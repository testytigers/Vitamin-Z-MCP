import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["selector", "[data-appearance='dark']"],
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "action-primary": "var(--color-action-primary-bg)",
        "action-primary-hover": "var(--color-action-primary-bg-hover)",
        "action-primary-active": "var(--color-action-primary-bg-active)",
        "action-primary-disabled": "var(--color-action-primary-bg-disabled)",
        "action-primary-subtle": "var(--color-action-primary-bg-subtle)",
        "action-primary-tint": "var(--color-action-primary-bg-tint)",
        "action-secondary": "var(--color-action-secondary-bg)",
        "action-secondary-hover": "var(--color-action-secondary-bg-hover)",
        "action-secondary-active": "var(--color-action-secondary-bg-active)",
        "action-ghost-hover": "var(--color-action-ghost-bg-hover)",
        "action-ghost-active": "var(--color-action-ghost-bg-active)",
        "action-destructive": "var(--color-action-destructive-bg)",
        "action-destructive-hover": "var(--color-action-destructive-bg-hover)",
        "action-destructive-active": "var(--color-action-destructive-bg-active)",
        "status-error-fg": "var(--color-status-error-fg)",
        "status-error-bg": "var(--color-status-error-bg)",
        "status-error-border": "var(--color-status-error-border)",
        "status-success-fg": "var(--color-status-success-fg)",
        "status-success-bg": "var(--color-status-success-bg)",
        "status-success-border": "var(--color-status-success-border)",
        "status-warning-fg": "var(--color-status-warning-fg)",
        "status-warning-bg": "var(--color-status-warning-bg)",
        "status-warning-border": "var(--color-status-warning-border)",
        "status-info-fg": "var(--color-status-info-fg)",
        "status-attention-fg": "var(--color-status-attention-fg)",
        "status-info-bg": "var(--color-status-info-bg)",
        "status-info-border": "var(--color-status-info-border)",
        "icon-default": "var(--color-icon-default)",
        "icon-muted": "var(--color-icon-muted)",
        "icon-on-accent": "var(--color-icon-on-accent)",
        "icon-interactive": "var(--color-icon-interactive)",
        "icon-disabled": "var(--color-icon-disabled)",
        "chart-primary": "var(--color-chart-primary)",
        "chart-secondary": "var(--color-chart-secondary)",
        "chart-accent": "var(--color-chart-accent)",
        "chart-muted": "var(--color-chart-muted)",
        "chart-cat-1": "var(--color-chart-cat-1)",
        "chart-cat-2": "var(--color-chart-cat-2)",
        "chart-cat-3": "var(--color-chart-cat-3)",
        "chart-cat-4": "var(--color-chart-cat-4)",
        "chart-cat-5": "var(--color-chart-cat-5)",
        "chart-cat-6": "var(--color-chart-cat-6)",
        "chart-cat-7": "var(--color-chart-cat-7)",
        "chart-cat-8": "var(--color-chart-cat-8)",
        "chart-seq-1": "var(--color-chart-seq-1)",
        "chart-seq-2": "var(--color-chart-seq-2)",
        "chart-seq-3": "var(--color-chart-seq-3)",
        "chart-seq-4": "var(--color-chart-seq-4)",
        "chart-seq-5": "var(--color-chart-seq-5)",
        "chart-grid": "var(--color-chart-grid)",
        "chart-axis": "var(--color-chart-axis)",
      },

      /* Text colours live in textColor so the class reads text-primary,
         not text-text-primary. Same tokens, no stutter. */
      textColor: {
        "primary": "var(--color-text-primary)",
        "strong": "var(--color-text-strong)",
        "secondary": "var(--color-text-secondary)",
        "subtle": "var(--color-text-subtle)",
        "tertiary": "var(--color-text-tertiary)",
        "muted": "var(--color-text-muted)",
        "disabled": "var(--color-text-disabled)",
        "on-accent": "var(--color-text-on-accent)",
        "on-destructive": "var(--color-text-on-destructive)",
        "on-inverse": "var(--color-text-on-inverse)",
        "link": "var(--color-text-link)",
        "placeholder": "var(--color-text-placeholder)",
      },

      /* Surfaces and tonal fills merged — they overlapped (surface-canvas,
         surface-elevated and bg-primary were all white). */
      backgroundColor: {
        "canvas": "var(--color-surface-canvas)",
        "elevated": "var(--color-surface-elevated)",
        "overlay": "var(--color-surface-overlay)",
        "sunken": "var(--color-surface-sunken)",
        "popover": "var(--color-surface-popover)",
        "secondary": "var(--color-bg-secondary)",
        "tertiary": "var(--color-bg-tertiary)",
        "disabled": "var(--color-bg-disabled)",
        "inverse": "var(--color-bg-inverse)",
      },

      borderColor: {
        "subtle": "var(--color-border-subtle)",
        "default": "var(--color-border-default)",
        "hover": "var(--color-border-hover)",
        "focus": "var(--color-border-focus)",
        "disabled": "var(--color-border-disabled)",
        "error": "var(--color-border-error)",
        "success": "var(--color-border-success)",
        "canvas": "var(--color-surface-canvas)",
        "elevated": "var(--color-surface-elevated)",
      },

      ringColor: {
        "subtle": "var(--color-border-subtle)",
        "default": "var(--color-border-default)",
        "hover": "var(--color-border-hover)",
        "focus": "var(--color-border-focus)",
        "disabled": "var(--color-border-disabled)",
        "error": "var(--color-border-error)",
        "success": "var(--color-border-success)",
      },

      divideColor: {
        "subtle": "var(--color-border-subtle)",
        "default": "var(--color-border-default)",
        "hover": "var(--color-border-hover)",
        "focus": "var(--color-border-focus)",
        "disabled": "var(--color-border-disabled)",
        "error": "var(--color-border-error)",
        "success": "var(--color-border-success)",
      },

      borderRadius: {
        control: "var(--radius-control)",
        card:    "var(--radius-card)",
        overlay: "var(--radius-overlay)",
        pill:    "var(--radius-pill)",
      },

      boxShadow: {
        control: "var(--shadow-control)",
        card:    "var(--shadow-card)",
        popover: "var(--shadow-popover)",
        overlay: "var(--shadow-overlay)",
        focus:   "var(--focus-ring-shadow)",
      },

      fontFamily: {
        sans:  "var(--_font-sans)",
        mono:  "var(--_font-mono)",
        serif: "var(--_font-serif)",
      },

      fontSize: {
        xs:   ["var(--_font-size-xs)",   { lineHeight: "var(--_line-height-normal)" }],
        sm:   ["var(--_font-size-sm)",   { lineHeight: "var(--_line-height-normal)" }],
        base: ["var(--_font-size-base)", { lineHeight: "var(--_line-height-normal)" }],
        lg:   ["var(--_font-size-lg)",   { lineHeight: "var(--_line-height-relaxed)" }],
        xl:   ["var(--_font-size-xl)",   { lineHeight: "var(--_line-height-snug)" }],
        "2xl":["var(--_font-size-2xl)",  { lineHeight: "var(--_line-height-snug)" }],
        "3xl":["var(--_font-size-3xl)",  { lineHeight: "var(--_line-height-tight)" }],
        "4xl":["var(--_font-size-4xl)",  { lineHeight: "var(--_line-height-tight)" }],
        "5xl":["var(--_font-size-5xl)",  { lineHeight: "var(--_line-height-tight)" }],
      },

      transitionDuration: {
        fast:      "var(--_duration-fast)",
        normal:    "var(--_duration-normal)",
        slow:      "var(--_duration-slow)",
        deliberate:"var(--_duration-deliberate)",
      },

      transitionTimingFunction: {
        /* Keys are unprefixed so the classes read `ease-out`, not `ease-ease-out`.
           These override Tailwind's built-ins, whose curves are identical to the DS
           tokens — so the rename is visually a no-op. The `ease-ease-*` names are
           retained as deprecated aliases; drop them once no source uses them. */
        out:           "var(--_easing-ease-out)",
        in:            "var(--_easing-ease-in)",
        "in-out":      "var(--_easing-ease-in-out)",
        spring:        "var(--_easing-spring)",
        "ease-out":    "var(--_easing-ease-out)",
        "ease-in":     "var(--_easing-ease-in)",
        "ease-in-out": "var(--_easing-ease-in-out)",
      },

      zIndex: {
        dropdown: "var(--z-dropdown)",
        sticky:   "var(--z-sticky)",
        overlay:  "var(--z-overlay)",
        modal:    "var(--z-modal)",
        popover:  "var(--z-popover)",
        toast:    "var(--z-toast)",
        tooltip:  "var(--z-tooltip)",
      },

      spacing: {
        "stack-xs":  "var(--spacing-stack-xs)",
        "stack-sm":  "var(--spacing-stack-sm)",
        "stack-md":  "var(--spacing-stack-md)",
        "stack-lg":  "var(--spacing-stack-lg)",
        "stack-xl":  "var(--spacing-stack-xl)",
        "stack-2xl": "var(--spacing-stack-2xl)",
        "inline-xs": "var(--spacing-inline-xs)",
        "inline-sm": "var(--spacing-inline-sm)",
        "inline-md": "var(--spacing-inline-md)",
        "inline-lg": "var(--spacing-inline-lg)",
        "comp-px":   "var(--spacing-component-px)",
        "comp-py":   "var(--spacing-component-py)",
        "cont-px":   "var(--spacing-container-px)",
      },

      height: {
        "control-sm": "var(--control-height-sm)",
        "control-md": "var(--control-height-md)",
        "control-lg": "var(--control-height-lg)",
      },

      minHeight: {
        "control-sm": "var(--control-height-sm)",
        "control-md": "var(--control-height-md)",
        "control-lg": "var(--control-height-lg)",
      },
    },
  },
  plugins: [],
};

export default config;
