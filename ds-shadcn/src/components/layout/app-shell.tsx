/**
 * AppShell — Root Dashboard Layout
 * Design System v1.2 · Next.js compatible
 *
 * This is a Server Component by default (no "use client").
 * Header and Sidebar are Client Components and are imported here.
 *
 * ─── Next.js App Router setup ───────────────────────────────
 *
 * 1. In app/layout.tsx (root layout):
 *
 *    import { AppShell } from "@/components/layout/app-shell";
 *
 *    export default function RootLayout({ children }) {
 *      return (
 *        <html lang="en" data-appearance="light">
 *          <body>
 *            <AppShell
 *              appName="MyApp"
 *              workspace={{ name: "Acme Corp" }}
 *              user={{ name: "Musama O.", initials: "MO", email: "m@acme.com" }}
 *              nav={navConfig}
 *              upsell={upsellConfig}
 *            >
 *              {children}
 *            </AppShell>
 *          </body>
 *        </html>
 *      );
 *    }
 *
 * 2. For dark mode, set data-appearance="dark" on <html>.
 *    For brand mode, add data-brand="brand".
 *    For compact density, add data-density="compact".
 *
 * ─── Visual structure ────────────────────────────────────────
 *
 *  ┌─────────────────────────────────────────────────────────┐
 *  │ AnnouncementBanner (optional, bg-status-info-bg)        │
 *  ├─────────────────────────────────────────────────────────┤
 *  │ Header (bg-inverse, h-14)                            │
 *  ├──────────────┬──────────────────────────────────────────┤
 *  │ Sidebar      │ <main> (bg-sunken, overflow-auto)│
 *  │ (w-64)       │   {children}                             │
 *  └──────────────┴──────────────────────────────────────────┘
 */

import * as React from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Header, type HeaderProps } from "@/components/layout/header";
import { Sidebar, type SidebarProps } from "@/components/layout/sidebar";

/* ── Types ──────────────────────────────────────────────────── */

export interface AnnouncementBannerProps {
  message: React.ReactNode;
  /** @default "info" */
  variant?: "info" | "warning" | "error" | "success";
  /** If provided, renders a CTA link */
  cta?: { label: string; href: string };
}

export interface AppShellProps
  extends Pick<HeaderProps, "appName" | "logo" | "workspace" | "user" | "onSearch" | "onSignOut" | "onSettings" | "onNotifications" | "hasNotifications" | "actions">,
    Pick<SidebarProps, "nav" | "upsell" | "footer"> {
  children: React.ReactNode;
  /** Top-of-page announcement banner */
  announcement?: AnnouncementBannerProps;
  /** Extra class on the <main> element */
  mainClassName?: string;
}

/* ── Announcement Banner ────────────────────────────────────── */

const bannerVariantClasses = {
  info:    "bg-status-info-bg    text-status-info-fg    border-status-info-border",
  warning: "bg-status-warning-bg text-status-warning-fg border-status-warning-border",
  error:   "bg-status-error-bg   text-status-error-fg   border-status-error-border",
  success: "bg-status-success-bg text-status-success-fg border-status-success-border",
} as const;

function AnnouncementBanner({ message, variant = "info", cta }: AnnouncementBannerProps) {
  return (
    <div
      role="banner"
      className={cn(
        "flex items-center justify-center gap-inline-sm",
        "px-4 py-2 text-sm border-b",
        bannerVariantClasses[variant]
      )}
    >
      <Info className="w-4 h-4 shrink-0" aria-hidden />
      <span>
        {message}
        {cta && (
          <>
            {" "}
            <a
              href={cta.href}
              className="underline font-medium hover:opacity-80 transition-opacity duration-fast"
            >
              {cta.label}
            </a>
          </>
        )}
      </span>
    </div>
  );
}

/* ── AppShell ────────────────────────────────────────────────── */

export function AppShell({
  // Header props
  appName,
  logo,
  workspace,
  user,
  onSearch,
  onSignOut,
  onSettings,
  onNotifications,
  hasNotifications,
  actions,
  // Sidebar props
  nav,
  upsell,
  footer,
  // Shell props
  children,
  announcement,
  mainClassName,
}: AppShellProps) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-canvas font-sans">

      {/* ── Announcement Banner ──────────────────────────── */}
      {announcement && <AnnouncementBanner {...announcement} />}

      {/* ── Top Navigation Bar ───────────────────────────── */}
      <Header
        appName={appName}
        logo={logo}
        workspace={workspace}
        user={user}
        onSearch={onSearch}
        onSignOut={onSignOut}
        onSettings={onSettings}
        onNotifications={onNotifications}
        hasNotifications={hasNotifications}
        actions={actions}
      />

      {/* ── Body ─────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <Sidebar nav={nav} upsell={upsell} footer={footer} />

        {/* Main content area */}
        <main
          className={cn(
            "flex-1 overflow-y-auto bg-sunken",
            mainClassName
          )}
        >
          {children}
        </main>

      </div>
    </div>
  );
}

/* ── Page helpers (use inside page.tsx files) ────────────────── */

/**
 * PageContent — constrains width and applies standard page padding.
 * Wrap every dashboard page's content with this.
 *
 * @example
 * export default function DashboardPage() {
 *   return (
 *     <PageContent>
 *       <PageHeader title="Overview" />
 *       ...
 *     </PageContent>
 *   );
 * }
 */
export function PageContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("p-8", className)}>
      <div className="max-w-screen-xl mx-auto space-y-stack-xl">
        {children}
      </div>
    </div>
  );
}

/**
 * PageHeader — standardised page title row with optional CTA slot.
 *
 * @example
 * <PageHeader
 *   title="Projects"
 *   description="Manage and track all your active projects."
 *   actions={<Button variant="primary"><Plus className="w-4 h-4" /> New Project</Button>}
 * />
 */
export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between", className)}>
      <div className="flex flex-col gap-stack-xs">
        {breadcrumb}
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-secondary">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-inline-sm shrink-0 ms-stack-xl">
          {actions}
        </div>
      )}
    </div>
  );
}
