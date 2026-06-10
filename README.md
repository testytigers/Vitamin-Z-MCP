# shadcn-mcp — Design System v1.2 MCP Server

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server with 7 tools for building DS-compliant Next.js pages from voice commands. The star tool — `build_page` — takes a natural-language command verbatim and returns a complete, ready-to-save page. `validate_code` auto-fixes violations in one round-trip, so a small model never needs to know token names.

---

## Install

```bash
git clone https://github.com/brahimrizqHireme/shadcn-mcp.git
cd shadcn-mcp
npm install
```

The compiled server is already in `dist/` — no build step needed.

---

## Connect to your client

### Claude Code / Claude Desktop (stdio)

```bash
claude mcp add ds-shadcn node /absolute/path/to/shadcn-mcp/dist/index.js
```

Or merge `clients/claude-desktop.json` into `~/Library/Application Support/Claude/claude_desktop_config.json`. Restart — the 7 tools appear automatically.

### LM Studio / Ollama (HTTP)

Start the server in HTTP mode:

```bash
MCP_TRANSPORT=http PORT=3000 MCP_BEARER_TOKEN=your-secret node dist/index.js
```

Then merge `clients/lm-studio.json` or `clients/ollama.json` into your client config (see `clients/` for both).

---

## System-prompt snippet (Hermes / Ollama voice pipeline)

Paste this into your model's system prompt to make the voice → page loop zero-thought:

```
You have access to a Design System MCP server with 7 tools.

RULES:
1. When the user asks to build or create a page, ALWAYS call build_page with their
   exact transcribed words. Do not paraphrase. Save the returned file to the
   returned filePath.
2. When any code contains color classes (text-*, bg-*, border-*), call validate_code
   first. Apply the returned fixed code directly — never manually edit colors.
3. Before starting any new component or page, call get_cheatsheet once.
4. To look up a component, call get_component. For layout patterns, call get_pattern.
5. If you need a specific token, call get_tokens with the category.
6. For anything else DS-related, call search_ds with your question as the query.

TOOL NAMES: build_page · validate_code · get_component · get_pattern · get_tokens · search_ds · get_cheatsheet
```

---

## Tools

| Tool | Input | Returns |
|---|---|---|
| `build_page` | `command` — natural-language voice request | Complete Next.js page + suggested file path |
| `validate_code` | `code` — JSX/TSX snippet | Auto-fixed code with list of every substitution |
| `get_component` | `name` (e.g. `"button"`, `"badge"`) or `"list"` | Component docs + copy-paste TSX |
| `get_pattern` | `name` (e.g. `"data table"`, `"stat card"`) or `"list"` | Canonical pattern implementation |
| `get_tokens` | `category` (text / background / action / border / status / icon / all) | Token reference table |
| `search_ds` | `query` — any question or keyword | Top 5 matching doc sections |
| `get_cheatsheet` | — | Compact token + decision tree + forbidden-class card |

---

## Examples

**Voice → page:**
```
build_page("build me a shipments page with stats and a table")
→ Shipments page with 4 KPI cards + data table
   Save to: src/app/(dashboard)/shipments/page.tsx

build_page("an invoices dashboard with kpis")
→ Invoices page with stat cards
   Save to: src/app/(dashboard)/invoices/page.tsx

build_page("make a settings page with a form")
→ Settings form page with 2 card sections
   Save to: src/app/(dashboard)/settings/page.tsx
```

**Auto-fix violations:**
```
validate_code('<div className="text-slate-900 bg-white border-red-200">')
→ Fixed: text-text-primary · bg-surface-elevated · border-status-error-border
```

**Search:**
```
search_ds("badge status variant")
→ Top 5 doc sections covering badge variants and status usage
```

---

## What's included

```
shadcn-mcp/
├── src/index.ts              TypeScript source — single file
├── dist/index.js             Compiled server (run this)
├── docs/
│   ├── TOKENS.md             Full token reference
│   ├── COMPONENTS.md         shadcn components + TSX examples
│   ├── DASHBOARD_PATTERNS.md AppShell, TopBar, Sidebar, DataTable, StatCard…
│   ├── TEMPLATE_STYLE.md     Gemini template zone-by-zone translation
│   ├── AGENT_GUIDE.md        Golden rules, decision tree, anti-patterns
│   └── ENFORCEMENT.md        3-layer color enforcement system
├── clients/
│   ├── claude-code.json      Claude Code / Claude Desktop config
│   ├── claude-desktop.json   Claude Desktop config
│   ├── lm-studio.json        LM Studio HTTP config
│   └── ollama.json           Ollama pipeline config + system-prompt snippet
├── Dockerfile                Container build
├── .env.example              Environment variables reference
└── package.json
```

Docs are re-indexed at startup from `docs/` — no external dependencies, no network calls.

---

## Rebuild from source

```bash
npm run build    # tsc → dist/
npm run dev      # run with tsx (no build step)
```

---

## Docker

```bash
docker build -t ds-mcp .
docker run -e MCP_TRANSPORT=http -e PORT=3000 -e MCP_BEARER_TOKEN=your-secret -p 3000:3000 ds-mcp
```
