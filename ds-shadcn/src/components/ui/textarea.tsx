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
        "border border-control bg-canvas",
        "px-[var(--control-px-md)] py-[var(--control-py-md)]",
        "text-sm text-primary placeholder:text-placeholder",
        "transition-[border-color,box-shadow] duration-fast",
        "hover:border-hover",
        "focus-visible:outline-none focus-visible:border-focus focus-visible:shadow-focus",
        "disabled:bg-disabled disabled:text-disabled disabled:cursor-not-allowed",
        error && "border-error focus-visible:border-error",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export { Textarea };
