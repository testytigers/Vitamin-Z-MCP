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
  <p className="text-sm font-medium text-text-secondary mb-2">Total Revenue</p>
  <div className="flex items-end justify-between">
    <span className="text-2xl font-bold text-text-primary">$12,450</span>
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
- Background: `bg-surface-elevated` (auto)
- Border: `border-border-default` (auto)
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
- Background: `bg-surface-canvas`
- Border default: `border-border-default`
- Border focus: `border-border-focus` + `shadow-focus`
- Border error: `border-border-error`

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
<div className="flex items-center justify-between border-b border-border-default pb-0">
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

**Active state:** The active tab has `text-text-primary`, `font-semibold`, and a bottom border color of `bg-action-primary` (auto via `data-[state=active]`).

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
            <TableCell className="font-medium text-text-primary">{item.name}</TableCell>
            <TableCell>
              <Badge variant={item.status === "active" ? "success" : "warning"}>
                {item.status}
              </Badge>
            </TableCell>
            <TableCell className="text-text-secondary">{item.createdAt}</TableCell>
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
- Header bg: `bg-bg-secondary`
- Row border: `border-border-default`
- Row hover: `hover:bg-bg-secondary`
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
  <AvatarFallback className="bg-action-primary text-text-on-accent">MO</AvatarFallback>
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
    <p className="text-sm text-text-secondary">Storage used</p>
    <span className="text-sm font-medium text-text-primary">72%</span>
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
import { AppShell, PageContent, PageHeader } from "@/components/layout/app-shell";
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
  actions={<Button variant="ghost" size="sm" className="text-text-on-inverse/80 hover:text-text-on-inverse hover:bg-white/10">Invite</Button>}
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
