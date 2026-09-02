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
  /* The DEFAULT density block was never a resolvable layer, so anything reading
     a density token via resolve(..., "light") fell through to allDefs — which is
     last-wins across the whole file and therefore held the COMPACT value. B5 has
     been printing "control-height-lg (default) is 36px" for the compact 36px
     while the real default is 40px: the default column was measuring compact. */
  "density-default": ':root,\n[data-density="default"]',
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

// A4 — colour literals outside the primitive layer
{
  /* --color-action-primary-bg-subtle and -bg-tint held rgba() literals spelling
     out blue-500/600/400 by hand. A literal in the semantic layer is a copy, not
     a reference: change the primitive and it silently does not follow. The
     component-level `hardcoded-hex` rule only ever scanned components, so the
     token file itself was the one place a stray literal could hide. */
  /* Scan EVERY declaration in the file, not allDefs — a token defined once per
     mode collapses to a single entry there, so a literal in any block but the
     last would slip through. (It did, on the first version of this check.) */
  const seen = new Set();
  for (const m of css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    const tok = m[1], v = m[2].trim();
    if (tok.startsWith("--_")) continue;                 // primitives ARE the literals
    if (!/#[0-9a-fA-F]{3,8}\b|\brgba?\s*\(/.test(v)) continue;
    const key = `${tok}|${v}`;
    if (seen.has(key)) continue;
    seen.add(key);
    A("error", "tokens", `${tok} spells out a colour literal instead of referencing a primitive`,
      `${v} — use var(--_color-*), or color-mix(in srgb, var(--_color-*) N%, transparent) for a tint`);
  }
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
    const v = px(resolve(`--control-height-${s}`, "density-default").value);
    /* was px(modeDefs.compact[...]) — that map holds the DECLARED value, i.e.
       the string "var(--_size-7)", which px() cannot parse, so it returned null
       and the compact branch below has been a silent no-op since it was written.
       resolve() follows the chain to a real length. */
    const c = px(resolve(`--control-height-${s}`, "compact").value);
    for (const [label, val] of [["default", v], ["compact", c]]) {
      if (val !== null && val < 24)
        A("error", "a11y", `control-height-${s} (${label}) is ${val}px — below the WCAG 2.5.8 minimum of 24px`, `${val}px`);
      else if (val !== null && val < 44 && s === "lg")
        A("info", "a11y", `control-height-lg (${label}) is ${val}px — below the 44px AAA target size`, `${val}px`);
    }
  }
}

// B6 — compact density is a SPACING axis: it must not touch typography
{
  /* The decision recorded in tokens.css, made executable. Reintroducing a
     --control-font-* override here would recreate the 2-of-45 split silently,
     because only button and input can follow such a token at all. */
  const typo = Object.keys(modeDefs.compact || {}).filter((t) =>
    /font|line-height|letter-spacing/.test(t));
  if (typo.length)
    A("error", "scale", `compact density redefines ${typo.length} typography token(s)`,
      `${typo.join(", ")} — compact is a spacing axis. Only button and input read --control-font-*; ` +
      `the other 28 text-rendering components use raw text-* utilities and cannot follow, so a ` +
      `density-varying type token guarantees mismatched sizes in the same view.`);
}

// B7 — a control must be tall enough to contain its own text
{
  /* Compact no longer shrinks control type, so md keeps 14px inside a 32px box.
     That is the assumption B6 rests on; this measures it instead of trusting it.
     Height wins over padding when both are set (h-* is explicit on every
     control), so the test is height vs the line box, not height vs padding. */
  const LH = px(resolve("--_line-height-normal", "density-default").value) ?? 1.5;
  const lead = LH > 4 ? 1.5 : LH;                       // unitless vs px guard
  for (const s of ["sm", "md", "lg"]) {
    for (const layer of ["density-default", "compact"]) {
      const label = layer === "compact" ? "compact" : "default";
      const h = px(resolve(`--control-height-${s}`, layer).value);
      const f = px(resolve(`--control-font-${s}`, layer).value);
      if (h === null || f === null) continue;
      const lineBox = f * lead;
      if (lineBox > h)
        A("error", "scale", `control-${s} (${label}) cannot contain its own text`,
          `${f}px x ${lead} line-height = ${lineBox.toFixed(1)}px in a ${h}px box — the label will clip`);
      else if (h - lineBox < 4)
        A("info", "scale", `control-${s} (${label}) is tight around its text`,
          `${lineBox.toFixed(1)}px line box in a ${h}px box — ${(h - lineBox).toFixed(1)}px of breathing room`);
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
  /* Every text token that can carry prose — not just the four-step ladder.
     placeholder and link were absent, which is how text-placeholder sat at
     slate-500 in dark (3.07:1 on overlay) through a green audit. */
  const BODY = ["primary", "strong", "secondary", "subtle", "placeholder", "link"];
  const SURF = ["canvas", "elevated", "sunken", "overlay", "popover"];
  /* Tonal fills were never checked at all. CONTRACT (see tokens.css): text on
     bg-secondary / bg-tertiary must be text-secondary or stronger — slate-500
     reaches only 4.8:1 on pure white, so no tint can carry it. FILL_MIN is
     enforced; the out-of-contract ratios are printed every run (below) so the
     limit stays visible rather than being excluded and forgotten. */
  const FILL = ["primary", "secondary", "tertiary"];
  const FILL_MIN = ["primary", "strong", "secondary"];
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
    /* Tonal fills: enforce the in-contract tokens... */
    for (const t of FILL_MIN) {
      const tv = resolveIn(`--color-text-${t}`, layers);
      if (!tv || !/^#/.test(tv)) continue;
      for (const b of FILL) {
        const bv = resolveIn(`--color-bg-${b}`, layers);
        if (!bv || !/^#/.test(bv)) continue;
        const c = cr(tv, bv);
        if (c && c < 4.5)
          A("error", "a11y", `text-${t} on bg-${b} fails AA in ${combo}`, `${tv} on ${bv} = ${c.toFixed(2)}:1`);
      }
    }
    /* ...and report the out-of-contract ones so the ceiling is never invisible. */
    for (const t of ["subtle", "placeholder"]) {
      const tv = resolveIn(`--color-text-${t}`, layers);
      if (!tv || !/^#/.test(tv)) continue;
      const under = [];
      for (const b of ["secondary", "tertiary"]) {
        const bv = resolveIn(`--color-bg-${b}`, layers);
        if (!bv || !/^#/.test(bv)) continue;
        const c = cr(tv, bv);
        if (c && c < 4.5) under.push(`bg-${b} ${c.toFixed(2)}:1`);
      }
      if (under.length)
        A("info", "a11y", `text-${t} is out of contract on tonal fills (${combo})`,
          `${under.join(", ")} — by design: use text-secondary or stronger on bg-secondary/bg-tertiary`);
    }

    /* Interaction states. Rest-state-only checking let brand primary hover ship
       at 3.68:1 and dark destructive active at 2.77:1 while the audit read 0
       errors. A state is a rendered state; it gets measured like one. */
    for (const [t, bg, label] of [
      ["--color-text-on-accent",      "--color-action-primary-bg",     "primary button"],
      ["--color-text-on-destructive", "--color-action-destructive-bg", "destructive button"],
      ["--color-text-primary",        "--color-action-secondary-bg",   "secondary button"],
    ]) {
      const tv = resolveIn(t, layers);
      if (!tv || !/^#/.test(tv)) continue;
      for (const st of ["", "-hover", "-active"]) {
        const bv = resolveIn(`${bg}${st}`, layers);
        if (!bv || !/^#/.test(bv)) continue;
        const c = cr(tv, bv);
        if (c && c < 4.5)
          A("error", "a11y", `${label}${st || " (rest)"} fails AA in ${combo}`, `${tv} on ${bv} = ${c.toFixed(2)}:1`);
      }
    }
  }
}

// C1 — CVD separation: status colours AND the chart categorical palette
{
  function simCVD(hex, kind) {
    const rgb = hex2rgb(hex); if (!rgb) return null;
    const [r, g, b] = rgb.map((c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
    let L = 0.31399022 * r + 0.63951294 * g + 0.04649755 * b;
    let M = 0.15537241 * r + 0.75789446 * g + 0.08670142 * b;
    let S = 0.01775239 * r + 0.10944209 * g + 0.87256922 * b; // let: tritan reassigns S
    /* Tritan was missing entirely, so the blue-yellow axis was never tested. */
    if (kind === "deutan") M = 0.9513092 * L + 0.04866992 * S;
    else if (kind === "tritan") S = -0.86744736 * L + 1.86727089 * M;
    else L = 1.05118294 * M - 0.05116099 * S;
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
    for (const kind of ["deutan", "protan", "tritan"]) {
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

  /* Chart categorical palette. TOKENS.md and tokens.css both claim "min ΔE 21.4
     under deuteranopia and protanopia" for cat-1..6 — and NOTHING enforced it.
     It was a one-time manual measurement, so any future edit to a cat token
     would silently undo the property the comment promises. It is a check now.
     cat-1..6 are contracted CVD-safe; cat-7/8 are documented as requiring a
     second, non-colour cue, so pairs involving them are informational. */
  {
    const SAFE = 6, TOTAL = 8;
    for (const mode of ["light", "dark"]) {
      const cats = [];
      for (let i = 1; i <= TOTAL; i++) {
        const v = resolve(`--color-chart-cat-${i}`, mode).value;
        if (v && /^#/.test(v)) cats.push({ i, v });
      }
      for (const kind of ["deutan", "protan", "tritan"]) {
        let worst = null;
        for (let a = 0; a < cats.length; a++)
          for (let b = a + 1; b < cats.length; b++) {
            const d = dE(simCVD(cats[a].v, kind), simCVD(cats[b].v, kind));
            const bothSafe = cats[a].i <= SAFE && cats[b].i <= SAFE;
            if (bothSafe && (!worst || d < worst.d)) worst = { d, a: cats[a].i, b: cats[b].i };
            /* Tritan NEVER gates. simCVD is a single-plane model, which Viénot
               1999 states is not valid for the blue-yellow axis; correct Brettel
               1997 needs two half-planes. Two single-plane models disagree by 2x
               on this palette, so the number is indicative, not a verdict.
               Reported so it is visible, never escalated so it cannot lie. */
            if (kind === "tritan") {
              if (bothSafe && d < 20)
                A("info", "a11y", `chart cat-${cats[a].i}/cat-${cats[b].i} close under tritan (${mode}) — approximate`,
                  `ΔE ${d.toFixed(1)} — single-plane simulation is not valid for tritanopia; treat as indicative and use a non-colour cue`);
              continue;
            }
            if (bothSafe && d < 15)
              A("error", "a11y", `chart cat-${cats[a].i} and cat-${cats[b].i} collide under ${kind} (${mode})`,
                `ΔE ${d.toFixed(1)} — cat-1..6 are contracted to be distinguishable by colour alone`);
            else if (bothSafe && d < 20)
              A("warn", "a11y", `chart cat-${cats[a].i} and cat-${cats[b].i} are close under ${kind} (${mode})`,
                `ΔE ${d.toFixed(1)} — below the ΔE 20 the palette claims`);
            else if (!bothSafe && d < 15)
              A("info", "a11y", `chart cat-${cats[a].i}/cat-${cats[b].i} close under ${kind} (${mode})`,
                `ΔE ${d.toFixed(1)} — expected: past 6 series colour must not be the only cue (WCAG 1.4.1)`);
          }
        if (worst)
          A("info", "a11y", `chart cat-1..6 worst pair under ${kind} (${mode})`,
            `ΔE ${worst.d.toFixed(1)} (cat-${worst.a} vs cat-${worst.b}) — this is the number TOKENS.md quotes`);
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

// C6 — greyscale separation: can the statuses be told apart without hue?
{
  const lumOf = (hex) => { const r = hex2rgb(hex); return r ? lum(r) : null; };
  for (const mode of ["light", "dark"]) {
    const ls = {};
    for (const s of ["error", "success", "warning", "info"]) {
      const v = resolve(`--color-status-${s}-fg`, mode).value;
      if (v && /^#/.test(v)) ls[s] = lumOf(v);
    }
    const keys = Object.keys(ls);
    const close = [];
    for (let i = 0; i < keys.length; i++)
      for (let j = i + 1; j < keys.length; j++)
        if (Math.abs(ls[keys[i]] - ls[keys[j]]) < 0.03)
          close.push(`${keys[i]}/${keys[j]} Δlum ${Math.abs(ls[keys[i]] - ls[keys[j]]).toFixed(3)}`);
    if (close.length) {
      const badge = fs.existsSync(path.join(UI, "badge.tsx")) && /lucide-react/.test(fs.readFileSync(path.join(UI, "badge.tsx"), "utf8"));
      const alert = fs.existsSync(path.join(UI, "alert.tsx")) && /lucide-react/.test(fs.readFileSync(path.join(UI, "alert.tsx"), "utf8"));
      /* Report the measurement, not a stock paragraph. This message used to
         assert a fixed "Δlum 0.025 achievable / ~0.05 needed, measured in
         Chrome" regardless of what was actually computed — which is where
         CONTEXT.md's "all four within Δlum 0.01" came from. It is true of
         three of the four in light and false in dark (full spread 0.306). */
      const all = keys.map((k) => `${k} ${ls[k].toFixed(3)}`).join(", ");
      const spread = Math.max(...keys.map((k) => ls[k])) - Math.min(...keys.map((k) => ls[k]));
      A(badge && alert ? "info" : "error", "a11y",
        `${close.length} status pair(s) are near-identical in greyscale (${mode})${badge && alert ? " — icons are load-bearing" : " AND the icons are gone"}`,
        `${close.join(", ")}. Full-set spread Δlum ${spread.toFixed(3)} across [${all}]. ` +
        `Pairs this close cannot be separated by hue alone, so the icon in Badge and Alert is the ` +
        `second channel WCAG 1.4.1 requires. Removing it is a regression, not a simplification.`);
    }
  }
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

// E4 — hex values quoted in TOKENS.md must match the resolved token
{
  /* The chart table in TOKENS.md documented the ORIGINAL pre-CVD palette for a
     whole generation after the code moved on — cat-3 listed as green #16a34a
     while tokens.css said emerald-900. E2 validates that class names exist, and
     nothing validated the values beside them, so the canonical doc drifted from
     the canonical source with every check still green. A quoted value is a
     promise; check it like one. */
  const tokensMd = path.join(DOCS, "TOKENS.md");
  const md = fs.existsSync(tokensMd) ? fs.readFileSync(tokensMd, "utf8") : "";
  const norm = (h) => {
    h = h.trim().toLowerCase();
    if (/^#[0-9a-f]{3}$/.test(h)) h = "#" + [...h.slice(1)].map((c) => c + c).join("");
    return h;
  };
  let checked = 0;
  for (const line of md.split("\n")) {
    if (!line.trim().startsWith("|")) continue;
    const cells = line.split("|").map((c) => c.trim());
    const nameM = /^`([a-z][a-z0-9-]*)`$/.exec(cells[1] || "");
    if (!nameM) continue;
    const hexes = cells.slice(2).map((c) => /^`(#[0-9a-fA-F]{3,8})`$/.exec(c)).map((m) => (m ? m[1] : null));
    if (!hexes.some(Boolean)) continue;
    const tok = `--color-${nameM[1]}`;
    const modes = ["light", "dark"];
    hexes.filter(Boolean).forEach((hex, idx) => {
      const mode = modes[idx] ?? "light";
      const got = resolve(tok, mode).value;
      if (!got || !/^#/.test(got)) return;
      checked++;
      if (norm(got) !== norm(hex))
        A("error", "docs", `TOKENS.md documents ${nameM[1]} (${mode}) as ${hex} but the token resolves to ${got}`,
          `the doc and tokens.css disagree — one of them is lying to whoever reads it next`);
    });
  }
  A("info", "docs", `TOKENS.md hex values checked against resolved tokens`, `${checked} value(s) verified`);
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
