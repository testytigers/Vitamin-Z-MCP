#!/usr/bin/env node
/**
 * ds-mcp — MCP server for Design System v1.2
 *
 * Built for voice-driven workflows: a local LLM receives a transcribed
 * command ("build me a shipments page with stats and a table"), calls
 * build_page once, and gets back a complete DS-compliant Next.js page.
 * Lookup tools return compact slices (never whole files) so small
 * context windows stay fast.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadIndex, search, findByHeading, headings, clip, DOCS_DIR } from "./docIndex.js";
import { buildPage } from "./scaffold.js";
import { validate, syntaxCheck } from "./validator.js";
import { parseOps, applyOps } from "./editor.js";
import { saveFile, listPages, findPage, readFileRel, projectDir } from "./project.js";
import { CHEATSHEET } from "./cheatsheet.js";
const stats = loadIndex();
const server = new McpServer({ name: "ds-mcp", version: "2.0.0" }, {
    instructions: `Design System v1.2 server. Voice loop: (1) to CREATE a page, call build_page with save:true — done in one call; (2) to CHANGE an existing page ("add a chart to orders"), call edit_page; (3) only call validate_code on code YOU wrote or hand-modified. Use get_component / get_tokens / get_pattern / search_ds for targeted lookups. Call get_cheatsheet once per session. Never write raw Tailwind colors (slate-*, gray-*, hex) — only DS semantic tokens.`,
});
function text(s) {
    return { content: [{ type: "text", text: s }] };
}
// ──────────────────────────────────────────────────────────────────
// 1. build_page — THE voice-command tool
// ──────────────────────────────────────────────────────────────────
server.registerTool("build_page", {
    title: "Build a complete dashboard page",
    description: "PRIMARY TOOL. Turns a natural-language (voice) command like 'build me a users page with stats and a table' into a COMPLETE, design-system-compliant Next.js page (TSX). With save:true it also writes the file into the project — the full voice-to-page loop in ONE call. Sections are inferred from the intent, or pass them explicitly. Always prefer this over writing page code from scratch.",
    inputSchema: {
        intent: z.string().describe("The user's command, verbatim. E.g. 'create an orders dashboard with kpis, charts and a table'"),
        title: z.string().optional().describe("Page title override, e.g. 'Orders'. Inferred from intent if omitted."),
        sections: z.array(z.enum(["stats", "tabs", "charts", "table", "form", "empty"])).optional()
            .describe("Explicit section list in render order. Inferred from intent if omitted."),
        columns: z.array(z.string()).optional().describe("Table column headers, e.g. ['Order', 'Status', 'Customer', 'Total']"),
        stats: z.array(z.string()).optional().describe("KPI card labels, e.g. ['Total Orders', 'Revenue', 'Refunds', 'AOV']"),
        charts: z.array(z.string()).optional().describe("Chart card titles, e.g. ['Revenue Over Time']"),
        save: z.boolean().optional().describe("If true, write the page directly into the project (recommended for voice commands)."),
    },
}, async (args) => {
    const r = buildPage(args);
    const lines = [
        `## ${r.title} page — sections: ${r.sections.join(", ")}`,
    ];
    if (args.save) {
        const s = saveFile(r.filePath, r.code);
        if ("error" in s) {
            lines.push(`⚠ Save failed: ${s.error}`, "", `Code below — save it manually to \`${r.filePath}\`:`);
        }
        else {
            lines.push(`✓ SAVED to \`${r.filePath}\` — page is live, nothing else to do.`);
            return text([...lines, "", ...r.notes.map((n) => `- ${n}`)].join("\n"));
        }
    }
    else {
        lines.push(`Save to: \`${r.filePath}\` (or re-call with save:true)`);
    }
    lines.push("", "```tsx", r.code.trim(), "```", "", ...r.notes.map((n) => `- ${n}`));
    return text(lines.join("\n"));
});
// ──────────────────────────────────────────────────────────────────
// 1b. edit_page — iterative voice edits on existing pages
// ──────────────────────────────────────────────────────────────────
server.registerTool("edit_page", {
    title: "Edit an existing page by voice command",
    description: "Modifies an existing page: adds or removes whole sections (stats, tabs, charts, table, form, empty). Use for commands like 'add a chart to the orders page' or 'remove the tabs from settings'. Saves the result automatically. Operations are parsed from the instruction, or pass them explicitly via op/sections.",
    inputSchema: {
        page: z.string().describe("Which page, by spoken name or route: 'orders', 'the settings page', or a path like 'src/app/(dashboard)/orders/page.tsx'"),
        instruction: z.string().describe("The user's edit command, verbatim. E.g. 'add a revenue chart and remove the tabs'"),
        op: z.enum(["add", "remove"]).optional().describe("Explicit operation (overrides parsing the instruction)"),
        sections: z.array(z.enum(["stats", "tabs", "charts", "table", "form", "empty"])).optional()
            .describe("Explicit sections to add/remove (overrides parsing the instruction)"),
        columns: z.array(z.string()).optional().describe("Table columns, if adding a table"),
        stats: z.array(z.string()).optional().describe("KPI labels, if adding stats"),
        charts: z.array(z.string()).optional().describe("Chart titles, if adding charts"),
        dryRun: z.boolean().optional().describe("If true, return the modified code without saving."),
    },
}, async (args) => {
    const pg = findPage(args.page);
    if ("error" in pg)
        return text(`⚠ ${pg.error}`);
    const file = readFileRel(pg.relPath);
    if ("error" in file)
        return text(`⚠ ${file.error}`);
    const ops = args.op && args.sections?.length
        ? args.sections.map((section) => ({ op: args.op, section }))
        : parseOps(args.instruction);
    if (ops.length === 0) {
        return text("⚠ Could not detect any section to add/remove in that instruction. Pass op + sections explicitly, e.g. { op: 'add', sections: ['charts'] }.");
    }
    const r = applyOps(file.content, ops, {
        columns: args.columns, stats: args.stats, charts: args.charts,
    });
    if (r.applied.length === 0) {
        return text(`⚠ No changes made.\n${r.warnings.map((w) => `- ${w}`).join("\n")}`);
    }
    const syn = syntaxCheck(r.code);
    const lines = [`Edited ${pg.route}: ${r.applied.join(", ")}.`];
    if (r.warnings.length)
        lines.push(...r.warnings.map((w) => `- ⚠ ${w}`));
    if (!syn.ok) {
        lines.push("", "⚠ Result failed syntax check — NOT saved:", ...syn.errors.map((e) => `- ${e}`));
        return text(lines.join("\n"));
    }
    if (args.dryRun) {
        lines.push("", "Dry run — not saved. Result:", "```tsx", r.code.trim(), "```");
        return text(lines.join("\n"));
    }
    const s = saveFile(pg.relPath, r.code);
    if ("error" in s)
        return text(`⚠ Save failed: ${s.error}`);
    lines.push(`✓ SAVED to \`${pg.relPath}\`.`);
    return text(lines.join("\n"));
});
// ──────────────────────────────────────────────────────────────────
// 1c. save_page — validated write for LLM-authored code
// ──────────────────────────────────────────────────────────────────
server.registerTool("save_page", {
    title: "Validate and save code into the project",
    description: "Saves TSX you wrote yourself into the project — but only after it passes the DS validator (auto-fixing what it can) and a TypeScript syntax check. Build_page with save:true and edit_page already save automatically; use this only for custom code.",
    inputSchema: {
        filePath: z.string().describe("Project-relative path, e.g. 'src/app/(dashboard)/orders/page.tsx'"),
        code: z.string().describe("The TSX source to save"),
    },
}, async ({ filePath, code }) => {
    const syn = syntaxCheck(code);
    if (!syn.ok) {
        return text(["✗ NOT saved — TypeScript syntax errors:", ...syn.errors.map((e) => `- ${e}`), "", "Fix the code and call save_page again."].join("\n"));
    }
    const v = validate(code);
    let finalCode = code;
    const lines = [];
    if (!v.ok) {
        if (v.remaining > 0) {
            return text([
                `✗ NOT saved — ${v.remaining} DS violation(s) need a manual token choice:`,
                ...v.violations.filter((x) => !x.fix).map((x) => `- line ${x.line}: \`${x.match}\` — ${x.message}`),
                "",
                "Fix these (see get_tokens) and call save_page again.",
            ].join("\n"));
        }
        finalCode = v.fixedCode ?? code;
        lines.push(`Auto-fixed ${v.violations.length} DS violation(s) before saving:`);
        lines.push(...v.violations.map((x) => `- line ${x.line}: \`${x.match}\` → \`${x.fix}\``));
    }
    const s = saveFile(filePath, finalCode);
    if ("error" in s)
        return text(`⚠ ${s.error}`);
    lines.push(`✓ SAVED to \`${filePath}\`.`);
    return text(lines.join("\n"));
});
// ──────────────────────────────────────────────────────────────────
// 1d. list_pages — what exists in the app
// ──────────────────────────────────────────────────────────────────
server.registerTool("list_pages", {
    title: "List the app's pages",
    description: "Lists all pages (routes) that exist in the project. Use to resolve 'the orders page' or to answer 'what pages do we have?'.",
    inputSchema: {},
}, async () => {
    const pages = listPages();
    if ("error" in pages)
        return text(`⚠ ${pages.error}`);
    if (pages.length === 0)
        return text(`No pages yet in ${projectDir()}. Use build_page with save:true to create one.`);
    return text(pages.map((p) => `- ${p.route} → \`${p.relPath}\``).join("\n"));
});
// ──────────────────────────────────────────────────────────────────
// 2. validate_code — enforcement + autofix
// ──────────────────────────────────────────────────────────────────
server.registerTool("validate_code", {
    title: "Validate (and autofix) DS compliance",
    description: "Checks TSX/JSX code for (1) TypeScript syntax errors and (2) design-system violations (raw Tailwind colors, hex, dark: modifiers). Returns violations with line numbers AND an auto-fixed version where replacements are deterministic. Call this on any code you wrote yourself before saving it.",
    inputSchema: {
        code: z.string().describe("The TSX/JSX source code to validate"),
    },
}, async ({ code }) => {
    const syn = syntaxCheck(code);
    const synLines = syn.ok
        ? []
        : ["✗ TypeScript syntax errors:", ...syn.errors.map((e) => `- ${e}`), ""];
    const r = validate(code);
    if (r.ok && syn.ok)
        return text("✓ PASS — valid TSX, no DS violations. Safe to save.");
    if (r.ok)
        return text([...synLines, "DS tokens: ✓ no violations."].join("\n"));
    const lines = [
        ...synLines,
        `✗ ${r.violations.length} DS violation(s):`,
        ...r.violations.map((v) => `- line ${v.line}: \`${v.match}\` → ${v.fix ? `\`${v.fix}\`` : v.message}`),
    ];
    if (r.fixedCode) {
        lines.push("", r.remaining === 0
            ? "All violations auto-fixed. Use this corrected code:"
            : `${r.violations.length - r.remaining} auto-fixed, ${r.remaining} need manual token choice (see TOKENS.md). Partially corrected code:`, "```tsx", r.fixedCode.trim(), "```");
    }
    return text(lines.join("\n"));
});
// ──────────────────────────────────────────────────────────────────
// 3. get_component — compact component API + example
// ──────────────────────────────────────────────────────────────────
server.registerTool("get_component", {
    title: "Get a component's API and example",
    description: "Returns props, variants, and a copy-paste TSX example for one shadcn/DS component (Button, Card, Badge, Input, Select, Tabs, Table, Dialog, Dropdown Menu, Avatar, Alert, Skeleton, Separator, Tooltip, Breadcrumb, Checkbox, Switch, Progress, Accordion, Form, Header, Sidebar, AppShell).",
    inputSchema: {
        name: z.string().describe("Component name, e.g. 'Button' or 'data table'"),
    },
}, async ({ name }) => {
    const hit = findByHeading("COMPONENTS.md", name) ??
        search(`${name} component`, 1).find((c) => c.file === "COMPONENTS.md");
    if (!hit) {
        return text(`Component '${name}' not found. Available: ${headings("COMPONENTS.md").join(", ")}`);
    }
    return text(clip(hit.content));
});
// ──────────────────────────────────────────────────────────────────
// 4. get_pattern — one canonical blueprint
// ──────────────────────────────────────────────────────────────────
server.registerTool("get_pattern", {
    title: "Get a canonical layout pattern",
    description: "Returns one copy-paste blueprint from the dashboard patterns: app shell, announcement banner, top navigation bar, sidebar, page header, page content, stat cards, tabs filter, data table, chart card, empty state, loading states, full page template, spacing reference.",
    inputSchema: {
        name: z.string().describe("Pattern name, e.g. 'sidebar', 'data table', 'empty state', 'full page'"),
    },
}, async ({ name }) => {
    const hit = findByHeading("DASHBOARD_PATTERNS.md", name) ??
        search(`${name} pattern`, 1).find((c) => c.file === "DASHBOARD_PATTERNS.md");
    if (!hit) {
        return text(`Pattern '${name}' not found. Available: ${headings("DASHBOARD_PATTERNS.md").join(", ")}`);
    }
    return text(clip(hit.content));
});
// ──────────────────────────────────────────────────────────────────
// 5. get_tokens — token reference by category
// ──────────────────────────────────────────────────────────────────
const TOKEN_CATEGORIES = {
    colors: "1. Color Tokens",
    typography: "2. Typography Tokens",
    spacing: "3. Spacing Tokens",
    radius: "4. Radius Tokens",
    shadow: "5. Shadow Tokens",
    "z-index": "6. Z-Index Tokens",
    motion: "7. Motion Tokens",
    controls: "8. Control Size Tokens",
    modes: "9. Mode Switching Reference",
};
server.registerTool("get_tokens", {
    title: "Get design tokens by category",
    description: "Returns the token reference table for one category: colors, typography, spacing, radius, shadow, z-index, motion, controls, modes.",
    inputSchema: {
        category: z.enum(["colors", "typography", "spacing", "radius", "shadow", "z-index", "motion", "controls", "modes"])
            .describe("Token category"),
    },
}, async ({ category }) => {
    const hit = findByHeading("TOKENS.md", TOKEN_CATEGORIES[category]);
    if (!hit)
        return text(`Category not found. Available: ${Object.keys(TOKEN_CATEGORIES).join(", ")}`);
    return text(clip(hit.content, 6000));
});
// ──────────────────────────────────────────────────────────────────
// 6. search_ds — fallback fuzzy search across everything
// ──────────────────────────────────────────────────────────────────
server.registerTool("search_ds", {
    title: "Search the whole design system",
    description: "Fuzzy search across all design-system docs (tokens, components, patterns, rules, template law). Use when you don't know which lookup tool fits. Returns the most relevant sections, compact.",
    inputSchema: {
        query: z.string().describe("What you're looking for, e.g. 'how to style an active nav item'"),
        limit: z.number().int().min(1).max(8).optional().describe("Max results (default 3)"),
    },
}, async ({ query, limit }) => {
    const hits = search(query, limit ?? 3);
    if (hits.length === 0)
        return text(`No matches for '${query}'. Try get_cheatsheet or different keywords.`);
    return text(hits
        .map((h) => `### [${h.file} › ${h.heading}]\n${clip(h.content, 2200)}`)
        .join("\n\n---\n\n"));
});
// ──────────────────────────────────────────────────────────────────
// 7. get_cheatsheet — session primer
// ──────────────────────────────────────────────────────────────────
server.registerTool("get_cheatsheet", {
    title: "Get the DS rules cheat sheet",
    description: "Returns the complete golden rules + most-used tokens in ~60 lines. Call ONCE at the start of a session to know how to write compliant code without further lookups.",
    inputSchema: {},
}, async () => text(CHEATSHEET));
// ──────────────────────────────────────────────────────────────────
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`ds-mcp ready — ${stats.files} docs, ${stats.chunks} sections indexed from ${DOCS_DIR}`);
}
main().catch((err) => {
    console.error("ds-mcp fatal:", err);
    process.exit(1);
});
