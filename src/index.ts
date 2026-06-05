#!/usr/bin/env node
/**
 * Design System v1.2 — MCP Server
 *
 * Tools:
 *   ds_get_tokens          — token reference by category
 *   ds_resolve_violation   — forbidden class → correct DS token
 *   ds_lint_snippet        — lint JSX/TSX for DS violations
 *   ds_get_component       — component docs + copy-paste examples
 *   ds_get_pattern         — canonical dashboard pattern implementation
 *   ds_get_template_zone   — Gemini template zone spec (header/sidebar/main)
 *   ds_get_guide           — agent guide sections (rules, decision tree, anti-patterns…)
 *   ds_setup_enforcement   — 3-layer enforcement setup (lint script + CLAUDE.md + husky)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { existsSync, readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

// ── Paths ─────────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// dist/index.js → ../../MCP  |  src/index.ts (tsx dev) → ../../MCP
const MCP_DIR = resolve(__dirname, "..", "..", "MCP");

function loadDoc(name: string): string {
  const p = resolve(MCP_DIR, name);
  if (!existsSync(p)) {
    console.error(`[ds-mcp] WARNING: ${name} not found at ${p}`);
    return `[${name} not found — check MCP_DIR: ${MCP_DIR}]`;
  }
  return readFileSync(p, "utf8");
}

const DOCS = {
  tokens: loadDoc("TOKENS.md"),
  components: loadDoc("COMPONENTS.md"),
  patterns: loadDoc("DASHBOARD_PATTERNS.md"),
  template: loadDoc("TEMPLATE_STYLE.md"),
  guide: loadDoc("AGENT_GUIDE.md"),
  enforcement: loadDoc("ENFORCEMENT.md"),
};

// ── Violation map ─────────────────────────────────────────────────────────────

interface ViolationEntry {
  replacement: string;
  category: string;
  note?: string;
}

const VIOLATION_MAP: Record<string, ViolationEntry> = {
  // text — slate
  "text-slate-900": { replacement: "text-text-primary", category: "text" },
  "text-slate-800": { replacement: "text-text-primary", category: "text" },
  "text-slate-700": { replacement: "text-text-strong", category: "text" },
  "text-slate-600": { replacement: "text-text-secondary", category: "text" },
  "text-slate-500": { replacement: "text-text-subtle", category: "text" },
  "text-slate-400": { replacement: "text-text-muted", category: "text" },
  "text-slate-300": { replacement: "text-text-disabled", category: "text" },
  "text-slate-200": { replacement: "text-text-disabled", category: "text" },
  "text-slate-100": { replacement: "text-text-disabled", category: "text" },
  // text — status
  "text-red-400": { replacement: "text-status-error-fg", category: "status" },
  "text-red-500": { replacement: "text-status-error-fg", category: "status" },
  "text-red-600": { replacement: "text-status-error-fg", category: "status" },
  "text-red-700": { replacement: "text-status-error-fg", category: "status" },
  "text-green-500": { replacement: "text-status-success-fg", category: "status" },
  "text-green-600": { replacement: "text-status-success-fg", category: "status" },
  "text-green-700": { replacement: "text-status-success-fg", category: "status" },
  "text-yellow-500": { replacement: "text-status-warning-fg", category: "status" },
  "text-yellow-600": { replacement: "text-status-warning-fg", category: "status" },
  "text-blue-500": { replacement: "text-status-info-fg", category: "status" },
  "text-blue-600": { replacement: "text-status-info-fg", category: "status" },
  "text-orange-500": { replacement: "text-status-attention-fg", category: "status" },
  "text-orange-600": { replacement: "text-status-attention-fg", category: "status" },
  // text — hardcoded purple
  "text-[#4f46e5]": { replacement: "text-icon-interactive", category: "action" },
  "text-[#4338ca]": { replacement: "text-icon-interactive", category: "action" },
  // background — neutral
  "bg-white": { replacement: "bg-surface-elevated", category: "background" },
  "bg-slate-50": { replacement: "bg-surface-sunken", category: "background" },
  "bg-slate-100": { replacement: "bg-bg-secondary", category: "background" },
  "bg-slate-200": { replacement: "bg-bg-tertiary", category: "background" },
  "bg-slate-300": { replacement: "bg-bg-tertiary", category: "background" },
  "hover:bg-slate-50": { replacement: "hover:bg-surface-sunken", category: "background" },
  "hover:bg-slate-100": { replacement: "hover:bg-action-ghost-hover", category: "action" },
  "hover:bg-slate-200": { replacement: "hover:bg-action-ghost-active", category: "action" },
  // background — status
  "bg-red-50": { replacement: "bg-status-error-bg", category: "status" },
  "bg-red-100": { replacement: "bg-status-error-bg", category: "status" },
  "bg-green-50": { replacement: "bg-status-success-bg", category: "status" },
  "bg-green-100": { replacement: "bg-status-success-bg", category: "status" },
  "bg-yellow-50": { replacement: "bg-status-warning-bg", category: "status" },
  "bg-yellow-100": { replacement: "bg-status-warning-bg", category: "status" },
  "bg-blue-50": { replacement: "bg-status-info-bg", category: "status" },
  "bg-blue-100": { replacement: "bg-status-info-bg", category: "status" },
  // background — hardcoded purple
  "bg-[#4f46e5]": { replacement: "bg-action-primary", category: "action" },
  "bg-[#4338ca]": { replacement: "bg-action-primary-hover", category: "action" },
  "bg-[rgba(79,70,229,0.04)]": { replacement: "bg-action-primary-tint", category: "action" },
  "bg-[rgba(79,70,229,0.06)]": { replacement: "bg-action-primary-tint", category: "action" },
  "bg-[rgba(79,70,229,0.08)]": { replacement: "bg-action-primary-subtle", category: "action" },
  "bg-[rgba(79,70,229,0.1)]": { replacement: "bg-action-primary-subtle", category: "action" },
  "bg-[rgba(79,70,229,0.10)]": { replacement: "bg-action-primary-subtle", category: "action" },
  "bg-[rgba(79,70,229,0.12)]": { replacement: "bg-action-primary-subtle", category: "action" },
  // border
  "border-slate-100": { replacement: "border-border-subtle", category: "border" },
  "border-slate-200": { replacement: "border-border-default", category: "border" },
  "border-slate-300": { replacement: "border-border-hover", category: "border" },
  "border-gray-200": { replacement: "border-border-default", category: "border" },
  "border-[#4f46e5]": { replacement: "border-border-focus", category: "border" },
  "ring-[#4f46e5]": { replacement: "ring-border-focus", category: "border" },
  "border-[rgba(79,70,229,0.2)]": { replacement: "border-action-primary-subtle", category: "border" },
  // border — status
  "border-red-200": { replacement: "border-status-error-border", category: "status" },
  "border-red-500": { replacement: "border-status-error-border", category: "status" },
  "border-green-200": { replacement: "border-status-success-border", category: "status" },
  "border-yellow-200": { replacement: "border-status-warning-border", category: "status" },
  "border-blue-200": { replacement: "border-status-info-border", category: "status" },
};

function resolveViolation(cls: string): ViolationEntry | null {
  const trimmed = cls.trim();

  // Exact map lookup
  if (VIOLATION_MAP[trimmed]) return VIOLATION_MAP[trimmed];

  // Pattern-based resolution
  const textSlate = trimmed.match(/^text-slate-(\d+)$/);
  if (textSlate) {
    const n = parseInt(textSlate[1]);
    if (n >= 800) return { replacement: "text-text-primary", category: "text" };
    if (n >= 700) return { replacement: "text-text-strong", category: "text" };
    if (n >= 600) return { replacement: "text-text-secondary", category: "text" };
    if (n >= 500) return { replacement: "text-text-subtle", category: "text" };
    if (n >= 400) return { replacement: "text-text-muted", category: "text" };
    return { replacement: "text-text-disabled", category: "text" };
  }

  const bgSlate = trimmed.match(/^bg-slate-(\d+)$/);
  if (bgSlate) {
    const n = parseInt(bgSlate[1]);
    if (n <= 50) return { replacement: "bg-surface-sunken", category: "background" };
    if (n <= 100) return { replacement: "bg-bg-secondary", category: "background" };
    return { replacement: "bg-bg-tertiary", category: "background" };
  }

  const borderSlate = trimmed.match(/^border-slate-(\d+)$/);
  if (borderSlate) {
    const n = parseInt(borderSlate[1]);
    if (n <= 100) return { replacement: "border-border-subtle", category: "border" };
    if (n <= 200) return { replacement: "border-border-default", category: "border" };
    return { replacement: "border-border-hover", category: "border" };
  }

  if (/^text-red-\d+$/.test(trimmed)) return { replacement: "text-status-error-fg", category: "status" };
  if (/^text-green-\d+$/.test(trimmed)) return { replacement: "text-status-success-fg", category: "status" };
  if (/^text-yellow-\d+$/.test(trimmed)) return { replacement: "text-status-warning-fg", category: "status" };
  if (/^text-blue-\d+$/.test(trimmed)) return { replacement: "text-status-info-fg", category: "status" };
  if (/^text-orange-\d+$/.test(trimmed)) return { replacement: "text-status-attention-fg", category: "status" };

  if (/^bg-red-\d+$/.test(trimmed)) return { replacement: "bg-status-error-bg", category: "status" };
  if (/^bg-green-\d+$/.test(trimmed)) return { replacement: "bg-status-success-bg", category: "status" };
  if (/^bg-yellow-\d+$/.test(trimmed)) return { replacement: "bg-status-warning-bg", category: "status" };
  if (/^bg-blue-\d+$/.test(trimmed)) return { replacement: "bg-status-info-bg", category: "status" };

  if (/^border-red-\d+$/.test(trimmed)) return { replacement: "border-status-error-border", category: "status" };
  if (/^border-green-\d+$/.test(trimmed)) return { replacement: "border-status-success-border", category: "status" };
  if (/^border-yellow-\d+$/.test(trimmed)) return { replacement: "border-status-warning-border", category: "status" };
  if (/^border-blue-\d+$/.test(trimmed)) return { replacement: "border-status-info-border", category: "status" };

  if (/^(?:bg|text|border|ring)-\[#[0-9a-fA-F]+\]$/.test(trimmed)) {
    return {
      replacement: "use a DS token — browse with ds_get_tokens",
      category: "hardcoded-hex",
      note: "Cannot auto-resolve an arbitrary hex value. Identify the semantic role (action? surface? border?) and pick the right token.",
    };
  }

  return null;
}

// ── Lint rules (exact mirror of lint-colors.mjs) ──────────────────────────────

interface LintRule {
  pattern: RegExp;
  message: string;
}

const LINT_RULES: LintRule[] = [
  {
    pattern: /(?:bg|text|border|ring)-\[#[0-9a-fA-F]+\]/g,
    message: "Hardcoded hex color — use a DS token (e.g. bg-action-primary, text-icon-interactive, border-border-focus)",
  },
  {
    pattern: /(?:bg|border|text)-\[rgba\(\s*79\s*,\s*70\s*,\s*229/g,
    message: "Hardcoded purple rgba — use bg-action-primary-subtle, bg-action-primary-tint, or border-action-primary-subtle",
  },
  {
    pattern: /text-slate-\d+/g,
    message: "Raw text-slate-* — use text-text-{primary|strong|secondary|subtle|muted|disabled}",
  },
  {
    pattern: /\bbg-white\b/g,
    message: "Raw bg-white — use bg-surface-elevated",
  },
  {
    pattern: /\bbg-slate-\d+/g,
    message: "Raw bg-slate-* — use bg-surface-{sunken|elevated} or bg-bg-{secondary|tertiary}",
  },
  {
    pattern: /\bborder-slate-\d+/g,
    message: "Raw border-slate-* — use border-border-{subtle|default|hover|focus}",
  },
  {
    pattern: /(?:text|bg|border)-red-\d+/g,
    message: "Raw red-* — use {text|bg|border}-status-error-{fg|bg|border}",
  },
  {
    pattern: /(?:text|bg|border)-green-\d+/g,
    message: "Raw green-* — use {text|bg|border}-status-success-{fg|bg|border}",
  },
  {
    pattern: /(?:text|bg|border)-yellow-\d+/g,
    message: "Raw yellow-* — use {text|bg|border}-status-warning-{fg|bg|border}",
  },
  {
    pattern: /(?:text|bg|border)-blue-\d+/g,
    message: "Raw blue-* — use {text|bg|border}-status-info-{fg|bg|border}",
  },
  {
    pattern: /(?:text|bg)-orange-\d+/g,
    message: "Raw orange-* — use text-status-attention-fg",
  },
];

interface LintViolation {
  line: number;
  match: string;
  message: string;
  suggestion?: string;
}

function lintSnippet(code: string): LintViolation[] {
  const violations: LintViolation[] = [];
  const lines = code.split("\n");

  for (const rule of LINT_RULES) {
    lines.forEach((line, i) => {
      const regex = new RegExp(rule.pattern.source, "g");
      let m: RegExpExecArray | null;
      while ((m = regex.exec(line)) !== null) {
        const resolved = resolveViolation(m[0]);
        violations.push({
          line: i + 1,
          match: m[0],
          message: rule.message,
          suggestion: resolved?.replacement,
        });
      }
    });
  }

  return violations;
}

// ── Markdown section helpers ──────────────────────────────────────────────────

function wordsMatch(heading: string, query: string): boolean {
  const h = heading.toLowerCase().replace(/[^a-z0-9 ]/g, " ");
  const q = query.toLowerCase().replace(/[^a-z0-9 ]/g, " ").trim();
  if (h === q || h.includes(q)) return true;
  // All words in query must appear in heading
  return q.split(/\s+/).filter(Boolean).every((w) => h.includes(w));
}

function extractSection(markdown: string, query: string, level = 2): string | null {
  const lines = markdown.split("\n");
  let inSection = false;
  const buf: string[] = [];

  for (const line of lines) {
    if (/^#+/.test(line)) {
      const lineLevel = (line.match(/^#+/) as RegExpMatchArray)[0].length;
      const title = line.replace(/^#+\s*/, "").trim();

      if (!inSection && lineLevel === level && wordsMatch(title, query)) {
        inSection = true;
        buf.push(line);
        continue;
      }
      if (inSection && lineLevel <= level) {
        break; // next same-or-higher heading ends this section
      }
    }
    if (inSection) buf.push(line);
  }

  return buf.length > 0 ? buf.join("\n").trim() : null;
}

function listSections(markdown: string, level = 2): string[] {
  const prefix = "#".repeat(level) + " ";
  return markdown
    .split("\n")
    .filter((l) => l.startsWith(prefix))
    .map((l) => l.slice(prefix.length).trim());
}

// ── Token category helper ─────────────────────────────────────────────────────

const TOKEN_SUBSECTION_MAP: Record<string, string[]> = {
  text: ["Text Colors"],
  background: ["Surface (background layers)", "Background (tonal fills)"],
  surface: ["Surface (background layers)", "Background (tonal fills)"],
  action: ["Action Colors"],
  border: ["Border Colors"],
  status: ["Status Colors"],
  icon: ["Icon Colors"],
  spacing: ["3. Spacing Tokens"],
  radius: ["4. Radius Tokens"],
  shadow: ["5. Shadow Tokens"],
  zindex: ["6. Z-Index Tokens"],
  motion: ["7. Motion Tokens"],
  size: ["8. Control Size Tokens"],
};

function getTokenContent(category: string): string {
  if (category === "all") {
    return extractSection(DOCS.tokens, "1. Color Tokens") ?? DOCS.tokens;
  }
  const headings = TOKEN_SUBSECTION_MAP[category.toLowerCase()];
  if (!headings) {
    return `Unknown category "${category}". Valid values: text, background, action, border, status, icon, spacing, radius, shadow, motion, size, all`;
  }
  const parts = headings.map(
    (h) =>
      extractSection(DOCS.tokens, h, 3) ??
      extractSection(DOCS.tokens, h, 2) ??
      `[Section "${h}" not found in TOKENS.md]`
  );
  return parts.join("\n\n");
}

// ── Guide section aliases ─────────────────────────────────────────────────────

const GUIDE_ALIASES: Record<string, string> = {
  golden_rules: "The Golden Rules",
  golden: "The Golden Rules",
  rules: "The Golden Rules",
  rule0: "RULE #0",
  template_law: "RULE #0",
  decision_tree: "Decision Tree",
  decision: "Decision Tree",
  what_to_use: "Decision Tree",
  anti_patterns: "Anti-Patterns",
  antipatterns: "Anti-Patterns",
  anti: "Anti-Patterns",
  dont: "Anti-Patterns",
  token_cheat_sheet: "Token Cheat Sheet",
  cheat_sheet: "Token Cheat Sheet",
  cheat: "Token Cheat Sheet",
  tokens: "Token Cheat Sheet",
  accessibility: "Accessibility Checklist",
  a11y: "Accessibility Checklist",
  icons: "Icon Usage Rules",
  icon: "Icon Usage Rules",
  page_steps: "Step-by-Step",
  steps: "Step-by-Step",
  building: "Step-by-Step",
  composing: "Composing New Patterns",
  compose: "Composing New Patterns",
  new_patterns: "Composing New Patterns",
  quick_reference: "Quick Reference Card",
  quick: "Quick Reference Card",
  reference: "Quick Reference Card",
  imports: "File & Import Conventions",
  file: "File & Import Conventions",
};

// ── MCP Server ────────────────────────────────────────────────────────────────

const server = new Server(
  { name: "ds-shadcn-mcp", version: "1.2.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "ds_get_tokens",
      description:
        "Get the DS token reference table for a category. Returns token names, approximate values, and use cases. Category options: text, background, action, border, status, icon, spacing, radius, shadow, motion, size, all. Defaults to all color tokens.",
      inputSchema: {
        type: "object",
        properties: {
          category: {
            type: "string",
            description:
              "Token category: text | background | action | border | status | icon | spacing | radius | shadow | motion | size | all",
            default: "all",
          },
        },
      },
    },
    {
      name: "ds_resolve_violation",
      description:
        "Given a forbidden Tailwind class (e.g. 'text-slate-600', 'bg-white', 'bg-[#4f46e5]', 'hover:bg-slate-100'), returns the correct DS token replacement and the category it belongs to. Use this when the linter flags a violation.",
      inputSchema: {
        type: "object",
        properties: {
          class_name: {
            type: "string",
            description: "The forbidden class to resolve, e.g. 'text-slate-600' or 'bg-[#4f46e5]'",
          },
        },
        required: ["class_name"],
      },
    },
    {
      name: "ds_lint_snippet",
      description:
        "Check a JSX/TSX code snippet for Design System color violations. Returns each violation with its line number, the forbidden match, an explanation, and the suggested DS replacement. Mirrors the behavior of `npm run lint:colors`.",
      inputSchema: {
        type: "object",
        properties: {
          code: {
            type: "string",
            description: "The JSX/TSX code snippet to check",
          },
        },
        required: ["code"],
      },
    },
    {
      name: "ds_get_component",
      description:
        "Get full documentation (variants, props, copy-paste TSX examples, rules) for a named shadcn/DS component such as button, badge, card, table, input, select, dialog, sheet, switch, tooltip, tabs, etc. Pass 'list' to see all available components.",
      inputSchema: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description:
              "Component name (e.g. 'button', 'badge', 'card', 'table', 'dialog', 'sheet', 'switch') or 'list' to see all components",
          },
        },
        required: ["name"],
      },
    },
    {
      name: "ds_get_pattern",
      description:
        "Get the canonical TSX implementation of a dashboard layout pattern. Patterns include: app shell, announcement banner, top bar, sidebar, stat card, data table, empty state, page header, filter bar, chart card, full page template. Pass 'list' to see all.",
      inputSchema: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description:
              "Pattern name (e.g. 'app shell', 'top bar', 'data table', 'stat card', 'empty state') or 'list' to see all patterns",
          },
        },
        required: ["name"],
      },
    },
    {
      name: "ds_get_template_zone",
      description:
        "Get the exact DS token translation for a layout zone from the canonical Gemini template (the visual law). Use this to verify that your header, sidebar, or main content area matches the template spec. Zones: header, sidebar, main, all.",
      inputSchema: {
        type: "object",
        properties: {
          zone: {
            type: "string",
            description: "Zone: 'header' | 'sidebar' | 'main' | 'all'",
            default: "all",
          },
        },
      },
    },
    {
      name: "ds_get_guide",
      description:
        "Get a section from the Agent Guide. Available sections: golden_rules, decision_tree (what to use for each UI need), anti_patterns, token_cheat_sheet, accessibility, icons, page_steps (step-by-step new page), composing (new patterns), quick_reference, imports.",
      inputSchema: {
        type: "object",
        properties: {
          section: {
            type: "string",
            description:
              "Section key: golden_rules | decision_tree | anti_patterns | token_cheat_sheet | accessibility | icons | page_steps | composing | quick_reference | imports | all",
          },
        },
        required: ["section"],
      },
    },
    {
      name: "ds_setup_enforcement",
      description:
        "Get the complete 3-layer DS color enforcement setup: Layer 1 — lint script source code ready to copy into scripts/lint-colors.mjs, Layer 2 — CLAUDE.md template structure, Layer 3 — husky pre-commit hook setup. Use when setting up enforcement in a new project.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // ── ds_get_tokens ───────────────────────────────────────────────────────
      case "ds_get_tokens": {
        const category = ((args?.category as string) ?? "all").trim();
        return { content: [{ type: "text", text: getTokenContent(category) }] };
      }

      // ── ds_resolve_violation ────────────────────────────────────────────────
      case "ds_resolve_violation": {
        const cls = args?.class_name as string;
        if (!cls) throw new McpError(ErrorCode.InvalidParams, "class_name is required");

        const result = resolveViolation(cls.trim());
        if (!result) {
          return {
            content: [
              {
                type: "text",
                text: [
                  `No known DS replacement for \`${cls}\`.`,
                  "",
                  "This class may not be a violation, or it may be an unusual pattern.",
                  "Try ds_get_tokens to browse all available tokens, or ds_lint_snippet to check a full snippet.",
                ].join("\n"),
              },
            ],
          };
        }

        const lines = [
          `❌ Forbidden:  \`${cls}\``,
          `✅ DS token:   \`${result.replacement}\``,
          `Category:     ${result.category}`,
        ];
        if (result.note) lines.push(`Note: ${result.note}`);

        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      // ── ds_lint_snippet ─────────────────────────────────────────────────────
      case "ds_lint_snippet": {
        const code = args?.code as string;
        if (!code) throw new McpError(ErrorCode.InvalidParams, "code is required");

        const violations = lintSnippet(code);

        if (violations.length === 0) {
          return { content: [{ type: "text", text: "✓ No DS color violations found." }] };
        }

        const lines = violations.map((v) => {
          const fix = v.suggestion ? `\n   → Replace with: \`${v.suggestion}\`` : "";
          return `✗ Line ${v.line}: \`${v.match}\`\n   ${v.message}${fix}`;
        });

        return {
          content: [
            {
              type: "text",
              text: `${violations.length} violation(s) found:\n\n${lines.join("\n\n")}`,
            },
          ],
        };
      }

      // ── ds_get_component ────────────────────────────────────────────────────
      case "ds_get_component": {
        const input = (args?.name as string)?.toLowerCase().trim();
        if (!input) throw new McpError(ErrorCode.InvalidParams, "name is required");

        if (input === "list") {
          const all = listSections(DOCS.components, 2);
          return {
            content: [
              { type: "text", text: `Available components (${all.length}):\n\n${all.map((c) => `- ${c}`).join("\n")}` },
            ],
          };
        }

        let section = extractSection(DOCS.components, input, 2);

        if (!section) {
          const all = listSections(DOCS.components, 2);
          const matches = all.filter((s) => wordsMatch(s, input));
          if (matches.length === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: `Component "${input}" not found.\nPass 'list' to see all available components.\nAvailable: ${all.join(", ")}`,
                },
              ],
            };
          }
          if (matches.length === 1) {
            section = extractSection(DOCS.components, matches[0], 2);
          } else {
            return {
              content: [
                {
                  type: "text",
                  text: `Multiple matches for "${input}": ${matches.join(", ")}\nPlease be more specific.`,
                },
              ],
            };
          }
        }

        return { content: [{ type: "text", text: section ?? `[Could not extract component section]` }] };
      }

      // ── ds_get_pattern ──────────────────────────────────────────────────────
      case "ds_get_pattern": {
        const input = (args?.name as string)?.toLowerCase().trim();
        if (!input) throw new McpError(ErrorCode.InvalidParams, "name is required");

        if (input === "list") {
          const all = listSections(DOCS.patterns, 2);
          return {
            content: [
              { type: "text", text: `Available patterns (${all.length}):\n\n${all.map((p) => `- ${p}`).join("\n")}` },
            ],
          };
        }

        let section = extractSection(DOCS.patterns, input, 2);

        if (!section) {
          const all = listSections(DOCS.patterns, 2);
          const matches = all.filter((s) => wordsMatch(s, input));
          if (matches.length === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: `Pattern "${input}" not found.\nPass 'list' to see all available patterns.\nAvailable: ${all.join(", ")}`,
                },
              ],
            };
          }
          if (matches.length === 1) {
            section = extractSection(DOCS.patterns, matches[0], 2);
          } else {
            return {
              content: [
                {
                  type: "text",
                  text: `Multiple matches for "${input}": ${matches.join(", ")}\nPlease be more specific.`,
                },
              ],
            };
          }
        }

        return { content: [{ type: "text", text: section ?? `[Could not extract pattern section]` }] };
      }

      // ── ds_get_template_zone ────────────────────────────────────────────────
      case "ds_get_template_zone": {
        const zone = ((args?.zone as string) ?? "all").toLowerCase().trim();

        if (zone === "all") {
          return { content: [{ type: "text", text: DOCS.template }] };
        }

        // Map common aliases to actual heading keywords
        const ZONE_KEYWORD: Record<string, string> = {
          header: "header",
          sidebar: "sidebar",
          main: "main",
          card: "card",
          navbar: "header",
          topbar: "header",
          "top bar": "header",
          nav: "header",
        };

        const keyword = ZONE_KEYWORD[zone] ?? zone;
        const section = extractSection(DOCS.template, keyword, 2);

        if (!section) {
          const all = listSections(DOCS.template, 2);
          return {
            content: [
              {
                type: "text",
                text: `Zone "${zone}" not found in TEMPLATE_STYLE.md.\nAvailable sections: ${all.join(", ")}`,
              },
            ],
          };
        }

        return { content: [{ type: "text", text: section }] };
      }

      // ── ds_get_guide ────────────────────────────────────────────────────────
      case "ds_get_guide": {
        const key = (args?.section as string)?.toLowerCase().trim();
        if (!key) throw new McpError(ErrorCode.InvalidParams, "section is required");

        if (key === "all") {
          return { content: [{ type: "text", text: DOCS.guide }] };
        }

        const heading = GUIDE_ALIASES[key] ?? key;
        let section = extractSection(DOCS.guide, heading, 2);

        if (!section) {
          // Try fuzzy match across all ## sections
          const all = listSections(DOCS.guide, 2);
          const matches = all.filter((s) => wordsMatch(s, heading));
          if (matches.length > 0) {
            section = extractSection(DOCS.guide, matches[0], 2);
          }
        }

        if (!section) {
          const all = listSections(DOCS.guide, 2);
          const aliases = Object.keys(GUIDE_ALIASES).join(", ");
          return {
            content: [
              {
                type: "text",
                text: [
                  `Section "${key}" not found in AGENT_GUIDE.md.`,
                  ``,
                  `Available guide sections:`,
                  all.map((s) => `  - ${s}`).join("\n"),
                  ``,
                  `Aliases you can use: ${aliases}`,
                ].join("\n"),
              },
            ],
          };
        }

        return { content: [{ type: "text", text: section }] };
      }

      // ── ds_setup_enforcement ────────────────────────────────────────────────
      case "ds_setup_enforcement": {
        return { content: [{ type: "text", text: DOCS.enforcement }] };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (err) {
    if (err instanceof McpError) throw err;
    throw new McpError(ErrorCode.InternalError, `Tool error: ${String(err)}`);
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`DS v1.2 MCP server running on stdio — docs dir: ${MCP_DIR}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
