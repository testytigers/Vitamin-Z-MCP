# Design System v1.2 — Component Reference

> **Source:** `ds-v2/src/components/ui/`
> **For agents:** Import from `@/components/ui/<name>`. All components consume DS tokens automatically — do not override with arbitrary Tailwind colors.

---

## Button

**File:** `button.tsx`
**Variants:** `primary` | `secondary` | `destructive` | `outline` | `ghost` | `link`
**Sizes:** `sm` | `md` (default) | `lg` | `icon`

```tsx
import { Button } from "@/components/ui/button";

// Primary — main CTA
<Button variant="primary" size="md">Save Changes</Button>

// Primary with icon (always use Lucide icons)
<Button variant="primary" size="md">
  <Plus className="w-4 h-4" /> New Project
</Button>

// Secondary — paired with primary
<Button variant="secondary">Cancel</Button>

// Outline — filter bar actions, less emphasis
<Button variant="outline" size="sm">
  <Calendar className="w-4 h-4" /> Date Range
</Button>

// Ghost — nav items, icon actions in toolbars
<Button variant="ghost" size="icon">
  <Settings className="w-5 h-5" />
</Button>

// Destructive — delete/remove flows
<Button variant="destructive">Delete Account</Button>

// Link — inline text actions
<Button variant="link">Learn more</Button>

// Disabled state (works on all variants)
<Button variant="primary" disabled>Processing…</Button>

// asChild — render as another element (e.g., Link)
<Button asChild variant="primary">
  <a href="/dashboard">Go to Dashboard</a>
</Button>
```

**Rules:**
- Use `primary` for the single most important action per view
- Use `outline` or `secondary` for secondary actions
- Icon buttons must use `size="icon"` — they become square
- Never mix `variant="primary"` with Tailwind color overrides like `bg-blue-600`

---

## Card

**File:** `card.tsx`
**Sub-components:** `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

// Standard card
<Card>
  <CardHeader>
    <CardTitle>Users</CardTitle>
    <CardDescription>Manage your team members and their permissions.</CardDescription>
  </CardHeader>
  <CardContent>
    {/* table, list, chart, etc. */}
  </CardContent>
  <CardFooter>
    <Button variant="outline" size="sm">View all</Button>
  </CardFooter>
</Card>

// Stat / metric card (no sub-components needed)
<Card className="p-5">
  <p className="text-sm font-medium text-secondary mb-2">Total Revenue</p>
  <div className="flex items-end justify-between">
    <span className="text-2xl font-bold text-primary">$12,450</span>
    <span className="text-xs font-medium text-status-success-fg">+14.5%</span>
  </div>
</Card>

// Card with header action
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle>Recent Activity</CardTitle>
      <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
    </div>
  </CardHeader>
  <CardContent>...</CardContent>
</Card>
```

**Token mapping:**
- Background: `bg-elevated` (auto)
- Border: `border-default` (auto)
- Shadow: `shadow-card` (auto)
- Radius: `rounded-card` (auto)

**Rules:**
- Always wrap chart/data panels in `<Card>`
- `CardHeader` and `CardContent` have built-in container padding (`--spacing-container-px` = 24px)
- `CardFooter` automatically has a top divider

---

## Badge

**File:** `badge.tsx`
**Variants:** `default` | `secondary` | `outline` | `destructive` | `success` | `warning` | `info`

```tsx
import { Badge } from "@/components/ui/badge";

<Badge variant="default">Active</Badge>
<Badge variant="success">Completed</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="destructive">Failed</Badge>
<Badge variant="info">In Review</Badge>
<Badge variant="outline">Draft</Badge>

// With count in sidebar nav
<Badge variant="default" className="ml-auto">3</Badge>

// Status in a table cell
<TableCell>
  <Badge variant="success">Live</Badge>
</TableCell>
```

**Rules:**
- Use status variants (`success`, `warning`, `destructive`, `info`) for state indicators
- Use `outline` for categories/labels without semantic meaning
- Never use hardcoded `bg-green-100 text-green-700` — use `variant="success"`

---

## Input

**File:** `input.tsx`
**Props:** `size?: "sm" | "md" | "lg"` (default `md`), `error?: boolean`

```tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Standard field
<div className="flex flex-col gap-stack-sm">
  <Label htmlFor="email">Email address</Label>
  <Input id="email" type="email" placeholder="you@example.com" />
</div>

// With icon (use wrapper div + absolute positioning)
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-icon-muted" />
  <Input className="pl-9" placeholder="Search…" />
</div>

// Error state
<Input error placeholder="Enter value" />
<p className="text-xs text-status-error-fg mt-1">This field is required.</p>

// Disabled
<Input disabled placeholder="Disabled" />

// Sizes
<Input size="sm" placeholder="Small" />
<Input size="md" placeholder="Medium (default)" />
<Input size="lg" placeholder="Large" />
```

**Token mapping (auto-applied):**
- Background: `bg-canvas`
- Border default: `border-default`
- Border focus: `border-focus` + `shadow-focus`
- Border error: `border-error`

---

## Select

**File:** `select.tsx`
**Sub-components:** `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectGroup`, `SelectLabel`, `SelectItem`, `SelectSeparator`

```tsx
import {
  Select, SelectTrigger, SelectValue, SelectContent,
  SelectItem, SelectLabel, SelectGroup, SelectSeparator
} from "@/components/ui/select";

<Select defaultValue="month">
  <SelectTrigger className="w-40">
    <SelectValue placeholder="Select period" />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Time Period</SelectLabel>
      <SelectItem value="week">Last 7 days</SelectItem>
      <SelectItem value="month">Last 30 days</SelectItem>
      <SelectItem value="quarter">Last 90 days</SelectItem>
      <SelectSeparator />
      <SelectItem value="custom">Custom range</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>
```

---

## Tabs

**File:** `tabs.tsx`
**Sub-components:** `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Standard underline tabs (matches dashboard template)
<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="analytics">Analytics</TabsTrigger>
    <TabsTrigger value="reports">Reports</TabsTrigger>
  </TabsList>

  <TabsContent value="overview">
    {/* Overview content */}
  </TabsContent>
  <TabsContent value="analytics">
    {/* Analytics content */}
  </TabsContent>
  <TabsContent value="reports">
    {/* Reports content */}
  </TabsContent>
</Tabs>

// Tabs with filter bar (right-aligned actions alongside tabs)
<div className="flex items-center justify-between border-b border-default pb-0">
  <Tabs defaultValue="all">
    <TabsList className="border-b-0">
      <TabsTrigger value="all">All Items</TabsTrigger>
      <TabsTrigger value="active">Active</TabsTrigger>
      <TabsTrigger value="archived">Archived</TabsTrigger>
    </TabsList>
  </Tabs>
  <div className="flex items-center gap-inline-sm pb-4">
    <Button variant="outline" size="sm"><Filter className="w-4 h-4" /> Filter</Button>
    <Select>...</Select>
  </div>
</div>
```

**Active state:** The active tab has `text-primary`, `font-semibold`, and a bottom border color of `bg-action-primary` (auto via `data-[state=active]`).

---

## Table

**File:** `table.tsx`
**Sub-components:** `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`

```tsx
import {
  Table, TableHeader, TableBody, TableRow,
  TableHead, TableCell, TableCaption
} from "@/components/ui/table";

<Card>
  <CardContent className="p-0">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium text-primary">{item.name}</TableCell>
            <TableCell>
              <Badge variant={item.status === "active" ? "success" : "warning"}>
                {item.status}
              </Badge>
            </TableCell>
            <TableCell className="text-secondary">{item.createdAt}</TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </CardContent>
</Card>
```

**Token mapping (auto):**
- Header bg: `bg-secondary`
- Row border: `border-default`
- Row hover: `hover:bg-secondary`
- Selected row: `bg-action-primary-subtle`

---

## Dialog

**File:** `dialog.tsx`
**Sub-components:** `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`

```tsx
import {
  Dialog, DialogTrigger, DialogContent,
  DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";

<Dialog>
  <DialogTrigger asChild>
    <Button variant="primary"><Plus className="w-4 h-4" /> Add Member</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Add Team Member</DialogTitle>
      <DialogDescription>
        Invite a new member to your workspace. They'll receive an email invitation.
      </DialogDescription>
    </DialogHeader>

    <div className="flex flex-col gap-stack-md py-stack-md">
      <div className="flex flex-col gap-stack-sm">
        <Label htmlFor="invite-email">Email address</Label>
        <Input id="invite-email" type="email" placeholder="colleague@example.com" />
      </div>
      <div className="flex flex-col gap-stack-sm">
        <Label htmlFor="role">Role</Label>
        <Select>
          <SelectTrigger id="role"><SelectValue placeholder="Select role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button variant="primary">Send Invite</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Layer stack:** Overlay at z-300 (backdrop), modal at z-400 (content).

---

## Dropdown Menu

**File:** `dropdown-menu.tsx`

```tsx
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuShortcut
} from "@/components/ui/dropdown-menu";

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-48">
    <DropdownMenuLabel>Actions</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>
      <Edit className="w-4 h-4 mr-2" /> Edit
    </DropdownMenuItem>
    <DropdownMenuItem>
      <Copy className="w-4 h-4 mr-2" /> Duplicate
      <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-status-error-fg">
      <Trash2 className="w-4 h-4 mr-2" /> Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## Popover

**File:** `popover.tsx`
**Sub-components:** `Popover`, `PopoverTrigger`, `PopoverContent`, `PopoverAnchor`

Floating panel anchored to a trigger. Base for `Combobox`. Content is DS-tokenized: `rounded-overlay border-default bg-popover shadow-popover`. Never restyle the panel chrome with raw colors.

```tsx
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Open</Button>
  </PopoverTrigger>
  <PopoverContent align="start" className="w-64">
    <p className="text-sm text-primary">Panel content</p>
  </PopoverContent>
</Popover>
```

**Rules:**
- Add `overflow-hidden` when children (search input, list) must clip to the rounded corners — otherwise square child corners poke past the border and look broken.
- Default width is `w-72`; override via `className`. Use `w-[var(--radix-popover-trigger-width)]` to match the trigger width (combobox pattern).

---

## Command

**File:** `command.tsx` (built on `cmdk`)
**Sub-components:** `Command`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`, `CommandSeparator`

Searchable command/list primitive. Mostly used inside `Popover` to build a `Combobox`. The input separator is `border-b border-subtle`; selected item state is `data-[selected=true]:bg-action-ghost-hover`. Items carry `outline-none` — never add a raw focus ring.

```tsx
import {
  Command, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem,
} from "@/components/ui/command";

<Command>
  <CommandInput placeholder="Search..." />
  <CommandList>
    <CommandEmpty>No results.</CommandEmpty>
    <CommandGroup>
      <CommandItem value="alger" onSelect={() => {}}>Alger</CommandItem>
      <CommandItem value="oran" onSelect={() => {}}>Oran</CommandItem>
    </CommandGroup>
  </CommandList>
</Command>
```

**Rules:** padding lives on `CommandGroup` (`p-1`), NOT on `CommandList` — don't double up or rows get inset twice.

---

## Combobox

**File:** `combobox.tsx`
**Exports:** `Combobox` (single-select), `MultiCombobox` (multi-select), type `ComboboxOption`

Searchable select built from `Popover` + `Command`. **This is the DS-correct way to do a searchable/typeahead dropdown** — do NOT hand-roll a `DropdownMenu` + `<input>`. Use plain `Select` when the option list is short and needs no search; use `Combobox` when it's long or searchable.

`ComboboxOption` = `{ value: string; label: string; sublabel?: string }`. `sublabel` renders a muted second line (e.g. shop owner under shop name) and is included in the search match.

```tsx
import { Combobox, MultiCombobox } from "@/components/ui/combobox";

// Single-select
<Combobox
  options={[{ value: "hub-alger", label: "Hub Alger" }, { value: "hub-oran", label: "Hub Oran" }]}
  value={hub}
  onChange={setHub}
  placeholder="Select a hub"
  searchPlaceholder="Search hub..."
/>

// Single-select with sub-labels (e.g. shop + owner)
<Combobox
  options={shops.map((s) => ({ value: s.id, label: s.name, sublabel: s.owner }))}
  value={shop}
  onChange={setShop}
  placeholder="All shops"
  searchPlaceholder="Shop or owner..."
/>

// Multi-select (checkbox rows, count in trigger, inline clear ✕)
<MultiCombobox
  options={cities.map((c) => ({ value: c, label: c }))}
  value={selectedCities}
  onChange={setSelectedCities}
  placeholder="All cities"
  searchPlaceholder="Search a city..."
/>
```

**Props:** `options`, `value`, `onChange`, `placeholder`, `searchPlaceholder`, `emptyText`, `className`, `contentClassName`. `Combobox` also takes `clearValue` (sentinel for "nothing selected", default `""`) — re-selecting the active option clears it.

**Rules:**
- Trigger matches `Select`'s chrome: `h-9 border-default bg-elevated rounded-control shadow-control focus:border-focus focus:shadow-focus`. Don't restyle borders with raw colors.
- Works inside a `Sheet` (the filter pattern) — the popover layers above the sheet correctly.
- For a multiselect filter, surface chosen values as removable pills outside the combobox (see DASHBOARD_PATTERNS → Filter Sheet).

---

## Sheet

**File:** `sheet.tsx`
**Sub-components:** `Sheet`, `SheetTrigger`, `SheetClose`, `SheetContent`, `SheetHeader`, `SheetFooter`, `SheetTitle`

Right-anchored slide-over panel (Radix Dialog). Used for filters, detail panels, quick edits.

```tsx
import {
  Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from "@/components/ui/sheet";

<Sheet open={open} onOpenChange={setOpen}>
  <SheetContent className="w-[420px] sm:w-[480px] flex flex-col p-0">
    <SheetHeader className="px-6 py-5 border-b border-subtle">
      <SheetTitle>Filtres</SheetTitle>
    </SheetHeader>
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">{/* fields */}</div>
    <SheetFooter>
      <Button variant="outline">Annuler</Button>
      <div className="flex items-center gap-2">
        <Button variant="outline">Réinitialiser</Button>
        <Button>Appliquer</Button>
      </div>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

**Layer stack (DS z-index tokens):** overlay = `z-overlay` (300), content = `z-modal` (400). Both sit ABOVE the sticky header/sidebar (`z-sticky`, 200) — the sheet is the superior layer when open. `Popover`/`Combobox` opened *inside* a sheet use `z-popover` (500), so they correctly layer above the sheet content. Never lower a sheet below `z-overlay`.

**Footer convention (`SheetFooter` defaults to `justify-between`):** secondary/cancel on the LEFT, primary actions grouped on the RIGHT. Buttons **hug their content** — do NOT use `flex-1`/full-width buttons.

```tsx
<SheetFooter>
  <Button variant="outline" onClick={cancel}>Annuler</Button>
  <div className="flex items-center gap-2">
    <Button variant="outline" onClick={reset}>Réinitialiser</Button>
    <Button onClick={apply}>Appliquer</Button>
  </div>
</SheetFooter>
```

---

## Avatar

**File:** `avatar.tsx`
**Sub-components:** `Avatar`, `AvatarImage`, `AvatarFallback`

```tsx
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// With image
<Avatar>
  <AvatarImage src="/avatars/user.jpg" alt="Jane D." />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>

// Initials only
<Avatar>
  <AvatarFallback className="bg-action-primary text-on-accent">MO</AvatarFallback>
</Avatar>

// Small size
<Avatar className="w-7 h-7 text-xs">
  <AvatarFallback>MO</AvatarFallback>
</Avatar>
```

---

## Alert

**File:** `alert.tsx`
**Variants:** `default` | `destructive`

```tsx
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Info, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

// Info alert
<Alert>
  <Info className="h-4 w-4" />
  <AlertTitle>Heads up</AlertTitle>
  <AlertDescription>Your trial ends in 3 days.</AlertDescription>
</Alert>

// Destructive
<Alert variant="destructive">
  <XCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>Failed to save changes. Please try again.</AlertDescription>
</Alert>

// Custom status variants (apply DS status tokens directly)
<Alert className="border-status-success-border bg-status-success-bg text-status-success-fg">
  <CheckCircle2 className="h-4 w-4" />
  <AlertTitle>Success</AlertTitle>
  <AlertDescription className="text-status-success-fg">Changes saved successfully.</AlertDescription>
</Alert>
```

---

## Skeleton

**File:** `skeleton.tsx`

```tsx
import { Skeleton } from "@/components/ui/skeleton";

// Loading state for a stat card
<Card className="p-5">
  <Skeleton className="h-4 w-24 mb-3" />
  <Skeleton className="h-8 w-32" />
</Card>

// Loading table rows
{Array.from({length: 5}).map((_, i) => (
  <TableRow key={i}>
    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
    <TableCell><Skeleton className="h-5 w-16 rounded-pill" /></TableCell>
    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
  </TableRow>
))}
```

---

## Separator

**File:** `separator.tsx`

```tsx
import { Separator } from "@/components/ui/separator";

// Horizontal (default)
<Separator />

// Vertical (in flex rows)
<div className="flex items-center gap-inline-md">
  <span>Item 1</span>
  <Separator orientation="vertical" className="h-4" />
  <span>Item 2</span>
</div>
```

---

## Tooltip

**File:** `tooltip.tsx`
**Sub-components:** `TooltipProvider`, `Tooltip`, `TooltipTrigger`, `TooltipContent`

```tsx
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

// Wrap app root with TooltipProvider once
<TooltipProvider>
  {/* ... */}
</TooltipProvider>

// Usage on icon buttons
<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="ghost" size="icon" aria-label="Settings">
      <Settings className="w-5 h-5" />
    </Button>
  </TooltipTrigger>
  <TooltipContent>Settings</TooltipContent>
</Tooltip>
```

---

## Breadcrumb

**File:** `breadcrumb.tsx`

```tsx
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem,
  BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage
} from "@/components/ui/breadcrumb";

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/projects">Projects</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Alpha Project</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

---

## Checkbox

**File:** `checkbox.tsx`

```tsx
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

<div className="flex items-center gap-inline-sm">
  <Checkbox id="terms" />
  <Label htmlFor="terms">Accept terms and conditions</Label>
</div>

// Select-all in table header
<TableHead>
  <Checkbox
    checked={allSelected}
    onCheckedChange={handleSelectAll}
    aria-label="Select all"
  />
</TableHead>
```

---

## Switch

**File:** `switch.tsx`

```tsx
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

<div className="flex items-center gap-inline-sm">
  <Switch id="notifications" />
  <Label htmlFor="notifications">Email notifications</Label>
</div>
```

---

## Progress

**File:** `progress.tsx`

```tsx
import { Progress } from "@/components/ui/progress";

<Progress value={72} className="h-2" />

// In a stat card
<Card className="p-5">
  <div className="flex items-center justify-between mb-2">
    <p className="text-sm text-secondary">Storage used</p>
    <span className="text-sm font-medium text-primary">72%</span>
  </div>
  <Progress value={72} className="h-1.5" />
</Card>
```

---

## Accordion

**File:** `accordion.tsx`

```tsx
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

<Accordion type="single" collapsible>
  <AccordionItem value="faq-1">
    <AccordionTrigger>How do I invite team members?</AccordionTrigger>
    <AccordionContent>
      Navigate to Settings → Team and click "Invite Member".
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="faq-2">
    <AccordionTrigger>What payment methods are accepted?</AccordionTrigger>
    <AccordionContent>
      We accept all major credit cards and bank transfers.
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

---

## Form (react-hook-form integration)

**File:** `form.tsx`

```tsx
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const form = useForm({ defaultValues: { name: "" } });

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-stack-md">
    <FormField
      control={form.control}
      name="name"
      rules={{ required: "Name is required" }}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Name</FormLabel>
          <FormControl>
            <Input placeholder="Enter name" {...field} />
          </FormControl>
          <FormMessage /> {/* auto-renders error in text-status-error-fg */}
        </FormItem>
      )}
    />
    <Button type="submit" variant="primary">Save</Button>
  </form>
</Form>
```

---

## Toast

**File:** `toast.tsx` + `use-toast.ts`
**Variants:** `default` | `destructive`

Transient feedback. Mount `<Toaster />` once in the app shell, then call `toast()`
from anywhere. Prefer this over `<Alert>` for anything that should disappear.

```tsx
import { useToast } from "@/components/ui/use-toast";

const { toast } = useToast();

// success
toast({ title: "Colis créé", description: "Référence CX-1042 enregistrée." });

// error — use the destructive variant, not a custom colour
toast({
  variant: "destructive",
  title: "Échec de l'enregistrement",
  description: "Vérifiez la connexion et réessayez.",
});

// with an action
toast({
  title: "Colis supprimé",
  action: <ToastAction altText="Annuler">Annuler</ToastAction>,
});
```

**Exports:** `ToastProvider` · `ToastViewport` · `Toast` · `ToastAction` · `ToastClose` · `ToastTitle` · `ToastDescription` · `toastVariants`, plus `useToast` / `toast` from `use-toast.ts`.

> `ToastAction` requires `altText` for screen readers.

---

## Drawer

**File:** `drawer.tsx`

Bottom sheet, primarily for mobile. On desktop prefer `<Dialog>` (centred) or
`<Sheet>` (side panel).

```tsx
<Drawer>
  <DrawerTrigger asChild>
    <Button variant="outline">Filtres</Button>
  </DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Filtrer les colis</DrawerTitle>
      <DrawerDescription>Affinez la liste par statut et hub.</DrawerDescription>
    </DrawerHeader>
    {/* body */}
    <DrawerFooter>
      <Button variant="primary">Appliquer</Button>
      <DrawerClose asChild><Button variant="ghost">Annuler</Button></DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>
```

**Exports:** `Drawer` · `DrawerTrigger` · `DrawerPortal` · `DrawerOverlay` · `DrawerClose` · `DrawerContent` · `DrawerHeader` · `DrawerFooter` · `DrawerTitle` · `DrawerDescription`

---

## Context Menu

**File:** `context-menu.tsx`

Right-click menu. For a click-triggered menu use `<DropdownMenu>` instead — same
item vocabulary, different trigger.

```tsx
<ContextMenu>
  <ContextMenuTrigger asChild>
    <TableRow>{/* … */}</TableRow>
  </ContextMenuTrigger>
  <ContextMenuContent className="w-48">
    <ContextMenuItem><Edit className="w-4 h-4 mr-2" /> Modifier</ContextMenuItem>
    <ContextMenuItem>
      <Copy className="w-4 h-4 mr-2" /> Dupliquer
      <ContextMenuShortcut>⌘D</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuSub>
      <ContextMenuSubTrigger>Déplacer vers</ContextMenuSubTrigger>
      <ContextMenuSubContent>
        <ContextMenuItem>Hub Alger</ContextMenuItem>
        <ContextMenuItem>Hub Oran</ContextMenuItem>
      </ContextMenuSubContent>
    </ContextMenuSub>
    <ContextMenuSeparator />
    <ContextMenuItem className="text-status-error-fg">
      <Trash2 className="w-4 h-4 mr-2" /> Supprimer
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

**Exports:** `ContextMenu` · `ContextMenuTrigger` · `ContextMenuContent` · `ContextMenuItem` · `ContextMenuCheckboxItem` · `ContextMenuRadioItem` · `ContextMenuRadioGroup` · `ContextMenuLabel` · `ContextMenuSeparator` · `ContextMenuShortcut` · `ContextMenuGroup` · `ContextMenuPortal` · `ContextMenuSub` · `ContextMenuSubContent` · `ContextMenuSubTrigger`

---

## Hover Card

**File:** `hover-card.tsx`

Rich preview on hover — user cards, entity summaries. For short text use
`<Tooltip>`; hover cards can contain layout.

```tsx
<HoverCard>
  <HoverCardTrigger asChild>
    <Button variant="ghost" className="p-0 h-auto font-medium">CX-1042</Button>
  </HoverCardTrigger>
  <HoverCardContent className="w-72">
    <p className="text-sm font-semibold text-primary">Colis CX-1042</p>
    <p className="text-xs text-subtle mt-1">Alger → Oran · 2.4 kg</p>
    <Badge variant="success" className="mt-2">Livré</Badge>
  </HoverCardContent>
</HoverCard>
```

**Exports:** `HoverCard` · `HoverCardTrigger` · `HoverCardContent`

> Hover-only content is invisible to touch and keyboard users. Never put an action
> or information that exists nowhere else inside a hover card.

---

## Input OTP

**File:** `input-otp.tsx`

Segmented one-time-code entry — SMS confirmation, 2FA.

```tsx
<InputOTP maxLength={6}>
  <InputOTPGroup>
    <InputOTPSlot index={0} />
    <InputOTPSlot index={1} />
    <InputOTPSlot index={2} />
  </InputOTPGroup>
  <InputOTPSeparator />
  <InputOTPGroup>
    <InputOTPSlot index={3} />
    <InputOTPSlot index={4} />
    <InputOTPSlot index={5} />
  </InputOTPGroup>
</InputOTP>
```

**Exports:** `InputOTP` · `InputOTPGroup` · `InputOTPSlot` · `InputOTPSeparator`

---

## Carousel

**File:** `carousel.tsx`

Horizontal slider. In dashboards, use sparingly — a scrollable row or a table is
usually clearer than hiding content behind arrows.

```tsx
<Carousel className="w-full">
  <CarouselContent>
    {items.map((item) => (
      <CarouselItem key={item.id} className="md:basis-1/2 lg:basis-1/3">
        <Card className="p-5">{item.name}</Card>
      </CarouselItem>
    ))}
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>
```

**Exports:** `Carousel` · `CarouselContent` · `CarouselItem` · `CarouselPrevious` · `CarouselNext` · `useCarousel`

---

## Menubar

**File:** `menubar.tsx`

Desktop-application menu bar (File / Edit / View). Not for site navigation — use
`<NavigationMenu>` or the DS `Sidebar` for that.

```tsx
<Menubar>
  <MenubarMenu>
    <MenubarTrigger>Fichier</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Nouveau colis <MenubarShortcut>⌘N</MenubarShortcut></MenubarItem>
      <MenubarSeparator />
      <MenubarItem>Exporter CSV</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>
```

**Exports:** `Menubar` · `MenubarMenu` · `MenubarTrigger` · `MenubarContent` · `MenubarItem` · `MenubarCheckboxItem` · `MenubarRadioItem` · `MenubarRadioGroup` · `MenubarLabel` · `MenubarSeparator` · `MenubarShortcut` · `MenubarGroup` · `MenubarPortal` · `MenubarSub` · `MenubarSubTrigger` · `MenubarSubContent`

---

## Navigation Menu

**File:** `navigation-menu.tsx`

Horizontal nav with dropdown panels — marketing headers and multi-section apps.
The DS dashboard shell uses the vertical `Sidebar` instead; reach for this only
when navigation must live in the top bar.

```tsx
<NavigationMenu>
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuTrigger>Opérations</NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="grid w-[400px] gap-stack-sm p-4">
          <li>
            <NavigationMenuLink href="/colis">Tous les colis</NavigationMenuLink>
          </li>
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
    <NavigationMenuItem>
      <NavigationMenuLink href="/rapports" className={navigationMenuTriggerStyle()}>
        Rapports
      </NavigationMenuLink>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>
```

**Exports:** `NavigationMenu` · `NavigationMenuList` · `NavigationMenuItem` · `NavigationMenuTrigger` · `NavigationMenuContent` · `NavigationMenuLink` · `NavigationMenuViewport` · `NavigationMenuIndicator` · `navigationMenuTriggerStyle`

---

## Resizable

**File:** `resizable.tsx`

Draggable split panes — list/detail layouts, side-by-side comparison.

```tsx
<ResizablePanelGroup direction="horizontal" className="min-h-[500px] rounded-card border border-default">
  <ResizablePanel defaultSize={40} minSize={25}>
    {/* list */}
  </ResizablePanel>
  <ResizableHandle withHandle />
  <ResizablePanel defaultSize={60}>
    {/* detail */}
  </ResizablePanel>
</ResizablePanelGroup>
```

**Exports:** `ResizablePanelGroup` · `ResizablePanel` · `ResizableHandle`

> `ResizableHandle` is keyboard-operable via arrow keys once focused. Pass
> `withHandle` to render the visible grip.

---

## Complete Component Import List

```tsx
// All available imports
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectSeparator } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption } from "@/components/ui/table";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator } from "@/components/ui/command";
import { Combobox, MultiCombobox } from "@/components/ui/combobox"; // searchable single/multi select (Popover + Command)
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "@/components/ui/pagination";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Calendar } from "@/components/ui/calendar";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// ── Layout components (Next.js) ──
import { PageHeader } from "@/components/layout/page-header"; // title + description + actions; no icon, no breadcrumb
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
```

---

## Layout Components (Next.js)

> Located in `ds-v2/src/components/layout/`. These are **dashboard-level** shells, not primitive UI components. They compose the shadcn/ui primitives above and are fully token-correct.

### Header (`"use client"`)

**File:** `layout/header.tsx`

```tsx
import { Header } from "@/components/layout/header";

<Header
  appName="MyApp"
  workspace={{ name: "Acme Corp", items: [
    { id: "1", name: "Acme Corp",  href: "/ws/acme" },
    { id: "2", name: "Side Project", href: "/ws/side" },
  ]}}
  user={{ name: "Musama O.", initials: "MO", email: "m@acme.com", avatarUrl: "/avatar.jpg" }}
  hasNotifications={true}
  onSearch={(q) => router.push(`/search?q=${q}`)}
  onSignOut={() => signOut()}
  onSettings={() => router.push("/settings")}
  onNotifications={() => setNotifOpen(true)}
  // Inject extra actions between search and icon cluster
  actions={<Button variant="ghost" size="sm" className="text-on-inverse/80 hover:text-on-inverse hover:bg-white/10">Invite</Button>}
/>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `appName` | `string` | Product name next to logo |
| `logo` | `ReactNode` | Custom logo — replaces the default letter square |
| `workspace` | `{ name, items? }` | Workspace name + optional switcher items |
| `user` | `{ name, initials, email?, avatarUrl? }` | User shown in avatar menu |
| `onSearch` | `(q: string) => void` | Called on every keystroke in global search |
| `onSignOut` | `() => void` | Sign out menu item handler |
| `onSettings` | `() => void` | Settings icon click handler |
| `onNotifications` | `() => void` | Bell icon click handler |
| `hasNotifications` | `boolean` | Shows red dot on bell |
| `actions` | `ReactNode` | Slot between search and icon buttons |

---

### Sidebar (`"use client"`)

**File:** `layout/sidebar.tsx`

```tsx
import { Sidebar, type NavSection } from "@/components/layout/sidebar";
import { Home, Layers, Box, PieChart, Settings } from "lucide-react";

const nav: NavSection[] = [
  {
    items: [
      { label: "Overview", href: "/dashboard", icon: Home, exact: true },
    ],
  },
  {
    label: "Workspace",
    items: [
      { label: "Projects",  href: "/projects",  icon: Layers, badge: 3 },
      { label: "Resources", href: "/resources", icon: Box },
    ],
  },
  {
    label: "Manage",
    items: [
      { label: "Reports",       href: "/reports",       icon: PieChart },
      { label: "Configuration", href: "/configuration", icon: Settings },
    ],
  },
];

<Sidebar
  nav={nav}
  upsell={{
    title: "Upgrade to Pro",
    description: "Unlock unlimited projects and advanced analytics.",
    cta: "Upgrade",
    href: "/billing",
  }}
/>
```

**Active state:** Driven by `usePathname()` — no manual `active` prop needed. Prefix matching by default (`/projects` matches `/projects/123`). Pass `exact: true` on items like Home to prevent false matches.

**NavItem props:**
| Prop | Type | Description |
|------|------|-------------|
| `label` | `string` | Nav link text |
| `href` | `string` | Next.js route |
| `icon` | `LucideIcon` | Icon component |
| `badge` | `number` | Count badge on the right |
| `exact` | `boolean` | Exact pathname match only |
| `disabled` | `boolean` | Renders non-interactive |

---

### AppShell (Server Component)

**File:** `layout/app-shell.tsx`
Also exports: `PageContent`, `PageHeader`

```tsx
// app/layout.tsx
import { AppShell } from "@/components/layout/app-shell";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-appearance="light">
      <body>
        <AppShell
          appName="MyApp"
          workspace={{ name: "Acme Corp" }}
          user={{ name: "Musama O.", initials: "MO" }}
          nav={nav}
          upsell={{ title: "Upgrade", description: "...", cta: "Upgrade", href: "/billing" }}
          announcement={{
            message: "Scheduled maintenance Sunday 2–4am UTC.",
            variant: "info",
            cta: { label: "Learn more", href: "/status" },
          }}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}

// app/dashboard/page.tsx
import { PageContent, PageHeader } from "@/components/layout/app-shell";

export default function DashboardPage() {
  return (
    <PageContent>
      <PageHeader
        title="Overview"
        description="Monitor your key metrics."
        actions={<Button variant="primary"><Plus className="w-4 h-4" /> New</Button>}
      />
      {/* ... */}
    </PageContent>
  );
}
```

**Announcement variants:** `"info"` | `"warning"` | `"error"` | `"success"` — maps to DS status tokens automatically.
