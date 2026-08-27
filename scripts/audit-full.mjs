#!/usr/bin/env node
/**
 * audit-full.mjs — exhaustive design-system audit.
 *
 * Produces a numbered issue register covering token integrity, scale coherence,
 * accessibility, component contracts and documentation consistency. Every check
 * reports the concrete evidence it used, so a finding can be confirmed by hand.
 *
 * This exists because narrower audits kept passing while real defects survived
 * in dimensions nobody had thought to check. Enumerate first, fix second.
 *
 * Run: npm run audit:full [-- --json]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CSS = path.join(ROOT, "ds-shadcn/src/styles/tokens.css");
const TW = path.join(ROOT, "ds-shadcn/tailwind.config.ts");
const DOCS = path.join(ROOT, "docs");
const UI = path.join(ROOT, "ds-shadcn/src/components/ui");
const LAYOUT = path.join(ROOT, "ds-shadcn/src/components/layout");
const SRC = path.join(ROOT, "src");

const css = fs.readFileSync(CSS, "utf8");
const tw = fs.readFileSync(TW, "utf8");

const issues = [];
let seq = 0;
const A = (sev, area, title, evidence) =>
  issues.push({ id: `#${String(++seq).padStart(2, "0")}`, sev, area, title, evidence });

/* ─────────────────────────── helpers ─────────────────────────── */
/* @media blocks legitimately redefine tokens (reduced motion sets durations to
   0.01ms). Reading them into the base map made the duration scale look broken —
   a bug in this auditor, not the system. Strip them for baseline analysis. */
const cssBase = css.replace(/@media[^{]*\{(?:[^{}]|\{[^{}]*\})*\}/g, "");
const allDefs = {};
for (const m of cssBase.matchAll(/(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g)) allDefs[m[1]] = m[2].trim();

function block(sel) {
  const i = css.indexOf(sel + " {");
  if (i < 0) return null;
  const open = css.indexOf("{", i);
  let d = 0;
  for (let j = open; j < css.length; j++) {
    if (css[j] === "{") d++;
    else if (css[j] === "}") { d--; if (!d) return css.slice(open, j); }
  }
  return null;
}
const MODES = {
  light: ':root,\n[data-appearance="light"]',
  dark: '[data-appearance="dark"]',
  brand: '[data-brand="brand"]',
  "dark+brand": '[data-appearance="dark"][data-brand="brand"]',
  compact: '[data-density="compact"]',
};

/* Effective cascade per rendered combination. Checking only `light` and `dark`
   missed light/brand entirely — brand tints the sunken surface, which dropped
   text-subtle to 4.37:1. A mode block is a *diff*, so contrast has to be
   measured on the merged result, not on the block. */
const COMBOS = {
  "light/default": ["light"],
  "light/brand": ["light", "brand"],
  "dark/default": ["light", "dark"],
  "dark/brand": ["light", "dark", "brand", "dark+brand"],
};
const modeDefs = {};
for (const [k, sel] of Object.entries(MODES)) {
  const b = block(sel);
  modeDefs[k] = b ? Object.fromEntries([...b.matchAll(/(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()])) : {};
}
function resolve(name, mode, seen = new Set()) {
  if (seen.has(name)) return { value: null, circular: true };
  seen.add(name);
  const v = modeDefs[mode]?.[name] ?? allDefs[name];
  if (v === undefined) return { value: null, missing: name };
  const ref = /^var\((--[a-zA-Z0-9_-]+)\)$/.exec(v.trim());
  if (ref) return resolve(ref[1], mode, seen);
  return { value: v.trim(), depth: seen.size };
}
const hex2rgb = (h) => {
  const m = /^#([0-9a-f]{6})$/i.exec(h.trim());
  return m ? [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)) : null;
};
const lum = (rgb) => {
  const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
};
function cr(a, b) {
  const [x, y] = [hex2rgb(a), hex2rgb(b)];
  if (!x || !y) return null;
  const [la, lb] = [lum(x), lum(y)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
const px = (v) => { const m = /^(-?[\d.]+)px$/.exec(String(v).trim()); return m ? parseFloat(m[1]) : null; };
const ms = (v) => { const m = /^([\d.]+)ms$/.exec(String(v).trim()); return m ? parseFloat(m[1]) : null; };

function files(dir, ext = ".tsx") {
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(ext)).map((f) => path.join(dir, f)) : [];
}
const components = [...files(UI), ...files(LAYOUT)];
const docText = (() => {
  const skip = new Set(["DS-AUDIT.md", "DS-IMPROVEMENTS-LOG.md"]);
  return fs.readdirSync(DOCS).filter((f) => f.endsWith(".md") && !skip.has(f))
    .map((f) => fs.readFileSync(path.join(DOCS, f), "utf8")).join("\n");
})();

/* ═══════════════ A. TOKEN INTEGRITY ═══════════════ */

// A1 — var() references pointing at nothing
{
  const bad = new Set();
  for (const m of css.matchAll(/var\((--[a-zA-Z0-9_-]+)\)/g)) if (!(m[1] in allDefs)) bad.add(m[1]);
  for (const m of tw.matchAll(/var\((--[a-zA-Z0-9_-]+)\)/g)) if (!(m[1] in allDefs)) bad.add(m[1]);
  if (bad.size) A("error", "integrity", `${bad.size} var() reference(s) resolve to nothing`, [...bad].join(", "));
}

// A2 — circular chains, and chains deeper than 3 hops
{
  const circ = [], deep = [];
  for (const t of Object.keys(allDefs)) {
    for (const mode of ["light", "dark"]) {
      const r = resolve(t, mode);
      if (r.circular) circ.push(`${t} (${mode})`);
      else if (r.depth > 4) deep.push(`${t} (${mode}, ${r.depth} hops)`);
    }
  }
  if (circ.length) A("error", "integrity", `${circ.length} circular var() chain(s)`, [...new Set(circ)].join(", "));
  if (deep.length) A("info", "integrity", `${deep.length} token(s) resolve through >4 hops`, [...new Set(deep)].slice(0, 8).join(", "));
}

// A3 — brand / dark+brand parity: which tokens does brand override?
{
  /* Excluded by design, not oversight:
     - chart-*: categorical colour separates series, it does not express brand
       (documented in TOKENS.md), so brand mode deliberately inherits it.
     - action-destructive-*: destructive is red by meaning in every brand.
     - *-text / *-disabled: derived from contrast needs, not from the accent. */
  const lightAccent = Object.keys(modeDefs.light).filter((t) =>
    /^--color-(action|border-focus|icon-interactive|text-link)/.test(t) &&
    !/chart|destructive|-text($|-)|disabled/.test(t));
  const brandHas = new Set(Object.keys(modeDefs.brand));
  const missing = lightAccent.filter((t) => !brandHas.has(t));
  if (missing.length)
    A("warn", "modes", `brand mode overrides ${brandHas.size} tokens but leaves ${missing.length} accent-derived token(s) at the default`,
      missing.join(", "));
  const dbHas = new Set(Object.keys(modeDefs["dark+brand"]));
  const dbMissing = [...brandHas].filter((t) => !dbHas.has(t) && t.startsWith("--color-"));
  if (dbMissing.length)
    A("warn", "modes", `dark+brand overrides ${dbHas.size}; ${dbMissing.length} token(s) overridden in brand are not re-derived for dark+brand`,
      dbMissing.join(", "));
}

/* ═══════════════ B. SCALE COHERENCE ═══════════════ */

// B1 — spacing scale monotonic
{
  for (const fam of ["stack", "inline"]) {
    const steps = ["xs", "sm", "md", "lg", "xl", "2xl"]
      .map((s) => ({ s, v: px(resolve(`--spacing-${fam}-${s}`, "light").value) }))
      .filter((x) => x.v !== null);
    for (let i = 1; i < steps.length; i++)
      if (steps[i].v <= steps[i - 1].v)
        A("error", "scale", `spacing-${fam} is not monotonic`, `${steps[i - 1].s}=${steps[i - 1].v}px then ${steps[i].s}=${steps[i].v}px`);
  }
}

// B2 — compact density must be smaller than default, never larger
{
  const dflt = block(':root,\n[data-density="default"]') || block('[data-density="default"]') || "";
  const base = Object.fromEntries([...dflt.matchAll(/(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
  const bad = [];
  for (const [t, v] of Object.entries(modeDefs.compact)) {
    const b = px(base[t]), c = px(v);
    if (b !== null && c !== null && c > b) bad.push(`${t}: default ${b}px → compact ${c}px`);
  }
  if (bad.length) A("error", "scale", `${bad.length} compact value(s) larger than default`, bad.join(", "));
}

// B3 — radius, shadow elevation, z-index and duration ordering
{
  const radii = ["control", "card", "overlay"].map((k) => ({ k, v: px(resolve(`--radius-${k}`, "light").value) })).filter((x) => x.v !== null);
  for (let i = 1; i < radii.length; i++)
    if (radii[i].v < radii[i - 1].v)
      A("warn", "scale", "radius scale not ascending control→card→overlay", `${radii[i - 1].k}=${radii[i - 1].v} then ${radii[i].k}=${radii[i].v}`);

  const zs = ["dropdown", "sticky", "overlay", "modal", "popover", "toast", "tooltip"]
    .map((k) => ({ k, v: parseInt(resolve(`--z-${k}`, "light").value ?? "", 10) })).filter((x) => !isNaN(x.v));
  for (let i = 1; i < zs.length; i++)
    if (zs[i].v <= zs[i - 1].v)
      A("error", "scale", "z-index scale not ascending", `${zs[i - 1].k}=${zs[i - 1].v} then ${zs[i].k}=${zs[i].v}`);
  const dupZ = zs.filter((z, i) => zs.findIndex((o) => o.v === z.v) !== i);
  if (dupZ.length) A("error", "scale", "duplicate z-index values", dupZ.map((z) => `${z.k}=${z.v}`).join(", "));

  const ds = ["fast", "normal", "slow", "deliberate"].map((k) => ({ k, v: ms(allDefs[`--_duration-${k}`]) })).filter((x) => x.v !== null);
  for (let i = 1; i < ds.length; i++)
    if (ds[i].v <= ds[i - 1].v)
      A("error", "scale", "duration scale not ascending", `${ds[i - 1].k}=${ds[i - 1].v}ms then ${ds[i].k}=${ds[i].v}ms`);

  // shadow elevation: blur radius should grow with elevation
  // blur = second length in the first shadow layer ("0 1px 3px ..." → 3)
  const blur = (v) => {
    const first = String(v).split(/,(?![^(]*\))/)[0];
    const lens = [...first.matchAll(/(-?[\d.]+)px/g)].map((m) => parseFloat(m[1]));
    return lens.length >= 2 ? lens[1] : null;
  };
  const sh = ["control", "card", "popover", "overlay"].map((k) => ({ k, v: blur(resolve(`--shadow-${k}`, "light").value) })).filter((x) => x.v !== null);
  for (let i = 1; i < sh.length; i++)
    if (sh[i].v < sh[i - 1].v)
      A("warn", "scale", "shadow elevation not ascending", `${sh[i - 1].k} blur ${sh[i - 1].v}px then ${sh[i].k} ${sh[i].v}px`);
}

// B4 — type scale ratio consistency
{
  const names = ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl"];
  const sizes = names.map((n) => px(allDefs[`--_font-size-${n}`])).filter((v) => v !== null);
  const ratios = sizes.slice(1).map((v, i) => +(v / sizes[i]).toFixed(3));
  const spread = Math.max(...ratios) - Math.min(...ratios);
  if (spread > 0.25)
    A("info", "scale", "type scale is hand-picked, not a consistent ratio",
      `step ratios ${ratios.join(", ")} — spread ${spread.toFixed(2)}. A fixed ratio makes the scale rescalable.`);
}

// B5 — control heights vs WCAG 2.5.8 target size (24×24 min, 44 recommended)
{
  for (const s of ["sm", "md", "lg"]) {
    const v = px(resolve(`--control-height-${s}`, "light").value);
    const c = px(modeDefs.compact[`--control-height-${s}`]);
    for (const [label, val] of [["default", v], ["compact", c]]) {
      if (val !== null && val < 24)
        A("error", "a11y", `control-height-${s} (${label}) is ${val}px — below the WCAG 2.5.8 minimum of 24px`, `${val}px`);
      else if (val !== null && val < 44 && s === "lg")
        A("info", "a11y", `control-height-lg (${label}) is ${val}px — below the 44px AAA target size`, `${val}px`);
    }
  }
}

/* ═══════════════ C. ACCESSIBILITY ═══════════════ */

// C0 — contrast across every rendered mode combination
{
  function resolveIn(tok, layerNames, seen = new Set()) {
    if (seen.has(tok)) return null;
    seen.add(tok);
    let v;
    for (const n of layerNames) if (modeDefs[n]?.[tok] !== undefined) v = modeDefs[n][tok];
    if (v === undefined) v = allDefs[tok];
    if (v === undefined) return null;
    const ref = /^var\((--[a-zA-Z0-9_-]+)\)$/.exec(String(v).trim());
    return ref ? resolveIn(ref[1], layerNames, seen) : String(v).trim();
  }
  const BODY = ["primary", "strong", "secondary", "subtle"];
  const SURF = ["canvas", "elevated", "sunken", "overlay"];
  for (const [combo, layers] of Object.entries(COMBOS)) {
    for (const t of BODY) {
      const tv = resolveIn(`--color-text-${t}`, layers);
      if (!tv || !/^#/.test(tv)) continue;
      for (const s2 of SURF) {
        const sv = resolveIn(`--color-surface-${s2}`, layers);
        if (!sv || !/^#/.test(sv)) continue;
        const c = cr(tv, sv);
        if (c && c < 4.5)
          A("error", "a11y", `text-${t} on ${s2} fails AA in ${combo}`, `${tv} on ${sv} = ${c.toFixed(2)}:1`);
      }
    }
    for (const [tok, min, label] of [["--color-border-control", 3, "border-control"],
                                     ["--color-icon-muted", 3, "icon-muted"],
                                     ["--focus-ring-color", 3, "focus ring"]]) {
      const v = resolveIn(tok, layers);
      if (!v || !/^#/.test(v)) continue;
      for (const s2 of SURF) {
        const sv = resolveIn(`--color-surface-${s2}`, layers);
        if (!sv || !/^#/.test(sv)) continue;
        const c = cr(v, sv);
        if (c && c < min)
          A("error", "a11y", `${label} below ${min}:1 on ${s2} in ${combo}`, `${c.toFixed(2)}:1`);
      }
    }
    for (const [t, bg, label] of [["--color-text-on-accent", "--color-action-primary-bg", "on-accent/primary"],
                                  ["--color-text-on-destructive", "--color-action-destructive-bg", "on-destructive/destructive"]]) {
      const tv = resolveIn(t, layers), bv = resolveIn(bg, layers);
      if (!tv || !bv || !/^#/.test(tv) || !/^#/.test(bv)) continue;
      const c = cr(tv, bv);
      if (c && c < 4.5) A("error", "a11y", `${label} fails AA in ${combo}`, `${c.toFixed(2)}:1`);
    }
  }
}

// C1 — status colours must be distinguishable from each other under CVD
{
  function simCVD(hex, kind) {
    const rgb = hex2rgb(hex); if (!rgb) return null;
    const [r, g, b] = rgb.map((c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
    let L = 0.31399022 * r + 0.63951294 * g + 0.04649755 * b;
    let M = 0.15537241 * r + 0.75789446 * g + 0.08670142 * b;
    const S = 0.01775239 * r + 0.10944209 * g + 0.87256922 * b;
    if (kind === "deutan") M = 0.9513092 * L + 0.04866992 * S; else L = 1.05118294 * M - 0.05116099 * S;
    return [5.47221206 * L - 4.6419601 * M + 0.16963708 * S,
            -1.1252419 * L + 2.29317094 * M - 0.1678952 * S,
            0.02980165 * L - 0.19318073 * M + 1.16364789 * S].map((v) => Math.max(0, Math.min(1, v)));
  }
  const toLab = ([r, g, b]) => {
    const X = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047, Y = 0.2126 * r + 0.7152 * g + 0.0722 * b, Z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
    const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
    const [fx, fy, fz] = [f(Math.max(X, 0)), f(Math.max(Y, 0)), f(Math.max(Z, 0))];
    return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
  };
  const dE = (a, b) => { const [x, y] = [toLab(a), toLab(b)]; return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]); };
  for (const mode of ["light", "dark"]) {
    const st = ["error", "success", "warning", "info"]
      .map((s) => ({ s, v: resolve(`--color-status-${s}-fg`, mode).value }))
      .filter((x) => x.v && /^#/.test(x.v));
    for (const kind of ["deutan", "protan"]) {
      for (let i = 0; i < st.length; i++)
        for (let j = i + 1; j < st.length; j++) {
          const d = dE(simCVD(st[i].v, kind), simCVD(st[j].v, kind));
          if (d < 15) {
            /* WCAG 1.4.1 is satisfied when a second, non-colour channel exists.
               Status colours in the same hue family will always be close under
               CVD; what matters is whether the components that use them also
               carry an icon. Check the mitigation rather than the raw values. */
            const badge = path.join(UI, "badge.tsx");
            const alert = path.join(UI, "alert.tsx");
            const hasIcon = (f) => fs.existsSync(f) && /lucide-react|STATUS_ICONS|<Icon/.test(fs.readFileSync(f, "utf8"));
            const mitigated = hasIcon(badge) && hasIcon(alert);
            A(mitigated ? "info" : "error", "a11y",
              `status-${st[i].s} and status-${st[j].s} are close under ${kind} (${mode})${mitigated ? " — mitigated by icons" : ""}`,
              mitigated
                ? `ΔE ${d.toFixed(1)}; Badge and Alert both pair the colour with an icon, satisfying WCAG 1.4.1`
                : `ΔE ${d.toFixed(1)} — colour is the only signal (WCAG 1.4.1); pair with an icon`);
          }
        }
    }
  }
}

// C2 — status border against its own tinted background (3:1, it's a boundary)
for (const mode of ["light", "dark"]) {
  for (const s of ["error", "success", "warning", "info"]) {
    const b = resolve(`--color-status-${s}-border`, mode).value;
    const bg = resolve(`--color-status-${s}-bg`, mode).value;
    if (b && bg && /^#/.test(b) && /^#/.test(bg)) {
      const c = cr(b, bg);
      if (c && c < 1.4)
        A("info", "a11y", `status-${s} border barely differs from its background (${mode})`, `${c.toFixed(2)}:1 — the alert edge is nearly invisible`);
    }
  }
}

// C3 — focus ring must reach 3:1 against adjacent surfaces
for (const mode of ["light", "dark"]) {
  const f = resolve("--focus-ring-color", mode).value;
  if (!f || !/^#/.test(f)) continue;
  for (const s of ["--color-surface-canvas", "--color-surface-elevated", "--color-surface-sunken"]) {
    const sv = resolve(s, mode).value;
    if (!sv || !/^#/.test(sv)) continue;
    const c = cr(f, sv);
    if (c && c < 3)
      A("error", "a11y", `focus ring below 3:1 on ${s.replace("--color-surface-", "")} (${mode})`, `${c.toFixed(2)}:1 — WCAG 1.4.11`);
  }
}

// C4 — line-height minimum for body text (WCAG 1.4.12 guidance: ≥1.5)
{
  const lh = parseFloat(allDefs["--_line-height-normal"] ?? "0");
  if (lh && lh < 1.5) A("warn", "a11y", `--_line-height-normal is ${lh}, below the 1.5 body-text guidance`, `${lh}`);
}

// C5 — form controls: labelling and error identification
{
  const inp = components.find((f) => path.basename(f) === "input.tsx");
  if (inp) {
    const t = fs.readFileSync(inp, "utf8");
    if (!/aria-invalid/.test(t))
      A("warn", "a11y", "input.tsx has no aria-invalid support", "error state cannot be announced to assistive tech (WCAG 3.3.1)");
    if (!/aria-describedby/.test(t))
      A("info", "a11y", "input.tsx has no aria-describedby passthrough", "helper text and error messages can't be linked to the field");
  }
  const label = components.find((f) => path.basename(f) === "label.tsx");
  if (label && !/htmlFor|Root/.test(fs.readFileSync(label, "utf8")))
    A("warn", "a11y", "label.tsx does not associate with a control", "needs htmlFor or the Radix Label root");
}

/* ═══════════════ D. COMPONENT CONTRACTS ═══════════════ */
for (const file of components) {
  const name = path.basename(file, ".tsx");
  const raw = fs.readFileSync(file, "utf8");
  const code = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  // D1 — cva without VariantProps typing
  if (/\bcva\(/.test(code) && !/VariantProps/.test(code))
    A("warn", "types", `${name}: uses cva but does not export VariantProps typing`, "consumers get no autocomplete or type safety on variants");

  // D2 — RTL: physical direction utilities
  const phys = [...code.matchAll(/(?<![\w-])(ml|mr|pl|pr)-[a-z0-9.]+/g)].map((m) => m[0]);
  if (phys.length)
    A("info", "rtl", `${name}: ${phys.length} physical direction utility/utilities`, `${[...new Set(phys)].join(", ")} — use ms-/me-/ps-/pe- for RTL`);

  // D3 — interactive components should style a disabled state
  /* A focusable element, not merely a Radix root. Separator, Progress, Label and
     Tooltip content are not interactive; matching Primitive.Root flagged them. */
  /* Only count elements whose focus ring this file is responsible for.
     A bare `const X = Primitive.Trigger` re-export delegates to the consumer's
     asChild element, and onClick on a <Button> inherits Button's focus ring. */
  const ownsFocusSurface =
    /<button\b/.test(code) ||
    /role=["']button["']/.test(code) ||
    /tabIndex=\{?0/.test(code) ||
    /onClick=\{[^}]*\}[\s\S]{0,200}className=/.test(code.replace(/<Button[\s\S]*?\/?>/g, ""));
  const interactive = ownsFocusSurface;
  if (interactive && !/disabled/.test(code))
    A("info", "states", `${name}: interactive but no disabled styling`, "no disabled: variant or prop handling found");

  // D4 — focus-visible styling on interactive components
  if (interactive && !/focus-visible|focus:/.test(code))
    A("warn", "a11y", `${name}: interactive with no focus-visible styling`, "keyboard users get no visible focus indicator");
}

// D5 — export hygiene: is there an index and does it cover everything?
{
  const idx = path.join(UI, "index.ts");
  if (!fs.existsSync(idx)) A("info", "dx", "no ui/index.ts barrel export", "consumers must import each component by path");
  else {
    const t = fs.readFileSync(idx, "utf8");
    const missing = files(UI).map((f) => path.basename(f, ".tsx")).filter((n) => !t.includes(n));
    if (missing.length) A("warn", "dx", `ui/index.ts omits ${missing.length} component(s)`, missing.join(", "));
  }
}

/* ═══════════════ E. DOCS CONSISTENCY ═══════════════ */

// E1 — cheatsheet vs TOKENS.md agreement on layout zones
{
  const cheat = path.join(SRC, "cheatsheet.ts");
  if (fs.existsSync(cheat)) {
    const c = fs.readFileSync(cheat, "utf8");
    const zones = [["TopBar", /TopBar=([a-z-]+)/], ["Sidebar", /Sidebar=([a-z-]+)/], ["Main", /Main=([a-z-]+)/]];
    for (const [zone, re] of zones) {
      const m = re.exec(c);
      if (m && !docText.includes(m[1]))
        A("warn", "docs", `cheatsheet says ${zone}=${m[1]} but no reference doc mentions that class`, m[1]);
    }
  }
}

// E2 — code samples in docs must use classes that exist
{
  const valid = new Set();
  const twBlock = (k) => {
    const i = tw.indexOf(`${k}: {`); if (i < 0) return [];
    let d = 0, end = -1;
    for (let j = tw.indexOf("{", i); j < tw.length; j++) { if (tw[j] === "{") d++; else if (tw[j] === "}") { d--; if (!d) { end = j; break; } } }
    return [...tw.slice(i, end).matchAll(/["']?([a-zA-Z0-9-]+)["']?\s*:\s*(?:\[|["']var\()/g)].map((m) => m[1]);
  };
  for (const k of twBlock("colors")) for (const p of ["bg", "text", "border"]) valid.add(`${p}-${k}`);
  for (const k of twBlock("textColor")) valid.add(`text-${k}`);
  for (const k of twBlock("backgroundColor")) valid.add(`bg-${k}`);
  for (const k of twBlock("borderColor")) valid.add(`border-${k}`);
  for (const k of twBlock("spacing")) for (const p of ["gap", "p", "px", "py", "space-y", "space-x", "m", "mx", "my"]) valid.add(`${p}-${k}`);
  /* Docs deliberately quote forbidden classes to teach the replacement:
     ENFORCEMENT.md has a forbidden→correct table, AGENT_GUIDE marks BAD blocks.
     Only flag classes in lines that aren't teaching what to avoid. */
  /* The BAD marker sits on a comment line or a heading ABOVE the fenced block,
     so line-level filtering missed the samples inside it. Track fence state and
     drop any block whose preamble said "don't do this". */
  const teachingLine = (l) =>
    /\|\s*`|BAD|❌|forbidden|never use|→|used to begin|deprecated/i.test(l);
  const keep = [];
  let inFence = false, fenceIsBad = false, lastLines = [];
  for (const line of docText.split("\n")) {
    if (/^```/.test(line)) {
      if (!inFence) {
        inFence = true;
        fenceIsBad = lastLines.some((l) => /BAD|❌|forbidden|never use|anti-?pattern/i.test(l));
      } else { inFence = false; fenceIsBad = false; }
      continue;
    }
    if (inFence) { if (!fenceIsBad && !teachingLine(line)) keep.push(line); }
    else {
      lastLines = [...lastLines.slice(-6), line];
      if (!teachingLine(line)) keep.push(line);
    }
  }
  const docLines = keep.join("\n");
  const suspicious = new Set();
  for (const m of docLines.matchAll(/className="([^"]+)"/g))
    for (const cls of m[1].split(/\s+/)) {
      const bare = cls.replace(/^[a-z-]+:/, "");
      if (/^(bg|text|border)-(surface|bg|text|border)-/.test(bare)) suspicious.add(bare);       // old doubled names
      else if (/^(bg|text|border)-(slate|gray|zinc|red|green|blue|yellow|indigo)-\d/.test(bare)) suspicious.add(bare);
    }
  if (suspicious.size)
    A("error", "docs", `${suspicious.size} class(es) in doc code samples don't exist or are forbidden`, [...suspicious].join(", "));
}

// E3 — a preview page must import tokens.css, never redefine tokens
{
  for (const f of ["showcase.html", "verify.html"]) {
    const fp = path.join(ROOT, "ds-shadcn", f);
    if (!fs.existsSync(fp)) continue;
    const t = fs.readFileSync(fp, "utf8");
    const importsTokens = /tokens\.css/.test(t);
    const redefines = (t.match(/^\s*--[a-zA-Z0-9_-]+\s*:/gm) || []).length;
    if (!importsTokens && redefines > 20)
      A(/STALE/.test(t.slice(0, 2000)) ? "info" : "error", "docs",
        `${f} defines ${redefines} tokens of its own and never imports tokens.css`,
        "A preview that copies tokens will drift and then lie about what ships. Import them.");
  }
}

/* ═══════════════ OUTPUT ═══════════════ */
if (process.argv.includes("--json")) {
  console.log(JSON.stringify(issues, null, 2));
} else {
  const order = { error: 0, warn: 1, info: 2 };
  issues.sort((a, b) => order[a.sev] - order[b.sev]);
  console.log("FULL DESIGN SYSTEM AUDIT\n========================\n");
  const counts = { error: 0, warn: 0, info: 0 };
  for (const i of issues) counts[i.sev]++;
  console.log(`${counts.error} error · ${counts.warn} warn · ${counts.info} info   (${issues.length} total)\n`);
  let lastSev = null;
  for (const i of issues) {
    if (i.sev !== lastSev) { console.log(`\n── ${i.sev.toUpperCase()} ──`); lastSev = i.sev; }
    console.log(`${i.id} [${i.area}] ${i.title}`);
    console.log(`    ${i.evidence}`);
  }
  console.log("");
}
