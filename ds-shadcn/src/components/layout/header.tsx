"use client";

/**
 * Header — Top Navigation Bar
 * Design System v1.2 · Next.js compatible
 *
 * Usage in Next.js app/layout.tsx:
 *   import { Header } from "@/components/layout/header";
 *   <Header
 *     appName="AppName"
 *     workspaceName="My Workspace"
 *     user={{ name: "Musama O.", initials: "MO", avatarUrl: "/avatar.jpg" }}
 *     onSearch={(q) => console.log(q)}
 *   />
 *
 * Tokens used:
 *   bg-surface-elevated   → white topbar, same plane as the sidebar
 *   text-text-primary     → primary label colour
 *   border-border-default → bottom rule separating bar from canvas
 *   bg-action-primary     → primary accent for logo bg
 */

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  ChevronDown,
  Search,
  Settings,
  LogOut,
  User,
  CreditCard,
  LifeBuoy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* ── Types ──────────────────────────────────────────────────── */

export interface HeaderUser {
  name: string;
  email?: string;
  initials: string;
  avatarUrl?: string;
}

export interface HeaderWorkspace {
  name: string;
  /** Optional list of workspaces for the switcher dropdown */
  items?: { id: string; name: string; href: string }[];
}

export interface HeaderProps {
  /** App / product name shown next to the logo */
  appName?: string;
  /** Logo — pass a React node (image, icon, text). Defaults to a coloured square. */
  logo?: React.ReactNode;
  /** Active workspace info */
  workspace?: HeaderWorkspace;
  /** Logged-in user */
  user?: HeaderUser;
  /** Called when the user types in the global search box */
  onSearch?: (query: string) => void;
  /** Called when the user clicks "Sign out" */
  onSignOut?: () => void;
  /** Called when the user clicks Settings icon */
  onSettings?: () => void;
  /** Called when the user clicks Notifications */
  onNotifications?: () => void;
  /** Show notification dot on the bell */
  hasNotifications?: boolean;
  /** Extra items injected into the right side before the icon cluster */
  actions?: React.ReactNode;
  className?: string;
}

/* ── Component ───────────────────────────────────────────────── */

export function Header({
  appName = "App",
  logo,
  workspace,
  user,
  onSearch,
  onSignOut,
  onSettings,
  onNotifications,
  hasNotifications = false,
  actions,
  className,
}: HeaderProps) {
  const [searchValue, setSearchValue] = React.useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    onSearch?.(e.target.value);
  };

  return (
    <TooltipProvider>
      <header
        className={cn(
          // Layout
          "flex items-center justify-between shrink-0 h-14",
          "px-6",
          // Colours — white bar on the same plane as the sidebar
          "bg-surface-elevated text-text-primary",
          "border-b border-border-default",
          // Stacking
          "z-sticky",
          className
        )}
      >
        {/* ── Left: Logo + Workspace switcher ──────────────── */}
        <div className="flex items-center gap-inline-lg">

          {/* Logo + App name */}
          <Link
            href="/"
            className="flex items-center gap-inline-sm text-base font-bold text-text-primary hover:opacity-90 transition-opacity duration-fast"
          >
            {logo ?? (
              <span className="w-8 h-8 rounded-control bg-action-primary flex items-center justify-center text-text-on-accent text-xs font-bold shrink-0">
                {appName.charAt(0).toUpperCase()}
              </span>
            )}
            <span>{appName}</span>
          </Link>

          {/* Workspace switcher */}
          {workspace && (
            workspace.items?.length ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-inline-xs text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-action-ghost-hover px-3 py-1.5 rounded-control transition-colors duration-fast">
                    {workspace.name}
                    <ChevronDown className="w-4 h-4 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52">
                  <DropdownMenuLabel>Switch workspace</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {workspace.items.map((ws) => (
                    <DropdownMenuItem key={ws.id} asChild>
                      <Link href={ws.href}>{ws.name}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <span className="flex items-center gap-inline-xs text-sm font-medium text-text-secondary px-3 py-1.5">
                {workspace.name}
                <ChevronDown className="w-4 h-4 opacity-60" />
              </span>
            )
          )}
        </div>

        {/* ── Right: Search + Actions + Icons + User ────────── */}
        <div className="flex items-center gap-inline-md">

          {/* Global search */}
          <div className="relative hidden md:flex items-center">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-icon-muted pointer-events-none" />
            <input
              type="search"
              value={searchValue}
              onChange={handleSearch}
              placeholder="Search…"
              aria-label="Global search"
              className={cn(
                "h-9 w-56 lg:w-72 rounded-control",
                "border border-border-default bg-surface-sunken",
                "pl-9 pr-10 text-sm",
                "text-text-primary placeholder:text-text-placeholder",
                "focus:outline-none focus:ring-1 focus:ring-border-focus focus:border-border-hover",
                "transition-colors duration-fast"
              )}
            />
            <kbd className="absolute right-3 hidden lg:inline-flex items-center text-[10px] text-text-muted font-mono pointer-events-none">
              ⌘K
            </kbd>
          </div>

          {/* Caller-supplied actions slot */}
          {actions}

          {/* Divider */}
          <div className="h-5 w-px bg-bg-secondary" aria-hidden />

          {/* Settings icon */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onSettings}
                aria-label="Settings"
                className="p-2 rounded-control text-icon-default hover:text-text-primary hover:bg-action-ghost-hover transition-colors duration-fast"
              >
                <Settings className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>

          {/* Notifications */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onNotifications}
                aria-label={hasNotifications ? "Notifications (unread)" : "Notifications"}
                className="relative p-2 rounded-control text-icon-default hover:text-text-primary hover:bg-action-ghost-hover transition-colors duration-fast"
              >
                <Bell className="w-5 h-5" />
                {hasNotifications && (
                  <span
                    className="absolute top-1.5 right-1.5 w-2 h-2 rounded-pill bg-action-destructive"
                    aria-hidden
                  />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>Notifications</TooltipContent>
          </Tooltip>

          {/* User menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="User menu"
                  className="flex items-center gap-inline-sm ml-1 rounded-control hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-focus transition-opacity duration-fast"
                >
                  <Avatar className="w-8 h-8 border border-border-default">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback className="bg-action-primary text-text-on-accent text-xs font-medium">
                      {user.initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-stack-xs">
                    <p className="text-sm font-medium text-text-primary">{user.name}</p>
                    {user.email && (
                      <p className="text-xs text-text-muted truncate">{user.email}</p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/billing">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Billing
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/support">
                    <LifeBuoy className="w-4 h-4 mr-2" />
                    Support
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-status-error-fg focus:text-status-error-fg focus:bg-status-error-bg"
                  onClick={onSignOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>
    </TooltipProvider>
  );
}
