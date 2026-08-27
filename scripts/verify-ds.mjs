#!/usr/bin/env node
/**
 * verify-ds.mjs — asserts the docs and the implementation agree.
 *
 * Every failure this catches was, at some point, a real bug that a human had
 * to notice by hand. The checks exist because each one already went wrong:
 *
 *   1. token round-trip   — tailwind.config.ts referenced a CSS var that
 *                           tokens.css never defined (silent broken class)
 *   2. mode parity        — a semantic token defined in light but not dark,
 *                           so dark mode silently fell back to light values
 *   3. category mapping   — get_tokens categories pointed at TOKENS.md
 *                           headings that had been renumbered away
 *   4. doc paths          — AGENT_GUIDE pointed at ds-v2/src/styles/tokens.css,
 *                           a path that never existed
 *   5. documented classes — the chart palette was documented but truncated
 *                           out of the tool's own response
 *
 * Exit 1 on any failure. Run: npm test
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TOKENS_CSS = path.join(ROOT, "ds-shadcn/src/styles/tokens.css");
const TW_CONFIG = path.join(ROOT, "ds-shadcn/tailwind.config.ts");
const DOCS = path.join(ROOT, "docs");
const SERVER_INDEX = path.join(ROOT, "src/index.ts");

let failures = 0;
let checks = 0;

function fail(check, detail) {
  failures++;
  console.error(`✗ ${check}\n  ${detail}\n`);
}
function pass(check, note = "") {
  checks++;
  console.log(`✓ ${check}${note ? ` — ${note}` : ""}`);
}
function read(p) {
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null;
}

// ──────────────────────────────────────────────────────────────
// 1. Token round-trip: every var() in tailwind.config.ts is defined in tokens.css
// ──────────────────────────────────────────────────────────────
function checkTokenRoundTrip() {
  const css = read(TOKENS_CSS);
  const tw = read(TW_CONFIG);
  if (!css || !tw) return fail("token round-trip", "tokens.css or tailwind.config.ts missing");

  const defined = new Set(
    [...css.matchAll(/^\s*(--[a-zA-Z0-9_-]+)\s*:/gm)].map((m) => m[1])
  );
  const referenced = [...tw.matchAll(/var\((--[a-zA-Z0-9_-]+)\)/g)].map((m) => m[1]);
  const missing = [...new Set(referenced.filter((v) => !defined.has(v)))];

  if (missing.length) {
    fail(
      "token round-trip",
      `tailwind.config.ts references ${missing.length} var(s) not defined in tokens.css:\n  ${missing.join("\n  ")}`
    );
  } else {
    pass("token round-trip", `${new Set(referenced).size} vars all defined`);
  }
}

// ──────────────────────────────────────────────────────────────
// 2. Mode parity: tokens defined in light must also be defined in dark
// ──────────────────────────────────────────────────────────────
function blockOf(css, selector) {
  const i = css.indexOf(selector);
  if (i < 0) return null;
  const open = css.indexOf("{", i);
  const close = css.indexOf("\n}", open);
  return css.slice(open, close);
}

function checkModeParity() {
  const css = read(TOKENS_CSS);
  if (!css) return fail("mode parity", "tokens.css missing");

  const light = blockOf(css, '[data-appearance="light"]');
  const dark = blockOf(css, '[data-appearance="dark"]');
  if (!light || !dark) {
    return fail("mode parity", "could not locate light and/or dark appearance block");
  }
  const names = (b) => new Set([...b.matchAll(/^\s*(--color-[a-zA-Z0-9_-]+)\s*:/gm)].map((m) => m[1]));
  const L = names(light);
  const D = names(dark);
  const onlyLight = [...L].filter((n) => !D.has(n));

  if (onlyLight.length) {
    fail(
      "mode parity",
      `${onlyLight.length} colour token(s) defined in light but NOT dark (they will silently keep light values):\n  ${onlyLight.join("\n  ")}`
    );
  } else {
    pass("mode parity", `${L.size} colour tokens defined in both modes`);
  }
}

// ──────────────────────────────────────────────────────────────
// 3. get_tokens categories resolve to real TOKENS.md headings
// ──────────────────────────────────────────────────────────────
function checkCategoryMapping() {
  const src = read(SERVER_INDEX);
  const tokensMd = read(path.join(DOCS, "TOKENS.md"));
  if (!src || !tokensMd) return fail("get_tokens categories", "source or TOKENS.md missing");

  const mapBlock = /const TOKEN_CATEGORIES[^{]*\{([\s\S]*?)\n\};/.exec(src);
  if (!mapBlock) return fail("get_tokens categories", "TOKEN_CATEGORIES not found in src/index.ts");

  const entries = [...mapBlock[1].matchAll(/["']?([a-z-]+)["']?\s*:\s*["']([^"']+)["']/g)];
  const headings = [...tokensMd.matchAll(/^##\s+(.+)$/gm)].map((m) => m[1].trim());
  const broken = entries.filter(([, , heading]) => !headings.includes(heading));

  if (broken.length) {
    fail(
      "get_tokens categories",
      `${broken.length} category(ies) point at headings that don't exist in TOKENS.md:\n  ${broken
        .map(([, cat, h]) => `${cat} → "${h}"`)
        .join("\n  ")}\n  Available: ${headings.join(" | ")}`
    );
  } else {
    pass("get_tokens categories", `${entries.length} categories all resolve`);
  }
}

// ──────────────────────────────────────────────────────────────
// 4. File paths named in docs exist
// ──────────────────────────────────────────────────────────────
function checkDocPaths() {
  const bad = [];
  let scanned = 0;
  for (const f of fs.readdirSync(DOCS).filter((f) => f.endsWith(".md"))) {
    const text = read(path.join(DOCS, f));
    // Only repo-owned paths. `src/...` and `scripts/...` in ENFORCEMENT.md are
    // deliberately app-relative (setup instructions for a consuming project),
    // so they can't be resolved from here.
    const paths = [...text.matchAll(/(?:^|[\s`"(])((?:ds-shadcn|docs)\/[A-Za-z0-9_./()-]*\.[a-z]{2,4})/gm)]
      .map((m) => m[1]);
    for (const p of new Set(paths)) {
      scanned++;
      if (!fs.existsSync(path.join(ROOT, p))) bad.push(`${f}: ${p}`);
    }
  }
  if (bad.length) {
    fail("doc file paths", `${bad.length} path(s) referenced in docs do not exist:\n  ${bad.join("\n  ")}`);
  } else {
    pass("doc file paths", `${scanned} path references all resolve`);
  }
}

// ──────────────────────────────────────────────────────────────
// 5. DS classes named in docs are backed by a real token family
// ──────────────────────────────────────────────────────────────
function tokenNamesFromConfig(tw) {
  // capture the quoted keys in the extend blocks we care about
  const names = new Set();
  for (const m of tw.matchAll(/["']([a-z0-9-]+)["']\s*:\s*["']var\(--[a-zA-Z0-9_-]+\)["']/g)) {
    names.add(m[1]);
  }
  // unquoted keys, e.g. control: "var(--radius-control)"
  for (const m of tw.matchAll(/^\s*([a-z][a-z0-9-]*)\s*:\s*["']var\(--[a-zA-Z0-9_-]+\)["']/gm)) {
    names.add(m[1]);
  }
  return names;
}

function checkDocumentedClasses() {
  const tw = read(TW_CONFIG);
  if (!tw) return fail("documented classes", "tailwind.config.ts missing");
  const tokens = tokenNamesFromConfig(tw);

  // families whose suffix must be a known token
  const FAMILIES = [
    "bg-surface-", "bg-bg-", "bg-action-", "bg-status-", "bg-chart-",
    "text-text-", "text-status-", "text-icon-", "text-chart-",
    "border-border-", "border-status-",
    "gap-stack-", "gap-inline-", "space-y-stack-", "p-stack-", "px-cont-", "py-comp-", "px-comp-",
    "rounded-", "shadow-", "z-", "duration-", "ease-",
  ];
  const KNOWN_NON_TOKEN = new Set([
    // Tailwind core values that share a DS prefix
    "rounded-none", "rounded-sm", "rounded-md", "rounded-lg", "rounded-xl", "rounded-full", "rounded-2xl",
    "shadow-none", "shadow-sm", "shadow-md", "shadow-lg", "shadow-xl", "shadow-inner",
    "z-auto",
    "ease-linear",
    // prose, not classes
    "z-index", "ease-ease",
    // deprecated aliases, intentionally still present in the config
    "ease-ease-out", "ease-ease-in", "ease-ease-in-out",
  ]);
  // numeric utilities (z-50, duration-300) are Tailwind core scale values, not DS tokens
  const isNumericScale = (c) => /^(z|duration)-\d+$/.test(c);

  const bad = [];
  let scanned = 0;
  for (const f of fs.readdirSync(DOCS).filter((f) => f.endsWith(".md"))) {
    const text = read(path.join(DOCS, f));
    const classes = new Set(
      [...text.matchAll(/[`"\s](?:hover:|focus:|focus-visible:|active:|disabled:)?([a-z]+(?:-[a-z0-9]+)+)/g)].map((m) => m[1])
    );
    for (const cls of classes) {
      const fam = FAMILIES.find((p) => cls.startsWith(p));
      if (!fam) continue;
      if (KNOWN_NON_TOKEN.has(cls) || isNumericScale(cls)) continue;
      scanned++;
      // strip the utility prefix to get the token name as tailwind knows it
      const candidates = [
        cls.replace(/^(bg|text|border|fill|stroke|ring)-/, ""),
        cls.replace(/^(gap|space-y|space-x|p|px|py|m|mx|my|h|w)-/, ""),
        cls.replace(/^(rounded|shadow|z|duration|ease)-/, ""),
      ];
      if (!candidates.some((c) => tokens.has(c))) bad.push(`${f}: ${cls}`);
    }
  }

  if (bad.length) {
    fail(
      "documented classes",
      `${bad.length} DS-family class(es) in docs have no matching token in tailwind.config.ts:\n  ${bad.slice(0, 25).join("\n  ")}${bad.length > 25 ? `\n  …and ${bad.length - 25} more` : ""}`
    );
  } else {
    pass("documented classes", `${scanned} DS-family class references all backed by tokens`);
  }
}

// ──────────────────────────────────────────────────────────────
// 6. Every real component is mentioned in COMPONENTS.md
// ──────────────────────────────────────────────────────────────
function checkComponentCoverage() {
  const dir = path.join(ROOT, "ds-shadcn/src/components/ui");
  const doc = read(path.join(DOCS, "COMPONENTS.md"));
  if (!fs.existsSync(dir) || !doc) return fail("component coverage", "components dir or COMPONENTS.md missing");

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".tsx"));
  const missing = files
    .map((f) => path.basename(f, ".tsx"))
    .filter((name) => {
      const pattern = new RegExp(name.replace(/-/g, "[- ]*"), "i");
      return !pattern.test(doc);
    });

  if (missing.length) {
    fail(
      "component coverage",
      `${missing.length} of ${files.length} components are never mentioned in COMPONENTS.md (get_component cannot describe them):\n  ${missing.join(", ")}`
    );
  } else {
    pass("component coverage", `all ${files.length} components documented`);
  }
}

// ──────────────────────────────────────────────────────────────
console.log("verify-ds — checking docs against implementation\n");
checkTokenRoundTrip();
checkModeParity();
checkCategoryMapping();
checkDocPaths();
checkDocumentedClasses();
checkComponentCoverage();

console.log("");
if (failures > 0) {
  console.error(`${failures} check(s) failed, ${checks} passed.`);
  process.exit(1);
}
console.log(`All ${checks} checks passed.`);
