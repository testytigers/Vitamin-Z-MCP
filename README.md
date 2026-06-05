# DS v1.2 — MCP Server

A real [Model Context Protocol](https://modelcontextprotocol.io/) server that exposes the Design System v1.2 documentation as callable tools for AI agents (Claude Code, Cursor, etc.).

Instead of reading markdown files manually, agents call structured tools to get token lookups, component docs, dashboard patterns, and live lint checks.

---

## Setup

```bash
cd mcp-server
npm install
npm run build
```

---

## Adding to Claude Code

Add to `~/.claude/settings.json` (global) or `.claude/settings.json` (project-only):

```json
{
  "mcpServers": {
    "ds-shadcn": {
      "command": "node",
      "args": ["/Users/macbook/Desktop/ds-shadcn-v1.2/mcp-server/dist/index.js"]
    }
  }
}
```

Restart Claude Code. The 8 `ds_*` tools will appear in the agent's toolset.

---

## Tools

| Tool | Description |
|---|---|
| `ds_get_tokens` | Token reference table by category (text, background, action, border, status, icon, spacing, radius, shadow, motion, size, all) |
| `ds_resolve_violation` | Forbidden class → correct DS token. Input: `"text-slate-600"` → Output: `"text-text-secondary"` |
| `ds_lint_snippet` | Check JSX/TSX code for DS violations. Returns line number, match, message, and suggested fix — same rules as `npm run lint:colors` |
| `ds_get_component` | Full docs + copy-paste TSX examples for any shadcn/DS component. Pass `"list"` for all components |
| `ds_get_pattern` | Canonical TSX implementation of a dashboard pattern (app shell, top bar, sidebar, stat card, data table, empty state…). Pass `"list"` for all patterns |
| `ds_get_template_zone` | Exact DS token translation for the Gemini template zones: header, sidebar, main |
| `ds_get_guide` | Sections of the Agent Guide: `golden_rules`, `decision_tree`, `anti_patterns`, `token_cheat_sheet`, `accessibility`, `icons`, `page_steps`, `quick_reference` |
| `ds_setup_enforcement` | Complete 3-layer enforcement setup: lint script source + CLAUDE.md template + husky pre-commit hook |

---

## Data sources

The server reads from `../MCP/` at startup:

```
MCP/
├── TOKENS.md            → ds_get_tokens, ds_resolve_violation, ds_lint_snippet
├── COMPONENTS.md        → ds_get_component
├── DASHBOARD_PATTERNS.md → ds_get_pattern
├── TEMPLATE_STYLE.md    → ds_get_template_zone
├── AGENT_GUIDE.md       → ds_get_guide
└── ENFORCEMENT.md       → ds_setup_enforcement
```

Updating a markdown file is immediately reflected the next time the server starts.

---

## Development

```bash
npm run dev      # run with tsx (no build step)
npm run build    # compile to dist/
```
