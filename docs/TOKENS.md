# Design System v1.2 — Token Reference

> **For agents:** Always use semantic tokens (e.g., `text-text-primary`) in Tailwind classes. Never hardcode colors like `text-slate-900` or hex values. The token architecture ensures automatic light/dark mode and brand switching.

---

## Architecture

```
Primitives (_color-slate-900)
    ↓
Semantic tokens (--color-text-primary → var(--_color-slate-900))
    ↓
Component tokens (--button-radius → var(--radius-control))
    ↓
Tailwind utilities (text-text-primary, bg-bg-secondary, rounded-control)
```

**Mode axes** — applied via data attributes on a root element:
- `data-appearance="light"` (default) | `data-appearance="dark"`
- `data-brand="default"` (default) | `data-brand="brand"` (blue-accented)
- `data-density="default"` (default) | `data-density="compact"`

---

## 1. Color Tokens

### Surface (background layers)

| Tailwind class        | CSS Variable                  | Light value    | Dark value      |
|-----------------------|-------------------------------|----------------|-----------------|
| `bg-surface-canvas`   | `--color-surface-canvas`      | #ffffff        | #020617         |
| `bg-surface-elevated` | `--color-surface-elevated`    | #ffffff        | #0f172a         |
| `bg-surface-overlay`  | `--color-surface-overlay`     | #ffffff        | #1e293b         |
| `bg-surface-sunken`   | `--color-surface-sunken`      | #f8fafc        | #020617         |
| `bg-surface-popover`  | `--color-surface-popover`     | #ffffff        | #1e293b         |

**Usage guide:**
- `canvas` — page/app background
- `elevated` — cards, panels
- `overlay` — dialogs, modals
- `sunken` — inset areas, table headers, sidebar backgrounds
- `popover` — dropdowns, tooltips, select content

### Background (tonal fills)

| Tailwind class    | Description                  |
|-------------------|------------------------------|
| `bg-bg-primary`   | Main content background      |
| `bg-bg-secondary` | Subtle fill (table rows, headers) |
| `bg-bg-tertiary`  | Stronger tonal fill          |
| `bg-bg-disabled`  | Disabled state background    |
| `bg-bg-inverse`   | Inverse (dark in light mode) |

### Action Colors

**Brand accent = green** ramp: `50 #ecf6f2 · 100 #cfe7df · 200 #a6d2c4 · 300 #72b8a3 · 400 #3d9580 · 500 #156a52 (primary button) · 600 #004030 (hover · also icon-interactive / border-focus) · 700 #003526 (active) · 800 #002a1e · 900 #001d15`. `subtle`/`tint` are `rgba(0,64,48,0.1)` / `rgba(0,64,48,0.06)`. Never hardcode — always use the `action-primary` / `icon-interactive` / `border-focus` tokens below.

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

> Secondary button text + border reuse the **primary color** token directly: `text-action-primary border-action-primary`.
| `bg-action-ghost-hover`         | Ghost button / nav item hover    |
| `bg-action-ghost-active`        | Ghost button pressed             |
| `bg-action-destructive`         | Destructive/danger button        |
| `bg-action-destructive-hover`   | Destructive hover                |

### Text Colors

| Tailwind class          | Approx. value | Use case                              |
|-------------------------|---------------|---------------------------------------|
| `text-text-primary`     | slate-900     | Headings, strong labels               |
| `text-text-strong`      | slate-700     | Body text, row values                 |
| `text-text-secondary`   | slate-600     | Sub-labels, descriptions              |
| `text-text-subtle`      | slate-500     | Helper text, timestamps               |
| `text-text-muted`       | slate-400     | Placeholders, minor labels            |
| `text-text-disabled`    | slate-300     | Disabled states                       |
| `text-text-on-accent`   | white         | Text on primary/accent backgrounds    |
| `text-text-on-inverse`  | white         | Text on inverse (dark) background     |
| `text-text-placeholder` | slate-400     | Input placeholder                     |

### Border Colors

| Tailwind class          | Approx. value | Use case                        |
|-------------------------|---------------|---------------------------------|
| `border-border-subtle`  | slate-100     | Section dividers, very light separators |
| `border-border-default` | slate-200     | Default card / input border     |
| `border-border-hover`   | slate-300     | Hovered border                  |
| `border-border-focus`   | brand-600 (#004030) | Focused input ring        |
| `border-border-error`   | red-500       | Error state                     |

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
| `text-status-attention-fg`  | Attention text/icon (orange — overdue, retries) |

### Icon Colors

| Tailwind class         | Use case                            |
|------------------------|-------------------------------------|
| `text-icon-default`    | Standard icon                       |
| `text-icon-muted`      | Subtle/secondary icon               |
| `text-icon-on-accent`  | Icon on accent background           |
| `text-icon-interactive`| Interactive icon (buttons, links)   |
| `text-icon-disabled`   | Disabled icon                       |

---

## 2. Typography Tokens

### Font Families (Tailwind)
- `font-sans` → Inter / Segoe UI / system-ui
- `font-mono` → JetBrains Mono / Fira Code
- `font-serif` → Merriweather / Georgia

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

### Composite Typography (CSS variable — use directly via `style` prop or CSS)
```css
--font-heading-h1  → 700 30px/1.25 Inter
--font-heading-h2  → 600 24px/1.375 Inter
--font-heading-h3  → 600 20px/1.375 Inter
--font-heading-h4  → 600 18px/1.5 Inter
--font-body-md     → 400 16px/1.5 Inter
--font-body-sm     → 400 14px/1.5 Inter
--font-label-md    → 500 14px/1 Inter
--font-label-sm    → 500 12px/1 Inter
--font-code-md     → 400 14px/1.5 JetBrains Mono
```

---

## 3. Spacing Tokens

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

## 4. Radius Tokens

| Tailwind class     | Value  | Use case                         |
|--------------------|--------|----------------------------------|
| `rounded-control`  | 6px    | Buttons, inputs, selects         |
| `rounded-card`     | 8px    | Cards, panels                    |
| `rounded-overlay`  | 12px   | Dialogs, drawers, popovers       |
| `rounded-pill`     | 9999px | Badges, avatars, switches        |

---

## 5. Shadow Tokens

| Tailwind class   | Use case                            |
|------------------|-------------------------------------|
| `shadow-control` | Subtle shadow on interactive controls |
| `shadow-card`    | Cards, panels                       |
| `shadow-popover` | Dropdown menus, popovers            |
| `shadow-overlay` | Dialogs, modals                     |
| `shadow-focus`   | Focus ring (applied via `focus-visible:shadow-focus`) |

---

## 6. Z-Index Tokens

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

## 7. Motion Tokens

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
| `ease-ease-out`  | cubic-bezier(0,0,0.2,1)       | Most transitions |
| `ease-ease-in`   | cubic-bezier(0.4,0,1,1)       | Exit animations  |
| `ease-ease-in-out` | cubic-bezier(0.4,0,0.2,1)   | Hover states     |
| `ease-spring`    | cubic-bezier(0.175,0.885,0.32,1.275) | Playful entrance |

---

## 8. Control Size Tokens

Applied automatically by Button/Input/Select variants. Use as CSS variables if building custom controls.

| Token                   | Default | Compact | Use as Tailwind          |
|-------------------------|---------|---------|--------------------------|
| `--control-height-sm`   | 32px    | 28px    | `h-control-sm`           |
| `--control-height-md`   | 36px    | 32px    | `h-control-md`           |
| `--control-height-lg`   | 40px    | 36px    | `h-control-lg`           |

---

## 9. Mode Switching Reference

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

### Brand mode (blue accent)
```html
<html data-brand="brand">...</html>
```

### Dark + Brand
```html
<html data-appearance="dark" data-brand="brand">...</html>
```

### Compact density
```html
<html data-density="compact">...</html>
```

> **Agent rule:** Place `data-appearance` and `data-brand` on `<html>` or the root layout wrapper. Never override individual token values inline — switch the mode attribute instead.
