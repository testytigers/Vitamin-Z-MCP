import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  [
    "relative w-full rounded-card border p-[var(--spacing-component-px)]",
    "[&>svg~*]:ps-7 [&>svg+div]:translate-y-[-3px]",
    "[&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4",
  ],
  {
    variants: {
      variant: {
        default:     "border-default bg-canvas text-primary [&>svg]:text-icon-default",
        destructive: "border-status-error-border bg-status-error-bg text-status-error-fg [&>svg]:text-status-error-fg",
        success:     "border-status-success-border bg-status-success-bg text-status-success-fg [&>svg]:text-status-success-fg",
        warning:     "border-status-warning-border bg-status-warning-bg text-status-warning-fg [&>svg]:text-status-warning-fg",
        info:        "border-status-info-border bg-status-info-bg text-status-info-fg [&>svg]:text-status-info-fg",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

/**
 * Status variants supply their icon automatically.
 *
 * The variant styles used to only *position* a `<svg>` the caller passed in, so
 * an Alert rendered without one conveyed its state through colour alone. The
 * status foregrounds are close under colour-vision deficiency — error vs warning
 * measures ΔE 4.8 under deuteranopia — which makes that a WCAG 1.4.1 failure.
 *
 * The icon is decorative (`aria-hidden`); `role="alert"` plus the title and
 * description already convey the state to assistive tech. Pass `icon={false}` to
 * opt out, or a node to override.
 */
const ALERT_ICONS = {
  success: CheckCircle2,
  warning: AlertTriangle,
  destructive: XCircle,
  info: Info,
} as const;

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  icon?: React.ReactNode | false;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, icon, children, ...props }, ref) => {
    const AutoIcon =
      variant && variant in ALERT_ICONS
        ? ALERT_ICONS[variant as keyof typeof ALERT_ICONS]
        : null;
    const leading =
      icon === false
        ? null
        : icon !== undefined
          ? icon
          : AutoIcon
            ? <AutoIcon className="w-4 h-4" aria-hidden="true" />
            : null;
    return (
      <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
        {leading}
        {children}
      </div>
    );
  }
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <h5 ref={ref} className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props} />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
