# Design System v1.2 — Dashboard Patterns

> These are the canonical composition patterns for building dashboard pages. Agents should treat these as **blueprints** — assemble from these blocks rather than inventing new layouts.

---

## 1. App Shell (Root Layout)

The app shell is the full-screen container. It mirrors the Gemini template's structure: announcement banner → dark top bar → sidebar + main content.

```tsx
// app/layout.tsx or root layout component
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div data-appearance="light" className="flex flex-col h-screen overflow-hidden bg-surface-canvas font-sans">

      {/* ── Announcement Banner (optional) ─────────── */}
      <AnnouncementBanner />

      {/* ── Top Navigation Bar ───────────────────────*/}
      <TopBar />

      {/* ── Body: Sidebar + Main ─────────────────────*/}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-surface-sunken">
          {children}
        </main>
      </div>

    </div>
  );
}
```

**Critical rules:**
- The root `div` carries `data-appearance` (not `<html>` in React) — this drives all token switching
- `h-screen overflow-hidden` on root prevents double scrollbars
- Only `<main>` scrolls — sidebar and topbar are sticky
- Use `bg-surface-sunken` on main (slightly grey background)

---

## 2. Announcement Banner

```tsx
function AnnouncementBanner() {
  return (
    <div className="bg-status-info-bg text-status-info-fg text-sm px-4 py-2 flex items-center justify-center gap-inline-sm border-b border-status-info-border">
      <Info className="w-4 h-4 shrink-0" />
      <span>
        System maintenance scheduled for Sunday 2am–4am UTC.{" "}
        <a href="#" className="underline font-medium hover:opacity-80">Learn more</a>
      </span>
    </div>
  );
}
```

**Variants:** Use `bg-status-warning-bg / text-status-warning-fg` for warnings, `bg-status-error-bg / text-status-error-fg` for incidents.

---

## 3. Top Navigation Bar

```tsx
function TopBar() {
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-bg-inverse text-text-on-inverse border-b border-border-default shrink-0 h-14">

      {/* Left: Logo + Workspace switcher */}
      <div className="flex items-center gap-inline-lg">
        {/* Logo */}
        <div className="flex items-center gap-inline-sm text-base font-bold">
          <div className="w-8 h-8 rounded-control bg-action-primary flex items-center justify-center text-text-on-accent text-xs font-bold">
            A
          </div>
          <span>AppName</span>
        </div>

        {/* Workspace switcher */}
        <button className="flex items-center gap-inline-xs text-sm font-medium text-text-on-inverse/80 hover:text-text-on-inverse hover:bg-white/10 px-3 py-1.5 rounded-control transition-colors duration-fast">
          Workspace Name
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Right: Search + Actions + User */}
      <div className="flex items-center gap-inline-md">
        {/* Global search */}
        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-text-on-inverse/50" />
          <input
            type="text"
            placeholder="Search…"
            className="h-9 w-64 rounded-control border border-white/20 bg-white/10 pl-9 pr-3 text-sm text-text-on-inverse placeholder:text-text-on-inverse/50 focus:outline-none focus:ring-1 focus:ring-white/40 transition-colors duration-fast"
          />
          <kbd className="absolute right-3 hidden lg:inline-flex items-center text-xs text-text-on-inverse/40 font-mono">⌘K</kbd>
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-white/20" />

        {/* Icon actions */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="p-2 rounded-control text-text-on-inverse/70 hover:text-text-on-inverse hover:bg-white/10 transition-colors duration-fast">
              <Settings className="w-5 h-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Settings</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button className="relative p-2 rounded-control text-text-on-inverse/70 hover:text-text-on-inverse hover:bg-white/10 transition-colors duration-fast">
              <Bell className="w-5 h-5" />
              {/* Notification dot */}
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-pill bg-action-destructive" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Notifications</TooltipContent>
        </Tooltip>

        {/* User avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-inline-sm hover:opacity-80 transition-opacity ml-1">
              <Avatar className="w-8 h-8 border border-white/30">
                <AvatarImage src="/avatar.jpg" alt="User" />
                <AvatarFallback className="bg-action-primary text-text-on-accent text-xs">MO</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem><User className="w-4 h-4 mr-2" /> Profile</DropdownMenuItem>
            <DropdownMenuItem><Settings className="w-4 h-4 mr-2" /> Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-status-error-fg"><LogOut className="w-4 h-4 mr-2" /> Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
```

**Key tokens used:**
- `bg-bg-inverse` — dark background (slate-900 light / slate-50 dark)
- `text-text-on-inverse` — white text on dark background
- `hover:bg-white/10` — subtle hover on dark surface (raw CSS opacity ok here)

---

## 4. Sidebar Navigation

```tsx
function Sidebar() {
  return (
    <aside className="w-64 bg-surface-elevated border-r border-border-default flex flex-col overflow-y-auto shrink-0">

      {/* ── Nav items ──────────────────────────────── */}
      <nav className="flex-1 p-4 space-y-stack-xs">

        {/* Active item */}
        <SidebarItem href="/dashboard" icon={Home} label="Overview" active />

        {/* Section header */}
        <p className="pt-6 pb-1 text-xs font-semibold text-text-muted uppercase tracking-wider px-3">
          Section 1
        </p>

        {/* Items with badge */}
        <SidebarItem href="/projects" icon={Layers} label="Projects" />
        <SidebarItem href="/resources" icon={Box} label="Resources" badge={3} />

        <p className="pt-6 pb-1 text-xs font-semibold text-text-muted uppercase tracking-wider px-3">
          Section 2
        </p>

        <SidebarItem href="/reports" icon={PieChart} label="Reports" />
        <SidebarItem href="/settings" icon={Settings} label="Settings" />
      </nav>

      {/* ── Bottom upsell card ─────────────────────── */}
      <div className="p-4 border-t border-border-default">
        <Card className="shadow-none">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-text-primary mb-1">Upgrade to Pro</p>
            <p className="text-xs text-text-secondary mb-3">Unlock unlimited projects and advanced analytics.</p>
            <Button variant="outline" size="sm" className="w-full">Upgrade</Button>
          </CardContent>
        </Card>
      </div>

    </aside>
  );
}

// Reusable sidebar nav item
function SidebarItem({
  href, icon: Icon, label, active, badge
}: {
  href: string; icon: LucideIcon; label: string; active?: boolean; badge?: number;
}) {
  return (
    <a
      href={href}
      className={cn(
        "flex items-center justify-between px-3 py-2 rounded-control text-sm font-medium transition-colors duration-fast",
        active
          ? "bg-action-primary-subtle text-action-primary"
          : "text-text-secondary hover:bg-action-ghost-hover hover:text-text-primary"
      )}
    >
      <div className="flex items-center gap-inline-md">
        <Icon className={cn("w-4 h-4", active ? "text-action-primary" : "text-icon-muted")} />
        {label}
      </div>
      {badge !== undefined && (
        <Badge variant="default" className="ml-auto text-xs">{badge}</Badge>
      )}
    </a>
  );
}
```

**Sidebar width:** `w-64` (256px). For compact mode add `w-56`.

---

## 5. Page Header

Every page's main content area starts with a page header.

```tsx
function PageHeader({
  title,
  description,
  primaryAction,
}: {
  title: string;
  description?: string;
  primaryAction?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-stack-xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-text-primary mb-stack-xs">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-text-secondary">{description}</p>
        )}
      </div>
      {primaryAction && (
        <div className="flex items-center gap-inline-sm">{primaryAction}</div>
      )}
    </div>
  );
}

// Usage
<PageHeader
  title="Overview"
  description="Track your team's performance and key metrics."
  primaryAction={
    <>
      <Button variant="primary"><Plus className="w-4 h-4" /> New Project</Button>
      <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
    </>
  }
/>
```

---

## 6. Page Content Wrapper

The inner content area with consistent padding and max-width.

```tsx
function PageContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-8">
      <div className="max-w-screen-xl mx-auto space-y-stack-xl">
        {children}
      </div>
    </div>
  );
}
```

---

## 7. Stat / KPI Cards Grid

```tsx
const stats = [
  { label: "Total Revenue", value: "$12,450", trend: "+14.5%", up: true },
  { label: "Active Users",  value: "1,234",   trend: "+2.5%",  up: true },
  { label: "Conversion",    value: "85.2%",   trend: "-1.2%",  up: false },
  { label: "Open Tickets",  value: "432",     trend: "0%",     up: null },
];

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-stack-lg">
  {stats.map((s) => (
    <Card key={s.label} className="p-5 hover:shadow-popover transition-shadow duration-normal">
      <p className="text-sm font-medium text-text-secondary mb-2">{s.label}</p>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-text-primary">{s.value}</span>
        <span className={cn(
          "text-xs font-medium",
          s.up === true  && "text-status-success-fg",
          s.up === false && "text-status-error-fg",
          s.up === null  && "text-text-muted"
        )}>
          {s.trend}
        </span>
      </div>
    </Card>
  ))}
</div>
```

**Grid rule:** Always `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` for 4-up KPI rows.

---

## 8. Tabs + Filter Bar

```tsx
<div className="flex items-center justify-between border-b border-border-default">
  <Tabs defaultValue="all">
    <TabsList className="border-b-0 -mb-px">
      <TabsTrigger value="all">All Items</TabsTrigger>
      <TabsTrigger value="active">Active</TabsTrigger>
      <TabsTrigger value="archived">Archived</TabsTrigger>
    </TabsList>
  </Tabs>

  <div className="flex items-center gap-inline-sm pb-4">
    <Button variant="outline" size="sm">
      <Calendar className="w-4 h-4" /> Date Range
      <ChevronDown className="w-4 h-4" />
    </Button>
    <Select defaultValue="all-time">
      <SelectTrigger className="w-36 h-9">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="today">Today</SelectItem>
        <SelectItem value="week">This week</SelectItem>
        <SelectItem value="month">This month</SelectItem>
        <SelectItem value="all-time">All time</SelectItem>
      </SelectContent>
    </Select>
  </div>
</div>
```

---

## 9. Data Table Card

```tsx
function DataTableCard() {
  return (
    <Card>
      {/* Card toolbar */}
      <CardHeader className="flex-row items-center justify-between py-4">
        <CardTitle className="text-base">Recent Projects</CardTitle>
        <div className="flex items-center gap-inline-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-icon-muted" />
            <Input className="pl-9 h-9 w-56" placeholder="Search projects…" />
          </div>
          <Button variant="outline" size="sm">
            <SlidersHorizontal className="w-4 h-4" /> Filter
          </Button>
        </div>
      </CardHeader>

      {/* Table (no CardContent padding — p-0 for flush edges) */}
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox aria-label="Select all" />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((p) => (
              <TableRow key={p.id}>
                <TableCell><Checkbox /></TableCell>
                <TableCell>
                  <div className="font-medium text-text-primary">{p.name}</div>
                  <div className="text-xs text-text-muted">{p.description}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-inline-sm">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">{p.ownerInitials}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-text-secondary">{p.owner}</span>
                  </div>
                </TableCell>
                <TableCell className="text-text-muted text-sm">{p.updatedAt}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem><Edit className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                      <DropdownMenuItem><Copy className="w-4 h-4 mr-2" /> Duplicate</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-status-error-fg">
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {/* Pagination */}
      <CardFooter className="flex items-center justify-between py-4">
        <p className="text-sm text-text-secondary">Showing 1–10 of 48 results</p>
        <Pagination>
          <PaginationContent>
            <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
            <PaginationItem><PaginationLink href="#" isActive>1</PaginationLink></PaginationItem>
            <PaginationItem><PaginationLink href="#">2</PaginationLink></PaginationItem>
            <PaginationItem><PaginationEllipsis /></PaginationItem>
            <PaginationItem><PaginationLink href="#">5</PaginationLink></PaginationItem>
            <PaginationItem><PaginationNext href="#" /></PaginationItem>
          </PaginationContent>
        </Pagination>
      </CardFooter>
    </Card>
  );
}

function statusVariant(status: string) {
  const map: Record<string, string> = {
    active: "success", pending: "warning", failed: "destructive", draft: "outline"
  };
  return (map[status] ?? "default") as any;
}
```

---

## 10. Chart Card (Two-Column Grid)

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-stack-xl">

  {/* Chart A */}
  <Card className="flex flex-col">
    <CardHeader className="flex-row items-center justify-between py-4">
      <CardTitle className="text-base">Revenue Over Time</CardTitle>
      <Select defaultValue="month">
        <SelectTrigger className="w-32 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="week">7 days</SelectItem>
          <SelectItem value="month">30 days</SelectItem>
          <SelectItem value="quarter">90 days</SelectItem>
        </SelectContent>
      </Select>
    </CardHeader>
    <CardContent className="flex-1 min-h-72">
      {/* Insert Recharts / Chart.js here */}
      <ChartPlaceholder />
    </CardContent>
  </Card>

  {/* Chart B */}
  <Card className="flex flex-col">
    <CardHeader className="flex-row items-center justify-between py-4">
      <CardTitle className="text-base">Traffic Sources</CardTitle>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <MoreHorizontal className="w-4 h-4" />
      </Button>
    </CardHeader>
    <CardContent className="flex-1 min-h-72">
      <ChartPlaceholder />
    </CardContent>
  </Card>

</div>
```

---

## 11. Empty State

Use inside any card when there is no data.

```tsx
function EmptyState({
  icon: Icon = Box,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-12 h-12 rounded-overlay bg-bg-secondary flex items-center justify-center mb-stack-lg">
        <Icon className="w-6 h-6 text-icon-muted" />
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-stack-xs">{title}</h3>
      {description && (
        <p className="text-sm text-text-secondary max-w-sm mb-stack-xl">{description}</p>
      )}
      {action}
    </div>
  );
}

// Usage
<Card>
  <CardContent className="p-0">
    <EmptyState
      icon={FolderOpen}
      title="No projects yet"
      description="Create your first project to start tracking your work."
      action={<Button variant="primary"><Plus className="w-4 h-4" /> New Project</Button>}
    />
  </CardContent>
</Card>
```

---

## 12. Loading States

### Skeleton stat cards
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-stack-lg">
  {Array.from({ length: 4 }).map((_, i) => (
    <Card key={i} className="p-5">
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-8 w-32 mb-1" />
      <Skeleton className="h-3 w-16" />
    </Card>
  ))}
</div>
```

### Skeleton table rows
```tsx
<TableBody>
  {Array.from({ length: 5 }).map((_, i) => (
    <TableRow key={i}>
      <TableCell><Skeleton className="h-4 w-4 rounded-sm" /></TableCell>
      <TableCell>
        <Skeleton className="h-4 w-40 mb-1" />
        <Skeleton className="h-3 w-24" />
      </TableCell>
      <TableCell><Skeleton className="h-5 w-16 rounded-pill" /></TableCell>
      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
    </TableRow>
  ))}
</TableBody>
```

---

## 13. Full Page Template

The complete wired-together dashboard page:

```tsx
export default function DashboardPage() {
  return (
    <PageContent>
      <PageHeader
        title="Overview"
        description="Monitor key metrics and recent activity."
        primaryAction={
          <Button variant="primary"><Plus className="w-4 h-4" /> New Project</Button>
        }
      />

      {/* Tabs + filter */}
      <div className="flex items-center justify-between border-b border-border-default">
        <Tabs defaultValue="overview">
          <TabsList className="border-b-0 -mb-px">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-inline-sm pb-4">
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4" /> Last 30 days
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-stack-lg">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-stack-xl">
        <ChartCard title="Revenue Over Time" />
        <ChartCard title="Traffic Sources" />
      </div>

      {/* Data table */}
      <DataTableCard />
    </PageContent>
  );
}
```

---

## Spacing Quick Reference

| Gap between…                     | Token          |
|----------------------------------|----------------|
| Label → Input                    | `gap-stack-sm` |
| Form fields                      | `gap-stack-md` |
| Card sections                    | `gap-stack-xl` |
| Page sections (KPIs, charts, table) | `space-y-stack-xl` |
| Icon → text in button/nav        | `gap-inline-sm` |
| Buttons in a toolbar             | `gap-inline-sm` |
| Columns in a grid                | `gap-stack-lg`  |
