# vitamin-z — Design System v1.2 MCP Server (v2)

Voice-command-optimized MCP server for the DS. The full loop is now hands-free: speak → `build_page(save:true)` → file on disk. Iterate by voice with `edit_page`. The markdown docs in `MCP/` stay the single source of truth — edit them and restart the server; no rebuild needed.

## Setup (one time)

```bash
cd MCP/server
npm install
npm run build
```

Run check: `node dist/index.js` should print `vitamin-z ready — 7 docs, 86 sections indexed`.

## Connect a client

All configs are in `clients/` (stdio, `node dist/index.js`, with `DS_PROJECT_DIR` pointing at your app):

| Client | Where to put it |
|---|---|
| **LM Studio** | Merge `clients/lmstudio-mcp.json` into `~/.lmstudio/mcp.json` (or Program → Install → Edit mcp.json) |
| **Claude Desktop** | Merge `clients/claude-desktop-config.json` into `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Claude Code** | Copy `clients/claude-code.mcp.json` to your project root as `.mcp.json` |
| **Custom Ollama/Hermes pipeline** | Spawn `node /path/to/MCP/server/dist/index.js` with env `DS_PROJECT_DIR` set, speak MCP over stdio |

Env vars: `DS_PROJECT_DIR` = your Next.js app root (where pages get written, **required**). `DS_DOCS_DIR` = docs location if you move them.

## Tools

| Tool | What it does | Typical voice trigger |
|---|---|---|
| `build_page` | **Primary.** Intent → complete DS-compliant page. With `save:true` it writes the file too — one call, done. Infers sections (stats/tabs/charts/table/form/empty); accepts `columns`, `stats`, `charts`. | "Build me a shipments page with stats and a table" |
| `edit_page` | Adds/removes whole sections on an existing page, merges imports, prunes orphaned helpers, syntax-checks, saves. | "Add a revenue chart to the orders page" |
| `save_page` | Validated write for LLM-authored code: TS syntax check + DS validation with autofix, then save. Refuses broken code. | (used by the LLM, not spoken) |
| `list_pages` | Lists existing routes. | "What pages do we have?" |
| `validate_code` | TS syntax check + DS enforcement with **auto-fixed** code returned. | "Check this code" |
| `get_component` | Compact API + example for one shadcn component. | "How do I use Badge?" |
| `get_pattern` | One canonical blueprint (sidebar, data table, empty state…). | "Show me the sidebar pattern" |
| `get_tokens` | Token table by category. | "What are the radius tokens?" |
| `search_ds` | Synonym-aware fuzzy search across all docs ("rounded corners" → radius tokens). | Anything else |
| `get_cheatsheet` | ~60-line rules primer. Once per session. | Session start |

## The voice → page loop (zero file handling)

```
🎤 "Build me an orders page with KPIs and a table of order, status, customer, total"
        ▼  build_page({ intent, columns: [...], save: true })
        ✓ SAVED to src/app/(dashboard)/orders/page.tsx

🎤 "Add a revenue chart to the orders page"
        ▼  edit_page({ page: "orders", instruction: "add a revenue chart" })
        ✓ SAVED — chart section spliced in, imports merged

🎤 "Actually remove the KPIs"
        ▼  edit_page({ page: "orders", instruction: "remove the kpis" })
        ✓ SAVED — section removed, unused helpers & imports pruned
```

Every write is gated: TypeScript syntax check + DS token validation. Broken or non-compliant code never reaches disk.

For best speed with a small local model, add to its system prompt:

> You build dashboard pages with the vitamin-z tools. To create a page, call `build_page` with the user's words as `intent` and `save: true` — nothing else needed. To change an existing page, call `edit_page` with the page name and the user's words as `instruction`. Only write code yourself for things the tools can't do, and save it with `save_page`. Use `get_component`/`search_ds` for lookups.

## Layout

```
server/
├── src/
│   ├── index.ts      ← server + 10 tool definitions
│   ├── scaffold.ts   ← intent parsing + section generators (shared with editor)
│   ├── editor.ts     ← section splice/remove, import merge, orphan pruning
│   ├── project.ts    ← DS_PROJECT_DIR resolution, safe confined writes
│   ├── validator.ts  ← DS rules + autofix + TypeScript syntax check
│   ├── docIndex.ts   ← chunks ../​*.md by heading, synonym-aware search
│   └── cheatsheet.ts ← session primer
└── clients/          ← ready-made configs per client
```
