#!/usr/bin/env node
/**
 * Design System v1.2 — MCP Server
 *
 * Tools:
 *   build_page      — voice command → complete DS-compliant Next.js page
 *   validate_code   — auto-fix all DS violations, return corrected code
 *   get_component   — compact component docs slice
 *   get_pattern     — compact pattern slice
 *   get_tokens      — token reference by category
 *   search_ds       — full-text search across all DS docs
 *   get_cheatsheet  — quick-reference card (tokens + rules + decisions)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import "dotenv/config";
import { existsSync, readFileSync } from "fs";
import { createServer as createHttpServer } from "node:http";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

// ── Paths ─────────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MCP_DIR = resolve(__dirname, "..", "docs");

function loadDoc(name: string): string {
  const p = resolve(MCP_DIR, name);
  if (!existsSync(p)) {
    console.error(`[ds-mcp] WARNING: ${name} not found at ${p}`);
    return `[${name} not found — check MCP_DIR: ${MCP_DIR}]`;
  }
  return readFileSync(p, "utf8");
}

const DOCS = {
  tokens: loadDoc("TOKENS.md"),
  components: loadDoc("COMPONENTS.md"),
  patterns: loadDoc("DASHBOARD_PATTERNS.md"),
  template: loadDoc("TEMPLATE_STYLE.md"),
  guide: loadDoc("AGENT_GUIDE.md"),
  enforcement: loadDoc("ENFORCEMENT.md"),
};

// ── Violation map ─────────────────────────────────────────────────────────────

interface ViolationEntry {
  replacement: string;
  category: string;
  note?: string;
}

const VIOLATION_MAP: Record<string, ViolationEntry> = {
  "text-slate-900": { replacement: "text-text-primary", category: "text" },
  "text-slate-800": { replacement: "text-text-primary", category: "text" },
  "text-slate-700": { replacement: "text-text-strong", category: "text" },
  "text-slate-600": { replacement: "text-text-secondary", category: "text" },
  "text-slate-500": { replacement: "text-text-subtle", category: "text" },
  "text-slate-400": { replacement: "text-text-muted", category: "text" },
  "text-slate-300": { replacement: "text-text-disabled", category: "text" },
  "text-slate-200": { replacement: "text-text-disabled", category: "text" },
  "text-slate-100": { replacement: "text-text-disabled", category: "text" },
  "text-red-400": { replacement: "text-status-error-fg", category: "status" },
  "text-red-500": { replacement: "text-status-error-fg", category: "status" },
  "text-red-600": { replacement: "text-status-error-fg", category: "status" },
  "text-red-700": { replacement: "text-status-error-fg", category: "status" },
  "text-green-500": { replacement: "text-status-success-fg", category: "status" },
  "text-green-600": { replacement: "text-status-success-fg", category: "status" },
  "text-green-700": { replacement: "text-status-success-fg", category: "status" },
  "text-yellow-500": { replacement: "text-status-warning-fg", category: "status" },
  "text-yellow-600": { replacement: "text-status-warning-fg", category: "status" },
  "text-blue-500": { replacement: "text-status-info-fg", category: "status" },
  "text-blue-600": { replacement: "text-status-info-fg", category: "status" },
  "text-orange-500": { replacement: "text-status-attention-fg", category: "status" },
  "text-orange-600": { replacement: "text-status-attention-fg", category: "status" },
  "text-[#4f46e5]": { replacement: "text-icon-interactive", category: "action" },
  "text-[#4338ca]": { replacement: "text-icon-interactive", category: "action" },
  "bg-white": { replacement: "bg-surface-elevated", category: "background" },
  "bg-slate-50": { replacement: "bg-surface-sunken", category: "background" },
  "bg-slate-100": { replacement: "bg-bg-secondary", category: "background" },
  "bg-slate-200": { replacement: "bg-bg-tertiary", category: "background" },
  "bg-slate-300": { replacement: "bg-bg-tertiary", category: "background" },
  "hover:bg-slate-50": { replacement: "hover:bg-surface-sunken", category: "background" },
  "hover:bg-slate-100": { replacement: "hover:bg-action-ghost-hover", category: "action" },
  "hover:bg-slate-200": { replacement: "hover:bg-action-ghost-active", category: "action" },
  "bg-red-50": { replacement: "bg-status-error-bg", category: "status" },
  "bg-red-100": { replacement: "bg-status-error-bg", category: "status" },
  "bg-green-50": { replacement: "bg-status-success-bg", category: "status" },
  "bg-green-100": { replacement: "bg-status-success-bg", category: "status" },
  "bg-yellow-50": { replacement: "bg-status-warning-bg", category: "status" },
  "bg-yellow-100": { replacement: "bg-status-warning-bg", category: "status" },
  "bg-blue-50": { replacement: "bg-status-info-bg", category: "status" },
  "bg-blue-100": { replacement: "bg-status-info-bg", category: "status" },
  "bg-[#4f46e5]": { replacement: "bg-action-primary", category: "action" },
  "bg-[#4338ca]": { replacement: "bg-action-primary-hover", category: "action" },
  "bg-[rgba(79,70,229,0.04)]": { replacement: "bg-action-primary-tint", category: "action" },
  "bg-[rgba(79,70,229,0.06)]": { replacement: "bg-action-primary-tint", category: "action" },
  "bg-[rgba(79,70,229,0.08)]": { replacement: "bg-action-primary-subtle", category: "action" },
  "bg-[rgba(79,70,229,0.1)]": { replacement: "bg-action-primary-subtle", category: "action" },
  "bg-[rgba(79,70,229,0.10)]": { replacement: "bg-action-primary-subtle", category: "action" },
  "bg-[rgba(79,70,229,0.12)]": { replacement: "bg-action-primary-subtle", category: "action" },
  "border-slate-100": { replacement: "border-border-subtle", category: "border" },
  "border-slate-200": { replacement: "border-border-default", category: "border" },
  "border-slate-300": { replacement: "border-border-hover", category: "border" },
  "border-gray-200": { replacement: "border-border-default", category: "border" },
  "border-[#4f46e5]": { replacement: "border-border-focus", category: "border" },
  "ring-[#4f46e5]": { replacement: "ring-border-focus", category: "border" },
  "border-[rgba(79,70,229,0.2)]": { replacement: "border-action-primary-subtle", category: "border" },
  "border-red-200": { replacement: "border-status-error-border", category: "status" },
  "border-red-500": { replacement: "border-status-error-border", category: "status" },
  "border-green-200": { replacement: "border-status-success-border", category: "status" },
  "border-yellow-200": { replacement: "border-status-warning-border", category: "status" },
  "border-blue-200": { replacement: "border-status-info-border", category: "status" },
};

function resolveViolation(cls: string): ViolationEntry | null {
  const trimmed = cls.trim();
  if (VIOLATION_MAP[trimmed]) return VIOLATION_MAP[trimmed];

  const textSlate = trimmed.match(/^text-slate-(\d+)$/);
  if (textSlate) {
    const n = parseInt(textSlate[1]);
    if (n >= 800) return { replacement: "text-text-primary", category: "text" };
    if (n >= 700) return { replacement: "text-text-strong", category: "text" };
    if (n >= 600) return { replacement: "text-text-secondary", category: "text" };
    if (n >= 500) return { replacement: "text-text-subtle", category: "text" };
    if (n >= 400) return { replacement: "text-text-muted", category: "text" };
    return { replacement: "text-text-disabled", category: "text" };
  }
  const bgSlate = trimmed.match(/^bg-slate-(\d+)$/);
  if (bgSlate) {
    const n = parseInt(bgSlate[1]);
    if (n <= 50) return { replacement: "bg-surface-sunken", category: "background" };
    if (n <= 100) return { replacement: "bg-bg-secondary", category: "background" };
    return { replacement: "bg-bg-tertiary", category: "background" };
  }
  const borderSlate = trimmed.match(/^border-slate-(\d+)$/);
  if (borderSlate) {
    const n = parseInt(borderSlate[1]);
    if (n <= 100) return { replacement: "border-border-subtle", category: "border" };
    if (n <= 200) return { replacement: "border-border-default", category: "border" };
    return { replacement: "border-border-hover", category: "border" };
  }
  if (/^text-red-\d+$/.test(trimmed)) return { replacement: "text-status-error-fg", category: "status" };
  if (/^text-green-\d+$/.test(trimmed)) return { replacement: "text-status-success-fg", category: "status" };
  if (/^text-yellow-\d+$/.test(trimmed)) return { replacement: "text-status-warning-fg", category: "status" };
  if (/^text-blue-\d+$/.test(trimmed)) return { replacement: "text-status-info-fg", category: "status" };
  if (/^text-orange-\d+$/.test(trimmed)) return { replacement: "text-status-attention-fg", category: "status" };
  if (/^bg-red-\d+$/.test(trimmed)) return { replacement: "bg-status-error-bg", category: "status" };
  if (/^bg-green-\d+$/.test(trimmed)) return { replacement: "bg-status-success-bg", category: "status" };
  if (/^bg-yellow-\d+$/.test(trimmed)) return { replacement: "bg-status-warning-bg", category: "status" };
  if (/^bg-blue-\d+$/.test(trimmed)) return { replacement: "bg-status-info-bg", category: "status" };
  if (/^border-red-\d+$/.test(trimmed)) return { replacement: "border-status-error-border", category: "status" };
  if (/^border-green-\d+$/.test(trimmed)) return { replacement: "border-status-success-border", category: "status" };
  if (/^border-yellow-\d+$/.test(trimmed)) return { replacement: "border-status-warning-border", category: "status" };
  if (/^border-blue-\d+$/.test(trimmed)) return { replacement: "border-status-info-border", category: "status" };
  if (/^(?:bg|text|border|ring)-\[#[0-9a-fA-F]+\]$/.test(trimmed)) {
    return {
      replacement: "use a DS token — browse with get_tokens",
      category: "hardcoded-hex",
      note: "Cannot auto-resolve an arbitrary hex. Identify the semantic role and pick the right token.",
    };
  }
  return null;
}

// ── Lint rules ────────────────────────────────────────────────────────────────

interface LintRule { pattern: RegExp; message: string }

const LINT_RULES: LintRule[] = [
  { pattern: /(?:bg|text|border|ring)-\[#[0-9a-fA-F]+\]/g, message: "Hardcoded hex color — use a DS token" },
  { pattern: /(?:bg|border|text)-\[rgba\(\s*79\s*,\s*70\s*,\s*229/g, message: "Hardcoded purple rgba — use bg-action-primary-subtle / bg-action-primary-tint" },
  { pattern: /text-slate-\d+/g, message: "Raw text-slate-* — use text-text-{primary|strong|secondary|subtle|muted|disabled}" },
  { pattern: /\bbg-white\b/g, message: "Raw bg-white — use bg-surface-elevated" },
  { pattern: /\bbg-slate-\d+/g, message: "Raw bg-slate-* — use bg-surface-{sunken|elevated} or bg-bg-{secondary|tertiary}" },
  { pattern: /\bborder-slate-\d+/g, message: "Raw border-slate-* — use border-border-{subtle|default|hover|focus}" },
  { pattern: /(?:text|bg|border)-red-\d+/g, message: "Raw red-* — use {text|bg|border}-status-error-{fg|bg|border}" },
  { pattern: /(?:text|bg|border)-green-\d+/g, message: "Raw green-* — use {text|bg|border}-status-success-{fg|bg|border}" },
  { pattern: /(?:text|bg|border)-yellow-\d+/g, message: "Raw yellow-* — use {text|bg|border}-status-warning-{fg|bg|border}" },
  { pattern: /(?:text|bg|border)-blue-\d+/g, message: "Raw blue-* — use {text|bg|border}-status-info-{fg|bg|border}" },
  { pattern: /(?:text|bg)-orange-\d+/g, message: "Raw orange-* — use text-status-attention-fg" },
];

interface LintViolation { line: number; match: string; message: string; suggestion?: string }

function lintSnippet(code: string): LintViolation[] {
  const violations: LintViolation[] = [];
  const lines = code.split("\n");
  for (const rule of LINT_RULES) {
    lines.forEach((line, i) => {
      const regex = new RegExp(rule.pattern.source, "g");
      let m: RegExpExecArray | null;
      while ((m = regex.exec(line)) !== null) {
        const resolved = resolveViolation(m[0]);
        violations.push({ line: i + 1, match: m[0], message: rule.message, suggestion: resolved?.replacement });
      }
    });
  }
  return violations;
}

// ── Auto-fix ──────────────────────────────────────────────────────────────────

interface FixEntry { from: string; to: string }

function autoFix(code: string): { fixed: string; fixes: FixEntry[]; clean: boolean } {
  const violations = lintSnippet(code);
  if (violations.length === 0) return { fixed: code, fixes: [], clean: true };

  let fixed = code;
  const seen = new Set<string>();
  const fixes: FixEntry[] = [];

  // Sort longest-first to avoid partial replacements (e.g. bg-slate-100 before bg-slate)
  const toFix = violations
    .filter((v) => v.suggestion && !v.suggestion.startsWith("use a DS token"))
    .sort((a, b) => b.match.length - a.match.length);

  for (const v of toFix) {
    if (!seen.has(v.match) && v.suggestion) {
      seen.add(v.match);
      const escaped = v.match.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      fixed = fixed.replace(new RegExp(escaped, "g"), v.suggestion);
      fixes.push({ from: v.match, to: v.suggestion });
    }
  }

  return { fixed, fixes, clean: fixes.length === 0 };
}

// ── Page builder ──────────────────────────────────────────────────────────────

interface PageSpec {
  pageName: string;
  entityPlural: string;
  entitySingular: string;
  routePath: string;
  filePath: string;
  features: Set<string>;
}

interface IconSet { imports: string[]; stat: string[]; }

function getIconSet(entity: string): IconSet {
  const e = entity.toLowerCase();
  if (/ship|deliver|logistic|freight/.test(e))
    return { imports: ["Package", "Truck", "CheckCircle2", "AlertCircle"], stat: ["Package", "Truck", "CheckCircle2", "AlertCircle"] };
  if (/invoice|bill|payment|finance|revenue/.test(e))
    return { imports: ["FileText", "DollarSign", "CheckCircle2", "Clock"], stat: ["FileText", "DollarSign", "CheckCircle2", "Clock"] };
  if (/user|member|people|team|employee|staff/.test(e))
    return { imports: ["Users", "UserCheck", "UserX", "Clock"], stat: ["Users", "UserCheck", "UserX", "Clock"] };
  if (/product|item|stock|inventory|sku/.test(e))
    return { imports: ["Package", "BarChart3", "CheckCircle2", "AlertCircle"], stat: ["Package", "BarChart3", "CheckCircle2", "AlertCircle"] };
  if (/order|purchase|transaction|sale/.test(e))
    return { imports: ["ShoppingCart", "TrendingUp", "CheckCircle2", "AlertCircle"], stat: ["ShoppingCart", "TrendingUp", "CheckCircle2", "AlertCircle"] };
  if (/client|customer|account|contact/.test(e))
    return { imports: ["Building2", "UserCheck", "TrendingUp", "Clock"], stat: ["Building2", "UserCheck", "TrendingUp", "Clock"] };
  return { imports: ["BarChart3", "TrendingUp", "CheckCircle2", "AlertCircle"], stat: ["BarChart3", "TrendingUp", "CheckCircle2", "AlertCircle"] };
}

function toSingular(word: string): string {
  if (/ies$/.test(word)) return word.slice(0, -3) + "y";
  if (/ses$|xes$|zes$|ches$|shes$/.test(word)) return word.slice(0, -2);
  if (/s$/.test(word) && word.length > 3) return word.slice(0, -1);
  return word;
}

function toPlural(word: string): string {
  if (/y$/.test(word)) return word.slice(0, -1) + "ies";
  if (/s$|x$|z$|ch$|sh$/.test(word)) return word + "es";
  return word + "s";
}

function parseCommand(command: string): PageSpec {
  const cmd = command.toLowerCase().trim();

  // Extract the entity/page name
  const patterns = [
    /(?:build|make|create|generate)\s+(?:me\s+)?(?:a[n]?\s+)?(\w+)\s+(?:page|dashboard|screen|view|list)/i,
    /(?:a[n]?\s+)?(\w+)\s+(?:page|dashboard|screen|view|list)\s+(?:with|for|that)/i,
    /(?:a[n]?\s+)?(\w+)\s+(?:dashboard|page)/i,
    /(?:build|make|create|generate)\s+(?:me\s+)?(?:a[n]?\s+)?(\w+)/i,
  ];

  let raw = "Dashboard";
  for (const pat of patterns) {
    const m = command.match(pat);
    if (m && m[1].length > 1 && !["me", "a", "an", "the", "with", "for"].includes(m[1].toLowerCase())) {
      raw = m[1];
      break;
    }
  }

  // Capitalise first letter
  const cap = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();

  // Derive singular / plural
  const entitySingular = toSingular(cap);
  const entityPlural = cap.endsWith("s") ? cap : toPlural(entitySingular);
  const pageName = entityPlural;
  const routePath = pageName.toLowerCase();

  // Detect features from command
  const features = new Set<string>();
  if (/stat|kpi|metric|card|overview|number|count/.test(cmd)) features.add("stats");
  if (/table|list|grid|row|record|data/.test(cmd)) features.add("table");
  if (/form|input|field|setting|edit|update|creat|new/.test(cmd) && !/create/.test(cmd.replace(/create\s+a/, ""))) features.add("form");
  if (/chart|graph|analytic|trend|plot/.test(cmd)) features.add("chart");
  if (/filter|search/.test(cmd)) features.add("filters");

  // Settings / profile are form-first pages
  const isFormPage = /setting|profile|account|preference|config/.test(cmd);
  if (isFormPage) { features.add("form"); features.delete("table"); features.delete("stats"); }

  // Defaults if nothing detected
  if (features.size === 0) { features.add("stats"); features.add("table"); }

  const filePath = `src/app/(dashboard)/${routePath}/page.tsx`;
  return { pageName, entityPlural, entitySingular, routePath, filePath, features };
}

function buildStatsTablePage(spec: PageSpec): string {
  const { pageName, entityPlural, entitySingular } = spec;
  const icons = getIconSet(pageName);
  const idPrefix = entitySingular.slice(0, 3).toUpperCase();

  return `"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ${icons.imports.join(", ")} } from "lucide-react";

const STATS = [
  { label: "Total ${entityPlural}", value: "1,284", icon: ${icons.stat[0]}, trend: "+12% from last month" },
  { label: "Active", value: "348", icon: ${icons.stat[1]}, trend: "+5% from last month" },
  { label: "Completed", value: "902", icon: ${icons.stat[2]}, trend: "+18% from last month" },
  { label: "Pending", value: "34", icon: ${icons.stat[3]}, trend: "-3% from last month" },
];

const SAMPLE_ROWS = [
  { id: "${idPrefix}-001", name: "Sample ${entitySingular} 1", status: "active", date: "2026-06-09" },
  { id: "${idPrefix}-002", name: "Sample ${entitySingular} 2", status: "completed", date: "2026-06-10" },
  { id: "${idPrefix}-003", name: "Sample ${entitySingular} 3", status: "pending", date: "2026-06-11" },
  { id: "${idPrefix}-004", name: "Sample ${entitySingular} 4", status: "cancelled", date: "2026-06-12" },
];

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Active", variant: "default" },
  completed: { label: "Completed", variant: "secondary" },
  pending: { label: "Pending", variant: "outline" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

export default function ${pageName}Page() {
  return (
    <div className="space-y-6 p-6 bg-surface-sunken min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold font-mono text-text-primary">${pageName}</h1>
          <p className="text-sm text-text-secondary mt-1">Manage and track all ${entityPlural.toLowerCase()}</p>
        </div>
        <Button>New ${entitySingular}</Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <Card key={stat.label} className="border border-border-default rounded-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-icon-muted" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold font-mono text-text-primary">{stat.value}</p>
              <p className="text-xs text-text-subtle mt-1">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Data table */}
      <Card className="border border-border-default rounded-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-text-primary">${entityPlural}</CardTitle>
          <Button variant="outline" size="sm">Export</Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-bg-secondary hover:bg-bg-secondary">
                <TableHead className="text-text-secondary font-medium">ID</TableHead>
                <TableHead className="text-text-secondary font-medium">Name</TableHead>
                <TableHead className="text-text-secondary font-medium">Status</TableHead>
                <TableHead className="text-text-secondary font-medium">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SAMPLE_ROWS.map((row) => {
                const s = STATUS_MAP[row.status] ?? STATUS_MAP.pending;
                return (
                  <TableRow key={row.id} className="hover:bg-action-primary-tint border-b border-border-subtle">
                    <TableCell className="font-mono text-sm text-text-strong">{row.id}</TableCell>
                    <TableCell className="text-text-strong">{row.name}</TableCell>
                    <TableCell>
                      <Badge variant={s.variant}>{s.label}</Badge>
                    </TableCell>
                    <TableCell className="text-text-subtle">{row.date}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
`;
}

function buildFormPage(spec: PageSpec): string {
  const { pageName, entitySingular } = spec;
  return `"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

export default function ${pageName}Page() {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
  };

  return (
    <div className="space-y-6 p-6 bg-surface-sunken min-h-screen max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold font-mono text-text-primary">${pageName}</h1>
        <p className="text-sm text-text-secondary mt-1">Manage your ${entitySingular.toLowerCase()} preferences</p>
      </div>

      <Card className="border border-border-default rounded-card">
        <CardHeader>
          <CardTitle className="text-text-primary">General</CardTitle>
          <CardDescription className="text-text-secondary">Basic information and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-text-strong text-sm">Name</Label>
            <Input id="name" placeholder="Enter name" className="border-border-default" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-text-strong text-sm">Email</Label>
            <Input id="email" type="email" placeholder="email@example.com" className="border-border-default" />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border-default rounded-card">
        <CardHeader>
          <CardTitle className="text-text-primary">Preferences</CardTitle>
          <CardDescription className="text-text-secondary">Notifications and display settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-strong">Email notifications</p>
              <p className="text-xs text-text-subtle">Receive updates by email</p>
            </div>
            <Switch />
          </div>
          <Separator className="bg-bg-tertiary" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-strong">Dark mode</p>
              <p className="text-xs text-text-subtle">Use dark theme</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
`;
}

function buildPage(command: string): { code: string; filePath: string; description: string } {
  const spec = parseCommand(command);
  const isForm = spec.features.has("form") && !spec.features.has("table") && !spec.features.has("stats");
  const code = isForm ? buildFormPage(spec) : buildStatsTablePage(spec);
  const description = isForm
    ? `${spec.pageName} settings/form page with two card sections`
    : `${spec.pageName} page with ${spec.features.has("stats") ? "4 KPI cards + " : ""}data table`;
  return { code, filePath: spec.filePath, description };
}

// ── Markdown helpers ──────────────────────────────────────────────────────────

function wordsMatch(heading: string, query: string): boolean {
  const h = heading.toLowerCase().replace(/[^a-z0-9 ]/g, " ");
  const q = query.toLowerCase().replace(/[^a-z0-9 ]/g, " ").trim();
  if (h === q || h.includes(q)) return true;
  return q.split(/\s+/).filter(Boolean).every((w) => h.includes(w));
}

function extractSection(markdown: string, query: string, level = 2): string | null {
  const lines = markdown.split("\n");
  let inSection = false;
  const buf: string[] = [];
  for (const line of lines) {
    if (/^#+/.test(line)) {
      const lineLevel = (line.match(/^#+/) as RegExpMatchArray)[0].length;
      const title = line.replace(/^#+\s*/, "").trim();
      if (!inSection && lineLevel === level && wordsMatch(title, query)) {
        inSection = true;
        buf.push(line);
        continue;
      }
      if (inSection && lineLevel <= level) break;
    }
    if (inSection) buf.push(line);
  }
  return buf.length > 0 ? buf.join("\n").trim() : null;
}

function listSections(markdown: string, level = 2): string[] {
  const prefix = "#".repeat(level) + " ";
  return markdown.split("\n").filter((l) => l.startsWith(prefix)).map((l) => l.slice(prefix.length).trim());
}

// ── Token helpers ─────────────────────────────────────────────────────────────

const TOKEN_SUBSECTION_MAP: Record<string, string[]> = {
  text: ["Text Colors"],
  background: ["Surface (background layers)", "Background (tonal fills)"],
  surface: ["Surface (background layers)", "Background (tonal fills)"],
  action: ["Action Colors"],
  border: ["Border Colors"],
  status: ["Status Colors"],
  icon: ["Icon Colors"],
  spacing: ["3. Spacing Tokens"],
  radius: ["4. Radius Tokens"],
  shadow: ["5. Shadow Tokens"],
  zindex: ["6. Z-Index Tokens"],
  motion: ["7. Motion Tokens"],
  size: ["8. Control Size Tokens"],
};

function getTokenContent(category: string): string {
  if (category === "all") return extractSection(DOCS.tokens, "1. Color Tokens") ?? DOCS.tokens;
  const headings = TOKEN_SUBSECTION_MAP[category.toLowerCase()];
  if (!headings) return `Unknown category "${category}". Valid: text, background, action, border, status, icon, spacing, radius, shadow, motion, size, all`;
  return headings
    .map((h) => extractSection(DOCS.tokens, h, 3) ?? extractSection(DOCS.tokens, h, 2) ?? `[Section "${h}" not found]`)
    .join("\n\n");
}

// ── Search ────────────────────────────────────────────────────────────────────

function searchDocs(query: string): string {
  const q = query.toLowerCase().replace(/[^a-z0-9 ]/g, " ").trim();
  const words = q.split(/\s+/).filter((w) => w.length > 2);
  if (!words.length) return "Query too short — provide at least one word.";

  interface Hit { doc: string; section: string; score: number; excerpt: string }
  const hits: Hit[] = [];

  const docEntries = Object.entries(DOCS) as [string, string][];
  for (const [docKey, content] of docEntries) {
    for (const level of [2, 3]) {
      const sections = listSections(content, level);
      for (const section of sections) {
        const sectionLower = section.toLowerCase();
        const excerpt = extractSection(content, section, level) ?? "";
        const excerptLower = excerpt.toLowerCase();
        // Score: heading match = 3pts per word, body match = 1pt per word
        let score = 0;
        for (const w of words) {
          if (sectionLower.includes(w)) score += 3;
          if (excerptLower.includes(w)) score += 1;
        }
        if (score > 0) {
          hits.push({ doc: docKey, section, score, excerpt: excerpt.slice(0, 800) });
        }
      }
    }
  }

  if (!hits.length) return `No results found for "${query}". Try broader terms like "button", "color", "token", "table", "form".`;

  const top = hits.sort((a, b) => b.score - a.score).slice(0, 5);
  return top
    .map((h) => `### [${h.doc}] ${h.section}\n\n${h.excerpt}`)
    .join("\n\n---\n\n");
}

// ── Cheat sheet ───────────────────────────────────────────────────────────────

const CHEAT_SHEET = `## DS v1.2 Quick Reference

### Text
| Need | Class |
|---|---|
| Heading | \`text-text-primary\` |
| Body | \`text-text-strong\` |
| Caption | \`text-text-secondary\` |
| Helper | \`text-text-subtle\` |
| Placeholder | \`text-text-muted\` |
| Disabled | \`text-text-disabled\` |
| On purple button | \`text-text-on-accent\` |

### Backgrounds
| Need | Class |
|---|---|
| Page canvas | \`bg-surface-sunken\` |
| Card / panel | \`bg-surface-elevated\` |
| Table header | \`bg-bg-secondary\` |
| Divider fill | \`bg-bg-tertiary\` |
| Row hover | \`hover:bg-action-primary-tint\` |
| Row selected | \`bg-action-primary-subtle\` |
| Ghost hover | \`hover:bg-action-ghost-hover\` |

### Borders
| Need | Class |
|---|---|
| Subtle divider | \`border-border-subtle\` |
| Card / input | \`border-border-default\` |
| Hover | \`hover:border-border-hover\` |
| Focus ring | \`border-border-focus\` |

### Status
| State | Text | Background | Border |
|---|---|---|---|
| Error | \`text-status-error-fg\` | \`bg-status-error-bg\` | \`border-status-error-border\` |
| Success | \`text-status-success-fg\` | \`bg-status-success-bg\` | \`border-status-success-border\` |
| Warning | \`text-status-warning-fg\` | \`bg-status-warning-bg\` | \`border-status-warning-border\` |
| Info | \`text-status-info-fg\` | \`bg-status-info-bg\` | \`border-status-info-border\` |

### Icons
- Default: \`text-icon-default\`
- Muted: \`text-icon-muted\`
- Purple interactive: \`text-icon-interactive\`

### Forbidden (will fail lint)
\`bg-white\` \`bg-slate-*\` \`text-slate-*\` \`border-slate-*\`
\`text/bg/border-red-*\` \`text/bg/border-green-*\` \`text/bg/border-blue-*\`
\`bg-[#...]\` \`text-[#...]\` \`border-[#...]\`

### Decision tree
- Show status → \`<Badge variant="default|secondary|destructive|outline">\`
- Show count KPI → Card + \`text-2xl font-bold font-mono text-text-primary\`
- Page canvas → \`bg-surface-sunken\`
- Card / panel → \`bg-surface-elevated border border-border-default rounded-card\`
- Table header row → \`bg-bg-secondary\`
- Row hover → \`hover:bg-action-primary-tint\`
- Primary action → \`<Button>\` (default variant, never add bg-* override)
`;

// ── MCP Server ────────────────────────────────────────────────────────────────

function createDsServer(): Server {
  const server = new Server(
    { name: "ds-shadcn-mcp", version: "2.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "build_page",
        description:
          "Generate a complete, DS-compliant Next.js page from a natural-language voice command. Pass the transcribed command verbatim (e.g. 'build me a shipments page with stats and a table'). Returns: page code ready to save, the suggested file path, and a description of what was generated.",
        inputSchema: {
          type: "object",
          properties: {
            command: {
              type: "string",
              description: "Natural-language page request, e.g. 'build me a shipments page with stats and a table' or 'make a settings page with a form'",
            },
          },
          required: ["command"],
        },
      },
      {
        name: "validate_code",
        description:
          "Auto-fix all DS color violations in a JSX/TSX snippet. Returns the corrected code plus a list of every substitution made (bg-white → bg-surface-elevated, etc.). A small model can self-correct in one round-trip with this tool.",
        inputSchema: {
          type: "object",
          properties: {
            code: {
              type: "string",
              description: "JSX/TSX code to validate and auto-fix",
            },
          },
          required: ["code"],
        },
      },
      {
        name: "get_component",
        description:
          "Get docs for a shadcn/DS component (variants, props, copy-paste TSX). Pass 'list' to see all components.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Component name (e.g. 'button', 'badge', 'card', 'table', 'dialog') or 'list'",
            },
          },
          required: ["name"],
        },
      },
      {
        name: "get_pattern",
        description:
          "Get the canonical TSX for a dashboard layout pattern (app shell, top bar, sidebar, stat card, data table, empty state, etc.). Pass 'list' to see all.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Pattern name (e.g. 'app shell', 'data table', 'stat card', 'empty state') or 'list'",
            },
          },
          required: ["name"],
        },
      },
      {
        name: "get_tokens",
        description:
          "Get DS token table for a category. Categories: text, background, action, border, status, icon, spacing, radius, shadow, motion, size, all.",
        inputSchema: {
          type: "object",
          properties: {
            category: {
              type: "string",
              description: "Token category: text | background | action | border | status | icon | spacing | radius | shadow | motion | size | all",
              default: "all",
            },
          },
        },
      },
      {
        name: "search_ds",
        description:
          "Full-text search across all DS docs (tokens, components, patterns, template, guide, enforcement). Returns the top 5 most relevant sections for the query.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search terms, e.g. 'badge status variant' or 'table header background'",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "get_cheatsheet",
        description:
          "Get the compact DS quick-reference card: all token categories at a glance, the decision tree, and the forbidden-class list. Use at the start of a new component or page.",
        inputSchema: { type: "object", properties: {} },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        // ── build_page ──────────────────────────────────────────────────────────
        case "build_page": {
          const command = (args?.command as string)?.trim();
          if (!command) throw new McpError(ErrorCode.InvalidParams, "command is required");

          const result = buildPage(command);
          const out = [
            `## Generated: ${result.description}`,
            `**Save to:** \`${result.filePath}\``,
            ``,
            `\`\`\`tsx`,
            result.code.trim(),
            `\`\`\``,
          ].join("\n");
          return { content: [{ type: "text", text: out }] };
        }

        // ── validate_code ───────────────────────────────────────────────────────
        case "validate_code": {
          const code = args?.code as string;
          if (!code) throw new McpError(ErrorCode.InvalidParams, "code is required");

          const { fixed, fixes, clean } = autoFix(code);

          if (clean) {
            return { content: [{ type: "text", text: "✓ No DS violations — code is clean." }] };
          }

          const summary = fixes.map((f) => `  ${f.from}  →  ${f.to}`).join("\n");
          const out = [
            `## Auto-fixed ${fixes.length} violation(s)`,
            ``,
            `**Substitutions applied:**`,
            summary,
            ``,
            `**Fixed code:**`,
            `\`\`\`tsx`,
            fixed.trim(),
            `\`\`\``,
          ].join("\n");
          return { content: [{ type: "text", text: out }] };
        }

        // ── get_component ───────────────────────────────────────────────────────
        case "get_component": {
          const input = (args?.name as string)?.toLowerCase().trim();
          if (!input) throw new McpError(ErrorCode.InvalidParams, "name is required");

          if (input === "list") {
            const all = listSections(DOCS.components, 2);
            return { content: [{ type: "text", text: `Available components (${all.length}):\n\n${all.map((c) => `- ${c}`).join("\n")}` }] };
          }

          let section = extractSection(DOCS.components, input, 2);
          if (!section) {
            const all = listSections(DOCS.components, 2);
            const matches = all.filter((s) => wordsMatch(s, input));
            if (matches.length === 0)
              return { content: [{ type: "text", text: `Component "${input}" not found.\nAvailable: ${all.join(", ")}` }] };
            if (matches.length > 1)
              return { content: [{ type: "text", text: `Multiple matches: ${matches.join(", ")}\nBe more specific.` }] };
            section = extractSection(DOCS.components, matches[0], 2);
          }
          return { content: [{ type: "text", text: section ?? "[Could not extract section]" }] };
        }

        // ── get_pattern ─────────────────────────────────────────────────────────
        case "get_pattern": {
          const input = (args?.name as string)?.toLowerCase().trim();
          if (!input) throw new McpError(ErrorCode.InvalidParams, "name is required");

          if (input === "list") {
            const all = listSections(DOCS.patterns, 2);
            return { content: [{ type: "text", text: `Available patterns (${all.length}):\n\n${all.map((p) => `- ${p}`).join("\n")}` }] };
          }

          let section = extractSection(DOCS.patterns, input, 2);
          if (!section) {
            const all = listSections(DOCS.patterns, 2);
            const matches = all.filter((s) => wordsMatch(s, input));
            if (matches.length === 0)
              return { content: [{ type: "text", text: `Pattern "${input}" not found.\nAvailable: ${all.join(", ")}` }] };
            if (matches.length > 1)
              return { content: [{ type: "text", text: `Multiple matches: ${matches.join(", ")}\nBe more specific.` }] };
            section = extractSection(DOCS.patterns, matches[0], 2);
          }
          return { content: [{ type: "text", text: section ?? "[Could not extract section]" }] };
        }

        // ── get_tokens ──────────────────────────────────────────────────────────
        case "get_tokens": {
          const category = ((args?.category as string) ?? "all").trim();
          return { content: [{ type: "text", text: getTokenContent(category) }] };
        }

        // ── search_ds ───────────────────────────────────────────────────────────
        case "search_ds": {
          const query = (args?.query as string)?.trim();
          if (!query) throw new McpError(ErrorCode.InvalidParams, "query is required");
          return { content: [{ type: "text", text: searchDocs(query) }] };
        }

        // ── get_cheatsheet ──────────────────────────────────────────────────────
        case "get_cheatsheet": {
          return { content: [{ type: "text", text: CHEAT_SHEET }] };
        }

        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }
    } catch (err) {
      if (err instanceof McpError) throw err;
      throw new McpError(ErrorCode.InternalError, `Tool error: ${String(err)}`);
    }
  });

  return server;
}

// ── Start ─────────────────────────────────────────────────────────────────────

function parsePort(value: string | undefined): number {
  const raw = value ?? "3000";
  const port = Number.parseInt(raw, 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535 || String(port) !== raw.trim())
    throw new Error(`Invalid PORT "${raw}". Use an integer 1–65535.`);
  return port;
}

function sendJson(res: import("node:http").ServerResponse, statusCode: number, body: unknown) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function getBearerToken(): string {
  const token = process.env.MCP_BEARER_TOKEN?.trim();
  if (!token) throw new Error("MCP_BEARER_TOKEN is required when MCP_TRANSPORT=http.");
  return token;
}

function isAuthorized(req: import("node:http").IncomingMessage, expectedToken: string): boolean {
  const auth = req.headers.authorization;
  const match = auth?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() === expectedToken;
}

function sendUnauthorized(res: import("node:http").ServerResponse) {
  res.setHeader("WWW-Authenticate", 'Bearer realm="ds-shadcn-mcp"');
  sendJson(res, 401, { jsonrpc: "2.0", error: { code: -32001, message: "Unauthorized." }, id: null });
}

async function startStdioServer() {
  const server = createDsServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`DS v1.2 MCP server (v2) running on stdio — docs: ${MCP_DIR}`);
}

function startHttpServer() {
  const port = parsePort(process.env.PORT);
  const host = process.env.HOST ?? "0.0.0.0";
  const mcpPath = process.env.MCP_PATH ?? "/mcp";
  const bearerToken = getBearerToken();

  const httpServer = createHttpServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

    if (url.pathname === "/health") {
      sendJson(res, 200, { status: "ok", transport: "http", version: "2.0.0" });
      return;
    }
    if (url.pathname !== mcpPath) { sendJson(res, 404, { error: "Not found" }); return; }
    if (!isAuthorized(req, bearerToken)) { sendUnauthorized(res); return; }
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      sendJson(res, 405, { jsonrpc: "2.0", error: { code: -32000, message: "Use POST." }, id: null });
      return;
    }

    const server = createDsServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => { void transport.close(); void server.close(); });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch (err) {
      console.error("HTTP MCP request failed:", err);
      if (!res.headersSent)
        sendJson(res, 500, { jsonrpc: "2.0", error: { code: -32603, message: "Internal error" }, id: null });
    }
  });

  httpServer.listen(port, host, () => {
    console.error(`DS v1.2 MCP server (v2) on http://${host}:${port}${mcpPath} — docs: ${MCP_DIR}`);
  });

  for (const signal of ["SIGINT", "SIGTERM"] as const)
    process.on(signal, () => httpServer.close(() => process.exit(0)));
}

async function main() {
  const transport = (process.env.MCP_TRANSPORT ?? (process.env.PORT ? "http" : "stdio")).toLowerCase();
  if (transport === "http" || transport === "streamable-http") { startHttpServer(); return; }
  if (transport !== "stdio") throw new Error(`Unsupported MCP_TRANSPORT "${transport}". Use "stdio" or "http".`);
  await startStdioServer();
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
