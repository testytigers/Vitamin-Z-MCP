/**
 * validator.ts — DS enforcement rules (mirrors ENFORCEMENT.md / lint-colors.mjs)
 * with one upgrade the lint script doesn't have: deterministic AUTOFIX.
 * A local LLM can call validate_code once and get corrected code back.
 */
import ts from "typescript";
import fs from "node:fs";
import path from "node:path";
import { DOCS_DIR } from "./docIndex.js";
/**
 * Token whitelist — loaded from the real Tailwind config at startup.
 *
 * The forbidden-pattern rules below catch raw Tailwind colours, but they cannot
 * catch the opposite and far more common failure: a model inventing a token that
 * looks right. `bg-elevatd`, `text-strongest` and
 * `border-medium` all pass a blacklist and emit no CSS at all, so the
 * element silently renders unstyled. This checks the suffix of any DS-family
 * class against the tokens that actually exist.
 */
/**
 * Core Tailwind utilities that share our prefixes. Never flagged — they're
 * legitimate and unrelated to the token layer.
 */
const CORE_UTILITIES = new Set([
    "text-left", "text-center", "text-right", "text-justify", "text-start", "text-end",
    "text-wrap", "text-nowrap", "text-balance", "text-pretty", "text-clip", "text-ellipsis",
    "text-transparent", "text-current", "text-inherit",
    "text-xs", "text-sm", "text-base", "text-lg", "text-xl",
    "bg-none", "bg-cover", "bg-contain", "bg-fixed", "bg-local", "bg-scroll",
    "bg-center", "bg-top", "bg-bottom", "bg-left", "bg-right", "bg-repeat", "bg-no-repeat",
    "bg-transparent", "bg-current", "bg-inherit",
    "border-solid", "border-dashed", "border-dotted", "border-double", "border-hidden", "border-none",
    "border-collapse", "border-separate", "border-transparent", "border-current", "border-inherit",
    "border-t", "border-r", "border-b", "border-l", "border-x", "border-y",
    "ring-inset", "ring-transparent", "ring-current",
    "divide-solid", "divide-dashed", "divide-dotted", "divide-none",
    "divide-x", "divide-y", "divide-transparent", "divide-current",
]);
/** Utility prefixes whose value slot is a colour/spacing token. */
const TOKEN_PREFIXES = ["text", "bg", "border", "ring", "divide", "fill", "stroke", "gap", "space-x", "space-y"];
let VALID_CLASSES = null;
/**
 * Build the set of real classes from the Tailwind config.
 *
 * After the naming migration the DS classes no longer self-identify by prefix
 * (`text-primary` looks exactly like a core utility), so prefix matching can't
 * find typos any more. Instead we compare against the real class list and flag
 * anything that is *nearly* a token — which is precisely what a hallucinated or
 * mistyped class looks like.
 */
function loadClasses() {
    if (VALID_CLASSES)
        return VALID_CLASSES;
    const classes = new Set();
    const cfg = path.join(DOCS_DIR, "..", "ds-shadcn", "tailwind.config.ts");
    try {
        const src = fs.readFileSync(cfg, "utf8");
        const block = (key) => {
            const i = src.indexOf(`${key}: {`);
            if (i < 0)
                return [];
            let depth = 0, end = -1;
            for (let j = src.indexOf("{", i); j < src.length; j++) {
                if (src[j] === "{")
                    depth++;
                else if (src[j] === "}") {
                    depth--;
                    if (depth === 0) {
                        end = j;
                        break;
                    }
                }
            }
            return [...src.slice(i, end).matchAll(/["']?([a-zA-Z0-9-]+)["']?\s*:\s*["']var\(/g)].map((m) => m[1]);
        };
        for (const k of block("colors")) {
            for (const p of ["text", "bg", "border", "ring", "divide", "fill", "stroke"])
                classes.add(`${p}-${k}`);
        }
        for (const k of block("textColor"))
            classes.add(`text-${k}`);
        for (const k of block("backgroundColor"))
            classes.add(`bg-${k}`);
        for (const k of block("borderColor"))
            classes.add(`border-${k}`);
        for (const k of block("ringColor"))
            classes.add(`ring-${k}`);
        for (const k of block("divideColor"))
            classes.add(`divide-${k}`);
        for (const k of block("spacing")) {
            for (const p of ["gap", "space-x", "space-y", "p", "px", "py", "m", "mx", "my"])
                classes.add(`${p}-${k}`);
        }
    }
    catch {
        /* config unavailable — typo check is skipped, blacklist still applies */
    }
    VALID_CLASSES = classes;
    return classes;
}
/** Levenshtein distance, capped for speed. */
function distance(a, b, max = 3) {
    if (Math.abs(a.length - b.length) > max)
        return max + 1;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
        const cur = [i];
        for (let j = 1; j <= b.length; j++) {
            cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        }
        prev = cur;
    }
    return prev[b.length];
}
/** Deterministic replacements, applied longest-prefix-first. */
const FIX_MAP = [
    // hover variants BEFORE plain variants
    [/hover:bg-slate-100\b/g, "hover:bg-action-ghost-hover"],
    [/hover:bg-slate-200\b/g, "hover:bg-action-ghost-active"],
    [/hover:bg-slate-50\b/g, "hover:bg-sunken"],
    // known hex values (brand green #004030)
    [/bg-\[#004030\]/gi, "bg-action-primary"],
    [/bg-\[#003526\]/gi, "bg-action-primary-hover"],
    [/text-\[#004030\]/gi, "text-icon-interactive"],
    [/border-\[#004030\]/gi, "border-focus"],
    [/ring-\[#004030\]/gi, "ring-focus"],
    // brand rgba (0,64,48)
    [/bg-\[rgba\(\s*0\s*,\s*64\s*,\s*48\s*,\s*0?\.0[1-6]\s*\)\]/g, "bg-action-primary-tint"],
    [/bg-\[rgba\(\s*0\s*,\s*64\s*,\s*48[^\]]*\]/g, "bg-action-primary-subtle"],
    [/border-\[rgba\(\s*0\s*,\s*64\s*,\s*48[^\]]*\]/g, "border-action-primary-subtle"],
    // text slate scale
    [/text-slate-900\b/g, "text-primary"],
    [/text-slate-800\b/g, "text-primary"],
    [/text-slate-700\b/g, "text-strong"],
    [/text-slate-600\b/g, "text-secondary"],
    [/text-slate-500\b/g, "text-subtle"],
    [/text-slate-400\b/g, "text-muted"],
    [/text-slate-300\b/g, "text-disabled"],
    // backgrounds
    [/\bbg-white\b/g, "bg-elevated"],
    [/\bbg-slate-50\b/g, "bg-sunken"],
    [/\bbg-slate-100\b/g, "bg-secondary"],
    [/\bbg-slate-200\b/g, "bg-tertiary"],
    [/\bbg-slate-900\b/g, "bg-inverse"],
    // borders
    [/border-slate-100\b/g, "border-subtle"],
    [/border-slate-200\b/g, "border-default"],
    [/border-slate-300\b/g, "border-hover"],
    // status colors: fg/bg/border by prefix
    [/text-red-\d+\b/g, "text-status-error-fg"],
    [/bg-red-\d+\b/g, "bg-status-error-bg"],
    [/border-red-\d+\b/g, "border-status-error-border"],
    [/text-green-\d+\b/g, "text-status-success-fg"],
    [/bg-green-\d+\b/g, "bg-status-success-bg"],
    [/border-green-\d+\b/g, "border-status-success-border"],
    [/text-yellow-\d+\b/g, "text-status-warning-fg"],
    [/bg-yellow-\d+\b/g, "bg-status-warning-bg"],
    [/border-yellow-\d+\b/g, "border-status-warning-border"],
    [/text-blue-\d+\b/g, "text-status-info-fg"],
    [/bg-blue-\d+\b/g, "bg-status-info-bg"],
    [/border-blue-\d+\b/g, "border-status-info-border"],
    [/text-orange-\d+\b/g, "text-status-attention-fg"],
    [/bg-orange-\d+\b/g, "bg-status-warning-bg"],
];
/** Detection-only rules (no deterministic fix). */
const DETECT_ONLY = [
    [/(?:bg|text|border|ring)-\[#[0-9a-fA-F]+\]/g, "Hardcoded hex — pick the matching DS token (see TOKENS.md)"],
    [/\bdark:[a-z-]+/g, "Never use dark: modifiers — set data-appearance=\"dark\" on the root; tokens switch automatically"],
    [/(?:text|bg|border)-(?:gray|zinc|neutral|stone)-\d+\b/g, "Raw neutral palette — use text-text-* / bg-surface-* / border-border-* tokens"],
    [/(?:text|bg|border)-(?:indigo|purple|violet)-\d+\b/g, "Raw accent palette — use action-primary / icon-interactive / border-focus tokens"],
    [/text-slate-\d+\b/g, "Raw text-slate-* — use text-text-{primary|strong|secondary|subtle|muted|disabled}"],
    [/\bbg-slate-\d+\b/g, "Raw bg-slate-* — use bg-surface-* or bg-bg-* tokens"],
    [/border-slate-\d+\b/g, "Raw border-slate-* — use border-border-{subtle|default|hover|focus}"],
    [/\bbg-white\b/g, "Raw bg-white — use bg-elevated"],
    [/(?:text|bg|border)-red-\d+\b/g, "Raw red-* — use status-error tokens"],
    [/(?:text|bg|border)-green-\d+\b/g, "Raw green-* — use status-success tokens"],
    [/(?:text|bg|border)-yellow-\d+\b/g, "Raw yellow-* — use status-warning tokens"],
    [/(?:text|bg|border)-blue-\d+\b/g, "Raw blue-* — use status-info tokens"],
    [/(?:text|bg)-orange-\d+\b/g, "Raw orange-* — use text-status-attention-fg"],
];
/** TypeScript syntactic check — catches malformed TSX before it hits the project. */
export function syntaxCheck(code) {
    const result = ts.transpileModule(code, {
        compilerOptions: {
            jsx: ts.JsxEmit.Preserve,
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.ESNext,
        },
        reportDiagnostics: true,
        fileName: "page.tsx",
    });
    const errors = (result.diagnostics ?? [])
        .filter((d) => d.category === ts.DiagnosticCategory.Error)
        .map((d) => {
        const msg = ts.flattenDiagnosticMessageText(d.messageText, " ");
        if (d.file && d.start !== undefined) {
            const { line } = d.file.getLineAndCharacterOfPosition(d.start);
            return `line ${line + 1}: ${msg}`;
        }
        return msg;
    });
    return { ok: errors.length === 0, errors };
}
export function validate(code) {
    const lines = code.split("\n");
    const violations = [];
    lines.forEach((line, i) => {
        for (const [pattern, message] of DETECT_ONLY) {
            pattern.lastIndex = 0;
            for (const m of line.matchAll(new RegExp(pattern.source, "g"))) {
                // find a deterministic fix if one exists
                let fix = null;
                for (const [fp, replacement] of FIX_MAP) {
                    fp.lastIndex = 0;
                    if (new RegExp(`^(?:${fp.source})$`).test(m[0])) {
                        fix = typeof replacement === "string" ? replacement : replacement(m[0]);
                        break;
                    }
                }
                violations.push({ line: i + 1, match: m[0], fix, message });
            }
        }
    });
    // Near-miss check: a class that is one or two edits from a real token is
    // almost certainly a typo or a hallucinated name. It emits no CSS at all, so
    // the element renders unstyled and nothing anywhere reports an error.
    const known = loadClasses();
    if (known.size > 0) {
        lines.forEach((line, i) => {
            for (const m of line.matchAll(/[\s"'`{]((?:[a-z-]+:)*)((?:text|bg|border|ring|divide|fill|stroke|gap|space-[xy])-[a-z][a-z0-9-]*)/g)) {
                const cls = m[2];
                if (known.has(cls) || CORE_UTILITIES.has(cls))
                    continue;
                // arbitrary values and numeric scales are fine
                if (/-\[|-\d+$/.test(cls))
                    continue;
                if (!TOKEN_PREFIXES.some((p) => cls.startsWith(`${p}-`)))
                    continue;
                const prefix = cls.slice(0, cls.indexOf("-"));
                const candidates = [...known].filter((k) => k.startsWith(`${prefix}-`));
                // Pattern 1 — the class extends a real token with an invented suffix
                // (`text-strong` → `text-strongest`). Edit distance misses these because
                // the added suffix can be longer than the threshold.
                const extended = candidates.filter((c) => cls.startsWith(c) && /^[a-z]+$/.test(cls.slice(c.length)));
                // Pattern 2 — a near-miss typo (`bg-elevatd` → `bg-elevated`).
                let best = 99;
                let suggestions = [];
                for (const c of candidates) {
                    const d = distance(cls, c);
                    if (d < best) {
                        best = d;
                        suggestions = [c];
                    }
                    else if (d === best && suggestions.length < 3)
                        suggestions.push(c);
                }
                if (extended.length) {
                    best = 99; // not a 1-edit typo; don't offer an autofix
                    suggestions = extended;
                }
                else if (best > 2) {
                    continue; // not close to anything — a core utility
                }
                violations.push({
                    line: i + 1,
                    match: `${m[1]}${cls}`,
                    fix: suggestions.length === 1 && best === 1 ? `${m[1]}${suggestions[0]}` : null,
                    message: `Unknown token — emits no CSS. Did you mean: ${suggestions.slice(0, 3).join(", ")}?`,
                });
            }
        });
    }
    // dedupe (overlapping detect rules can double-report the same token)
    const seen = new Set();
    const unique = violations.filter((v) => {
        const k = `${v.line}:${v.match}`;
        if (seen.has(k))
            return false;
        seen.add(k);
        return true;
    });
    let fixedCode = null;
    let remaining = unique.length;
    if (unique.length > 0) {
        let fixed = code;
        for (const [pattern, replacement] of FIX_MAP) {
            pattern.lastIndex = 0;
            fixed = fixed.replace(pattern, replacement);
        }
        fixedCode = fixed !== code ? fixed : null;
        remaining = unique.filter((v) => v.fix === null).length;
    }
    return { ok: unique.length === 0, violations: unique, fixedCode, remaining };
}
