import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  [
    "relative w-full rounded-card border p-[var(--spacing-component-px)]",
    "[&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px]",
    "[&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4",
  ],
  {
    variants: {
      variant: {
        default:     "border-border-default bg-surface-canvas text-text-primary [&>svg]:text-icon-default",
        destructive: "border-status-error-border bg-status-error-bg text-status-error-fg [&>svg]:text-status-error-fg",
        success:     "border-status-success-border bg-status-success-bg text-status-success-fg [&>svg]:text-status-success-fg",
        warning:     "border-status-warning-border bg-status-warning-bg text-status-warning-fg [&>svg]:text-status-warning-fg",
        info:        "border-status-info-border bg-status-info-bg text-status-info-fg [&>svg]:text-status-info-fg",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
));
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
