# Agent Guide — Building Dashboard UI with DS v1.2

> **Audience:** AI agents (Hermes and others) tasked with generating or modifying dashboard components.
> **Goal:** Produce consistent, token-correct, accessible React + Tailwind + shadcn/ui code every time.

---

## ⚠️ RULE #0 — THE TEMPLATE IS THE LAW

**Before writing a single line of code, read `MCP/TEMPLATE_STYLE.md`.**

The file `gemini-code-1779566133115.html` is the canonical visual reference. Every dashboard page MUST match its structure exactly. This is non-negotiable:

| Zone         | Required style                              | DS tokens                                     |
|--------------|---------------------------------------------|-----------------------------------------------|
| Root `<html>`| Light mode + brand accent                   | `data-appearance="light" data-brand="brand"`  |
| Header       | **Dark** background, white text, h-14       | `bg-inverse text-on-inverse`          |
| Sidebar      | **White** background, right border, w-64    | `bg-elevated border-r border-default` |
| Main area    | **Light gray** background, p-8              | `bg-sunken`                           |
| Cards        | White bg, subtle border, rounded-card       | `bg-elevated border-default rounded-card shadow-card` |
| Primary CTA  | Indigo/blue solid button                    | `<Button variant="primary">` with brand mode  |
| Active nav   | Indigo tint bg + indigo text                | `bg-action-primary-subtle text-action-primary`|

**Violation examples — these will be rejected:**
- ❌ Dark sidebar (`bg-slate-900` in the sidebar)
- ❌ Light header (`bg-white` in the header)
- ❌ Colored main area (`bg-blue-50` in main)
- ❌ `dark:` Tailwind modifiers anywhere
- ❌ Any `gray-*`, `indigo-*`, `slate-*` raw Tailwind color classes
- ❌ Any `#` hex color values in className

Run the `TEMPLATE_STYLE.md` enforcement checklist before finalising any component.

---

## The Golden Rules (never break these)

0. **The template is the visual law.** See `TEMPLATE_STYLE.md`. Full stop.

1. **Use semantic tokens only.** Never use `text-slate-900`, `bg-blue-50`, or hex colors. Always use `text-primary`, `bg-status-info-bg`, etc.
   → See `ENFORCEMENT.md` for the full forbidden→correct mapping and the automated lint script that enforces this at build time.

2. **Never override component internals.** Don't add raw Tailwind colors to `<Button>`, `<Badge>`, or `<Card>` to change their theme. Switch the variant instead.

3. **Import from `@/components/ui/`.** All components live in `ds-v2/src/components/ui/`. If a component isn't there, check the index and use a composition.

4. **Use spacing tokens for gaps and padding.** Replace `gap-2`, `p-4`, `py-3` with `gap-stack-sm`, `px-cont-px`, `py-stack-lg` etc.

5. **Use Lucide icons everywhere.** The DS is tuned for Lucide. Import from `lucide-react`. Never use `feather-icons` or inline SVGs.

6. **Respect layer order.** Cards use `bg-elevated`, modal uses `bg-overlay`, page bg uses `bg-sunken`. Do not mix them.

7. **Dark mode is automatic.** Never write `dark:` Tailwind modifiers. Apply `data-appearance="dark"` to the root and every token switches automatically.

---

## Decision Tree — "What should I use?"

### I need to show data at a glance
→ **Stat card pattern** → `<Card className="p-5">` with `text-2xl font-bold` value + status color trend

### I need to list records
→ **Data table pattern** → `<Table>` inside `<Card>` with `<CardContent className="p-0">`, `<Badge>` for status, `<DropdownMenu>` for row actions

### I need to organize page content into views
→ **Tabs pattern** → `<Tabs>` + `<TabsList>` + `<TabsTrigger>` + `<TabsContent>`

### I need a user to take an action
→ **Button** → `variant="primary"` for the main CTA, `variant="outline"` for secondary, `variant="ghost"` for icon toolbar actions

### I need to show state/status
→ **Badge** → `variant="success" | "warning" | "destructive" | "info" | "outline"`
→ Never use custom color classes for status

### I need a form field
→ **Input** + **Label** + **FormMessage** → wrap with `<Form>` + `<FormField>` for validation

### I need a confirmation / destructive action
→ **Dialog** → `<DialogContent>` with `<DialogFooter>` containing `<Button variant="outline">Cancel</Button>` + `<Button variant="destructive">Delete</Button>`

### I need a contextual menu on a row/item
→ **DropdownMenu** triggered by `<Button variant="ghost" size="icon"><MoreHorizontal /></Button>`

### I need to filter or narrow a view
→ **Select** for single-choice filters, **Button variant="outline"** with `<Calendar>` icon for date ranges

### I need a loading state
→ **Skeleton** matching the shape of the real content

### I need to inform the user of a condition
→ **Alert** for persistent notices, **Toast** (via `useToast`) for transient feedback

### I need to show no data
→ **Empty state** pattern — icon + title + description + CTA button

---

## Step-by-Step: Building a New Dashboard Page

### Step 1 — Wrap in PageContent
```tsx
export default function MyPage() {
  return (
    <PageContent>
      {/* your sections */}
    </PageContent>
  );
}
```
`PageContent` = `<div className="p-8"><div className="max-w-screen-xl mx-auto space-y-stack-xl">`

### Step 2 — Add PageHeader
```tsx
<PageHeader
  title="Page Title"
  description="Brief description of this view."
  primaryAction={<Button variant="primary"><Plus className="w-4 h-4" /> Add Item</Button>}
/>
```

### Step 3 — Add Tabs if the page has sub-views
```tsx
<Tabs defaultValue="tab1">
  <div className="flex items-center justify-between border-b border-default">
    <TabsList className="border-b-0 -mb-px">
      <TabsTrigger value="tab1">Tab 1</TabsTrigger>
      <TabsTrigger value="tab2">Tab 2</TabsTrigger>
    </TabsList>
    <div className="flex gap-inline-sm pb-4">
      {/* filter controls */}
    </div>
  </div>
  <TabsContent value="tab1">...</TabsContent>
  <TabsContent value="tab2">...</TabsContent>
</Tabs>
```

### Step 4 — KPI grid (if metrics are needed)
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-stack-lg">
  <StatCard label="Label" value="1,234" trend="+5%" up />
  ...
</div>
```

### Step 5 — Content section (chart or table)
For a table: use **DataTableCard** pattern from DASHBOARD_PATTERNS.md.
For a chart: wrap in `<Card>` with `<CardHeader>` toolbar and `<CardContent className="min-h-72">`.

### Step 6 — Handle empty and loading states
- If data is loading: replace table rows with `<Skeleton>` rows
- If data is empty: render `<EmptyState>` inside `<CardContent>`

---

## Token Cheat Sheet — Most Used

| Purpose                       | Tailwind class              |
|-------------------------------|-----------------------------|
| Page title                    | `text-3xl font-bold text-primary` |
| Section heading               | `text-xl font-semibold text-primary` |
| Card title                    | `text-base font-semibold text-primary` |
| Label / nav item              | `text-sm font-medium text-secondary` |
| Table cell value              | `text-sm text-primary` |
| Caption / timestamp           | `text-xs text-muted` |
| Metric value                  | `text-2xl font-bold text-primary` |
| Positive trend                | `text-xs font-medium text-status-success-fg` |
| Negative trend                | `text-xs font-medium text-status-error-fg` |
| Card background               | `bg-elevated` (auto on `<Card>`) |
| Page area background          | `bg-sunken` |
| TopBar background             | `bg-inverse` |
| Input background              | `bg-canvas` (auto on `<Input>`) |
| Table header background       | `bg-secondary` (auto on `<TableHeader>`) |
| Default border                | `border border-default` |
| Focus ring                    | `focus-visible:shadow-focus` (auto on inputs/buttons) |
| Hover on ghost controls       | `hover:bg-action-ghost-hover` |

---

## Anti-Patterns — What NOT to Do

### ❌ Hardcoded colors (caught by `npm run lint:colors` — build will fail)

The lint script rejects ALL of these. See `ENFORCEMENT.md` for the complete forbidden → DS token mapping.

```tsx
// BAD — every one of these fails the linter
<p className="text-slate-600">...</p>           // → text-secondary
<p className="text-slate-900">...</p>           // → text-primary
<p className="text-slate-700">...</p>           // → text-strong
<p className="text-slate-500">...</p>           // → text-subtle
<p className="text-slate-400">...</p>           // → text-muted
<div className="bg-white">...</div>             // → bg-elevated
<div className="bg-slate-50">...</div>          // → bg-sunken
<div className="bg-slate-100">...</div>         // → bg-secondary
<div className="hover:bg-slate-100">...</div>   // → hover:bg-action-ghost-hover
<div className="border-slate-200">...</div>     // → border-default
<div className="border-slate-100">...</div>     // → border-subtle
<div className="bg-blue-50 border-blue-200">Info box</div>  // → use status-info-* tokens
<span className="text-green-600">Success</span>              // → text-status-success-fg
<span className="text-red-600">Error</span>                  // → text-status-error-fg
<span className="text-orange-600">Overdue</span>             // → text-status-attention-fg
<div className="bg-[#004030]">...</div>         // → bg-action-primary
<div className="text-[#004030]">...</div>       // → text-icon-interactive
<div className="bg-[rgba(0,64,48,0.1)]">...</div> // → bg-action-primary-subtle
```

```tsx
// GOOD
<p className="text-secondary">Description</p>
<div className="bg-elevated">Card</div>
<div className="bg-sunken">Page area</div>
<div className="hover:bg-action-ghost-hover">Nav item</div>
<div className="border border-default">Default border</div>
<div className="bg-status-info-bg border border-status-info-border text-status-info-fg">Info box</div>
<span className="text-status-success-fg">Success</span>
<span className="text-status-error-fg">Error</span>
<span className="text-status-attention-fg">Overdue</span>
<div className="bg-action-primary">Brand fill</div>
<div className="text-icon-interactive">Brand icon</div>
<div className="bg-action-primary-subtle">Selected row tint</div>
```

### ❌ Dark mode manual overrides
```tsx
// BAD — breaks the token system
<div className="bg-white dark:bg-gray-900">
```
```tsx
// GOOD — set mode at root, tokens handle the rest
<div data-appearance="dark">
  <div className="bg-elevated">
```

### ❌ Creating custom badge colors
```tsx
// BAD
<span className="bg-green-100 text-green-700 rounded-full px-2 py-0.5 text-xs">Active</span>
```
```tsx
// GOOD
<Badge variant="success">Active</Badge>
```

### ❌ Using raw padding/gap values
```tsx
// BAD
<div className="flex flex-col gap-3 p-4">
```
```tsx
// GOOD
<div className="flex flex-col gap-stack-md px-cont-px py-stack-lg">
```

### ❌ Putting a table outside a Card
```tsx
// BAD
<Table>...</Table>
```
```tsx
// GOOD
<Card>
  <CardContent className="p-0">
    <Table>...</Table>
  </CardContent>
</Card>
```

### ❌ Multiple primary buttons on one page
```tsx
// BAD — two equal-weight primary buttons
<Button variant="primary">Save</Button>
<Button variant="primary">Export</Button>
```
```tsx
// GOOD — one primary, one secondary/outline
<Button variant="primary">Save</Button>
<Button variant="outline">Export</Button>
```

### ❌ Using inline styles for token values
```tsx
// BAD
<div style={{ backgroundColor: 'var(--color-surface-elevated)', padding: '16px' }}>
```
```tsx
// GOOD — use Tailwind utilities that map to the tokens
<div className="bg-elevated p-cont-px">
```

---

## Icon Usage Rules

- **Size in buttons:** `w-4 h-4` (md button) or `w-5 h-5` (lg button / icon-only in topbar)
- **Color:** Inherit from parent text class or use `text-icon-muted` / `text-icon-default` / `text-icon-interactive`
- **Gap from text:** `gap-inline-sm` (`gap-2` equivalent) — this is auto-applied inside `<Button>`
- **Disabled icon:** `text-icon-disabled`
- **Semantic icons for common actions:**
  - Add/Create → `Plus`
  - Edit → `Edit` or `Pencil`
  - Delete → `Trash2`
  - Settings → `Settings`
  - Notifications → `Bell`
  - Search → `Search`
  - Filter → `SlidersHorizontal` or `Filter`
  - Calendar/Date → `Calendar`
  - More actions → `MoreHorizontal` (row) / `MoreVertical` (card header)
  - Close → `X`
  - User → `User` or `CircleUser`
  - Chevron → `ChevronDown`, `ChevronRight`, `ChevronLeft`
  - Home → `Home`
  - Chart → `BarChart2`, `LineChart`, `PieChart`
  - Table/Data → `Table2`, `Layers`
  - Export → `Download`
  - Upload → `Upload`
  - Copy → `Copy`
  - Check → `Check`, `CheckCircle2`
  - Warning → `AlertTriangle`
  - Info → `Info`
  - Error → `XCircle`

---

## Accessibility Checklist

Every generated component should satisfy:

- [ ] All interactive elements have accessible names (`aria-label` on icon-only buttons)
- [ ] Form fields are associated with their `<Label>` via `htmlFor` / `id`
- [ ] Error messages use `role="alert"` or `<FormMessage>` (auto)
- [ ] Focus ring is visible — use `focus-visible:shadow-focus` (auto on DS components)
- [ ] Dialogs trap focus — use `<Dialog>` from Radix (auto)
- [ ] Color is not the only status indicator — pair color with icon or text
- [ ] Tables have `<caption>` or `aria-label` describing their content
- [ ] Keyboard navigation works for all dropdowns (Radix handles this automatically)

---

## File & Import Conventions

The design system lives in this repository:

```
ds-shadcn/
├── src/
│   ├── components/
│   │   ├── ui/              ← All shadcn components (never modify directly)
│   │   └── layout/          ← AppShell, Header, Sidebar
│   └── styles/
│       └── tokens.css       ← All CSS custom properties (source of truth)
├── tailwind.config.ts       ← Tailwind mapping for every token
└── showcase.html            ← visual reference
```

In a consuming app, import via the app's own aliases — `@/components/ui/*` and
`@/lib/utils` for the `cn()` helper (clsx + tailwind-merge).

```tsx
// The cn() helper — always use it to merge class names
import { cn } from "@/lib/utils";

<div className={cn("base-classes", conditional && "optional-class", className)} />
```

```tsx
// Never import Radix primitives directly in page code
// BAD
import * as DialogPrimitive from "@radix-ui/react-dialog";

// GOOD — always use the wrapped DS components
import { Dialog, DialogContent } from "@/components/ui/dialog";
```

---

## Composing New Patterns

When a task requires a UI element not explicitly in this guide, build it from primitives following this formula:

1. **Shell:** Start with `<Card>` or a plain `div` with DS token classes
2. **Typography:** Use `text-primary / secondary / muted` + `text-sm/base/xl` + `font-medium/semibold/bold`
3. **Spacing:** Use `gap-stack-*` and `gap-inline-*` — never arbitrary pixel values
4. **Borders:** Use `border border-default` — never `border-gray-200`
5. **Interactive states:** Use `hover:bg-action-ghost-hover` and `focus-visible:shadow-focus`
6. **Status coloring:** Use `text-status-{error|success|warning|info}-fg` and matching `-bg` / `-border`

---

## Quick Reference Card

```
LAYOUT         TOKENS
TopBar         bg-inverse + text-on-inverse
Sidebar        bg-elevated + border-default
Main           bg-sunken
Card           bg-elevated + border-default + shadow-card + rounded-card
Dialog         bg-overlay + shadow-overlay + rounded-overlay
Popover        bg-popover + shadow-popover + rounded-overlay

TEXT HIERARCHY
H1 page title  text-3xl font-bold text-primary
H2 section     text-xl font-semibold text-primary
Card title     text-base font-semibold text-primary
Label          text-sm font-medium text-secondary
Body           text-sm text-primary
Caption        text-xs text-muted

ACTIONS
Primary CTA    variant="primary"
Secondary      variant="secondary" or variant="outline"
Icon toolbar   variant="ghost" size="icon"
Row action     variant="ghost" size="icon" + DropdownMenu
Destructive    variant="destructive"

STATUS
Active/OK      Badge variant="success"
Pending        Badge variant="warning"
Error/Failed   Badge variant="destructive"
Info/Review    Badge variant="info"
Draft          Badge variant="outline"
```
