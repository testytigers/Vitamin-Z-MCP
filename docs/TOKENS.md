# Design System v1.2 — Token Reference

> **For agents:** Always use semantic tokens (e.g., `text-primary`) in Tailwind classes. Never hardcode colors like `text-slate-900` or hex values. The token architecture ensures automatic light/dark mode and brand switching.

## What this document describes

The canonical source of truth is the **reference design system**, which lives in this
same repository so the docs and the implementation cannot drift apart:

```
ds-shadcn/src/styles/tokens.css     ← all CSS custom properties
ds-shadcn/tailwind.config.ts        ← Tailwind mapping
ds-shadcn/showcase.html             ← visual reference
docs/TOKENS.md                      ← this file
```

Paths are relative to the repo root. If you change a token, update this file in the
same commit.

Every token listed here exists there, across all four mode combinations
(light/dark × default/brand, plus the density axis).

**Consuming apps may ship a subset or re-brand.** A token existing in this document
does not guarantee it exists in a given app. Known deviations are flagged inline with
an "App note". The current app, `coliix`, uses a **green** accent instead of the
reference blue/slate, and omits the brand axis, `font-serif`, and the composite
`--font-*` shorthands.

When an app's token file and this document disagree, the app's file wins **for that
app** — but the disagreement is a bug worth closing in one direction or the other.

---

## Architecture

```
Primitives (_color-slate-900)
    ↓
Semantic tokens (--color-text-primary → var(--_color-slate-900))
    ↓
Tailwind utilities (text-primary, bg-elevated, border-subtle, rounded-control)
    ↓
Component variants (cva maps in each component)
```

**There is deliberately no component-token layer.** An earlier version defined 32
`--button-*` / `--card-* `/ `--dialog-*` tokens; every one was a pass-through to a
semantic token (`--button-radius: var(--radius-control)`) and **none was ever read**
by any component. They were deleted rather than wired up, because in a Tailwind +
cva system the variant map *is* the component contract:

```tsx
// button.tsx — this is the component layer
primary: "bg-action-primary text-on-accent hover:bg-action-primary-hover"
```

Duplicating that mapping into CSS variables means maintaining the same decision
twice, and cva can't consume the variables cleanly anyway (`bg-[var(--button-bg)]`
forfeits IntelliSense and purging).

Create a component token only where a component must **diverge** from the semantic
layer — a value semantics can't express, or a genuine per-component brand override.
`--color-control-thumb` is the one current example: "the knob on a switch" is not a
semantic concept. A pass-through token is a liability, not architecture.

> If Figma↔code variable parity ever becomes a requirement, **generate** this layer
> from the cva variants rather than hand-maintaining both.

**Class naming.** Colours are registered under Tailwind's property-specific keys
(`textColor`, `backgroundColor`, `borderColor`, `ringColor`, `divideColor`) rather
than the generic `colors` key. That is what keeps the class names single-barrelled:

| Registered as | Key | Class |
|---|---|---|
| `--color-text-primary` | `textColor.primary` | `text-primary` |
| `--color-surface-elevated` | `backgroundColor.elevated` | `bg-elevated` |
| `--color-border-subtle` | `borderColor.subtle` | `border-subtle` |

Putting these in `colors` instead would make Tailwind prepend the utility to a name
that already contains it — `text-text-primary`, `bg-bg-secondary`,
`border-border-default`. Tokens that stay in `colors` are the ones whose names don't
begin with a property word (`action-*`, `status-*`, `icon-*`, `chart-*`), so they read
correctly with any prefix: `bg-action-primary`, `text-status-error-fg`.

> A consequence worth knowing: a text colour can no longer be used as a background
> (`bg-text-primary` doesn't exist). That's intentional.

**Mode axes** — applied via data attributes on a root element:
- `data-appearance="light"` (default) | `data-appearance="dark"`
- `data-brand="default"` (default) | `data-brand="brand"` (blue-accented)
- `data-density="default"` (default) | `data-density="compact"`

---

## 1. Color Tokens

### Surface (background layers)

| Tailwind class        | CSS Variable                  | Light value    | Dark value      |
|-----------------------|-------------------------------|----------------|-----------------|
| `bg-canvas`   | `--color-surface-canvas`      | #ffffff        | #020617         |
| `bg-elevated` | `--color-surface-elevated`    | #ffffff        | #0f172a         |
| `bg-overlay`  | `--color-surface-overlay`     | #ffffff        | #1e293b         |
| `bg-sunken`   | `--color-surface-sunken`      | #f8fafc        | #020617         |
| `bg-popover`  | `--color-surface-popover`     | #ffffff        | #1e293b         |

**Usage guide:**
- `canvas` — page/app background
- `elevated` — cards, panels
- `overlay` — dialogs, modals
- `sunken` — inset areas, table headers, sidebar backgrounds
- `popover` — dropdowns, tooltips, select content
- `thumb` — the knob on a switch or slider. Stays light in both modes: it reads as a
  physical handle above the track, not as a surface behind content.

### Background (tonal fills)

Same `bg-*` namespace as the surfaces above — surfaces describe **layering**, these
describe **tonal weight**. `bg-primary` no longer exists; it was identical to
`bg-canvas`, so it was removed rather than kept as a second name for one value.

| Tailwind class | Description                       |
|----------------|-----------------------------------|
| `bg-secondary` | Subtle fill (table rows, headers) |
| `bg-tertiary`  | Stronger tonal fill               |
| `bg-disabled`  | Disabled state background         |
| `bg-inverse`   | Inverse (dark in light mode)      |

### Action Colors

The accent is **app-configurable**. Whatever its hue, always go through the
`action-primary` / `icon-interactive` / `border-focus` tokens below — never hardcode.

| Implementation | Default accent | Brand-mode accent | Focus ring |
|---|---|---|---|
| Reference DS (`ds-shadcn`) | `slate-900` | `blue-600` | `blue-500` |
| App: `coliix` | `brand-500 #156a52` (green) | — (no brand axis) | `brand-500` |

**`coliix` green ramp:** `50 #ecf6f2 · 100 #cfe7df · 200 #a6d2c4 · 300 #72b8a3 (dark-mode accent) · 400 #3d9580 · 500 #156a52 (primary button · icon-interactive · border-focus) · 600 #004030 (hover) · 700 #003526 (active) · 800 #002a1e · 900 #001d15`. `subtle`/`tint` are `rgba(21,106,82,0.12)` / `rgba(21,106,82,0.07)`.

| Tailwind class                  | Use case                         |
|---------------------------------|----------------------------------|
| `bg-action-primary`             | Primary button background        |
| `bg-action-primary-hover`       | Primary button hover             |
| `bg-action-primary-active`      | Primary button pressed           |
| `bg-action-primary-disabled`    | Disabled button                  |
| `bg-action-primary-subtle`      | Subtle accent fill (selected rows, 0.1 opacity) |
| `bg-action-primary-tint`        | Very light accent tint (row hover, 0.06 opacity) |
| `bg-action-secondary`           | Secondary button bg (brand-50)   |
| `bg-action-secondary-hover`     | Secondary button hover (brand-100) |
| `bg-action-secondary-active`    | Secondary button pressed         |
| `bg-action-destructive-active`  | Destructive button pressed       |

> Secondary button text + border reuse the **primary color** token directly: `text-action-primary border-action-primary`.
| `bg-action-ghost-hover`         | Ghost button / nav item hover    |
| `bg-action-ghost-active`        | Ghost button pressed             |
| `bg-action-destructive`         | Destructive/danger button        |
| `bg-action-destructive-hover`   | Destructive hover                |

### Text Colors

| Tailwind class          | Approx. value | Use case                              |
|-------------------------|---------------|---------------------------------------|
Four prominence levels. Every one clears **WCAG AA (4.5:1)** on all four surfaces
in both light and dark mode — verified by `npm run audit:tokens`, which resolves
each token to a hex and computes the ratio.

| Tailwind class        | Light     | Dark      | On white | Use case                     |
|-----------------------|-----------|-----------|----------|------------------------------|
| `text-primary`        | slate-900 | slate-50  | 17.4:1   | Headings, strong labels      |
| `text-strong`         | slate-700 | slate-200 | 10.1:1   | Body text, row values        |
| `text-secondary`      | slate-600 | slate-300 | 7.4:1    | Sub-labels, descriptions     |
| `text-subtle`         | slate-500 | slate-400 | 4.8:1    | Helper text, timestamps — **the AA floor** |

**Nothing readable may sit below `text-subtle`.** `slate-400` reaches only 2.56:1 on
white, which fails AA and even the 3:1 non-text minimum.

Contextual and exempt tokens:

| Tailwind class        | Value      | Notes                                          |
|-----------------------|------------|------------------------------------------------|
| `text-on-accent`      | white      | On `bg-action-primary` — passes AA both modes   |
| `text-on-destructive` | white      | On `bg-action-destructive`                      |
| `text-on-inverse`     | white      | On `bg-inverse`                                 |
| `text-link`           | blue-600   | Inline links                                    |
| `text-placeholder`    | slate-500  | Input placeholders — exempt from AA under WCAG 1.4.3, but set at the AA floor anyway |
| `text-disabled`       | slate-400  | Disabled controls — exempt under WCAG 1.4.3     |

**Deprecated — do not use in new code:**

| Class            | Resolves to    | Why                                                 |
|------------------|----------------|-----------------------------------------------------|
| `text-tertiary`  | `text-subtle`  | Always duplicated `subtle`; two names, one value     |
| `text-muted`     | `text-subtle`  | Was `slate-400` — failed AA for text                 |

Both are aliases, so existing markup keeps working. They will be removed once no
source references them.

### Border Colors

| Tailwind class          | Approx. value | Use case                        |
|-------------------------|---------------|---------------------------------|
| `border-subtle`  | slate-100     | Section dividers, very light separators |
| `border-default` | slate-200     | Card / panel borders — **decorative only** |
| `border-control` | slate-500     | **Any control's visible boundary** — inputs, selects, textareas, checkboxes |
| `border-hover`   | slate-300     | Hovered border                  |
| `border-focus`   | brand-500 (#156a52) | Focused input ring        |
| `border-error`   | red-500       | Error state                     |

> **`border-default` vs `border-control`.** WCAG 1.4.11 requires 3:1 contrast for
> anything that identifies a UI component — an input's outline qualifies. `slate-200`
> is 1.23:1 against white, which is fine for a card edge or a divider (both exempt as
> decorative) and not fine for a control the user has to locate. Use `border-control`
> on anything operable; keep `border-default` for structure.

### Status Colors

| Tailwind class              | Use case                        |
|-----------------------------|---------------------------------|
| `text-status-error-fg`      | Error text/icon                 |
| `bg-status-error-bg`        | Error alert background          |
| `border-status-error-border`| Error alert border              |
| `text-status-success-fg`    | Success text/icon               |
| `bg-status-success-bg`      | Success alert background        |
| `border-status-success-border` | Success alert border         |
| `text-status-warning-fg`    | Warning text/icon               |
| `bg-status-warning-bg`      | Warning alert background        |
| `text-status-info-fg`       | Info text/icon                  |
| `bg-status-info-bg`         | Info alert background           |
| `border-status-warning-border` | Warning alert border          |
| `text-status-attention-fg`  | Attention text/icon (orange — overdue, retries) |

### Icon Colors

| Tailwind class         | Use case                            |
|------------------------|-------------------------------------|
| `text-icon-default`    | Standard icon                       |
| `text-icon-muted`      | Subtle/secondary icon               |
| `text-icon-on-accent`  | Icon on accent background           |
| `text-icon-interactive`| Interactive icon (buttons, links)   |
| `text-icon-disabled`   | Disabled icon                       |
| `text-icon-on-accent`  | Icon on an accent background        |

## 2. Chart / Data-Viz Tokens

Charts are the one place raw hex is tempting — don't. Every series colour is a token,
so charts re-theme with the rest of the system and stay legible in dark mode.

**Single / dual series** — use the semantic four:

| Tailwind class      | Use case                              |
|---------------------|---------------------------------------|
| `chart-primary`     | Main series                           |
| `chart-secondary`   | Comparison / previous period          |
| `chart-accent`      | Attention series (returns, failures)  |
| `chart-muted`       | Track, background fill, "other"       |

**Three or more series** — use the categorical ramp **in order, without skipping**.
Order is fixed so the same category keeps its colour across every chart in the app:

| Tailwind class  | Light     | Dark      | Hue    |
|-----------------|-----------|-----------|--------|
| `chart-cat-1`   | `#2563eb` | `#60a5fa` | blue   |
| `chart-cat-2`   | `#f97316` | `#fb923c` | orange |
| `chart-cat-3`   | `#16a34a` | `#4ade80` | green  |
| `chart-cat-4`   | `#a855f7` | `#c084fc` | purple |
| `chart-cat-5`   | `#db2777` | `#f9a8d4` | pink   |
| `chart-cat-6`   | `#0891b2` | `#67e8f9` | cyan   |
| `chart-cat-7`   | `#ca8a04` | `#facc15` | yellow |
| `chart-cat-8`   | `#0d9488` | `#5eead4` | teal   |

Identical across `data-brand` modes — categorical colour is about telling series
apart, not about brand. Only light/dark varies.

**Ordered / magnitude data** (heat maps, choropleths, density) — use the sequential
ramp, low → high. It **inverts in dark mode** (`#dbeafe → #1e3a8a` light, `#1e3a8a →
#dbeafe` dark) so "more" always means "more visible" against the canvas:

`chart-seq-1` → `chart-seq-2` → `chart-seq-3` → `chart-seq-4` → `chart-seq-5`

**Chart structure:** `chart-grid` (grid lines), `chart-axis` (axis lines and ticks).

```tsx
// Recharts example — tokens via CSS variables
<Line dataKey="livre"   stroke="var(--color-chart-cat-1)" />
<Line dataKey="retour"  stroke="var(--color-chart-cat-3)" />
<CartesianGrid stroke="var(--color-chart-grid)" />
```

---

## 3. Typography Tokens

### Font Families (Tailwind)
- `font-sans` → Inter / system-ui
- `font-heading` → same face as body; weight carries the hierarchy
- `font-mono` → JetBrains Mono, falling back to `ui-monospace` / `SFMono-Regular`. Use for reference codes, SKUs, tracking numbers — anything where digits must align in a column.
- `font-serif` → Merriweather / Georgia (defined in the reference DS; rarely used in dashboards)

> App note: `coliix` loads Inter and JetBrains Mono via `next/font/google` and does not
> define `font-serif`. Verify the app's Tailwind config before using a family.

### Font Sizes (Tailwind)
| Class     | Value  | Use case                    |
|-----------|--------|-----------------------------|
| `text-xs`   | 12px | Captions, badges, labels    |
| `text-sm`   | 14px | Body small, table cells     |
| `text-base` | 16px | Body default                |
| `text-lg`   | 18px | Body large, subheadings     |
| `text-xl`   | 20px | h4 headings                 |
| `text-2xl`  | 24px | h3 headings                 |
| `text-3xl`  | 30px | h1 page titles              |
| `text-4xl`  | 36px | Display                     |
| `text-5xl`  | 48px | Hero/display large          |

### Font Weights (CSS variables, use Tailwind font-weight utilities)
- `font-normal` (400) → regular body
- `font-medium` (500) → labels, nav
- `font-semibold` (600) → headings, card titles
- `font-bold` (700) → page titles, display

### Composite Typography (CSS variables)

The reference DS defines composite shorthands. They are CSS variables, not Tailwind
classes — use via the `font` shorthand in CSS, or `style={{ font: "var(--font-heading-h1)" }}`:

```css
--font-heading-h1  → bold 30px/tight sans
--font-heading-h2  → semibold 24px/snug sans
--font-heading-h3  → semibold 20px/snug sans
--font-heading-h4  → semibold 18px/normal sans
--font-body-md     → regular 16px/normal sans
--font-body-sm     → regular 14px/normal sans
--font-label-md    → medium 14px/none sans
--font-label-sm    → medium 12px/none sans
--font-code-md     → regular 14px/normal mono
```

In practice most dashboard code composes with Tailwind utilities instead, which is
equally valid and easier to scan:

| Role       | Utilities                                          |
|------------|----------------------------------------------------|
| Page title | `text-3xl font-bold tracking-tight text-primary` |
| Section    | `text-xl font-semibold text-primary`          |
| Card title | `text-base font-semibold text-primary`        |
| Body       | `text-sm text-primary`                        |
| Label      | `text-sm font-medium text-secondary`          |
| Caption    | `text-xs text-muted`                          |
| Metric     | `text-2xl font-bold text-primary`             |
| Code / ref | `font-mono text-xs`                                |

> Note: `coliix` does **not** define these composite variables — it uses the utility
> table only. Don't reference `--font-*` shorthands in app code without checking.

---

## 4. Spacing Tokens

All spacing tokens are responsive to `data-density`. Use these instead of hardcoded `p-4`, `gap-2`.

### Stack (vertical gaps)
| Tailwind class    | Default | Compact |
|-------------------|---------|---------|
| `gap-stack-xs`    | 4px     | 2px     |
| `gap-stack-sm`    | 8px     | 6px     |
| `gap-stack-md`    | 12px    | 8px     |
| `gap-stack-lg`    | 16px    | 12px    |
| `gap-stack-xl`    | 24px    | 16px    |
| `gap-stack-2xl`   | 32px    | 24px    |

Also use as padding: `p-stack-md`, `py-stack-lg`, etc.

### Inline (horizontal gaps)
| Tailwind class    | Default | Compact |
|-------------------|---------|---------|
| `gap-inline-xs`   | 4px     | 2px     |
| `gap-inline-sm`   | 8px     | 6px     |
| `gap-inline-md`   | 12px    | 8px     |
| `gap-inline-lg`   | 16px    | 12px    |

### Component & Container
| Tailwind class  | Default | Compact | Use case              |
|-----------------|---------|---------|-----------------------|
| `px-comp-px`    | 16px    | 12px    | Button/input horizontal padding |
| `py-comp-py`    | 8px     | 6px     | Button/input vertical padding   |
| `px-cont-px`    | 24px    | 16px    | Card/section padding  |

---

## 5. Radius Tokens

| Tailwind class     | Value  | Use case                         |
|--------------------|--------|----------------------------------|
| `rounded-control`  | 6px    | Buttons, inputs, selects         |
| `rounded-card`     | 8px    | Cards, panels                    |
| `rounded-overlay`  | 12px   | Dialogs, drawers, popovers       |
| `rounded-pill`     | 9999px | Badges, avatars, switches        |

---

## 6. Shadow Tokens

| Tailwind class   | Use case                            |
|------------------|-------------------------------------|
| `shadow-control` | Subtle shadow on interactive controls |
| `shadow-card`    | Cards, panels                       |
| `shadow-popover` | Dropdown menus, popovers            |
| `shadow-overlay` | Dialogs, modals                     |
| `shadow-focus`   | Focus ring (applied via `focus-visible:shadow-focus`) |

---

## 7. Z-Index Tokens

| Tailwind class  | Value | Use case                  |
|-----------------|-------|---------------------------|
| `z-dropdown`    | 100   | Dropdown menus            |
| `z-sticky`      | 200   | Sticky headers/sidebars   |
| `z-overlay`     | 300   | Modal backdrop            |
| `z-modal`       | 400   | Dialog/modal content      |
| `z-popover`     | 500   | Popovers, select content  |
| `z-toast`       | 600   | Toast notifications       |
| `z-tooltip`     | 700   | Tooltips                  |

---

## 8. Motion Tokens

### Duration (Tailwind `duration-*`)
| Class              | Value  | Use case                       |
|--------------------|--------|--------------------------------|
| `duration-fast`    | 100ms  | Hover states, color changes    |
| `duration-normal`  | 200ms  | Transitions, open/close        |
| `duration-slow`    | 300ms  | Entrances, exits               |
| `duration-deliberate` | 500ms | Page transitions, onboarding |

### Easing (Tailwind `ease-*`)
| Class            | Curve                         | Use case         |
|------------------|-------------------------------|------------------|
| `ease-out`       | cubic-bezier(0,0,0.2,1)       | Most transitions |
| `ease-in`        | cubic-bezier(0.4,0,1,1)       | Exit animations  |
| `ease-in-out`    | cubic-bezier(0.4,0,0.2,1)     | Hover states     |
| `ease-spring`    | cubic-bezier(0.175,0.885,0.32,1.275) | Playful entrance |

> These override Tailwind's built-in `ease-*` classes so they resolve to DS motion
> tokens. The curves are identical to Tailwind's defaults, so nothing moves
> differently — the tokens just become the single source. `ease-ease-out`,
> `ease-ease-in` and `ease-ease-in-out` remain as **deprecated aliases** (the old
> stuttered names, produced when the config keys carried their own `ease-` prefix).
> Use the short forms in new code.

---

## 9. Control Size Tokens

Applied automatically by Button/Input/Select variants. Use as CSS variables if building custom controls.

| Token                   | Default | Compact | Use as Tailwind          |
|-------------------------|---------|---------|--------------------------|
| `--control-height-sm`   | 32px    | 28px    | `h-control-sm`           |
| `--control-height-md`   | 36px    | 32px    | `h-control-md`           |
| `--control-height-lg`   | 40px    | 36px    | `h-control-lg`           |

---

## 10. Mode Switching Reference

### Light mode (default — no attribute needed)
```html
<html>...</html>
```

### Dark mode
```html
<html data-appearance="dark">...</html>
<!-- or on any subtree: -->
<div data-appearance="dark">...</div>
```

### Brand mode
```html
<html data-brand="brand">...</html>
```
Blue-accented variant. Implemented in the reference DS as `[data-brand="brand"]`
(light) and `[data-appearance="dark"][data-brand="brand"]` (dark).

### Compact density
```html
<html data-density="compact">...</html>
```
Shrinks spacing (`stack-*`, `inline-*`, `comp-*`, `cont-*`) and control heights only.
Colours, radii and type sizes are unchanged.

> **Agent rule:** Place `data-appearance`, `data-brand` and `data-density` on `<html>`
> or the root layout wrapper. Never override individual token values inline — switch
> the mode attribute instead.

### Implementation status — reference DS (`ds-shadcn/src/styles/tokens.css`)

| Axis | Attribute | Status |
|---|---|---|
| Appearance | `data-appearance="light"` | ✅ base (also on `:root`) |
| Appearance | `data-appearance="dark"` | ✅ implemented |
| Brand | `data-brand="brand"` | ✅ implemented (light + dark) |
| Density | `data-density="compact"` | ✅ implemented |

**Consuming apps may implement a subset.** `coliix`, for example, ships light + dark
+ compact with a green accent and deliberately omits the brand axis — its `CLAUDE.md`
forbids `data-brand`. Check the app's own token file before assuming an axis is live.
