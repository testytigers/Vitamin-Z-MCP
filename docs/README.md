# MCP Design System — Agent Reference v1.2

> This folder is the **machine-readable interface** to the Design System v1.2. It is written for AI agents (Hermes and others) that generate, modify, or review dashboard UI code. Every file is self-contained and can be read independently.

---

## What Is This?

This DS is built on:
- **shadcn/ui** — unstyled, accessible Radix UI components wrapped with Tailwind
- **Design System v1.2 tokens** — a three-layer token architecture (Primitives → Semantic → Component)
- **Tailwind CSS** — extended with DS-specific color, spacing, radius, shadow, and motion utilities

The design language matches the Gemini SaaS dashboard template: dark top bar, white sidebar, grey canvas, card-based content.

---

## File Index

| File | Purpose |
|------|---------|
| `TEMPLATE_STYLE.md` | ⚠️ **START HERE.** The canonical visual law — line-by-line mapping of the reference HTML template to DS tokens. Every agent must pass this checklist before shipping code. |
| `TOKENS.md` | Complete token reference — colors, typography, spacing, radius, shadow, z-index, motion. |
| `COMPONENTS.md` | Every shadcn component with props, variants, and copy-paste TSX examples. Includes layout components (Header, Sidebar, AppShell). |
| `DASHBOARD_PATTERNS.md` | Canonical composition blueprints — AppShell, TopBar, Sidebar, StatCards, DataTable, Charts, EmptyState, Full page template. |
| `AGENT_GUIDE.md` | Decision tree, golden rules (Rule #0 = template law), anti-patterns, accessibility checklist, icon vocabulary. **Read after TEMPLATE_STYLE.md.** |
| `ENFORCEMENT.md` | 🔒 **3-layer DS enforcement system** — forbidden patterns, correct replacements, lint script source, CLAUDE.md template, pre-commit hook setup. |

---

## Quick Start for Agents

### Reading order for a new task

1. **Read `AGENT_GUIDE.md`** — understand the rules and decision tree
2. **Read `DASHBOARD_PATTERNS.md`** — identify the right pattern for your task
3. **Read `COMPONENTS.md`** — look up the specific component API
4. **Read `TOKENS.md`** — verify token names when in doubt

### The 30-second cheat sheet

```
✅ Always use                         ❌ Never use (lint will fail)
text-text-primary                     text-slate-900 / text-slate-800
text-text-strong                      text-slate-700
text-text-secondary                   text-slate-600
text-text-subtle                      text-slate-500
text-text-muted                       text-slate-400
text-text-disabled                    text-slate-300
bg-surface-elevated                   bg-white
bg-surface-sunken                     bg-slate-50
bg-bg-secondary                       bg-slate-100
hover:bg-action-ghost-hover           hover:bg-slate-100
border-border-subtle                  border-slate-100
border-border-default                 border-slate-200 / border-gray-200
text-status-success-fg                text-green-600
text-status-error-fg                  text-red-600
text-status-warning-fg                text-yellow-600
text-status-attention-fg              text-orange-600
bg-action-primary                     bg-[#4f46e5]
text-icon-interactive                 text-[#4f46e5]
bg-action-primary-subtle              bg-[rgba(79,70,229,0.1)]
bg-action-primary-tint                bg-[rgba(79,70,229,0.04)]
data-appearance="dark" on root        dark: Tailwind prefix
Badge variant="success"               custom green badge span
```

> Run `npm run lint:colors` to verify compliance. See `ENFORCEMENT.md` for the full mapping table and how to set up the 3-layer enforcement system in a project.

---

## Token Architecture

```
:root {
  /* PRIMITIVES (internal, _ prefix) */
  --_color-slate-900: #0f172a;

  /* SEMANTIC (use these in Tailwind) */
  --color-text-primary: var(--_color-slate-900);  → text-text-primary

  /* COMPONENT */
  --card-radius: var(--radius-card);              → rounded-card
}
```

**Mode switching:** Set `data-appearance="light|dark"` and `data-brand="default|brand"` on the root element. All tokens respond automatically. Never write `dark:` modifiers.

---

## Component Path

```
ds-v2/src/components/ui/
├── button.tsx         accordion.tsx      avatar.tsx
├── card.tsx           alert.tsx          badge.tsx
├── input.tsx          calendar.tsx       breadcrumb.tsx
├── select.tsx         carousel.tsx       checkbox.tsx
├── tabs.tsx           collapsible.tsx    command.tsx
├── table.tsx          context-menu.tsx   dialog.tsx
├── tooltip.tsx        drawer.tsx         dropdown-menu.tsx
├── separator.tsx      form.tsx           hover-card.tsx
├── skeleton.tsx       input-otp.tsx      label.tsx
├── switch.tsx         menubar.tsx        navigation-menu.tsx
├── progress.tsx       pagination.tsx     popover.tsx
├── textarea.tsx       radio-group.tsx    resizable.tsx
├── sheet.tsx          scroll-area.tsx    slider.tsx
├── toast.tsx          toggle.tsx         toggle-group.tsx
└── index.ts
```

Import path: `@/components/ui/<name>`

---

## Dashboard Layout Summary

```
┌─────────────────────────────────────────────────────────┐
│ AnnouncementBanner (bg-status-info-bg)                  │
├─────────────────────────────────────────────────────────┤
│ TopBar (bg-bg-inverse, h-14, shrink-0)                  │
│  Logo | Workspace ▾ | [Search] | ⚙ 🔔 | Avatar ▾       │
├──────────────┬──────────────────────────────────────────┤
│              │ Main (bg-surface-sunken, overflow-y-auto) │
│  Sidebar     │  ┌──────────────────────────────────────┐│
│  (w-64,      │  │ PageContent (p-8, max-w-screen-xl)   ││
│   bg-surface │  │  PageHeader (title + primary CTA)    ││
│   -elevated) │  │  Tabs + FilterBar                    ││
│              │  │  KPI Grid (4-col)                    ││
│  [nav items] │  │  Chart Grid (2-col)                  ││
│              │  │  DataTableCard                       ││
│  [upsell     │  └──────────────────────────────────────┘│
│   card]      │                                          │
└──────────────┴──────────────────────────────────────────┘
```

---

## Updating This Reference

When DS v1.3+ is released:
1. Update `tokens.css` in `ds-shadcn/src/styles/`
2. Update component files in `ds-v2/src/components/ui/`
3. Regenerate `TOKENS.md` and `COMPONENTS.md` to reflect new tokens/variants
4. Add new patterns to `DASHBOARD_PATTERNS.md`
5. Update anti-patterns in `AGENT_GUIDE.md` if any rules change

---

*DS v1.2 · Built for Hermes and compatible agents · Folder: `ds-shadcn-v1.2/MCP/`*
