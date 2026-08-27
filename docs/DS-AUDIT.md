# Design System Audit — tokens & components

**Date:** 2026-08-24 · **Scope:** `ds-shadcn/` (152 primitives, 133 semantic tokens, 45 components)

Reproduce with `npm run audit`. Both audits are scripts, not prose, so this report can be regenerated rather than trusted. Every finding below was confirmed against the file on disk before being written down.

```bash
npm run audit:tokens        # inventory, orphans, mode parity, contrast, doc coverage
npm run audit:components    # per-component rule + a11y scan
```

---

## Summary — all findings resolved

| | First run | Now |
|---|---|---|
| Component errors | 4 | **0** |
| Component warnings | 6 | 5 (arbitrary values, all reviewed & accepted) |
| Token errors | 0 | **0** |
| Token warnings | 4 categories | **0** |
| Contrast failures | 18 pairs | **0** |
| Dead component tokens | 24 | **0** (layer deleted) |
| Undocumented classes | 5 | **0** |
| Components documented | 45 / 45 | 45 / 45 |

Everything below is retained as the record of what was found and why each decision
was made. §3 and §4 describe problems that are now **fixed** — see §7 for what changed.

---

## 1. Inventory

```
primitives    152      (--_color-*, --_size-*, --_shadow-*, --_duration-*, …)
semantic      133      (--color-*, --radius-*, --shadow-*, --spacing-*, --focus-*)
component      24      (--button-*, --card-*, --dialog-*, …)
total         329
```

Mode coverage — token counts per block:

| Mode | Tokens | Note |
|---|---|---|
| light (`:root`) | 92 | base |
| dark | 91 | full redefinition |
| brand | 22 | partial override of light |
| dark + brand | 15 | partial override of dark |
| compact density | 26 | spacing + control heights only |

Light and dark are at **full parity** for colour tokens — no token silently inherits a light value in dark mode. `verify-ds.mjs` enforces this on every build.

---

## 2. Fixed during this audit

Four component errors were found and repaired.

### 2.1 `avatar` and `carousel` were missing `"use client"` — **runtime breakage**

Both use React state (`avatar` calls `React.useState` for image-error fallback; `carousel` uses six hooks plus `useEmblaCarousel`) with no `"use client"` directive. In the Next.js App Router these are Server Components by default, so importing either into a server-rendered page throws.

This is the most serious finding in the audit: not a style inconsistency but a component that cannot render.

**Fixed:** directive added to both.

### 2.2 `switch` and `slider` thumbs used raw `bg-white`

Both control knobs hardcoded `bg-white`, bypassing the token layer — so in dark mode they'd stay pure white regardless of theme, and the value couldn't be re-themed.

A dead `--switch-thumb-bg: #ffffff` already existed in `tokens.css`: a raw hex in the semantic layer that nothing consumed.

**Fixed:** added `--color-control-thumb` (white in light, `slate-100` in dark — a thumb reads as a physical handle above the track, so it stays light in both), exposed as `bg-thumb`, and pointed both components plus the old `--switch-thumb-bg` at it.

---

## 3. Open findings — tokens

### 3.1 The component token layer is 100% dead — **24 of 24 unreferenced**

```
--button-radius  --button-font-weight  --button-transition
--input-radius   --input-border-width  --input-transition
--card-radius    --card-border-width   --card-bg  --card-border  --card-shadow
--badge-radius   --dialog-radius  --dialog-shadow  --dialog-z
--tooltip-radius --tooltip-z  --select-radius
--switch-radius  --switch-thumb-bg  --avatar-radius
--toast-radius   --toast-shadow  --toast-z
```

Nothing reads any of them. `button.tsx` uses none of its three; `card.tsx` uses none of its five. Components go straight from semantic tokens to Tailwind classes, skipping the layer the architecture diagram advertises.

This is a real fork in the road, not a bug to sweep up:

- **Delete them** if the cva variant map stays the component contract. Right now they're documentation that lies.
- **Wire them up** if Figma↔code parity matters — a designer's `button/primary-bg` variable needs something concrete to bind to.

Either is defensible; the current state — defined, documented, ignored — is not.

### 3.2 `--focus-ring-color` cannot actually restyle the focus ring

`--focus-ring-shadow` hardcodes `var(--_color-blue-500)` rather than composing from `--focus-ring-color`, so overriding the colour token has no effect. The dark block defines the shadow but no colour token at all.

```css
/* today */
--focus-ring-color: var(--_color-blue-500);
--focus-ring-shadow: 0 0 0 2px var(--_color-white), 0 0 0 4px var(--_color-blue-500);

/* should be */
--focus-ring-shadow: 0 0 0 var(--focus-ring-offset) var(--focus-ring-halo),
                     0 0 0 calc(var(--focus-ring-offset) + var(--focus-ring-width)) var(--focus-ring-color);
```

`coliix` already uses the composed form — the reference DS is the one that's behind.

### 3.3 Five Tailwind classes exist with no documentation

`text-tertiary` · `text-on-destructive` · `bg-action-secondary-active` · `bg-action-destructive-active` · `border-status-warning-border`

`text-tertiary` is the notable one: it resolves to the same value as `text-subtle` (`slate-500`). Two names, one value, one documented. Pick one.

### 3.4 Ten semantic tokens are never referenced

```
--color-bg-primary            (removed from Tailwind during the naming migration; the CSS var remains)
--color-action-primary-text   --color-action-primary-text-disabled   --color-action-link-text
--color-icon-on-inverse       --focus-ring-color                     --spacing-section-gap
--motion-normal  --motion-slow  --motion-spring
```

Plus **41 unused primitives** — normal for a palette (a ramp keeps unused steps deliberately), but `--_font-serif` is worth noting: `font-serif` is exposed in Tailwind while the primitive it points at is otherwise unused, so the family is effectively untested.

---

## 4. Open findings — accessibility

### 4.1 Eighteen body-text/surface pairs fall below WCAG AA (4.5:1)

Computed by resolving each token through its `var()` chain to a final hex, then applying the WCAG relative-luminance formula.

**Light mode**

| Pair | Ratio | |
|---|---|---|
| `text-muted` on `canvas` / `elevated` | 2.56:1 | fails badly |
| `text-muted` on `sunken` | 2.34:1 | fails badly |
| `text-subtle` on `sunken` | 4.34:1 | marginal |
| `text-tertiary` on `sunken` | 4.34:1 | marginal |

**Dark mode**

| Pair | Ratio | |
|---|---|---|
| `text-subtle` / `tertiary` / `muted` on `overlay` | 3.07:1 | fails |
| `text-subtle` / `tertiary` / `muted` on `elevated` | 3.75:1 | fails |
| `text-subtle` / `tertiary` / `muted` on `canvas` / `sunken` | 4.24:1 | marginal |

Context matters before acting. `text-muted` is documented for "placeholders, minor labels" — WCAG exempts placeholder text and purely decorative text, and 3:1 is acceptable for large text (≥18.66px bold or ≥24px). But 2.34:1 is below even the non-text 3:1 threshold, so `text-muted` on `sunken` is hard to justify anywhere.

The cheapest fix is one step darker in light mode (`slate-400 → slate-500` gives 4.6:1) and one step lighter in dark. That is a visual change, so it wants a decision rather than a silent edit.

**All `on-*` pairings pass.** `text-on-accent` on `action-primary`, `text-on-destructive` on `action-destructive` and `text-on-inverse` on `bg-inverse` all clear AA in both modes.

### 4.2 Accessibility scan of all 45 components

No missing `alt`, no positive `tabIndex`, no unlabelled icon-only buttons.

> An earlier run reported an unlabelled icon button in `header.tsx`. That was a **false positive** in the audit rule — the button contains `{workspace.name}` alongside the chevron, so it is labelled. The rule was corrected to require the icon be the *only* child.

---

## 5. Open findings — components

### 5.1 Five arbitrary values

| Component | Value | Verdict |
|---|---|---|
| `dialog` | `left-[50%]` `top-[50%]` | Fine — Radix centring idiom. `left-1/2` would be equivalent. |
| `scroll-area` | `rounded-[inherit]` | Fine — no token can express `inherit`. |
| `navigation-menu` | `top-[60%]` | Fine — animation origin. |
| `drawer` | `w-[100px]` | **Worth a look** — a magic width with no token behind it. |
| `header` | `text-[10px]` | **Worth a look** — the ⌘K hint sits below the type scale's smallest step (12px). Either add a token or use `text-xs`. |

### 5.2 Only 17 of 45 components are used by the app

Unused: `accordion`, `alert`, `breadcrumb`, `calendar`, `carousel`, `context-menu`, `drawer`, `form`, `hover-card`, `input-otp`, `input`, `menubar`, `navigation-menu`, `pagination`, `progress`, `radio-group`, `resizable`, `scroll-area`, `skeleton`, `slider`, `tabs`, `textarea`, `toast`, `toggle`, `toggle-group`, `app-shell`, `header`, `sidebar`.

This is expected — a design system should ship more than any one app consumes. It's listed because it tells you which components have **never been exercised in production**, and those are where undiscovered bugs live. `avatar` and `carousel` shipping without `"use client"` for months is exactly that pattern.

`input` being unused is surprising for a dashboard and may indicate the app hand-rolls inputs instead. Worth checking.

---

## 7. Resolutions

### 7.1 Component token layer — **deleted** (32 tokens)

All were pass-throughs (`--button-radius: var(--radius-control)`) and none was read by any component. In a Tailwind + cva system the variant map already *is* the component contract, so a parallel CSS-variable layer means maintaining the same decision twice — and cva can't consume the variables cleanly anyway.

The rule is now written into `TOKENS.md`: create a component token only where a component must **diverge** from semantics. `--color-control-thumb` is the sole surviving example — "the knob on a switch" isn't a semantic concept.

If Figma↔code parity is ever required, generate this layer from the cva variants rather than hand-maintaining both.

### 7.2 Focus ring — **now composable**

`--focus-ring-shadow` is declared once and composed from `--focus-ring-width`, `--focus-ring-offset`, `--focus-ring-color` and `--focus-ring-halo`. Each mode block sets only colour and halo. Verified in compiled CSS: the parts are present and the dark block overrides them.

### 7.3 Contrast — **all pairs now clear AA**

Three coordinated changes:

- **`sunken`: slate-100 → slate-50.** The darker fill was what pushed `text-subtle` to 4.34:1. slate-50 is also the value `TOKENS.md` had always documented, so this closed a doc/implementation mismatch at the same time.
- **`text-muted` and `text-tertiary` became deprecated aliases of `text-subtle`.** `muted` was slate-400 — 2.56:1 on white, failing AA and even the 3:1 non-text floor. There is no room for a fifth readable grey above slate-500, so rather than invent one, the level was retired. Existing markup keeps working.
- **Dark ladder shifted one step lighter** — `secondary` slate-400→300, `subtle` slate-500→400. slate-500 reached only 3.07:1 on `overlay`.

Measured after the change, independently of the audit's own code:

| | light: white / sunken | dark: canvas / elevated / overlay |
|---|---|---|
| `text-primary` | 17.85 / 17.06 | 19.28 / 17.06 / 13.98 |
| `text-strong` | 10.35 / 9.90 | 16.36 / 14.48 / 11.87 |
| `text-secondary` | 7.58 / 7.24 | 13.59 / 12.02 / 9.85 |
| `text-subtle` | 4.76 / 4.55 | 7.87 / 6.96 / 5.71 |

`text-disabled` and `text-placeholder` are exempt under WCAG 1.4.3; `placeholder` was still moved off slate-400 to the AA floor.

### 7.4 Undocumented classes — **all documented**

`text-on-destructive`, `bg-action-secondary-active`, `bg-action-destructive-active`, `border-status-warning-border`, `bg-thumb`, plus the deprecation table for `text-tertiary` / `text-muted`.

> **A flaw in this audit was found while fixing it.** The doc-coverage check treated *any* markdown in `docs/` as documentation — including this report. Because §3.3 listed the undocumented classes by name, the next run saw them as documented and the warning silently disappeared. The check now excludes `DS-AUDIT.md` and `DS-IMPROVEMENTS-LOG.md`: a report about the DS is not reference documentation.

### 7.5 Still open — accepted, not fixed

- **5 arbitrary values.** `dialog`'s `left-[50%]`, `scroll-area`'s `rounded-[inherit]` and `navigation-menu`'s `top-[60%]` are correct as-is. `drawer`'s `w-[100px]` and `header`'s `text-[10px]` are cosmetic and low-risk; `text-[10px]` sits below the type scale's 12px floor, so the scale would need a new step to fix it properly.
- **28 of 45 components unused by the app.** Expected for a design system, but it marks the components with no production exposure — which is exactly where `avatar` and `carousel` were hiding broken.
- **10 unreferenced semantic tokens and 43 unused primitives.** Unused palette steps are normal; the 10 semantic ones (`--color-bg-primary`, `--motion-*`, `--spacing-section-gap`) are candidates for removal but harmless.
