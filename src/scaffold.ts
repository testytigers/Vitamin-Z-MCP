/**
 * scaffold.ts — turns a voice intent ("build me a shipments page with
 * stats and a table") into a complete, DS-compliant, ready-to-save
 * Next.js page. Deterministic composition from the canonical blueprints
 * in DASHBOARD_PATTERNS.md — the LLM only has to relay it, not write it.
 *
 * Section generators are exported individually so edit_page can splice
 * sections into existing pages.
 */

export type Section = "stats" | "tabs" | "charts" | "table" | "form" | "empty";

export interface BuildOptions {
  intent: string;
  title?: string;
  sections?: Section[];
  columns?: string[];
  stats?: string[];
  charts?: string[];
}

export interface SectionCtx {
  title: string;
  columns: string[];
  statLabels: string[];
  chartTitles: string[];
}

export interface SectionBlock {
  ui: string[];
  icons: string[];
  needCn: boolean;
  helpers: string[];        // top-level declarations the JSX depends on
  jsx: string;              // indented for placement inside the page wrapper
  extraImports?: string[];  // verbatim import lines (e.g. recharts)
}

/** Marker comments — used to find/remove sections when editing. */
export const SECTION_MARKERS: Record<Section, string> = {
  stats: "KPI row",
  tabs: "Tabs + filter bar",
  charts: "Charts row",
  table: "Data table",
  form: "Form card",
  empty: "Empty state",
};

// Rich voice vocabulary — synonyms people actually say
const SECTION_KEYWORDS: Record<Section, RegExp> = {
  stats: /\b(stats?|kpis?|metrics?|numbers|summary|counters?|totals?|figures|cards? at the top|overview cards?)\b/,
  table: /\b(tables?|list(ing)?s?|records?|rows|entries|crud|manage|history|grid|sortable|columns|data ?table|results)\b/,
  charts: /\b(charts?|graphs?|analytics?|trends?|visuali\w*|plots?|sparklines?|time series|breakdown|over time)\b/,
  tabs: /\b(tabs?|views|switch between|segments?|filter bar)\b/,
  form: /\b(forms?|settings?|profile|preferences|inputs?|fields?|editor)\b/,
  empty: /\b(empty|placeholder|blank slate|no data)\b/,
};

const STOPWORDS = new Set([
  "build", "create", "make", "generate", "add", "new", "me", "a", "an", "the",
  "page", "dashboard", "screen", "view", "with", "and", "for", "of", "that",
  "has", "having", "containing", "showing", "shows", "please", "i", "want",
  "need", "to", "my", "our", "some", "stats", "table", "charts", "chart",
  "tabs", "form", "kpi", "kpis", "metrics", "list",
]);

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}

export function pascal(s: string): string {
  return s.replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase()).replace(/^./, (c) => c.toUpperCase()).replace(/[^a-zA-Z0-9]/g, "");
}

export function kebab(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function camel(s: string): string {
  const p = pascal(s);
  return p.charAt(0).toLowerCase() + p.slice(1);
}

export function inferSections(intent: string): { sections: Section[]; inferred: boolean } {
  const low = intent.toLowerCase();
  const found: Section[] = [];
  (Object.keys(SECTION_KEYWORDS) as Section[]).forEach((s) => {
    if (SECTION_KEYWORDS[s].test(low)) found.push(s);
  });
  if (found.length === 0) return { sections: ["stats", "charts", "table"], inferred: true };
  const order: Section[] = ["tabs", "stats", "charts", "table", "form", "empty"];
  return { sections: order.filter((s) => found.includes(s)), inferred: false };
}

/** Detect sections mentioned in an edit instruction (no defaults). */
export function detectSections(text: string): Section[] {
  const low = text.toLowerCase();
  return (Object.keys(SECTION_KEYWORDS) as Section[]).filter((s) => SECTION_KEYWORDS[s].test(low));
}

export function inferTitle(intent: string): string {
  const m = /(?:^|\s)(?:(?:a|an|the)\s+)?([a-z][a-z0-9 _-]{1,40}?)\s+(?:page|dashboard|screen|view)\b/i.exec(intent);
  if (m) {
    const words = m[1].split(/\s+/).filter((w) => !STOPWORDS.has(w.toLowerCase()));
    if (words.length) return titleCase(words.join(" "));
  }
  const words = intent.toLowerCase().replace(/[^a-z0-9\s-]/g, "").split(/\s+/)
    .filter((w) => w && !STOPWORDS.has(w));
  return words.length ? titleCase(words.slice(0, 2).join(" ")) : "Overview";
}

export function defaultCtx(title: string, opts: Partial<BuildOptions> = {}): SectionCtx {
  return {
    title,
    columns: opts.columns?.length ? opts.columns : ["Name", "Status", "Owner", "Updated"],
    statLabels: opts.stats?.length ? opts.stats : [`Total ${title}`, "Active", "Pending", "This Month"],
    chartTitles: opts.charts?.length ? opts.charts : [`${title} Over Time`, "Breakdown by Category"],
  };
}

// ──────────────────────────────────────────────────────────────────
// Section generators
// ──────────────────────────────────────────────────────────────────

export function genSection(section: Section, ctx: SectionCtx): SectionBlock {
  switch (section) {
    case "stats": return genStats(ctx);
    case "tabs": return genTabs();
    case "charts": return genCharts(ctx);
    case "table": return genTable(ctx);
    case "form": return genForm();
    case "empty": return genEmpty(ctx);
  }
}

function genStats(ctx: SectionCtx): SectionBlock {
  const statsData = ctx.statLabels
    .map((l) => `  { label: ${JSON.stringify(l)}, value: "—", trend: "+0%", up: true },`)
    .join("\n");
  return {
    ui: ["Card"],
    icons: [],
    needCn: true,
    helpers: [`const stats = [\n${statsData}\n];`, STAT_CARD_HELPER],
    jsx:
`      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-stack-lg">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>`,
  };
}

function genTabs(): SectionBlock {
  return {
    ui: ["Tabs", "TabsList", "TabsTrigger", "Button"],
    icons: ["Calendar", "ChevronDown"],
    needCn: false,
    helpers: [],
    jsx:
`      {/* Tabs + filter bar */}
      <div className="flex items-center justify-between border-b border-default">
        <Tabs defaultValue="all">
          <TabsList className="border-b-0 -mb-px">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-inline-sm pb-4">
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4" /> Last 30 days
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      </div>`,
  };
}

function genCharts(ctx: SectionCtx): SectionBlock {
  const cols = ctx.chartTitles.length > 1 ? "lg:grid-cols-2 " : "";
  const sampleData = `const chartData = [
  { name: "Jan", a: 0, b: 0 },
  { name: "Feb", a: 0, b: 0 },
  { name: "Mar", a: 0, b: 0 },
];`;
  return {
    ui: ["Card", "CardHeader", "CardTitle", "CardContent"],
    icons: [],
    needCn: false,
    helpers: [sampleData, CHART_CARD_HELPER],
    extraImports: [
      `import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";`,
    ],
    jsx:
`      {/* Charts row */}
      <div className="grid grid-cols-1 ${cols}gap-stack-xl">
${ctx.chartTitles.map((t) => `        <ChartCard title=${JSON.stringify(t)} data={chartData} series={["a", "b"]} />`).join("\n")}
      </div>`,
  };
}

function genTable(ctx: SectionCtx): SectionBlock {
  const keys = ctx.columns.map(camel);
  const itemType = `interface Item {\n  id: string;\n${keys.map((k) => `  ${k}: string;`).join("\n")}\n}`;
  const sample = `const items: Item[] = [\n  { id: "1", ${keys.map((k) => `${k}: "—"`).join(", ")} },\n  { id: "2", ${keys.map((k) => `${k}: "—"`).join(", ")} },\n];`;
  const headCells = ctx.columns.map((c) => `                <TableHead>${c}</TableHead>`).join("\n");
  const statusKey = keys.find((k) => k.toLowerCase().includes("status"));
  const bodyCells = keys
    .map((k) =>
      k === statusKey
        ? `                  <TableCell><Badge variant="success">{item.${k}}</Badge></TableCell>`
        : `                  <TableCell className="text-sm text-primary">{item.${k}}</TableCell>`
    )
    .join("\n");
  return {
    ui: ["Card", "CardHeader", "CardTitle", "CardContent", "CardFooter",
      "Table", "TableHeader", "TableBody", "TableRow", "TableHead", "TableCell",
      "Checkbox", "Badge", "Input", "Button",
      "DropdownMenu", "DropdownMenuTrigger", "DropdownMenuContent",
      "DropdownMenuItem", "DropdownMenuSeparator"],
    icons: ["Search", "SlidersHorizontal", "MoreHorizontal", "Edit", "Copy", "Trash2"],
    needCn: false,
    helpers: [itemType, sample],
    jsx:
`      {/* Data table */}
      <Card>
        <CardHeader className="flex-row items-center justify-between py-4">
          <CardTitle className="text-base">${ctx.title}</CardTitle>
          <div className="flex items-center gap-inline-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-icon-muted" />
              <Input className="pl-9 h-9 w-56" placeholder="Search…" />
            </div>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="w-4 h-4" /> Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"><Checkbox aria-label="Select all" /></TableHead>
${headCells}
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell><Checkbox /></TableCell>
${bodyCells}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Row actions">
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
        <CardFooter className="flex items-center justify-between py-4">
          <p className="text-sm text-secondary">Showing {items.length} results</p>
        </CardFooter>
      </Card>`,
  };
}

function genForm(): SectionBlock {
  return {
    ui: ["Card", "CardHeader", "CardTitle", "CardContent", "CardFooter", "Input", "Label", "Button"],
    icons: [],
    needCn: false,
    helpers: [],
    jsx:
`      {/* Form card */}
      <Card>
        <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
        <CardContent className="space-y-stack-md max-w-lg">
          <div className="space-y-stack-sm">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Enter a name…" />
          </div>
          <div className="space-y-stack-sm">
            <Label htmlFor="description">Description</Label>
            <Input id="description" placeholder="Short description…" />
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-inline-sm">
          <Button variant="outline">Cancel</Button>
          <Button variant="primary">Save changes</Button>
        </CardFooter>
      </Card>`,
  };
}

function genEmpty(ctx: SectionCtx): SectionBlock {
  return {
    ui: ["Card", "CardContent", "Button"],
    icons: ["FolderOpen", "Plus"],
    needCn: false,
    helpers: [],
    jsx:
`      {/* Empty state */}
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-12 h-12 rounded-overlay bg-secondary flex items-center justify-center mb-stack-lg">
              <FolderOpen className="w-6 h-6 text-icon-muted" />
            </div>
            <h3 className="text-base font-semibold text-primary mb-stack-xs">No ${ctx.title.toLowerCase()} yet</h3>
            <p className="text-sm text-secondary max-w-sm mb-stack-xl">Create your first item to get started.</p>
            <Button variant="primary"><Plus className="w-4 h-4" /> New</Button>
          </div>
        </CardContent>
      </Card>`,
  };
}

// ──────────────────────────────────────────────────────────────────
// Import emission (shared with editor.ts)
// ──────────────────────────────────────────────────────────────────

export const UI_MODULES: Record<string, string[]> = {
  button: ["Button"],
  card: ["Card", "CardHeader", "CardTitle", "CardContent", "CardFooter"],
  tabs: ["Tabs", "TabsList", "TabsTrigger"],
  table: ["Table", "TableHeader", "TableBody", "TableRow", "TableHead", "TableCell"],
  checkbox: ["Checkbox"],
  badge: ["Badge"],
  input: ["Input"],
  label: ["Label"],
  "dropdown-menu": ["DropdownMenu", "DropdownMenuTrigger", "DropdownMenuContent", "DropdownMenuItem", "DropdownMenuSeparator"],
};

export function emitImports(ui: Set<string>, icons: Set<string>, needCn: boolean, extra: string[] = []): string[] {
  const lines: string[] = [];
  for (const [mod, names] of Object.entries(UI_MODULES)) {
    const used = names.filter((n) => ui.has(n));
    if (used.length) lines.push(`import { ${used.join(", ")} } from "@/components/ui/${mod}";`);
  }
  if (needCn) lines.push(`import { cn } from "@/lib/utils";`);
  if (icons.size) lines.push(`import { ${[...icons].sort().join(", ")} } from "lucide-react";`);
  for (const line of extra) if (!lines.includes(line)) lines.push(line);
  return lines;
}

// ──────────────────────────────────────────────────────────────────
// buildPage
// ──────────────────────────────────────────────────────────────────

export function buildPage(opts: BuildOptions): {
  code: string;
  filePath: string;
  title: string;
  sections: Section[];
  notes: string[];
} {
  const notes: string[] = [];
  const title = opts.title?.trim() || inferTitle(opts.intent);
  let sections: Section[];
  if (opts.sections?.length) {
    sections = opts.sections;
  } else {
    const r = inferSections(opts.intent);
    sections = r.sections;
    notes.push(
      r.inferred
        ? `No sections specified — defaulted to full dashboard (stats + charts + table).`
        : `Sections inferred from intent: ${sections.join(", ")}.`
    );
  }
  if (opts.columns?.length && !sections.includes("table")) sections.push("table");
  if (opts.stats?.length && !sections.includes("stats")) sections.unshift("stats");

  const ctx = defaultCtx(title, opts);
  const ui = new Set<string>(["Button"]);
  const icons = new Set<string>(["Plus"]);
  let needCn = false;
  const helpers: string[] = [];
  const body: string[] = [];
  const extraImports: string[] = [];

  for (const s of sections) {
    const block = genSection(s, ctx);
    block.ui.forEach((u) => ui.add(u));
    block.icons.forEach((i) => icons.add(i));
    needCn = needCn || block.needCn;
    for (const h of block.helpers) if (!helpers.includes(h)) helpers.push(h);
    for (const imp of block.extraImports ?? []) if (!extraImports.includes(imp)) extraImports.push(imp);
    body.push(block.jsx);
  }

  const importLines = emitImports(ui, icons, needCn, extraImports);
  const componentName = pascal(title) + "Page";
  const route = kebab(title);

  const code = `${importLines.join("\n")}

${helpers.join("\n\n")}${helpers.length ? "\n" : ""}
export default function ${componentName}() {
  return (
    <div className="p-8">
      <div className="max-w-screen-xl mx-auto space-y-stack-xl">

        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary mb-stack-xs">${title}</h1>
            <p className="text-sm text-secondary">Manage and monitor your ${title.toLowerCase()}.</p>
          </div>
          <div className="flex items-center gap-inline-sm">
            <Button variant="primary"><Plus className="w-4 h-4" /> New</Button>
          </div>
        </div>

${body.join("\n\n")}
      </div>
    </div>
  );
}
`;

  notes.push(`Save to src/app/(dashboard)/${route}/page.tsx (assumes AppShell layout wraps it).`);
  notes.push("Code uses only DS tokens — it passes validate_code as-is. Replace sample data (\"—\") with real data.");

  return { code, filePath: `src/app/(dashboard)/${route}/page.tsx`, title, sections, notes };
}

const STAT_CARD_HELPER = `function StatCard({ label, value, trend, up }: { label: string; value: string; trend: string; up: boolean | null }) {
  return (
    <Card className="p-5 hover:shadow-popover transition-shadow duration-normal">
      <p className="text-sm font-medium text-secondary mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-primary">{value}</span>
        <span className={cn(
          "text-xs font-medium",
          up === true && "text-status-success-fg",
          up === false && "text-status-error-fg",
          up === null && "text-muted"
        )}>
          {trend}
        </span>
      </div>
    </Card>
  );
}`;

const CHART_CARD_HELPER = `function ChartCard({ title, data, series }: {
  title: string;
  data: Array<Record<string, string | number>>;
  series: string[];
}) {
  // DS chart tokens — series colours come from the categorical ramp, in order.
  // Never hardcode hex here; these re-theme with the system and invert in dark mode.
  const seriesColors = [
    "var(--color-chart-cat-1)", "var(--color-chart-cat-2)",
    "var(--color-chart-cat-3)", "var(--color-chart-cat-4)",
    "var(--color-chart-cat-5)", "var(--color-chart-cat-6)",
    "var(--color-chart-cat-7)", "var(--color-chart-cat-8)",
  ];
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center justify-between py-4">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-72">
        <ResponsiveContainer width="100%" height={288}>
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid stroke="var(--color-chart-grid)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" stroke="var(--color-chart-axis)" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis stroke="var(--color-chart-axis)" tickLine={false} axisLine={false} fontSize={12} />
            <Tooltip
              contentStyle={{
                background: "var(--color-surface-popover)",
                border: "1px solid var(--color-border-default)",
                borderRadius: "var(--radius-card)",
                fontSize: 12,
              }}
            />
            {series.map((key, i) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={seriesColors[i % seriesColors.length]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}`;
