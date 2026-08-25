import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[80px] w-full rounded-control resize-y",
        "border border-border-default bg-surface-canvas",
        "px-[var(--control-px-md)] py-[var(--control-py-md)]",
        "text-sm text-text-primary placeholder:text-text-placeholder",
        "transition-[border-color,box-shadow] duration-fast",
        "hover:border-border-hover",
        "focus-visible:outline-none focus-visible:border-border-focus focus-visible:shadow-focus",
        "disabled:bg-bg-disabled disabled:text-text-disabled disabled:cursor-not-allowed",
        error && "border-border-error focus-visible:border-border-error",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export { Textarea };
