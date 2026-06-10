/**
 * validator.ts — DS enforcement rules (mirrors ENFORCEMENT.md / lint-colors.mjs)
 * with one upgrade the lint script doesn't have: deterministic AUTOFIX.
 * A local LLM can call validate_code once and get corrected code back.
 */

import ts from "typescript";

interface Violation {
  line: number;
  match: string;
  fix: string | null; // null = needs human/LLM judgement
  message: string;
}

/** Deterministic replacements, applied longest-prefix-first. */
const FIX_MAP: Array<[RegExp, string | ((m: string) => string)]> = [
  // hover variants BEFORE plain variants
  [/hover:bg-slate-100\b/g, "hover:bg-action-ghost-hover"],
  [/hover:bg-slate-200\b/g, "hover:bg-action-ghost-active"],
  [/hover:bg-slate-50\b/g, "hover:bg-surface-sunken"],
  // known hex values
  [/bg-\[#4f46e5\]/gi, "bg-action-primary"],
  [/bg-\[#4338ca\]/gi, "bg-action-primary-hover"],
  [/text-\[#4f46e5\]/gi, "text-icon-interactive"],
  [/border-\[#4f46e5\]/gi, "border-border-focus"],
  [/ring-\[#4f46e5\]/gi, "ring-border-focus"],
  // purple rgba
  [/bg-\[rgba\(\s*79\s*,\s*70\s*,\s*229\s*,\s*0?\.0[1-6]\s*\)\]/g, "bg-action-primary-tint"],
  [/bg-\[rgba\(\s*79\s*,\s*70\s*,\s*229[^\]]*\]/g, "bg-action-primary-subtle"],
  [/border-\[rgba\(\s*79\s*,\s*70\s*,\s*229[^\]]*\]/g, "border-action-primary-subtle"],
  // text slate scale
  [/text-slate-900\b/g, "text-text-primary"],
  [/text-slate-800\b/g, "text-text-primary"],
  [/text-slate-700\b/g, "text-text-strong"],
  [/text-slate-600\b/g, "text-text-secondary"],
  [/text-slate-500\b/g, "text-text-subtle"],
  [/text-slate-400\b/g, "text-text-muted"],
  [/text-slate-300\b/g, "text-text-disabled"],
  // backgrounds
  [/\bbg-white\b/g, "bg-surface-elevated"],
  [/\bbg-slate-50\b/g, "bg-surface-sunken"],
  [/\bbg-slate-100\b/g, "bg-bg-secondary"],
  [/\bbg-slate-200\b/g, "bg-bg-tertiary"],
  [/\bbg-slate-900\b/g, "bg-bg-inverse"],
  // borders
  [/border-slate-100\b/g, "border-border-subtle"],
  [/border-slate-200\b/g, "border-border-default"],
  [/border-slate-300\b/g, "border-border-hover"],
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
const DETECT_ONLY: Array<[RegExp, string]> = [
  [/(?:bg|text|border|ring)-\[#[0-9a-fA-F]+\]/g, "Hardcoded hex — pick the matching DS token (see TOKENS.md)"],
  [/\bdark:[a-z-]+/g, "Never use dark: modifiers — set data-appearance=\"dark\" on the root; tokens switch automatically"],
  [/(?:text|bg|border)-(?:gray|zinc|neutral|stone)-\d+\b/g, "Raw neutral palette — use text-text-* / bg-surface-* / border-border-* tokens"],
  [/(?:text|bg|border)-(?:indigo|purple|violet)-\d+\b/g, "Raw accent palette — use action-primary / icon-interactive / border-focus tokens"],
  [/text-slate-\d+\b/g, "Raw text-slate-* — use text-text-{primary|strong|secondary|subtle|muted|disabled}"],
  [/\bbg-slate-\d+\b/g, "Raw bg-slate-* — use bg-surface-* or bg-bg-* tokens"],
  [/border-slate-\d+\b/g, "Raw border-slate-* — use border-border-{subtle|default|hover|focus}"],
  [/\bbg-white\b/g, "Raw bg-white — use bg-surface-elevated"],
  [/(?:text|bg|border)-red-\d+\b/g, "Raw red-* — use status-error tokens"],
  [/(?:text|bg|border)-green-\d+\b/g, "Raw green-* — use status-success tokens"],
  [/(?:text|bg|border)-yellow-\d+\b/g, "Raw yellow-* — use status-warning tokens"],
  [/(?:text|bg|border)-blue-\d+\b/g, "Raw blue-* — use status-info tokens"],
  [/(?:text|bg)-orange-\d+\b/g, "Raw orange-* — use text-status-attention-fg"],
];

/** TypeScript syntactic check — catches malformed TSX before it hits the project. */
export function syntaxCheck(code: string): { ok: boolean; errors: string[] } {
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

export function validate(code: string): {
  ok: boolean;
  violations: Violation[];
  fixedCode: string | null;
  remaining: number;
} {
  const lines = code.split("\n");
  const violations: Violation[] = [];

  lines.forEach((line, i) => {
    for (const [pattern, message] of DETECT_ONLY) {
      pattern.lastIndex = 0;
      for (const m of line.matchAll(new RegExp(pattern.source, "g"))) {
        // find a deterministic fix if one exists
        let fix: string | null = null;
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

  // dedupe (overlapping detect rules can double-report the same token)
  const seen = new Set<string>();
  const unique = violations.filter((v) => {
    const k = `${v.line}:${v.match}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  let fixedCode: string | null = null;
  let remaining = unique.length;
  if (unique.length > 0) {
    let fixed = code;
    for (const [pattern, replacement] of FIX_MAP) {
      pattern.lastIndex = 0;
      fixed = fixed.replace(pattern, replacement as string);
    }
    fixedCode = fixed !== code ? fixed : null;
    remaining = unique.filter((v) => v.fix === null).length;
  }

  return { ok: unique.length === 0, violations: unique, fixedCode, remaining };
}
