/**
 * cheatsheet.ts — the one-call context primer for a small local LLM.
 * Everything it must know to write DS-correct code, in ~60 lines.
 */
export const CHEATSHEET = `# DS v1.2 — Cheat Sheet (the law)

## Golden rules
1. ONLY semantic tokens. Never slate-*/gray-*/indigo-*/hex/rgba. Never dark: modifiers.
2. Layout zones: TopBar=bg-surface-elevated border-b border-border-default · Sidebar=bg-surface-elevated border-r border-border-default · Main=bg-surface-sunken (light gray canvas) + [scrollbar-gutter:stable] (no sideways shift when scrollbar toggles) · Cards=bg-surface-elevated border-border-default rounded-card shadow-card
3. One primary Button per page (variant="primary"); the secondary action uses variant="secondary" (brand-tinted: brand-50 bg, primary-color text+border). Use "ghost" for tertiary; "outline" only for destructive-styled buttons.
3b. Page header: ALWAYS use <PageHeader title description actions /> from @/components/layout/page-header (never hand-roll). NO icon on title, NO breadcrumb (the component forbids both). title=string; subtitle/count/badges→description; controls→actions, all same height → Button size="md" (h-9) to match h-9 inputs.
3c. Stat/KPI cards: NO icons. One bordered strip split into equal columns with divide-x divide-border-subtle (not separate gapped cards). Each cell: label with dotted underline (border-b border-dotted border-border-hover, inline-block) then value text-3xl font-bold.
4. Tables ALWAYS inside <Card><CardContent className="p-0">.
5. Status via <Badge variant="success|warning|destructive|info|outline"> — never custom colors.
5b. Searchable/long dropdowns → <Combobox>/<MultiCombobox> (Popover+Command), never a hand-rolled DropdownMenu+input. Short static lists → <Select>. Many filters → Filtres button → <Sheet> with comboboxes + applied-filter pills; single date = one <input type="date">.
5c. Sheet z-index: overlay=z-overlay, content=z-modal (both above z-sticky chrome); Popover/Combobox inside a sheet use z-popover (above it). SheetFooter = justify-between: cancel LEFT, clear+apply RIGHT, buttons hug (no flex-1).
6. Spacing tokens: gap-stack-{xs..2xl} vertical, gap-inline-{xs..lg} horizontal, space-y-stack-xl between page sections.
7. Lucide icons only, w-4 h-4 in buttons.
8. Import from @/components/ui/*; merge classes with cn() from @/lib/utils.

## Color tokens (forbidden → correct)
text-slate-900/800 → text-text-primary      text-slate-700 → text-text-strong
text-slate-600 → text-text-secondary        text-slate-500 → text-text-subtle
text-slate-400 → text-text-muted            text-slate-300 → text-text-disabled
bg-white → bg-surface-elevated              bg-slate-50 → bg-surface-sunken
bg-slate-100 → bg-bg-secondary              bg-slate-900 → bg-bg-inverse
hover:bg-slate-100 → hover:bg-action-ghost-hover
border-slate-100 → border-border-subtle     border-slate-200 → border-border-default
green-* → status-success-{fg|bg|border}     red-* → status-error-{fg|bg|border}
yellow-* → status-warning-*                 blue-* → status-info-*
orange-* → text-status-attention-fg         #004030 → bg-action-primary

## Text hierarchy
H1 page title:  text-3xl font-bold text-text-primary
H2 section:     text-xl font-semibold text-text-primary
Card title:     text-base font-semibold text-text-primary
Label:          text-sm font-medium text-text-secondary
Body:           text-sm text-text-primary
Caption:        text-xs text-text-muted
Metric value:   text-2xl font-bold text-text-primary
Trend up/down:  text-xs font-medium text-status-{success|error}-fg

## Canonical grids
KPI row:    grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-stack-lg
Charts row: grid grid-cols-1 lg:grid-cols-2 gap-stack-xl
Page wrap:  p-8 > max-w-screen-xl mx-auto space-y-stack-xl

## Radius / shadow / motion
rounded-control(btn,input) rounded-card rounded-overlay(dialog) rounded-pill(badge,avatar)
shadow-card shadow-popover shadow-overlay · duration-fast(hover) duration-normal(open/close)

## Modes (set on root, never per-element)
data-appearance="light|dark" · data-brand="default|brand" · data-density="default|compact"

## Workflow for any page request
1) build_page(intent) → full TSX  2) customize names/data  3) validate_code(code) → fix  4) save`;
