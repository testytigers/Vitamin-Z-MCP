"use client";

/**
 * Sidebar — Left Navigation Panel
 * Design System v1.2 · Next.js compatible
 *
 * Usage in Next.js layout:
 *   import { Sidebar } from "@/components/layout/sidebar";
 *
 *   const nav: NavSection[] = [
 *     {
 *       items: [{ label: "Overview", href: "/dashboard", icon: Home }],
 *     },
 *     {
 *       label: "Workspace",
 *       items: [
 *         { label: "Projects",  href: "/projects",  icon: Layers, badge: 3 },
 *         { label: "Resources", href: "/resources", icon: Box },
 *       ],
 *     },
 *     {
 *       label: "Manage",
 *       items: [
 *         { label: "Reports",       href: "/reports",       icon: PieChart },
 *         { label: "Configuration", href: "/configuration", icon: Settings },
 *       ],
 *     },
 *   ];
 *
 *   <Sidebar
 *     nav={nav}
 *     upsell={{
 *       title: "Upgrade to Pro",
 *       description: "Unlock unlimited projects and advanced analytics.",
 *       cta: "Upgrade",
 *       href: "/billing",
 *     }}
 *   />
 *
 * Tokens:
 *   bg-elevated   → white (light) / slate-900 (dark)
 *   border-default → auto
 *   bg-action-primary-subtle + text-action-primary → active nav item
 *   bg-action-ghost-hover → hover state
 *   text-secondary   → inactive nav text
 *   text-icon-muted       → inactive nav icon
 */

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

/* ── Types ──────────────────────────────────────────────────── */

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Numeric badge shown on the right (e.g. unread count) */
  badge?: number;
  /** If true, item is always highlighted regardless of route */
  exact?: boolean;
  /** Disable this nav item */
  disabled?: boolean;
}

export interface NavSection {
  /** Section heading (omit for the first ungrouped section) */
  label?: string;
  items: NavItem[];
}

export interface SidebarUpsell {
  title: string;
  description: string;
  cta: string;
  href?: string;
  onClick?: () => void;
}

export interface SidebarProps {
  nav: NavSection[];
  /** Promotional card at the bottom of the sidebar */
  upsell?: SidebarUpsell;
  /** Footer slot — rendered above the upsell */
  footer?: React.ReactNode;
  className?: string;
}

/* ── Sub-components ─────────────────────────────────────────── */

interface NavItemProps {
  item: NavItem;
  isActive: boolean;
}

function SidebarNavItem({ item, isActive }: NavItemProps) {
  const Icon = item.icon;

  const classes = cn(
    // Layout
    "flex items-center justify-between w-full",
    "px-3 py-2 rounded-control",
    // Typography
    "text-sm font-medium",
    // Transition
    "transition-colors duration-fast",
    // States
    isActive
      ? "bg-action-primary-subtle text-action-primary"
      : "text-secondary hover:bg-action-ghost-hover hover:text-primary",
    item.disabled && "pointer-events-none opacity-50"
  );

  const inner = (
    <>
      <span className="flex items-center gap-inline-md">
        <Icon
          className={cn(
            "w-4 h-4 shrink-0",
            isActive ? "text-action-primary" : "text-icon-muted"
          )}
          aria-hidden
        />
        {item.label}
      </span>
      {item.badge !== undefined && (
        <Badge
          variant={isActive ? "default" : "outline"}
          className="ml-auto text-xs tabular-nums"
        >
          {item.badge}
        </Badge>
      )}
    </>
  );

  if (item.disabled) {
    return <div className={classes} aria-disabled="true">{inner}</div>;
  }

  return (
    <Link href={item.href} className={classes}>
      {inner}
    </Link>
  );
}

/* ── Main Component ─────────────────────────────────────────── */

export function Sidebar({ nav, upsell, footer, className }: SidebarProps) {
  const pathname = usePathname();

  /**
   * Determine active item:
   * - exact match: pathname === item.href
   * - prefix match (default): pathname.startsWith(item.href) unless href is "/"
   */
  function isActive(item: NavItem): boolean {
    if (item.exact || item.href === "/") {
      return pathname === item.href;
    }
    return pathname === item.href || pathname.startsWith(item.href + "/");
  }

  return (
    <aside
      className={cn(
        // Layout
        "w-64 shrink-0 flex flex-col overflow-y-auto",
        // Colours
        "bg-elevated",
        "border-r border-default",
        className
      )}
    >
      {/* ── Navigation ─────────────────────────────────────── */}
      <nav className="flex-1 p-4" aria-label="Main navigation">
        {nav.map((section, sectionIdx) => (
          <div key={sectionIdx}>
            {/* Section heading */}
            {section.label && (
              <p className="pt-6 pb-1 px-3 text-xs font-semibold text-muted uppercase tracking-wider select-none">
                {section.label}
              </p>
            )}

            {/* Items */}
            <ul className="space-y-stack-xs" role="list">
              {section.items.map((item) => (
                <li key={item.href}>
                  <SidebarNavItem item={item} isActive={isActive(item)} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── Footer slot ────────────────────────────────────── */}
      {footer && (
        <div className="px-4 pb-2">
          <Separator className="mb-4" />
          {footer}
        </div>
      )}

      {/* ── Upsell card ────────────────────────────────────── */}
      {upsell && (
        <div className="p-4 border-t border-default">
          <Card className="shadow-none bg-secondary">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-primary mb-stack-xs">
                {upsell.title}
              </p>
              <p className="text-xs text-secondary mb-stack-lg leading-relaxed">
                {upsell.description}
              </p>
              {upsell.href ? (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={upsell.href}>{upsell.cta}</Link>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={upsell.onClick}
                >
                  {upsell.cta}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </aside>
  );
}
