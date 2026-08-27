import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-inline-sm",
    "font-medium rounded-control",
    "transition-[background-color,color,border-color,box-shadow] duration-fast ease-ease-out",
    "focus-visible:outline-none focus-visible:shadow-focus",
    "disabled:pointer-events-none",
    "whitespace-nowrap select-none",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-action-primary text-on-accent shadow-control",
          "hover:bg-action-primary-hover",
          "active:bg-action-primary-active",
          "disabled:bg-action-primary-disabled disabled:text-disabled disabled:shadow-none",
        ],
        secondary: [
          "bg-action-secondary text-primary",
          "hover:bg-action-secondary-hover",
          "active:bg-action-secondary-active",
          "disabled:bg-action-primary-disabled disabled:text-disabled",
        ],
        destructive: [
          "bg-action-destructive text-on-destructive",
          "hover:bg-action-destructive-hover",
          "active:bg-action-destructive-active",
          "disabled:bg-action-primary-disabled disabled:text-disabled",
        ],
        outline: [
          "border border-default bg-transparent text-primary",
          "hover:bg-action-ghost-hover hover:border-hover",
          "active:bg-action-ghost-active",
          "disabled:border-disabled disabled:text-disabled",
        ],
        ghost: [
          "bg-transparent text-primary",
          "hover:bg-action-ghost-hover",
          "active:bg-action-ghost-active",
          "disabled:text-disabled",
        ],
        link: [
          "bg-transparent text-link underline-offset-4",
          "hover:text-[var(--color-action-link-text-hover)] hover:underline",
          "disabled:text-disabled",
        ],
      },
      size: {
        sm:   "h-control-sm px-[var(--control-px-sm)]   py-[var(--control-py-sm)]   text-[var(--control-font-sm)]",
        md:   "h-control-md px-[var(--control-px-md)]   py-[var(--control-py-md)]   text-[var(--control-font-md)]",
        lg:   "h-control-lg px-[var(--control-px-lg)]   py-[var(--control-py-lg)]   text-[var(--control-font-lg)]",
        icon: "h-control-md w-[var(--control-height-md)] p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
