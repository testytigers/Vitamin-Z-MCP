import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-pill",
      "border-2 border-transparent bg-tertiary",
      "transition-[background-color,box-shadow] duration-fast",
      "focus-visible:outline-none focus-visible:shadow-focus",
      "disabled:cursor-not-allowed disabled:bg-disabled",
      "data-[state=checked]:bg-action-primary",
      className
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        "pointer-events-none block h-4 w-4 rounded-pill",
        "bg-thumb shadow-control ring-0",
        "transition-transform duration-fast",
        "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = SwitchPrimitive.Root.displayName;

export { Switch };
