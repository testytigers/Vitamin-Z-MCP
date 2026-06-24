# Vitamin-Z Design System — Documentation site

A self-contained documentation site generated **directly from the canonical
markdown** in `../*.md` (the same docs the MCP server indexes and serves). The
site can never drift from the source of truth: regenerate and it re-reads the
docs.

## What's inside

- **`build-docs.mjs`** — the generator. Reads every doc, renders markdown → HTML
  at build time, builds a full nav of every token category and component,
  injects color swatches for hex/rgba values, and themes the page in Vitamin-Z's
  own identity (green `#004030`, the live brand ramp as the hero). Includes a
  light/dark toggle and client-side nav search.
- **`index.html`** — full standalone page. Open it directly in a browser or
  serve it from any static host.
- **`artifact.html`** — body-only build, published as the shareable link below.

## Rebuild

```bash
npm run docs:build      # from the mcp-server root
# or
node docs/site/build-docs.mjs
```

The generator covers, in order: Overview, Tokens, Components, Patterns,
Enforcement, Template Law, Agent Guide.

## Live link

Published artifact: https://claude.ai/code/artifact/c47679ef-4df2-40f0-8380-c4b58dbf814d

Re-publishing `artifact.html` to the same URL updates it in place.
