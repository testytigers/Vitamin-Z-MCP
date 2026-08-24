# Design System — Improvements Log

**Date:** 2026-08-24
**Subject:** the design system itself — `ds-shadcn` (reference implementation) and `vitamin-z/docs` (MCP-served documentation).

---

## 0. Read this first — a correction to an earlier version of this log

An earlier draft of this file claimed the DS had ten "documented but missing" tokens, and that `data-brand`, the composite `--font-*` variables, and `font-serif` were **phantom features that never existed**. **That was wrong.**

The error: I inspected only `coliix/src/app/globals.css` — an *application* that forked the DS, stripped it, and re-branded it green — and generalised from it to the design system. The actual reference implementation, `ds-shadcn/src/styles/tokens.css` (600 lines, untouched since May), already contained every one of those features:

| I claimed | Reality in `ds-shadcn/src/styles/tokens.css` |
|---|---|
| "`data-brand` is not implemented — phantom feature, never use" | Fully implemented: `[data-brand="brand"]` **and** `[data-appearance="dark"][data-brand="brand"]` |
| "No `--font-heading-h1`-style composite variables exist" | All present — `--font-heading-h1…h4`, `--font-body-md/sm`, `--font-label-md/sm`, `--font-code-md` |
| "There is no `font-serif`" | Defined in `ds-shadcn/tailwind.config.ts` |
| "Dark mode / density / `surface-overlay` / `icon-disabled` / `stack-2xl` / `duration-slow` / `easing-spring` are missing" | All already implemented |

So the DS was in far better shape than I reported. What was actually true is narrower and less dramatic: **`coliix` lost those features when it forked the DS.** That is an app problem, not a DS problem.

The false claims were committed to `TOKENS.md` in `f8af0ab` and have now been reverted (§2). The genuinely new work is in §3 and §4.

**Method change as a result:** every claim below names the specific file it was verified against, and "missing" is only asserted after checking the reference implementation, not an app.

---

## 1. How the entries below were verified

1. **`grep` against the file on disk** after each edit.
2. **A real Tailwind 3.4.19 compile** against `ds-shadcn/tailwind.config.ts` with a probe file using every new class, then grepping the emitted CSS. A token that exists in config but emits no CSS is not a real token.
3. **CSS-variable cascade resolved with a script** — chart tokens traced through `var()` indirection to final hex, per mode, to confirm light/dark actually differ.

Reproduce:

```bash
cd ds-shadcn
echo '<div class="bg-chart-cat-4 ease-out duration-slow"></div>' > /tmp/probe.html
printf '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n' > /tmp/in.css
../coliix/node_modules/.bin/tailwindcss -c tailwind.config.ts -i /tmp/in.css -o /tmp/out.css --content /tmp/probe.html
grep -A1 '\.ease-out' /tmp/out.css     # → transition-timing-function: var(--_easing-ease-out)
```

---

## 2. Reverted — false assertions removed from `TOKENS.md`

Restored to describe the reference DS accurately:

- **Brand mode.** Re-documented as implemented, with both the light and dark+brand blocks noted. Removed "not implemented / must never be used".
- **Composite typography.** Restored the `--font-*` shorthand list. Kept the Tailwind utility table alongside it as the practical alternative, since most dashboard code composes that way.
- **`font-serif`.** Restored as a real family.
- **Implementation-status table.** Rewritten to describe the reference DS (all four axes ✅) with app deviations called out separately rather than presented as DS gaps.

Also added a **"What this document describes"** header naming `ds-shadcn/src/styles/tokens.css` as canonical, and stating that consuming apps may ship a subset — with `coliix`'s deviations (green accent, no brand axis, no serif, no composite fonts) listed explicitly. This is the fix for the root cause: one document was silently describing two divergent implementations, which is what misled me.

- Verified: `data-brand`, dark+brand, `--font-heading-h1`, `--font-code-md`, density all confirmed present in `ds-shadcn/src/styles/tokens.css`; `serif` confirmed in its `tailwind.config.ts`. Zero remaining false-negative assertions in `TOKENS.md`.

---

## 3. New capability — chart / data-viz tokens in the reference DS

The reference DS had **no chart tokens at all** (verified: 0 occurrences of `chart-` in both `tokens.css` and `tailwind.config.ts` before this change). Any chart with more than two series forced raw hex, which is the one place the token discipline was reliably breaking down.

Added to `ds-shadcn/src/styles/tokens.css`, in both the light and dark blocks:

- **Semantic roles** — `chart-primary`, `chart-secondary`, `chart-accent`, `chart-muted` for one- and two-series charts.
- **Categorical series** — `chart-cat-1` … `chart-cat-8`, eight mutually distinguishable hues. Documented as *use in order, never skip*, so a given category keeps its colour across every chart in the product.
- **Sequential ramp** — `chart-seq-1` … `chart-seq-5` for magnitude data. **Inverts in dark mode** (`#dbeafe→#1e3a8a` light, `#1e3a8a→#dbeafe` dark) so "more" always means "more visible" against the canvas.
- **Structure** — `chart-grid`, `chart-axis`.

Design decisions:

| Concern | Decision | Reason |
|---|---|---|
| Vary by brand mode? | **No** — identical across `data-brand` | Categorical colour exists to tell series apart, not to express brand. Only light/dark varies. Matches how mature systems handle this. |
| Ramp basis | Blue | The reference accent is slate-900 default / blue-600 brand; a blue ramp reads as on-system in both. |
| Missing hues | Added `cyan`, `pink`, `teal` primitives | Existing families (slate/blue/green/red/yellow/orange/purple) supply only five usable categorical hues; eight is the practical minimum. |
| Orange & purple on dark | Added `--_color-orange-400`, `--_color-purple-400` | Those ramps stopped at 500, so dark-mode series 2 and 4 could not lighten like the other six. Caught by resolving the cascade and diffing light vs dark — all 8 now differentiate. |

- Verified: all 15 classes generate; cascade resolves to distinct light/dark values for all 8 categorical entries and the full sequential ramp; brand blocks confirmed to contain 0 chart overrides (inheritance is intentional, not an omission).

---

## 4. Fixed — `ease-ease-*` naming stutter in the reference DS

`transitionTimingFunction` keys carried their own `ease-` prefix (`"ease-out"`, `"ease-in"`, `"ease-in-out"`), which Tailwind then prefixes again, emitting the classes `ease-ease-out`, `ease-ease-in`, `ease-ease-in-out`.

**Fix:** rekeyed to `out` / `in` / `in-out` / `spring`, producing clean `ease-out`, `ease-in`, `ease-in-out`, `ease-spring` that override Tailwind's built-ins with DS tokens.

**This is visually a no-op.** The DS easing curves are byte-identical to Tailwind's defaults (`ease-out` = `cubic-bezier(0,0,0.2,1)` in both), so the 13 existing plain `ease-*` usages in `ds-shadcn/showcase.html` and 5 in `ds-v2` render exactly as before — they simply now resolve through the token layer instead of Tailwind's hardcoded defaults.

The three stuttered names are retained as **deprecated aliases**, protecting the 5 `ease-ease-*` usages in `ds-v2`. Delete them once those are migrated.

- Verified: all seven classes (4 new + 3 aliases) generate; `.ease-out` resolves to `var(--_easing-ease-out)`, `.ease-spring` to `var(--_easing-spring)`.

---

## 5. Not verified — confirm locally

- **Nothing has been viewed in a browser.** Token resolution is verified in compiled CSS; the chart palette's perceptual distinguishability and its contrast against both canvases are reasoned, not measured. Worth an eyeball on a real multi-series chart before relying on series 5–8.
- **No full app build was run** against the modified reference DS. `ds-shadcn` has no local `node_modules` (the Tailwind binary was borrowed from `coliix`), so the compile test used its config but not its own toolchain.

---

## 6. Known problems NOT fixed

- **`coliix` has drifted substantially from the reference DS** — no brand axis, no composite font variables, no `font-serif`, green re-brand, and until this session no dark mode or density either. Whether the app should re-converge on the reference DS or be formally recognised as a separate theme is an open decision. Right now it is neither, which is what produced the documentation confusion in §0.
- **`vitamin-z/docs/TEMPLATE_STYLE.md` and `cheatsheet.ts` disagree on the TopBar** — cheat sheet says `bg-surface-elevated` (white), TEMPLATE_STYLE says `bg-bg-inverse` (dark). Both ship through the MCP, so agents get contradictory instructions depending on which tool they call.
- **`ds-v2` and `ds-shadcn` overlap unclearly.** `ds-shadcn` holds `tokens.css` + `tailwind.config.ts`; `ds-v2` holds `src/components/ui/` and pages. `AGENT_GUIDE.md` §"File & Import Conventions" draws the tree as `ds-v2/src/ … └── styles/tokens.css ← All CSS custom properties (source of truth)` — but `ds-v2/src/styles/` **does not exist** (verified). The tokens live in `ds-shadcn`. An agent following that guide looks in the wrong place. One of the two should own the tokens, and the guide updated to match.
- **A stale duplicate project exists at `~/Downloads/ds-shadcn-v1.2`** containing an outdated `CLAUDE.md` (claims the accent is indigo `#4f46e5`, points at an old MCP path). It misled me earlier in this session. Recommend deleting it.

---

## 7. Files changed

| File | Change |
|---|---|
| `ds-shadcn/src/styles/tokens.css` | chart tokens in light + dark blocks; `cyan`/`pink`/`teal` primitives; `orange-400`/`purple-400` primitives |
| `ds-shadcn/tailwind.config.ts` | wired 15 chart colours; rekeyed easing to remove the `ease-ease-*` stutter, with aliases |
| `vitamin-z/docs/TOKENS.md` | reverted 3 false assertions; added scope header; chart section retargeted to reference-DS values; accent table split reference vs app |
| `vitamin-z/docs/DS-IMPROVEMENTS-LOG.md` | this file — rewritten to correct §0 |

**Not touched:** `ds-v2`, any component file, the MCP server source.

> Changes made to `coliix` earlier in this session (dark mode, density, `font-mono` → JetBrains Mono, ten added tokens, chart palette) remain in place. They are app-level fixes that bring `coliix` closer to the reference DS, and are documented in its own commit rather than here — this log covers the design system.
