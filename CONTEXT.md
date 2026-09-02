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
| `npm run audit:full` | **0 errors, 0 warnings**, 30 informational (was 8 — C0 got much wider, see §6) |
| `npm run audit:tokens` | 0 / 0 / 3 notes |
| `npm run audit:components` | 0 errors, 5 warnings (arbitrary values, all reviewed and accepted) |
| Contrast | WCAG AA across all four rendered mode combinations — now including `text-placeholder`, `text-link`, `popover`, every `bg-*` fill, and rest/hover/active on primary, secondary and destructive |
| Chart palette | protan/deutan min ΔE 20.3, worst case across two simulators; tritan unverifiable, reported not gated |
| Unpushed commits | **17** — blocked, see §4 |

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

**Interaction states move away from the text colour, never toward it.** With white text,
brand primary hover was `blue-500` at 3.68:1 and dark destructive active `red-400` at
2.77:1 — resting states passed, hover and active failed, and a rest-state-only audit read
0 errors. Brand and destructive therefore darken; slate ramps may keep lightening because
white stays above 10:1 across the whole slate ramp. In dark/brand the accent text is
`slate-900`, so "away" means lighter there. `audit-full` C0 walks rest/hover/active.

**`bg-secondary` and `bg-tertiary` are fills, not text surfaces.** Text on them must be
`text-secondary` or stronger. `text-subtle` does not clear AA on them in ANY mode —
slate-500 only reaches 4.8:1 on pure white, so any tint at all puts it under 4.5
(slate-100 4.34, slate-200 3.86, dark slate-700 4.04). This is the same shape of decision
as `border-default` vs `border-control`, and for the same reason as the retired
`text-muted` level: there is no room for a readable grey between slate-500 and slate-400,
so the limit is written down rather than papered over. C0 enforces the in-contract tokens
and prints the out-of-contract ratios every run, so the ceiling stays visible.

**The `_` prefix is a boundary, and it is now enforced.** A component that reads a
primitive opts out of every axis layered above it. `badge`, `select` and `toggle-group`
read `--_size-*` directly, so their padding and gap stayed at the default value when the
app switched to `data-density="compact"` — primitives are density-invariant by design,
which is exactly why they are private. `badge` had `gap-inline-xs` on one line and
`px-[var(--_size-2_5)]` on the next. The `arbitrary-value` rule could never catch it: its
`allow: /var\(--/` treats any token reference as acceptable and cannot tell
`--control-px-md` from `--_size-2_5`. `audit:components` `primitive-escape` is the check.

  A chip scale (`--spacing-chip-px` / `-py`) was added to both density blocks so Badge
  has something correct to point at. That is not the component-token layer §3 rejects: a
  density axis only functions if each component *class* has a token on it, which is the
  same reason `--control-*` exists. The default values are identical to the old hardcoded
  primitives, so nothing moves at default density.

**Colour literals belong to the primitive layer and nowhere else.**
`--color-action-primary-bg-subtle` and `-bg-tint` held eight `rgba()` literals spelling
out blue-400/500/600's channels by hand across the four mode blocks. A literal in the
semantic layer is a copy, not a reference — change the primitive and it silently does not
follow. They now use `color-mix(in srgb, var(--_color-blue-500) 10%, transparent)`.
`audit:full` A4 is the check, and it scans every declaration rather than the collapsed
token map, because the first version of it missed literals in any block but the last.

**`border-control` (slate-500) is separate from `border-default` (slate-200).** WCAG
1.4.11 needs 3:1 for a control's visible boundary; slate-200 is 1.23:1. `border-default`
stays for card edges and dividers, which are exempt as decorative.

**`border-chrome` exists and brand mode does not override it.** `TEMPLATE_STYLE.md` used
to instruct authors to hardcode `border-slate-200` "to avoid brand blue" — the canonical
doc telling agents to break the no-raw-colour rule. The real cause was a missing concept:
structural chrome that stays neutral while accents change.

**The status icons in `Badge` and `Alert` are load-bearing.** Three of the four light
foregrounds — success, warning, info — sit within Δlum 0.010 of each other, so in
greyscale or for a user with achromatopsia they are one colour. The icon is the only
non-colour channel. `audit:full` escalates to ERROR if it disappears.

  Corrected 2026-09-01: this used to claim *all four* foregrounds were within Δlum 0.01
  and that the best achievable spread was 0.025 against ~0.05 needed. Neither number was
  real. Error sits 0.05 from the others (full light spread 0.051, which already clears the
  0.05 the old text called the target), and the dark spread is 0.306. The "0.025 / 0.05"
  sentence was a hardcoded string in `audit-full.mjs` that printed regardless of what was
  measured — the one place the audit editorialised instead of reporting. It now prints the
  measured pairs and the full-set spread. The conclusion is unchanged and still right for
  the right reason: WCAG 1.4.1 needs a second channel wherever pairs are that close.

**Chart `cat-7` and `cat-8` are documented as needing a second cue.** Six hue-encoded
categories are verified distinguishable under protanopia and deuteranopia at min ΔE 20.3.
Eight cannot be. Past six series, add dash patterns or markers.

  Revised 2026-09-01. Three things were wrong with the old state. (1) The 21.4 was a
  single-model figure; 20.3 is the worst case across two independent simulators, so it no
  longer depends on which one you trust. (2) Nothing enforced any of it — the number was a
  one-time manual measurement recorded in a comment, so any future edit to a `cat` token
  would have silently undone it. `audit-full` C1 checks the palette now. (3) Tritanopia had
  never been measured, and it turns out it *cannot* be measured here: single-plane
  simulation is not valid for the blue-yellow axis, correct Brettel 1997 needs two
  half-planes, and the two single-plane models available disagree by ~2x on this palette.
  Tritan is reported as INFO and never gates. Do not "fix" the palette against a tritan
  number from either model — that is how the steps got churned twice in one session.

**Dark `cat-2` now actually lightens.** It was `orange-700` in both modes, unchanged,
even though `--_color-orange-400` was added to the primitives expressly so that the
dark-mode orange series could lighten like every other hue. Nothing read it.

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

**Docs drift silently unless the values are checked.** `TOKENS.md` documented the
original pre-CVD chart palette (`cat-3` as green `#16a34a`) for a whole palette
generation after the code had moved on. E2 validated that class *names* exist and nothing
validated the hex values printed beside them, so the canonical doc contradicted the
canonical source with every check green. E4 now compares every hex in `TOKENS.md` against
the resolved token.

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

Added 2026-09-01, after an external review found each of these by re-deriving the numbers
rather than reading the comments:

- I said `audit:full` was green, and it was — but C0 checked four text tokens against four
  `surface-*` tokens and nothing else. `text-placeholder`, `text-link`, `surface-popover`,
  every `bg-*` fill, and all hover/active states were outside its reach. Green meant
  "nothing I looked at is broken", which is not what I reported it to mean.
- `text-placeholder` was `slate-500` in dark: 3.07:1 on overlay. That is the exact value
  the ladder comment eleven lines above rejects, sitting one line below the fix.
- I said the `use client` bug in `avatar`/`carousel` was "found by audit, fixed". The check
  existed and still missed `form`, `input-otp` and `toggle-group`, because `interactive`
  enumerated six specific hooks and missed `createContext`/`useContext`/`useId`. I fixed
  the instances and never fixed the detector — the exact failure §8 warns about.
- I said 24 `left-`/`right-` utilities remained. It was 34. 21 are now logical; the other
  13 are centring, animation keyframe names, or `Sheet side="left"`, and are physical on
  purpose.
- `--color-action-primary-text` and `-text-disabled` were dead — no component or Tailwind
  entry ever read them — while §3 above claims that class of pass-through token was
  eradicated. dark/brand even carefully re-derived one of them. Deleted.
- `status-attention-fg` had no `-bg` or `-border` sibling and was `orange-600`: 3.56:1 on
  white, while `AGENT_GUIDE.md` documents it as text on the canvas ("Overdue"). Now
  `orange-700` with a full tint/border pair.
- The token classifier in `audit-tokens.mjs` keyed off a hardcoded prefix list with no
  fallback bucket, and `font` was not on it. All twelve `--font-*` composites therefore
  belonged to none of primitive/semantic/component and were invisible to the *entire*
  token audit — absent from the inventory (which read 312 of 305 real tokens), never
  checked for orphanhood, never checked for chain depth. Adding `font` fixes today's
  case; the `unclassified` assertion is what stops the next family vanishing the same
  way. With them visible, the orphan count goes from 8 to 20.
- I described the architecture as "Primitives → Semantics → Components" in the file
  header without ever checking that components honoured it. Three of them didn't, and
  the semantic layer had eight colour literals in it.
- Two density checks were measuring the wrong thing, and one of them was mine. `B5` read
  the compact height as `px(modeDefs.compact[...])` — that map holds the *declared* string
  `"var(--_size-7)"`, which `px()` cannot parse, so it returned null and the compact
  branch was a silent no-op from the day it was written. Worse, its "default" column
  resolved via `resolve(..., "light")`, which falls through to `allDefs` — last-wins across
  the whole file, and therefore holding the **compact** value. B5 printed
  "control-height-lg (default) is 36px" for years when the real default is 40px: the
  default column was reporting compact. `[data-density="default"]` is now a resolvable
  layer in `MODES`, and both columns read their own block. I reproduced the same bug in B7
  by copying B5's shape before noticing.
- `verify-ds.mjs`'s `blockOf()` located a mode block with a bare `indexOf(selector)`, so
  the first *textual* occurrence anywhere in the file won — including inside a comment.
  The moment tokens.css documented `[data-appearance="dark"]` in prose, mode parity
  resolved to that sentence, took the next `{` (the primitives `:root`) and reported all
  88 colour tokens as missing from dark mode. A green check that a comment can flip to
  red was measuring the wrong thing all along; it now strips comments before locating,
  and before reading declarations.

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

**Typography is two-layer on purpose — resolved, do not "fix" it.** Colour earns three
layers because it genuinely differs across the four mode combinations. Type differs
across none: `[data-appearance="dark"]` redefines zero typography tokens, and so does
brand. So `text-sm` resolving straight to a primitive is the right shape for an axis-free
scale, and `text-body-md` in its place would be a rename across 73 call sites in 30 files
buying no capability. The `--font-*` composites are a *documented external API*
(`style={{ font: "var(--font-heading-h1)" }}`, TOKENS.md), now declared under an
`@public-api` banner so `audit:tokens` stops listing them as orphans — the orphan count
drops from 20 to 4 real ones, which makes that list worth reading again. The four
`--motion-*` composites got the opposite treatment: `transition:` shorthands Tailwind
cannot consume, documented nowhere but a generated report, so they were deleted under the
same rule §3 applies to any pass-through nobody reads.

**CLOSED 2026-09-02 — compact density is a SPACING axis.** `--control-font-*` used to
shrink under compact (md 14px → 12px, lg 16px → 14px) and was read by exactly **two** of
forty-five components, `button` and `input`. The other 28 that render text use raw
`text-sm` / `text-xs` and cannot follow a token at all, so compact mode put a 12px Button
label beside a 14px Tab, and a 12px Input beside a 14px Select — two sibling form controls
at different type sizes. Either all type follows density or none does; two of forty-five
was the one state that was certainly wrong.

The three overrides are deleted. Compact now tightens height, padding and gaps only.
Shrinking body text was the worse of the two available fixes (WCAG 1.4.4, and it reads as
cramped rather than dense), and the alternative — giving type a real density axis — is a
30-file migration whose only real payoff would have been retroactively justifying a
semantic type scale nothing else needs.

Enforced, not just recorded: `audit-full` **B6** fails if any typography token reappears
in the compact block, and **B7** proves the consequence is safe by checking every control
is tall enough for its own line box (compact md is now 14px text in a 32px box, with 11px
of room). Do not reintroduce a density-varying type token without first migrating all 30
text-rendering components — B6 exists to make that a deliberate act.

**Open, low priority:** the type scale is hand-picked rather than a ratio, so it can't be
rescaled; `ds-v2` and `MCP.zip` are leftovers; 8 unreferenced semantic tokens and 43
unused primitives are harmless cruft. Five `arbitrary-value` warnings in
`audit:components` are reviewed and accepted. `status-success`/`status-warning` borders are
~1.3:1 on their own tints — reported as INFO, not yet decided.

**Score, honestly: 7/10 before this session's fixes, and the reason matters.** The old
8.5 said the weakness was all downstream. It wasn't: the token layer rated "strong" had
verifiable AA failures in four independent categories (placeholder, tonal fills,
interaction states, and an unmeasured CVD axis), plus dead tokens and an undetected
`use client` class of bug. Those are now fixed and, more importantly, each one is now a
check rather than a claim — which is the only reason to believe the next number.

What still holds it back is genuinely downstream, and unchanged: **nothing has been
rendered and reviewed by a human**, 0 of 45 components are used by any app, the MCP has
never run against a real local model, and 17 commits are unpushed behind a revoked token.
Do not raise the score on the strength of a green audit alone — that is precisely the
mistake the 8.5 encoded.

---

## 8. The most important thing

The audit infrastructure is worth more than any individual fix in this repo. It caught
six of my own mistakes, a self-certifying doc-coverage bug where this audit's own report
counted as documentation, and a contrast failure in a mode combination nobody had thought
to measure. When you find a defect, the question to ask is **"why didn't a script catch
this?"** — and then add the check. That is why `HUMAN-TEST.md` exists and is expected to
shrink over time.
