import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  size?: "sm" | "md" | "lg";
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, size = "md", error, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex w-full rounded-control",
        "border border-control bg-canvas",
        "text-primary placeholder:text-placeholder",
        "transition-[border-color,box-shadow] duration-fast ease-ease-out",
        "hover:border-hover",
        "focus-visible:outline-none focus-visible:border-focus focus-visible:shadow-focus",
        "disabled:bg-disabled disabled:text-disabled disabled:cursor-not-allowed",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        size === "sm" && "h-control-sm px-[var(--control-px-sm)] text-[var(--control-font-sm)]",
        size === "md" && "h-control-md px-[var(--control-px-md)] text-[var(--control-font-md)]",
        size === "lg" && "h-control-lg px-[var(--control-px-lg)] text-[var(--control-font-lg)]",
        error && "border-error focus-visible:border-error",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
