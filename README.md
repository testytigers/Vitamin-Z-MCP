# shadcn-mcp — Design System v1.2 MCP Server

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server that gives AI agents direct access to the Design System v1.2. Token lookups, component docs, dashboard patterns, live lint checks — all callable as tools inside Claude Code, Cursor, or any MCP-compatible client.

---

## Install & Run

```bash
git clone https://github.com/brahimrizqHireme/shadcn-mcp.git
cd shadcn-mcp
npm install
npm run build
```

Run locally over stdio:

```bash
npm start
```

Run locally over Streamable HTTP:

```bash
cp .env.example .env
npm start
```

The HTTP MCP endpoint is available at:

```text
http://localhost:3000/mcp
```

HTTP transport requires Bearer authentication. Set `MCP_BEARER_TOKEN` in `.env`, then send it with MCP requests:

```text
Authorization: Bearer <your MCP_BEARER_TOKEN>
```

Health check:

```text
http://localhost:3000/health
```

---

## Build

Build the TypeScript source into `dist/`:

```bash
npm run build
```

Development mode with `tsx`:

```bash
npm run dev
```

Production start:

```bash
npm start
```

`dist/` is generated output and is intentionally ignored by Git.

---

## Docker

Build the image:

```bash
docker build -t ds-shadcn-mcp .
```

Run with the default port from the Dockerfile:

```bash
docker run --rm --env-file .env -p 3000:3000 ds-shadcn-mcp
```

Run with a custom port:

```bash
docker run --rm --env-file .env -e PORT=3011 -p 3011:3011 ds-shadcn-mcp
```

Run with values from `.env`:

```bash
docker run --rm --env-file .env -p 3000:3000 ds-shadcn-mcp
```

The Docker image runs as a non-root user, starts with `MCP_TRANSPORT=http`, and reads `PORT` plus `MCP_BEARER_TOKEN` from the environment.

---

## Add to Claude Code

### Option A — Project only (`.claude/settings.json` in your repo)

```json
{
  "mcpServers": {
    "ds-shadcn": {
      "command": "node",
      "args": ["/absolute/path/to/shadcn-mcp/dist/index.js"]
    }
  }
}
```

### Option B — Global (available in every project)

Run once:

```bash
claude mcp add ds-shadcn node /absolute/path/to/shadcn-mcp/dist/index.js
```

Restart Claude Code. The 8 `ds_*` tools appear automatically.

---

## Tools

| Tool | Input | What it returns |
|---|---|---|
| `ds_get_tokens` | `category` (text / background / action / border / status / icon / spacing / radius / shadow / motion / size / all) | Token reference table with use cases |
| `ds_resolve_violation` | `class_name` e.g. `"text-slate-600"` | `text-text-secondary` — the correct DS replacement |
| `ds_lint_snippet` | `code` (JSX/TSX string) | All DS color violations with line numbers and suggested fixes |
| `ds_get_component` | `name` e.g. `"button"` or `"list"` | Full component docs + copy-paste TSX examples |
| `ds_get_pattern` | `name` e.g. `"data table"` or `"list"` | Canonical dashboard pattern implementation |
| `ds_get_template_zone` | `zone` (header / sidebar / main / all) | Exact DS token translation for that layout zone |
| `ds_get_guide` | `section` (golden_rules / decision_tree / anti_patterns / token_cheat_sheet / accessibility / icons / page_steps / quick_reference) | Agent guide section |
| `ds_setup_enforcement` | — | Complete 3-layer enforcement setup: lint script source + CLAUDE.md template + husky pre-commit hook |

---

## Usage examples

**Resolve a linter violation:**
```
ds_resolve_violation("bg-white")
→ ✅ bg-surface-elevated
```

**Lint before committing:**
```
ds_lint_snippet('<div className="text-slate-900 bg-red-50">')
→ 2 violations with fixes
```

**Look up a component:**
```
ds_get_component("badge")
→ variants, props, copy-paste TSX
```

**Get the decision tree:**
```
ds_get_guide("decision_tree")
→ "I need to show status → use Badge variant=success|warning|destructive..."
```

---

## What's included

```
shadcn-mcp/
├── src/index.ts          TypeScript source (single file, ~500 lines)
├── docs/
│   ├── TOKENS.md         Full token reference (colors, spacing, radius, shadow, motion)
│   ├── COMPONENTS.md     Every shadcn component with props + TSX examples
│   ├── DASHBOARD_PATTERNS.md  AppShell, TopBar, Sidebar, DataTable, StatCard…
│   ├── TEMPLATE_STYLE.md Canonical Gemini template zone-by-zone translation
│   ├── AGENT_GUIDE.md    Golden rules, decision tree, anti-patterns, accessibility
│   └── ENFORCEMENT.md    3-layer color enforcement system
├── package.json
└── tsconfig.json
```

The server reads from `docs/` at startup — no external dependencies, no network calls.

---

## Rebuild from source

```bash
npm run build    # tsc → dist/
npm run dev      # run with tsx (no build step, for development)
```
