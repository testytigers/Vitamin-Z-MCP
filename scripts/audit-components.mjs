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
/* The consuming app is scanned to spot tokens the app uses that the DS lacks.
   It used to be assumed to sit at ../coliix, which broke the moment the design
   system moved out of that folder. Point DS_APP_DIR at an app to re-enable the
   scan; when it is unset or missing, app-usage checks are simply skipped and the
   DS-only checks still run. */
const APP = process.env.DS_APP_DIR
  ? path.resolve(process.env.DS_APP_DIR)
  : (fs.existsSync(path.resolve(ROOT, "../coliix/src")) ? path.resolve(ROOT, "../coliix/src") : null);

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
    if (!d || !fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.tsx?$/.test(e.name)) out.push(fs.readFileSync(p, "utf8"));
    }
  };
  if (APP) walk(APP);
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
    /* The `_` prefix marks a primitive as private to tokens.css. A component
       that reads one bypasses every axis layered above it: badge, select and
       toggle-group read --_size-* and so kept default padding under
       data-density="compact", because primitives are density-invariant. The
       arbitrary-value rule below could never catch this — its `allow: /var\(--/`
       treats any token reference as fine, and cannot tell --control-px-md
       (correct) from --_size-2_5 (a layer violation). */
    id: "primitive-escape",
    sev: "error",
    desc: "reads a private --_ primitive — use the semantic or density token",
    re: /var\(\s*--_[\w-]+\s*\)/g,
  },
  {
    /* RTL. 21 physical inset utilities were converted to logical ones
       (start- and end- variants); CONTEXT.md claimed 24 remained when the real count
       was 34. Spacing had been converted long before and positioning never was,
       so nothing flagged the gap. Three shapes stay legitimately physical and
       are allowed below:
         · centring — left-1/2 / left-[50%] paired with -translate-x-1/2 is
           symmetric, so mirroring it is a no-op
         · tailwindcss-animate keyframe names (slide-in-from-left, …), which
           have no logical form; they read as `-left`, never `left-`
         · a component whose own API names a physical side (Sheet side="left"),
           marked with an explicit `rtl-exempt` comment
       Anything else must use start-/end- so the component mirrors. */
    id: "physical-inset",
    sev: "warn",
    desc: "physical left-/right- inset — use start-/end- so it mirrors in RTL",
    re: /(?<![\w-])(?:-)?(?:left|right)-(?!1\/2(?![\w\/])|\[50%\])[a-z0-9./\[\]%-]+/g,
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
  /* A component may declare `rtl-exempt` in a comment when its public API names
     a physical side (Sheet side="left"/"right"); the directive is the contract. */
  const rtlExempt = /rtl-exempt/.test(text);
  for (const r of RULES) {
    if (r.id === "physical-inset" && rtlExempt) continue;
    const hits = [...code.matchAll(r.re)]
      .map((m) => m[0])
      .filter((h) => !(r.allow && r.allow.test(h)));
    if (hits.length) issues.push({ ...r, hits: [...new Set(hits)] });
  }
  for (const a of A11Y) {
    const hits = a.test(code);
    if (hits.length) issues.push({ id: a.id, sev: a.sev, desc: a.desc, hits: [...new Set(hits)] });
  }

  /* This check already existed and still missed form.tsx, input-otp.tsx and
     toggle-group.tsx — all three broke on import into a server component. The
     old list enumerated six specific hooks, so context and identity hooks
     (createContext / useContext / useId / useReducer / useLayoutEffect /
     useSyncExternalStore) and every on*= prop other than the three named ones
     fell straight through. Match the actual rule instead of a sample of it:
     any React hook call, any context creation, any event prop. */
  const interactive =
    /\buse[A-Z]\w*\s*\(/.test(code) ||        // any hook, incl. React.useX via the \b on "use"
    /\bcreateContext\s*\(/.test(code) ||       // context is client-only
    /\son(?:Click|DoubleClick|Change|Input|Submit|Reset|KeyDown|KeyUp|KeyPress|Focus|Blur|MouseEnter|MouseLeave|MouseDown|MouseUp|MouseMove|Wheel|Scroll|Drag|Drop|Touch\w*|Pointer\w*|Animation\w*|Transition\w*)\s*=/.test(code);
  /* Only real DOM events count. Matching every /on[A-Z]/ prop flagged app-shell,
     which merely forwards caller-supplied callbacks (onSearch, onSignOut) to a
     child that is itself a client component — a pass-through, not a boundary. */
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
