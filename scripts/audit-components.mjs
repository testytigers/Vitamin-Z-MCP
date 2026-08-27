#!/usr/bin/env node
/**
 * audit-components.mjs — per-component health check across the DS.
 *
 * Checks each component for the things that quietly rot a design system:
 * raw colours that bypass tokens, hardcoded pixel values, missing "use client"
 * on interactive components, and the accessibility rules AGENT_GUIDE.md lists
 * but nothing enforces.
 *
 * Run: npm run audit:components [-- --json] [-- --verbose]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const UI = path.join(ROOT, "ds-shadcn/src/components/ui");
const LAYOUT = path.join(ROOT, "ds-shadcn/src/components/layout");
const DOCS_COMPONENTS = path.join(ROOT, "docs/COMPONENTS.md");
const APP = path.resolve(ROOT, "../coliix/src");

const verbose = process.argv.includes("--verbose");
const doc = fs.readFileSync(DOCS_COMPONENTS, "utf8");

function listFiles(dir) {
  return fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => f.endsWith(".tsx")).map((f) => path.join(dir, f))
    : [];
}
const files = [...listFiles(UI), ...listFiles(LAYOUT)];

// app usage, to spot components nothing consumes
const appText = (() => {
  const out = [];
  const walk = (d) => {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.tsx?$/.test(e.name)) out.push(fs.readFileSync(p, "utf8"));
    }
  };
  walk(APP);
  return out.join("\n");
})();

/* ── rules ─────────────────────────────────────────────────── */
const RULES = [
  {
    id: "raw-color",
    sev: "error",
    desc: "raw Tailwind colour instead of a DS token",
    re: /(?<![\w-])(?:hover:|focus:|active:|disabled:|group-hover:)?(?:text|bg|border|ring|divide|fill|stroke)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}(?![\w-])/g,
  },
  {
    id: "hardcoded-hex",
    sev: "error",
    desc: "hardcoded hex/rgb colour",
    re: /(?:#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\))/g,
    // token files legitimately contain colour literals; components should not
  },
  {
    id: "dark-modifier",
    sev: "error",
    desc: "dark: modifier (mode is driven by data-appearance, not variants)",
    re: /(?<![\w-])dark:[a-z-]+/g,
  },
  {
    id: "arbitrary-value",
    sev: "warn",
    desc: "arbitrary value — prefer a token",
    re: /(?<![\w-])(?:w|h|p|px|py|m|mx|my|gap|text|bg|border|rounded|top|left|right|bottom)-\[[^\]]+\]/g,
    allow: /var\(--/,   // arbitrary values that reference a token are fine
  },
  {
    id: "bg-white",
    sev: "error",
    desc: "bg-white / text-white — use bg-elevated / text-on-accent",
    re: /(?<![\w-])(?:hover:|focus:)?(?:bg|text|border)-white(?![\w-])/g,
  },
];

const A11Y = [
  {
    id: "icon-button-no-label",
    sev: "warn",
    desc: "icon-only <button> without aria-label",
    test(text) {
      const hits = [];
      // A <button> whose ONLY child is an icon element. A `{expression}` child
      // is assumed to render text (e.g. {workspace.name}) and therefore labels
      // the button — matching it here produced false positives.
      const re = /<button\b([^>]*)>\s*<([A-Z][A-Za-z0-9]*)\b[^>]*\/>\s*<\/button>/g;
      for (const m of text.matchAll(re)) {
        if (!/aria-label|aria-labelledby|title=/.test(m[1])) hits.push(`<button><${m[2]} /></button>`);
      }
      return hits;
    },
  },
  {
    id: "img-no-alt",
    sev: "warn",
    desc: "<img> without alt",
    test: (text) => [...text.matchAll(/<img\b(?![^>]*\balt=)[^>]*>/g)].map((m) => m[0].slice(0, 60)),
  },
  {
    id: "positive-tabindex",
    sev: "warn",
    desc: "positive tabIndex breaks natural focus order",
    test: (text) => [...text.matchAll(/tabIndex=\{?["']?([1-9]\d*)/g)].map((m) => `tabIndex=${m[1]}`),
  },
];

/* ── run ───────────────────────────────────────────────────── */
const results = [];
for (const file of files) {
  const name = path.basename(file, ".tsx");
  const text = fs.readFileSync(file, "utf8");
  const code = text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, ""); // strip comments

  const issues = [];
  for (const r of RULES) {
    const hits = [...code.matchAll(r.re)]
      .map((m) => m[0])
      .filter((h) => !(r.allow && r.allow.test(h)));
    if (hits.length) issues.push({ ...r, hits: [...new Set(hits)] });
  }
  for (const a of A11Y) {
    const hits = a.test(code);
    if (hits.length) issues.push({ id: a.id, sev: a.sev, desc: a.desc, hits: [...new Set(hits)] });
  }

  const interactive = /useState|useEffect|onClick|onChange|onSubmit|useCallback|useRef\(/.test(code);
  const hasUseClient = /^["']use client["']/m.test(text);
  if (interactive && !hasUseClient)
    issues.push({ id: "missing-use-client", sev: "error", desc: 'interactive component without "use client"', hits: [] });

  const usesCn = /\bcn\(/.test(code);
  const documented = new RegExp(name.replace(/-/g, "[- ]*"), "i").test(doc);
  const importPath = `components/ui/${name}`;
  const usedByApp = appText.includes(importPath) ||
    new RegExp(`from ["'][^"']*ui/${name}["']`).test(appText);

  results.push({ name, file, issues, usesCn, documented, usedByApp, interactive, hasUseClient,
    lines: text.split("\n").length });
}

/* ── output ────────────────────────────────────────────────── */
if (process.argv.includes("--json")) {
  console.log(JSON.stringify(results, null, 2));
} else {
  console.log("COMPONENT AUDIT\n===============\n");
  console.log(`${results.length} components scanned\n`);

  const withIssues = results.filter((r) => r.issues.length);
  const errors = results.flatMap((r) => r.issues.filter((i) => i.sev === "error").map((i) => ({ r, i })));
  const warns = results.flatMap((r) => r.issues.filter((i) => i.sev === "warn").map((i) => ({ r, i })));

  if (errors.length) {
    console.log(`ERRORS (${errors.length})\n`);
    for (const { r, i } of errors) {
      console.log(`  ${r.name.padEnd(20)} ${i.desc}`);
      if (i.hits.length) console.log(`  ${" ".repeat(20)} ${i.hits.slice(0, 6).join(", ")}${i.hits.length > 6 ? ` …+${i.hits.length - 6}` : ""}`);
    }
    console.log("");
  }
  if (warns.length) {
    console.log(`WARNINGS (${warns.length})\n`);
    for (const { r, i } of warns) {
      console.log(`  ${r.name.padEnd(20)} ${i.desc}`);
      if (i.hits.length) console.log(`  ${" ".repeat(20)} ${i.hits.slice(0, 4).join(", ")}${i.hits.length > 4 ? ` …+${i.hits.length - 4}` : ""}`);
    }
    console.log("");
  }

  const undocumented = results.filter((r) => !r.documented);
  const unused = results.filter((r) => !r.usedByApp);
  console.log("COVERAGE\n");
  console.log(`  documented in COMPONENTS.md   ${results.length - undocumented.length}/${results.length}`);
  if (undocumented.length) console.log(`    missing: ${undocumented.map((r) => r.name).join(", ")}`);
  console.log(`  used by the app               ${results.length - unused.length}/${results.length}`);
  if (unused.length && verbose) console.log(`    unused: ${unused.map((r) => r.name).join(", ")}`);
  console.log(`  clean (no issues)             ${results.length - withIssues.length}/${results.length}`);
  console.log("");
  console.log(`${errors.length} error(s), ${warns.length} warning(s) across ${withIssues.length} component(s).`);
}
