# Vitamin-Z — Claude Code rules

An MCP server and the design system it serves, in one repository. The server generates
pages that must only ever use design-system tokens; the design system is the contract it
generates against. `docs/ENFORCEMENT.md` calls this file "Layer 2" of that contract — the
rules must be in context *before* code is written, not caught afterwards.

Read `CONTEXT.md` before changing anything. Several decisions there look wrong at first
glance and were made deliberately; the reasoning is recorded so it does not get undone.

## Commands

```bash
npm test          # tsc (server only) + verify-ds + smoke-tools   — CI runs these
npm run audit     # audit:tokens + audit:components + audit:full   — CI does NOT run this yet
npm run verify:css && open ds-shadcn/verify.html   # the visual verification surface
```

Run `npm run audit` before every commit that touches tokens, components or docs. It is not
in CI yet — closing that is task T0.1, the highest-leverage item in the repo.

## Hard rules — the audits enforce all of these

| Never | Instead |
|---|---|
| A raw Tailwind colour, e.g. a `bg-slate-200` style class | The semantic token: `bg-tertiary`, `text-subtle`, `border-default` |
| A hex or `rgba()` literal in a component | A token; `color-mix()` in the token layer for tints |
| A colour literal in the *semantic* layer | `var(--_color-*)` — literals belong to primitives alone |
| Reading a private `--_` primitive from a component | The semantic or density token (`--control-px-md`, `--spacing-chip-px`) |
| A `dark:` modifier | Mode comes from `data-appearance`, never a variant |
| Physical `left-` / `right-` insets | Logical `start-` / `end-` so components mirror in RTL |
| Hooks or `createContext` without `"use client"` | Add the directive — it throws on import into a server component |
| Typography tokens in the compact density block | Compact is a **spacing** axis only |

Two exceptions are declared, not accidental: `Sheet`'s `side` prop is physical on purpose
(marked `rtl-exempt`), and centring insets paired with a negative X translate are symmetric
so mirroring them is a no-op.

## The layer contract

Primitives → semantics → components. `--_*` is private to the token stylesheet. A component
that reaches past the semantic layer also opts out of every axis layered on top of it —
that is how three components ended up frozen at default size under
`data-density="compact"`, because primitives are density-invariant by design.

Colour is genuinely three-layer. **Typography and motion are two-layer on purpose**: they
vary across zero mode axes, so `text-sm` resolving to a primitive is the right shape. Do
not "fix" this — see `CONTEXT.md` §7.

## Adding a check — the rule that matters most

`CONTEXT.md` §8: when you find a defect, ask **why a script did not catch it**, then add
the check. With the corollary a 2026-09-02 review earned the hard way:

> **A check you have never seen fail is not yet a check.**

Four of the bugs found in that review were in the checks themselves, and two more were
introduced while fixing them. So every check you add or repair must be landed by
reintroducing the defect it targets and watching it fail — including *which* mode or
density column it fails in. A check that passes on a clean tree proves nothing.

## Traps that have already cost real time

- **A mode block is a diff, not a theme.** Checking `light` and `dark` in isolation misses
  `light/brand` and `dark/brand`. Contrast is measured on the merged cascade.
- **The last definition in the stylesheet wins.** Resolving a density token through the
  wrong layer silently returns the *compact* value; that bug made one check report compact
  numbers in its default column for months.
- **Locating a CSS block by substring matches comments.** Documenting a selector in prose
  once broke a check into reporting all 88 colour tokens as missing from dark mode.
- **`showcase.html` is STALE** and forked the token layer. Use `verify.html`, which imports
  the real tokens and therefore cannot drift.
- Duplicate copies of this repo exist outside it and contradict it. This directory is the
  live one.

## Where things are

- `ds-shadcn/src/styles/tokens.css` — the token layer, and the layer contract in its header
- `ds-shadcn/tailwind.config.ts` — token → utility mapping
- `ds-shadcn/src/components/` — 45 components (42 ui + 3 layout)
- `scripts/` — the audit and verification suites
- `src/` — the MCP server: 7 modules, 10 tools
- `docs/TOKENS.md` — the canonical token reference; documented values are checked against it

## Open work

`docs/TEST-PLAN.md` ranks everything unverified by risk × cost. Individual, self-contained
tasks live in `docs/tasks/` — each has acceptance criteria and a verification command, and
each ends with a deliberate-failure proof. Pick one up by name, e.g. "do T0.1".

Do not raise any quality claim on the strength of a green audit alone: nothing in the
design system has ever been rendered and reviewed by a human, and the 45 components are
compiled by nothing.
