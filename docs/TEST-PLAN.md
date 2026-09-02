# TEST-PLAN.md

What is still unverified in this repo, and the tests that would close it — ordered by
(risk × how cheap it is to fix), not by how interesting it is.

Written 2026-09-02 alongside the review recorded in `CONTEXT.md` §6. Every item below is
grounded in something measured, and each says **what it would have caught** from that
review's actual bug list. If an item cannot name a real bug it would have caught, it is
ranked lower on purpose.

Companion docs: `CONTEXT.md` (state and decisions), `HUMAN-TEST.md` (the human visual
checklist, already written and still the best 15 minutes available).

**To act on this rather than read it**, use `tasks/` — one self-contained file per item,
each with acceptance criteria, a verification command and a deliberate-failure proof. The
rules themselves live in the root `CLAUDE.md`, which Claude Code loads automatically, so a
session has the token contract in context before it writes a line.

Worth noting how this file was proofread: the first draft failed `npm run verify` twice.
It referenced two files that do not exist yet and spelled out an invalid class name as an
example, and `doc file paths` and `documented classes` both caught it. The prose was
changed rather than the checks — which is the whole argument of this document, applied to
this document.

---

## The one-paragraph summary

The token layer is now strongly verified and self-enforcing. **Nothing else is.** There is
no test runner in this repository — no vitest, no jest, no Testing Library, no jsdom, no
Playwright, no axe, no Storybook, and zero `.test.*` / `.spec.*` / `.stories.*` files. The
45 components are checked only by regex over source text. The 1,723-line MCP server is
covered only end-to-end through its 10 tools. And CI does not run the audits at all.

---

## Tier 0 — enforcement gaps. Hours of work, and everything else depends on them

### T0.1 · CI does not run `npm run audit` — **start here**

`.github/workflows/ci.yml` runs `npm run build`, `npm run verify`, and
`scripts/smoke-tools.mjs`. It never runs `npm run audit`. The three audit suites — every
contrast rule, the CVD palette check, the layer contract, the density contract — are not
enforced on any pull request. A PR that reintroduces every bug this review fixed merges
green.

- [ ] Add `- name: Audit` / `run: npm run audit` to `ci.yml`
- [ ] Confirm it fails the build: reintroduce one known bug on a branch, watch CI go red
- [ ] Consider making `npm test` include `npm run audit`, so local and CI agree

**Cost:** 3 lines of YAML plus one deliberate red build.
**Would have caught:** nothing by itself — but without it, *none* of the ~35 checks below
protect anything. This is the highest-leverage item in the document.

### T0.2 · Nothing typechecks the design system

`tsconfig.json` is `include: ["src/**/*"]` with `rootDir: "src"` — the MCP server.
`npm run build` is `tsc` over that. So the 45 components have never been compiled by
anything, in CI or locally. Specifically: 44 of 45 import `cn` from `@/lib/utils`, which
does not exist anywhere in this repo; no `@/*` path alias is defined in any config; and 0
of the DS's 37 declared dependencies are installed here.

**Blocked on one architectural decision** (see `CONTEXT.md` §7): is the DS a *copy-in
source distribution* where the consuming app supplies `@/lib/utils` (the shadcn
convention), or a *self-contained package* that ships its own? Nothing in the repo records
the intent, and the answer changes the fix.

- [ ] Decide and write the answer down in `COMPONENTS.md`
- [ ] If copy-in: document the peer requirement (`cn`, the `@/*` alias, the dep list) and
      give `ds-shadcn/` its own `tsconfig.json` stubbing the alias, purely so CI can
      typecheck
- [ ] If package: add the missing `cn` helper as a `utils.ts` under the DS's own
      `src/lib/`, plus a real `tsconfig.json` and an export entry point
- [ ] `npm install` in `ds-shadcn/`, then `tsc --noEmit` in CI
- [ ] Add a check that the dep list in `ds-shadcn/package.json` matches what the
      components actually import — an unused or missing dep is silent today

**Cost:** half a day, most of it the decision.
**Would have caught:** a whole class the audits cannot see — type errors, wrong props,
broken imports. All 45 files *do* parse (`tsc --noResolve`, 0 syntax errors), so this is
absent verification rather than known breakage.

---

## Tier 1 — the components. Largest surface, zero mechanical verification

### T1.1 · A test runner and render tests

No component has ever been rendered by a machine or a human.

- [ ] Add vitest + @testing-library/react + jsdom (or happy-dom)
- [ ] For each of the 45: renders without throwing, forwards `ref`, applies `className`,
      spreads unknown props to the root
- [ ] Every `cva` variant × size combination renders — that is the actual component
      contract, per `CONTEXT.md` §3
- [ ] Import each component into a server-rendered context and assert it does not throw

**Would have caught:** the `"use client"` bug in `form`, `input-otp` and `toggle-group`
directly, rather than via a regex that had already missed them once. Also the original
`avatar` / `carousel` breakage.

### T1.2 · Automated accessibility assertions

`audit-full` C5 checks *labelling* statically. Nothing checks rendered a11y.

- [ ] `axe-core` over every component in all four mode combinations, in both densities
- [ ] Assert a visible focus indicator on every interactive component (the focus ring is
      token-composed; nothing verifies a component actually opts in)
- [ ] Keyboard: Tab order, Escape, arrow keys on `select` / `menubar` /
      `navigation-menu` / `tabs`; focus trap and focus restoration on `dialog`, `drawer`,
      `sheet`
- [ ] Assert `prefers-reduced-motion` actually collapses motion — the token trick in
      `tokens.css` is elegant and completely untested

**Would have caught:** nothing from this review, which is exactly why it is worth doing —
it is a category no check in the repo currently touches at all.

### T1.3 · Visual regression

Chromium is available. Nothing renders.

- [ ] Playwright screenshots of `verify.html` in all four mode combinations × both
      densities
- [ ] Per-component snapshots, so a token change shows up as a picture in the diff
- [ ] Run it on PRs and require a human to approve pixel changes

**Would have caught:** the compact-density inconsistency visually and immediately — a 12px
Button label beside a 14px Tab is obvious in a screenshot and invisible to a token audit.
Also the badge/select/toggle-group padding that was frozen at default density.

---

## Tier 2 — the MCP server. 1,723 lines, end-to-end coverage only

`scripts/smoke-tools.mjs` exercises the 10 tools over stdio: 35 assertions, all passing.
No unit tests exist for any internal module, and `src/` was never reviewed.

- [ ] **`validator.ts` (303 lines) — highest risk.** It is the enforcement brain: it
      decides what is a legal token. A false negative silently permits raw colours in
      generated pages. Table-driven tests: every rule, plus adversarial near-misses
      — a real token name with a doubled trailing letter, an invented suffix on a real
      prefix, and valid core Tailwind utilities which must pass
- [ ] **`scaffold.ts` (508 lines)** — the largest file. Generated pages must pass
      `validate_code` *and* `audit-full`'s preview-page rule (E3, no token redefinition)
- [ ] `editor.ts` (236) — `edit_page` add/remove round-trips without corrupting a page
- [ ] `docIndex.ts` (143) + `cheatsheet.ts` (65) — search returns the documented answers
- [ ] `project.ts` (90) — path handling; assert it cannot write outside `DS_PROJECT_DIR`
- [ ] Golden-file tests for `build_page` output, so scaffold changes are reviewable

**Would have caught:** unknown — and that is the point. I never audited `src/`, so this
tier is honestly unassessed rather than assessed-and-fine.

---

## Tier 3 — checks the audits could gain cheaply

Each is small, and each closes a specific hole found while reviewing.

- [ ] **Docs values beyond colour.** E4 now compares every hex in `TOKENS.md` against the
      resolved token, which is why the stale chart palette can no longer hide. The same
      drift is still possible for spacing, radius, font sizes and durations — extend E4
      to any documented `px` / `ms` value
- [ ] **Documented examples must compile.** `COMPONENTS.md` carries copy-paste TSX. E2
      validates class *names*; nothing checks the snippets parse or typecheck
- [ ] **Variant coverage.** No check asserts every `cva` variant is documented, or that
      every documented variant exists
- [ ] **`--font-*` composites.** They are a declared `@public-api` surface and E4 does not
      cover them; assert each resolves to the px/weight/leading `TOKENS.md` claims
- [ ] **Rendered RTL.** 21 utilities are now logical and 13 are deliberately physical.
      `HUMAN-TEST.md` §6 covers it by eye; nothing covers it mechanically
- [ ] **Contrast on real composites.** C0 measures tokens against tokens. It cannot see a
      component that puts `text-subtle` on `bg-tertiary` — the out-of-contract combination
      §3 documents. A rendered a11y pass (T1.2) is what actually closes this

---

## Tier 4 — decisions, not tests

Open judgement calls. `audit-full` reports each as INFO; none is a bug until someone
decides it is.

- [ ] `status-success` / `status-warning` borders are ~1.3:1 on their own tints. Fix the
      values, or document the edge as decorative and exempt
- [ ] `control-height-lg` is 40px default / 36px compact, both below the 44px WCAG 2.5.8
      AAA target. Accept, or raise
- [ ] 4 orphan semantic tokens and 41 unused primitives. Delete, or mark `@public-api`
      like the `--font-*` composites
- [ ] 5 accepted `arbitrary-value` warnings. Keep accepting, or tokenise
- [ ] Tritanopia is unverifiable with a single-plane simulator. If it matters for your
      users, the answer is a real Brettel 1997 two-plane implementation with published
      anchor constants — not re-stepping the palette against a model that disagrees with
      itself. See `CONTEXT.md` §3

---

## Tier 5 — the original goal

- [ ] The MCP has never run against a real local model. `clients/lmstudio-mcp.json` is
      configured and the 10 tools work over stdio, but nobody has spoken a page into
      existence. `HUMAN-TEST.md` §9

---

## Do this first

1. **T0.1** — `npm run audit` in CI. Three lines. Without it nothing else is enforced.
2. **`HUMAN-TEST.md` §1** — 15 minutes with your eyes. Look at the re-stepped chart
   palette and a compact form first; both changed on 2026-09-02, both are numerically
   verified and visually unseen.
3. **T0.2** — make the decision, then typecheck the components in CI.

Everything after that is additive. Those three change what the repo can honestly claim.

---

## The rule this document exists to serve

`CONTEXT.md` §8: when you find a defect, ask why a script did not catch it, then add the
check. With the corollary that review earned — **a check you have never seen fail is not
yet a check.** Four of the bugs found in that session were in the checks themselves, and
two more were introduced while fixing them. Every item above should be landed by first
reintroducing the defect it targets and watching it fail, including which mode or density
column it fails in.
