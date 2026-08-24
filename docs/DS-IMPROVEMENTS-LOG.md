# Design System — Improvements Log

**Date:** 2026-08-24
**Scope agreed:** implementation (`globals.css` + `tailwind.config.ts`), docs (`vitamin-z/docs/TOKENS.md`), expanded chart palette, dark mode implemented.
**Explicitly out of scope this pass:** `coliix/CLAUDE.md` (see §6).

---

## 1. How every entry below was verified

Nothing in this log is asserted from memory. Each change was confirmed by:

1. **`grep` against the file on disk** after the edit — 34/34 checks passed.
2. **A real Tailwind 3.4.19 compile** (`npx tailwindcss -c tailwind.config.ts -i src/app/globals.css`) with a probe file using every new class, then grepping the emitted CSS to confirm the class actually generates. A token that exists in config but produces no CSS is not a real token.
3. **`npx tsc --noEmit`** → passes (exit 0).

Where verification was **not** possible, it is stated plainly in §5. No entry is listed as done unless it was observed on disk.

Reproduce the class-generation check:

```bash
cd coliix
echo '<div class="bg-chart-cat-4 gap-stack-2xl z-dropdown ease-spring font-mono"></div>' > /tmp/probe.html
npx tailwindcss -c tailwind.config.ts -i src/app/globals.css -o /tmp/out.css --content /tmp/probe.html
grep -c '\.bg-chart-cat-4' /tmp/out.css   # → 1
```

---

## 2. Bugs found and fixed

### 2.1 `font-mono` was not monospaced — 46 usages affected

**Severity: high (visible).** `tailwind.config.ts` mapped `sans`, `heading` **and** `mono` all to `var(--font-body)` (Inter). Every `font-mono` in the codebase — 46 occurrences on reference codes, SKUs, tracking numbers, hub codes — rendered in a proportional face, so digits did not align in table columns. Meanwhile `TOKENS.md` promised JetBrains Mono.

**Fix:** loaded JetBrains Mono via `next/font/google` in `src/app/layout.tsx` as `--font-mono`, exposed it on `<html>`, and pointed Tailwind's `mono` stack at it with a real monospace fallback chain (`ui-monospace`, `SFMono-Regular`, `monospace`).

> **This changes rendering in 44 places.** It is a fix, not a regression — but review the reference-code columns after your first local build.

- Verified: `JetBrains_Mono` imported and `jetbrainsMono.variable` applied in `layout.tsx`; `font-mono` class generates and resolves to `var(--font-mono)`; `tsc` passes. Usage count re-checked on disk: 46.

### 2.2 Dark mode was declared but never implemented

`tailwind.config.ts` line 4 declared `darkMode: ["selector", "[data-appearance='dark']"]`, but `globals.css` contained **no `[data-appearance="dark"]` block at all**. Setting the attribute did nothing; every token silently fell back to its light value.

**Fix:** added a complete dark block redefining every semantic token — surface, background, action, status, text, border, icon, chart, focus and shadows. Values match what `TOKENS.md` already documented (`#020617` canvas, `#0f172a` elevated, `#1e293b` overlay), so the doc became true rather than the doc being rewritten to match a compromise.

Design decisions worth knowing:

| Concern | Decision | Reason |
|---|---|---|
| Brand accent on dark | `brand-300 #72b8a3`, not `#004030` | `#004030` on a near-black canvas is ~1.1:1 — invisible. `brand-300` on `slate-950` text gives ~8:1. |
| `text-on-accent` in dark | `slate-950` (dark text) | Dark text on light-green reads at ~8:1 vs ~3.6:1 for white. |
| Status colours | bright `-300` foreground over a translucent same-hue tint | Solid light status backgrounds glare on dark canvases. |
| Shadows | deepened to `rgba(0,0,0,.5–.6)` | Light-mode shadow alphas are invisible against dark surfaces. |

- Verified: light `--color-surface-elevated` → `--_color-white`; dark → `--_color-slate-900`. Dark `--color-action-primary-bg` → `--_color-brand-300`. Both blocks present in compiled CSS.

### 2.3 Ten documented tokens produced no CSS

These were in `TOKENS.md` but absent from the build, so any agent following the docs would emit classes that silently do nothing:

| Token | Status before | Status now |
|---|---|---|
| `gap-stack-2xl` | missing | added (32px / 24px compact) |
| `px-comp-px`, `py-comp-py`, `px-cont-px` | missing | added |
| `z-dropdown` | missing | added (100) |
| `bg-surface-overlay` | missing | added |
| `text-icon-disabled` | missing | added |
| `text-icon-on-accent` | missing | added |
| `duration-slow`, `duration-deliberate` | missing | added (300ms / 500ms) |
| `ease-in`, `ease-spring` | missing | added |
| `data-density="compact"` axis | missing entirely | implemented |

Audit first: `grep` confirmed **zero** existing usages of all of these, so every addition is purely additive — no existing markup changes behaviour.

- Verified: all generate real CSS in the compile probe. Compact density confirmed active: `--spacing-stack-xl` 24px → 16px, `--control-height-md` 36px → 32px.

### 2.4 `ease-ease-out` naming stutter

`transitionTimingFunction` keys were `"ease-out"` / `"ease-in-out"`, which Tailwind prefixes into the classes `ease-ease-out` and `ease-ease-in-out`.

**Fix:** rekeyed to `out` / `in` / `in-out` / `spring`, giving clean `ease-out`, `ease-in`, `ease-in-out`, `ease-spring` that override Tailwind's defaults with DS motion tokens. The two old stutter names are retained as **deprecated aliases** so nothing can break. (`grep` showed 0 current usages, so the aliases can be deleted whenever you like.)

### 2.5 Scrollbars would break in dark mode

`::-webkit-scrollbar-thumb` used raw primitives (`--_color-slate-300`, `--_color-slate-200`), which stay light-grey on a dark canvas.

**Fix:** repointed to semantic tokens (`--color-border-hover`, `--color-icon-muted`, `--color-border-default`) so they invert automatically.

---

## 3. New capability: chart / data-viz tokens

The existing four (`chart-primary`, `chart-secondary`, `chart-accent`, `chart-muted`) cover one or two series. Anything with three or more forced raw hex. Added:

- **`chart-cat-1` … `chart-cat-8`** — categorical series palette, distinct hues, separate light and dark values. Documented as *use in order, never skip*, so a given category keeps its colour across every chart in the app.
- **`chart-seq-1` … `chart-seq-5`** — brand-derived sequential ramp for magnitude data (heat maps, density). Reverses in dark mode so "more" stays "more visible".
- **`chart-grid`, `chart-axis`** — chart structure, previously hardcoded.

All 15 wired into Tailwind and confirmed generating.

---

## 4. Documentation corrected (`vitamin-z/docs/TOKENS.md`)

Each of these was a place where the doc asserted something the code contradicted. Direction of resolution was **doc follows code**, except where the code was simply missing the documented feature (§2.3), where code followed doc.

| # | Doc claimed | Reality on disk | Resolution |
|---|---|---|---|
| 1 | `border-focus` / `icon-interactive` = `brand-600 #004030` | `globals.css` uses `brand-500 #156a52` | Doc corrected to brand-500 |
| 2 | `subtle`/`tint` = `rgba(0,64,48,…)` | `rgba(21,106,82,…)` | Doc corrected |
| 3 | `font-serif` → Merriweather | no `serif` key in Tailwind | Documented as non-existent, do-not-use |
| 4 | `font-mono` → JetBrains Mono / Fira Code | mapped to Inter | Code fixed (§2.1); doc tightened |
| 5 | Composite vars `--font-heading-h1` etc. "use via style prop" | **zero** such variables exist | Replaced with a real utility-pair table |
| 6 | `ease-ease-in` | never existed | Corrected to `ease-in` |
| 7 | `data-brand="brand"` blue-accent mode (4 mentions) | **no `[data-brand]` block anywhere** | Documented as not implemented + do-not-use |
| 8 | Chart tokens | undocumented despite existing | Full section added |

Also added an **implementation-status table** so the appearance/density/brand axes can never silently drift from the code again.

---

## 5. Not verified — please confirm locally

- **`next build` did not complete in my sandbox.** It timed out at ~3 minutes; the environment has restricted network and `next/font/google` fetches at build time. `tsc --noEmit` passes and the Tailwind compile is clean, but **run `npm run build` locally once** to confirm the JetBrains Mono fetch succeeds in your environment.
  - If it ever fails offline, the fallback is one line — drop the `next/font` import and let Tailwind's `ui-monospace, SFMono-Regular, monospace` stack handle it. `font-mono` still renders correctly monospaced, just not JetBrains Mono.
- **Dark mode has not been viewed in a browser.** Token resolution is verified in compiled CSS; contrast ratios above are calculated, not measured on-screen. No component has been visually reviewed in dark mode, and `<html>` sets no `data-appearance` attribute yet, so nothing renders dark until you add it.
- **Compact density has not been viewed in a browser** either — verified only at token level.

---

## 6. Known problems NOT fixed

### 6.1 A stale duplicate of the whole project exists in `~/Downloads`

**Correction to an earlier draft of this log.** I initially recorded that `coliix/CLAUDE.md` was stale and instructed agents to use forbidden raw Tailwind classes. That was wrong, and the verification pass caught it: I had read `~/Downloads/ds-shadcn-v1.2/coliix/CLAUDE.md`, a *different file* from the one in this folder.

The real `~/Desktop/ds-shadcn-v1.2/coliix/CLAUDE.md` (99 lines) is **correct and healthy** — green `#004030` accent, full DS token reference, and `text-slate-*` / `bg-slate-*` / `border-slate-*` correctly listed as forbidden. No change was needed and none was made.

The actual issue is duplication:

- `~/Desktop/ds-shadcn-v1.2/` — **the live project.** All work in this log happened here. The MCP client configs correctly point `DS_PROJECT_DIR` at `Desktop/.../coliix`.
- `~/Downloads/ds-shadcn-v1.2/` — a **stale copy** containing only `.next/` and an outdated 166-line `CLAUDE.md` that still claims the accent is `#4f46e5` (indigo), points the MCP at `../mcp/index.js`, and tells agents to use `bg-white` / `bg-slate-100` / `border-slate-200`.

Any agent that opens the Downloads copy gets actively wrong instructions. Recommend deleting it, or renaming it to something unmistakably dead. Two folders with the same name and divergent rules is a trap — it caught me in this very session.

### 6.2 Other drift worth a later pass

- `vitamin-z/docs/TEMPLATE_STYLE.md` and `cheatsheet.ts` disagree on the TopBar: the cheat sheet says `bg-surface-elevated` (white), TEMPLATE_STYLE says `bg-bg-inverse` (dark). Both are served by the MCP, so agents get contradictory instructions depending on which tool they call.
- `--color-surface-canvas` and `--color-surface-elevated` are both `#ffffff` in light mode. Two tokens, one value — worth deciding whether canvas should differ or be retired.
- No component has been audited for whether it *uses* the new dark tokens correctly; adding the tokens makes dark mode possible, not automatically correct.

---

## 7. Files changed

| File | Change |
|---|---|
| `coliix/src/app/globals.css` | dark block, compact density block, focus-ring group, 15 chart tokens, `surface-overlay`, `icon-disabled`, `icon-on-accent`, `stack-2xl`, `comp-px/py`, `cont-px`, 2 durations, 2 easings, 5 status primitives, tokenized scrollbars |
| `coliix/tailwind.config.ts` | wired all of the above; added `z-dropdown`; fixed `ease-*` naming; `font-mono` → JetBrains Mono |
| `coliix/src/app/layout.tsx` | load JetBrains Mono via `next/font/google`, expose `--font-mono` |
| `vitamin-z/docs/TOKENS.md` | 8 corrections (§4) + chart section + implementation-status table |

**Not touched:** `coliix/CLAUDE.md`, any component or page file, `scripts/lint-colors.mjs`, the MCP server source.
