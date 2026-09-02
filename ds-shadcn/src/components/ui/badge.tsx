import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  [
    "inline-flex items-center gap-inline-xs rounded-pill",
    "px-[var(--spacing-chip-px)] py-[var(--spacing-chip-py)]",
    "text-xs font-medium leading-none",
    "transition-colors duration-fast",
  ],
  {
    variants: {
      variant: {
        default:     "bg-secondary text-primary",
        secondary:   "bg-secondary text-secondary",
        destructive: "bg-status-error-bg text-status-error-fg border border-status-error-border",
        success:     "bg-status-success-bg text-status-success-fg border border-status-success-border",
        warning:     "bg-status-warning-bg text-status-warning-fg border border-status-warning-border",
        info:        "bg-status-info-bg text-status-info-fg border border-status-info-border",
        outline:     "border border-default text-primary bg-transparent",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

/**
 * Status variants carry an icon by default.
 *
 * WCAG 1.4.1 (Use of Color): colour must not be the only means of conveying
 * information. The status foregrounds are close enough under colour-vision
 * deficiency to be indistinguishable — measured ΔE 4.8 for error vs warning
 * under deuteranopia, 8.7 for error vs success in dark mode — so a success
 * badge and an error badge looked identical to some users.
 *
 * The icon is decorative (aria-hidden): the badge's text already names the
 * state, so announcing the icon too would be redundant for screen readers.
 * It exists to give sighted users a second, non-colour channel.
 *
 * Pass `icon={false}` only where the surrounding context already supplies a
 * non-colour signal.
 */
const STATUS_ICONS = {
  success: CheckCircle2,
  warning: AlertTriangle,
  destructive: XCircle,
  info: Info,
} as const;

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** Override the automatic status icon, or pass `false` to omit it. */
  icon?: React.ReactNode | false;
}

function Badge({ className, variant, icon, children, ...props }: BadgeProps) {
  const AutoIcon =
    variant && variant in STATUS_ICONS
      ? STATUS_ICONS[variant as keyof typeof STATUS_ICONS]
      : null;

  const leading =
    icon === false
      ? null
      : icon !== undefined
        ? icon
        : AutoIcon
          ? <AutoIcon className="w-3 h-3 shrink-0" aria-hidden="true" />
          : null;

  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {leading}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
