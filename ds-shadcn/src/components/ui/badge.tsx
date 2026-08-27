import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  [
    "inline-flex items-center rounded-pill",
    "px-[var(--_size-2_5)] py-[var(--_size-0_5)]",
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

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
