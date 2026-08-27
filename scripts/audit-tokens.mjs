#!/usr/bin/env node
/**
 * audit-tokens.mjs — full inventory and health check of the token layer.
 *
 * Unlike verify-ds.mjs (which fails the build on drift), this is a *report*.
 * It surfaces things that are worth a human decision rather than an error:
 * orphaned tokens, duplicate values, contrast failures, undocumented tokens.
 *
 * Run: npm run audit:tokens [-- --json]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CSS = path.join(ROOT, "ds-shadcn/src/styles/tokens.css");
const TW = path.join(ROOT, "ds-shadcn/tailwind.config.ts");
const DOCS = path.join(ROOT, "docs");
const COMPONENTS = path.join(ROOT, "ds-shadcn/src/components");
const APP = path.resolve(ROOT, "../coliix/src");

const css = fs.readFileSync(CSS, "utf8");
const tw = fs.readFileSync(TW, "utf8");

/* ── parse ─────────────────────────────────────────────────── */

function blockRange(sel) {
  const i = css.indexOf(sel + " {");
  if (i < 0) return null;
  const open = css.indexOf("{", i);
  let depth = 0;
  for (let j = open; j < css.length; j++) {
    if (css[j] === "{") depth++;
    else if (css[j] === "}") { depth--; if (!depth) return css.slice(open, j); }
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

const modeTokens = {};
for (const [name, sel] of Object.entries(MODES)) {
  const b = blockRange(sel);
  modeTokens[name] = b
    ? Object.fromEntries([...b.matchAll(/(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]))
    : {};
}

const allDefs = Object.fromEntries(
  [...css.matchAll(/(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()])
);
const primitives = Object.keys(allDefs).filter((k) => k.startsWith("--_"));
const semantic = Object.keys(allDefs).filter((k) => /^--(color|shadow|radius|spacing|focus|control|motion|z)-/.test(k));
const componentTokens = Object.keys(allDefs).filter((k) =>
  /^--(button|input|card|badge|dialog|select|switch|tooltip|avatar|table|toast)-/.test(k)
);

/* ── resolve a token to a final hex, per mode ──────────────── */
function resolve(name, mode, seen = new Set()) {
  if (seen.has(name)) return null;
  seen.add(name);
  const val = modeTokens[mode]?.[name] ?? allDefs[name];
  if (!val) return null;
  const varRef = /^var\((--[a-zA-Z0-9_-]+)\)$/.exec(val.trim());
  if (varRef) return resolve(varRef[1], mode, seen);
  return val.trim();
}

function hexToRgb(h) {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(h.trim());
  if (!m) return null;
  let s = m[1];
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}
function luminance([r, g, b]) {
  const f = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(a, b) {
  const ra = hexToRgb(a), rb = hexToRgb(b);
  if (!ra || !rb) return null;
  const la = luminance(ra), lb = luminance(rb);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/* ── usage scan ────────────────────────────────────────────── */
function readAll(dir, exts) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (e.name !== "node_modules") walk(p); }
      else if (exts.some((x) => e.name.endsWith(x))) out.push({ path: p, text: fs.readFileSync(p, "utf8") });
    }
  };
  walk(dir);
  return out;
}

const sourceFiles = [
  ...readAll(COMPONENTS, [".tsx", ".ts"]),
  ...readAll(APP, [".tsx", ".ts"]),
  { path: TW, text: tw },
  { path: CSS, text: css },
];
const allSource = sourceFiles.map((f) => f.text).join("\n");
/* Reference docs only. Reports *about* the DS (this audit, the improvements log)
   must not count as documentation — an audit that lists a token as undocumented
   would otherwise mark it documented on the next run. */
const REPORTS = ["DS-AUDIT.md", "DS-IMPROVEMENTS-LOG.md"];
const docsText = readAll(DOCS, [".md"])
  .filter((f) => !REPORTS.includes(path.basename(f.path)))
  .map((f) => f.text)
  .join("\n");

/* ── report ────────────────────────────────────────────────── */
const R = { inventory: {}, findings: [] };
const add = (sev, area, title, detail) => R.findings.push({ sev, area, title, detail });

R.inventory = {
  primitives: primitives.length,
  semantic: semantic.length,
  component: componentTokens.length,
  total: Object.keys(allDefs).length,
  modes: Object.fromEntries(Object.entries(modeTokens).map(([k, v]) => [k, Object.keys(v).length])),
};

// 1. orphan semantic tokens — defined but nothing references them
const orphans = semantic.filter((t) => {
  const bare = t.replace(/^--/, "");
  const refCount = (allSource.match(new RegExp(`var\\(${t}\\)`, "g")) || []).length;
  return refCount === 0 && !new RegExp(`["']${bare.replace(/^color-/, "")}["']`).test(tw);
});
if (orphans.length) add("info", "tokens", `${orphans.length} semantic tokens never referenced`, orphans.join(", "));

// 2. component tokens — dead layer?
const deadComponent = componentTokens.filter((t) => !new RegExp(`var\\(${t}\\)`).test(allSource.replace(css, "")));
if (deadComponent.length)
  add("warn", "tokens", `${deadComponent.length}/${componentTokens.length} component tokens are unreferenced`, deadComponent.join(", "));

// 3. unused primitives — check every source, not just the stylesheet
const unusedPrims = primitives.filter((p) => !new RegExp(`var\\(${p}\\)`).test(allSource));
if (unusedPrims.length) add("info", "tokens", `${unusedPrims.length} primitives defined but never referenced`, unusedPrims.join(", "));

// 4. raw hex in the semantic layer (should point at a primitive)
const rawHex = semantic.filter((t) => /^#[0-9a-f]{3,8}$/i.test(allDefs[t] ?? ""));
if (rawHex.length)
  add("warn", "tokens", `${rawHex.length} semantic tokens hold a raw hex instead of a primitive`,
    rawHex.map((t) => `${t}: ${allDefs[t]}`).join(", "));

// 5. duplicate values within light mode
const lightResolved = {};
for (const t of semantic.filter((t) => t.startsWith("--color-"))) {
  const v = resolve(t, "light");
  if (v && /^#/.test(v)) (lightResolved[v] ||= []).push(t);
}
const dupes = Object.entries(lightResolved).filter(([, ts]) => ts.length > 2);
if (dupes.length)
  add("info", "tokens", `${dupes.length} colour values have 3+ token names (light mode)`,
    dupes.map(([v, ts]) => `${v} ← ${ts.join(", ")}`).join(" | "));

// 6. mode parity
const lightColors = Object.keys(modeTokens.light).filter((t) => t.startsWith("--color-"));
for (const m of ["dark", "brand", "dark+brand"]) {
  const have = new Set(Object.keys(modeTokens[m]));
  const missing = lightColors.filter((t) => !have.has(t));
  if (m === "dark" && missing.length)
    add("error", "tokens", `${missing.length} colour tokens missing from dark mode`, missing.join(", "));
  if (m !== "dark")
    R.inventory[`${m}_overrides`] = Object.keys(modeTokens[m]).length;
}

/* 7. contrast — only pairings that actually occur in the UI.
   Pairing every text token with every surface produces nonsense like
   "text-on-accent on canvas = 1.00:1"; on-* tokens are for accent fills,
   never for the page background. */
const BODY_TEXTS = ["--color-text-primary", "--color-text-strong", "--color-text-secondary",
  "--color-text-subtle", "--color-text-tertiary", "--color-text-muted"];
const SURFACES = ["--color-surface-canvas", "--color-surface-elevated", "--color-surface-sunken", "--color-surface-overlay"];
// text token → the background it is designed to sit on
const ON_PAIRS = [
  ["--color-text-on-accent", "--color-action-primary-bg"],
  ["--color-text-on-destructive", "--color-action-destructive-bg"],
  ["--color-text-on-inverse", "--color-bg-inverse"],
  ["--color-icon-on-accent", "--color-action-primary-bg"],
];

const AA = 4.5;
const contrastFails = [];
for (const mode of ["light", "dark"]) {
  for (const s of SURFACES) {
    const sv = resolve(s, mode);
    if (!sv || !/^#/.test(sv)) continue;
    for (const t of BODY_TEXTS) {
      const tv = resolve(t, mode);
      if (!tv || !/^#/.test(tv)) continue;
      const c = contrast(tv, sv);
      if (c && c < AA)
        contrastFails.push(`${mode}: ${t.replace("--color-text-", "")} on ${s.replace("--color-surface-", "")} = ${c.toFixed(2)}:1`);
    }
  }
}
if (contrastFails.length)
  add("warn", "a11y", `${contrastFails.length} body-text/surface pairs below WCAG AA ${AA}:1`, contrastFails.join("\n    "));

for (const mode of ["light", "dark"]) {
  for (const [t, bg] of ON_PAIRS) {
    const tv = resolve(t, mode), bv = resolve(bg, mode);
    if (!tv || !bv || !/^#/.test(tv) || !/^#/.test(bv)) continue;
    const c = contrast(tv, bv);
    if (c && c < AA)
      add("error", "a11y", `${t.replace("--color-", "")} on ${bg.replace("--color-", "")} fails AA (${mode})`,
        `${tv} on ${bv} = ${c.toFixed(2)}:1 — needs ${AA}:1`);
  }
}

// 7b. a token that claims to be overridable but isn't wired up
if (/--focus-ring-shadow:[^;]*var\(--_color/.test(css) && allDefs["--focus-ring-color"])
  add("warn", "tokens", "--focus-ring-color is defined but --focus-ring-shadow hardcodes a primitive",
    "Overriding --focus-ring-color has no effect; the shadow should compose from it.");

// 9. documentation coverage of Tailwind-exposed tokens
const twClasses = new Set();
const twBlock = (key) => {
  const i = tw.indexOf(`${key}: {`);
  if (i < 0) return [];
  let d = 0, end = -1;
  for (let j = tw.indexOf("{", i); j < tw.length; j++) {
    if (tw[j] === "{") d++;
    else if (tw[j] === "}") { d--; if (!d) { end = j; break; } }
  }
  return [...tw.slice(i, end).matchAll(/["']?([a-zA-Z0-9-]+)["']?\s*:\s*(?:\[|["']var\()/g)].map((m) => m[1]);
};
for (const k of twBlock("textColor")) twClasses.add(`text-${k}`);
for (const k of twBlock("backgroundColor")) twClasses.add(`bg-${k}`);
for (const k of twBlock("borderColor")) twClasses.add(`border-${k}`);
/* Tokens in `colors` generate a class for every prefix, but only one reading is
   intended: `-fg` is foreground, `-bg`/`-border` name their own property, icons
   and charts are foregrounds. Documenting the whole cross product would be noise. */
for (const k of twBlock("colors")) {
  if (/-fg$/.test(k) || k.startsWith("icon-")) twClasses.add(`text-${k}`);
  else if (/-border$/.test(k)) twClasses.add(`border-${k}`);
  else twClasses.add(`bg-${k}`);
}
// A token counts as documented if either the full class or the bare token name
// appears — tables often list `chart-cat-1` without a utility prefix.
const undocumented = [...twClasses].filter((c) => {
  const bare = c.replace(/^(text|bg|border|ring|divide)-/, "");
  return !docsText.includes(c) && !docsText.includes(`\`${bare}\``);
});
if (undocumented.length)
  add("warn", "docs", `${undocumented.length} Tailwind classes exist but appear in no doc`, undocumented.join(", "));

/* ── output ────────────────────────────────────────────────── */
if (process.argv.includes("--json")) {
  console.log(JSON.stringify(R, null, 2));
} else {
  console.log("TOKEN AUDIT\n===========\n");
  console.log("Inventory:");
  for (const [k, v] of Object.entries(R.inventory)) {
    console.log(`  ${k.padEnd(18)} ${typeof v === "object" ? JSON.stringify(v) : v}`);
  }
  console.log("");
  const order = { error: 0, warn: 1, info: 2 };
  R.findings.sort((a, b) => order[a.sev] - order[b.sev]);
  for (const f of R.findings) {
    const tag = { error: "ERROR", warn: "WARN ", info: "INFO " }[f.sev];
    console.log(`[${tag}] (${f.area}) ${f.title}`);
    console.log(`    ${f.detail}\n`);
  }
  const e = R.findings.filter((f) => f.sev === "error").length;
  const w = R.findings.filter((f) => f.sev === "warn").length;
  console.log(`${e} error(s), ${w} warning(s), ${R.findings.length - e - w} note(s).`);
}
