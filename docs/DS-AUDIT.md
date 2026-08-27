# Design System Audit — tokens & components

**Date:** 2026-08-24 · **Scope:** `ds-shadcn/` (152 primitives, 133 semantic tokens, 45 components)

Reproduce with `npm run audit`. Both audits are scripts, not prose, so this report can be regenerated rather than trusted. Every finding below was confirmed against the file on disk before being written down.

```bash
npm run audit:tokens        # inventory, orphans, mode parity, contrast, doc coverage
npm run audit:components    # per-component rule + a11y scan
```

---

## Summary

| | Result |
|---|---|
| Component errors | **0** (4 found, 4 fixed) |
| Component warnings | 5 (all arbitrary values, reviewed below) |
| Token errors | 0 |
| Token warnings | 3 categories |
| Components documented | 45 / 45 |
| Components clean | 40 / 45 |
| Contrast failures | 18 body-text/surface pairs |

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

## 6. Recommended order

1. **Decide the component-token layer** — wire up or delete. It's the only structurally ambiguous thing left.
2. **Fix `--focus-ring-color`** — small, mechanical, restores an advertised affordance.
3. **Decide on `text-muted` contrast** — needs a visual call, affects real readability.
4. **Collapse `text-tertiary` into `text-subtle`** — two names, one value.
5. Document the five undocumented classes, or delete the two unused ones.
6. Look at `drawer`'s `w-[100px]` and `header`'s `text-[10px]`.

Items 1–4 are judgement calls and are deliberately left open rather than decided unilaterally.
