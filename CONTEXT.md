# CONTEXT.md

Handoff state for **Vitamin-Z** — an MCP server and the design system it serves,
in one repository. Written 2026-08-24 at the end of a long working session.

Read this before changing anything. Several decisions here look wrong at first
glance and were made deliberately; the reasoning is recorded so it doesn't get
undone by someone tidying up.

---

## 1. Where things are

```
~/Documents/vitamin-z/            ← THE LIVE REPO. Moved here from the Desktop.
├── dist/index.js                 ← entry point every MCP client runs (committed)
├── src/                          ← server source: 7 files, 10 tools
├── docs/                         ← 10 markdown files the server serves
├── ds-shadcn/                    ← the design system itself
│   ├── src/styles/tokens.css       163 primitives / 150 semantic tokens
│   ├── tailwind.config.ts
│   ├── src/components/ui/          42 components
│   ├── src/components/layout/      3 (app-shell, header, sidebar)
│   ├── verify.html + verify.css    visual verification surface
│   └── showcase.html               ⚠ marked STALE — see §5
├── scripts/                      ← 6 audit/verify scripts
└── clients/                      ← LM Studio / Claude Desktop / Claude Code configs
```

**Other folders, deliberately not moved:**

| Path | What | Status |
|---|---|---|
| `~/Desktop/ds-shadcn-v1.2/coliix` | the consuming Next.js app (ColiiX) | live, in use |
| `~/Desktop/ds-shadcn-v1.2/ds-v2` | 5 example pages + 1 app layout | leftover, not part of the DS |
| `~/Desktop/ds-shadcn-v1.2/vitamin-z` | **old copy of this repo** | superseded, has `SUPERSEDED.md`, safe to delete |
| `~/Downloads/ds-shadcn-v1.2` | stale duplicate | **actively misleading** — see §5 |

---

## 2. Current state, measured

| | |
|---|---|
| `npm test` | 6 verify checks + 35 smoke assertions, all passing |
| `npm run audit:full` | **0 errors, 0 warnings**, 8 informational |
| `npm run audit:tokens` | 0 / 0 / 3 notes |
| `npm run audit:components` | 0 errors, 5 warnings (arbitrary values, all reviewed and accepted) |
| Contrast | WCAG AA across all four rendered mode combinations; confirmed independently by Chrome |
| Unpushed commits | **16** — blocked, see §4 |

```bash
npm test          # build + verify + smoke      (CI runs this)
npm run audit     # the three audit suites
npm run verify:css && open ds-shadcn/verify.html
```

---

## 3. Decisions that will look like mistakes — don't revert them

**No component-token layer.** 32 `--button-*` / `--card-*` / `--dialog-*` tokens were
deleted, not wired up. Every one was a pass-through (`--button-radius:
var(--radius-control)`) and none was ever read. In a Tailwind + cva system the variant
map *is* the component contract; duplicating it into CSS variables maintains the same
decision twice, and cva can't consume them cleanly. Create a component token only where
a component must **diverge** from semantics — `--color-control-thumb` ("the knob on a
switch") is the one legitimate case. If Figma↔code parity is ever needed, *generate* the
layer from the cva variants rather than hand-maintaining both.

**Colours live in `textColor` / `backgroundColor` / `borderColor`, not `colors`.** This
is what makes class names single-barrelled: `text-primary`, not `text-text-primary`.
Putting them back in `colors` reintroduces the 24-class stutter. `action-*`, `status-*`,
`icon-*` and `chart-*` stay in `colors` because their names don't begin with a property
word. Consequence: a text colour can't be used as a background. That's intentional.

**`text-muted` and `text-tertiary` are aliases of `text-subtle`.** `muted` was slate-400
= 2.56:1 on white, which fails AA. There is no room for a fifth readable grey above
slate-500, so the level was retired rather than invented. Aliases keep existing markup
working.

**`border-control` (slate-500) is separate from `border-default` (slate-200).** WCAG
1.4.11 needs 3:1 for a control's visible boundary; slate-200 is 1.23:1. `border-default`
stays for card edges and dividers, which are exempt as decorative.

**`border-chrome` exists and brand mode does not override it.** `TEMPLATE_STYLE.md` used
to instruct authors to hardcode `border-slate-200` "to avoid brand blue" — the canonical
doc telling agents to break the no-raw-colour rule. The real cause was a missing concept:
structural chrome that stays neutral while accents change.

**The status icons in `Badge` and `Alert` are load-bearing.** Measured in Chrome, the
four status foregrounds sit within Δluminance 0.01, so in greyscale or for a user with
achromatopsia they are one colour. This cannot be fixed by recolouring: every status must
clear 4.5:1 on its own pale tint, which pins all four into a narrow luminance band — best
achievable spread is Δlum 0.025 against the ~0.05 needed. The icon is the only non-colour
channel. `audit:full` escalates to ERROR if it disappears.

**Chart `cat-7` and `cat-8` are documented as needing a second cue.** Six hue-encoded
categories can be made colourblind-safe (verified min ΔE 21.4 under deuteranopia and
protanopia). Eight cannot — best found was 19.0 light / 16.7 dark. Past six series, add
dash patterns or markers.

**`--_color-blue-25` exists for one reason.** Brand mode tints the sunken surface, and
`blue-50` is darker in luminance than `slate-50`, which dropped `text-subtle` to 4.37:1
in light/brand — the only combination nothing had ever measured.

---

## 4. Blocked

**The 16 commits cannot be pushed.** GitHub rejected the PAT that was embedded in the
remote URL: `Invalid username or token`. Network is fine. The token has been **removed
from both remotes** in this copy — it was invalid and had been exposed, so revoke it at
`github.com/settings/tokens` regardless.

```bash
cd ~/Documents/vitamin-z
git remote set-url origin https://<NEW_TOKEN>@github.com/testytigers/Vitamin-Z-MCP.git
git push origin main
```

The old Desktop copy still contains the exposed token in `.git/config` — another reason
to delete it.

---

## 5. Traps that have already caused real confusion

**Duplicate repos.** `~/Downloads/ds-shadcn-v1.2` has a `CLAUDE.md` claiming the accent
is indigo `#4f46e5` (it's green `#004030` in the app, slate/blue in the reference DS) and
pointing the MCP at `../mcp/index.js`, which doesn't exist. It caused a wrong diagnosis
during this session. Delete it.

**`showcase.html` forked the token layer.** 149 KB with its own abbreviated names
(`--txt-1`, `--act-p`, `--srf`), never importing `tokens.css`. It had drifted to showing
`sunken` as slate-100, `text-muted` as slate-400 and status foregrounds at -600 — exactly
the values changed to fix WCAG failures. Marked STALE. Use `verify.html`, which imports
the real tokens and therefore cannot drift. `audit:full` now flags any preview page that
redefines tokens.

**A mode block is a diff, not a theme.** Checking `light` and `dark` in isolation misses
`light/brand` and `dark/brand`. Contrast must be measured on the merged cascade —
`audit-full.mjs` does this via `COMBOS`.

**The DS no longer sits next to the app.** `DS_APP_DIR` tells the audits where a
consuming app is; without it, app-usage checks skip and DS-only checks still run.
`DS_PROJECT_DIR` is separate — it's where the MCP writes generated pages.

---

## 6. Corrections to earlier claims in this session

Recorded because stale confident statements are worse than no statements.

- I claimed the DS had no chart tokens. It had four; the reference DS had none. Both
  facts, different files.
- I wrote into `TOKENS.md` that `data-brand`, the composite `--font-*` variables and
  `font-serif` were "phantom features that never existed". **All three exist** in the
  reference DS. I had inspected only `coliix`, a stripped fork, and generalised. Reverted
  in `fcb1143`.
- I said the first chart palette was good. It was **not colourblind-safe** — orange and
  yellow were ΔE 2.8 apart under protanopia. Rebuilt.
- I dismissed a doc finding as a false positive. It was real: `TEMPLATE_STYLE.md` was
  instructing authors to use forbidden classes.
- I said RTL was "clean" after converting 42 spacing utilities. **24 `left-`/`right-`
  absolute-positioning utilities remain** and will not mirror. Spacing is converted;
  positioning is not.
- Six findings in the first full-audit run were bugs in my own checks, not the system.

---

## 7. What's actually left

**Verified but never seen by a human.** Nothing has been rendered and reviewed. Dark
mode, the chart palette, the badge icons, the darker input borders — all confirmed
numerically, none looked at. `docs/HUMAN-TEST.md` is the checklist; §1 is the
highest-risk 15 minutes.

**The original goal is untested.** The MCP has never run against a real local model.
`clients/lmstudio-mcp.json` is configured and the 10 tools work over stdio, but nobody
has spoken a page into existence. `HUMAN-TEST.md` §9.

**25 of 42 components have never run in production.** That is exactly where `avatar` and
`carousel` sat broken — both used React state with no `"use client"`, so importing either
into a server-rendered page threw. Found by audit, fixed.

**Open, low priority:** the type scale is hand-picked rather than a ratio, so it can't be
rescaled; `ds-v2` and `MCP.zip` are leftovers; 10 unreferenced semantic tokens and 43
unused primitives are harmless cruft.

**Score, honestly: 8.5/10.** The token layer and its enforcement are strong. What holds
it back is downstream — nothing visually reviewed, one consuming app that has diverged,
and the voice loop unproven.

---

## 8. The most important thing

The audit infrastructure is worth more than any individual fix in this repo. It caught
six of my own mistakes, a self-certifying doc-coverage bug where this audit's own report
counted as documentation, and a contrast failure in a mode combination nobody had thought
to measure. When you find a defect, the question to ask is **"why didn't a script catch
this?"** — and then add the check. That is why `HUMAN-TEST.md` exists and is expected to
shrink over time.
