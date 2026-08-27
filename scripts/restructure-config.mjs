#!/usr/bin/env node
/**
 * restructure-config.mjs — one-shot migration.
 *
 * Moves text/surface/bg/border colours out of `theme.extend.colors` into the
 * property-specific keys Tailwind provides. Everything in `colors` gets the
 * utility prefix prepended, which is what produced `text-primary`,
 * `bg-secondary` and `border-default` — 24 stuttering classes.
 * ENFORCEMENT.md itself blames that verbosity for people reaching back for
 * `text-slate-600`.
 *
 * After: textColor.primary → `text-primary`, backgroundColor.elevated →
 * `bg-elevated`, borderColor.subtle → `border-subtle`.
 *
 * Usage: node scripts/restructure-config.mjs <path-to-tailwind.config.ts>
 */
import fs from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("usage: restructure-config.mjs <tailwind.config.ts>");
  process.exit(1);
}
let src = fs.readFileSync(file, "utf8");

// Grab the colors block
const start = src.indexOf("colors: {");
if (start < 0) {
  console.error("no colors block found");
  process.exit(1);
}
// find matching close brace
let depth = 0, end = -1;
for (let i = src.indexOf("{", start); i < src.length; i++) {
  if (src[i] === "{") depth++;
  else if (src[i] === "}") {
    depth--;
    if (depth === 0) { end = i; break; }
  }
}
const colorsBody = src.slice(src.indexOf("{", start) + 1, end);

// Parse entries, preserving comments loosely
const entries = [...colorsBody.matchAll(/["']?([a-zA-Z0-9-]+)["']?\s*:\s*(["'][^"']*["'])/g)]
  .map((m) => ({ key: m[1], val: m[2] }));

const TEXT = /^text-/;
const SURFACE = /^surface-/;
const BGG = /^bg-/;
const BORDER = /^border-/;

const textEntries = entries.filter((e) => TEXT.test(e.key));
const surfaceEntries = entries.filter((e) => SURFACE.test(e.key));
const bgEntries = entries.filter((e) => BGG.test(e.key));
const borderEntries = entries.filter((e) => BORDER.test(e.key));
const keep = entries.filter(
  (e) => !TEXT.test(e.key) && !SURFACE.test(e.key) && !BGG.test(e.key) && !BORDER.test(e.key)
);

const strip = (k, re) => k.replace(re, "");
const fmt = (list, re, indent = "        ") =>
  list.map((e) => `${indent}"${strip(e.key, re)}": ${e.val},`).join("\n");

// background = surfaces + tonal fills; bg-primary is a duplicate of canvas, dropped
const bgMerged = [
  ...surfaceEntries.map((e) => ({ key: strip(e.key, SURFACE), val: e.val })),
  ...bgEntries
    .map((e) => ({ key: strip(e.key, BGG), val: e.val }))
    .filter((e) => e.key !== "primary"),
];

// borders + surface colours usable as a punch-out ring (notification dots)
const borderMerged = [
  ...borderEntries.map((e) => ({ key: strip(e.key, BORDER), val: e.val })),
  ...surfaceEntries
    .filter((e) => ["surface-elevated", "surface-canvas"].includes(e.key))
    .map((e) => ({ key: strip(e.key, SURFACE), val: e.val })),
];

const line = (e, indent = "        ") => `${indent}"${e.key}": ${e.val},`;

const newColors = `colors: {
${keep.map((e) => line(e)).join("\n")}
      },

      /* Text colours live in textColor so the class reads text-primary (one word),
         not the doubled form. Same tokens, no stutter. */
      textColor: {
${fmt(textEntries, TEXT)}
      },

      /* Surfaces and tonal fills merged — they overlapped (surface-canvas,
         surface-elevated and bg-primary were all white). */
      backgroundColor: {
${bgMerged.map((e) => line(e)).join("\n")}
      },

      borderColor: {
${borderMerged.map((e) => line(e)).join("\n")}
      },

      ringColor: {
${borderEntries.map((e) => line({ key: strip(e.key, BORDER), val: e.val })).join("\n")}
      },

      divideColor: {
${borderEntries.map((e) => line({ key: strip(e.key, BORDER), val: e.val })).join("\n")}
      }`;

src = src.slice(0, start) + newColors + src.slice(end + 1);
fs.writeFileSync(file, src);

console.log(`${file}`);
console.log(`  colors kept:      ${keep.length}`);
console.log(`  → textColor:      ${textEntries.length}`);
console.log(`  → backgroundColor:${bgMerged.length} (${surfaceEntries.length} surface + ${bgEntries.length} bg, minus 1 duplicate)`);
console.log(`  → borderColor:    ${borderMerged.length}`);
console.log(`  → ring/divide:    ${borderEntries.length} each`);
