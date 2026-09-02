import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const Sheet        = DrawerPrimitive.Root;
const SheetTrigger = DrawerPrimitive.Trigger;
const SheetClose   = DrawerPrimitive.Close;
const SheetPortal  = DrawerPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-[var(--z-overlay)] bg-black/50 backdrop-blur-sm",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
SheetOverlay.displayName = "SheetOverlay";

const sheetVariants = cva(
  [
    "fixed z-[var(--z-modal)] p-6",
    "bg-overlay border-default shadow-overlay",
    "transition-transform duration-normal ease-ease-in-out",
    "data-[state=open]:animate-in data-[state=closed]:animate-out",
  ],
  {
    /* rtl-exempt: the `side` prop names a physical edge, so these insets and
       the slide keyframes paired with them are physical on purpose. A caller
       that wants mirroring passes side={isRTL ? "right" : "left"}. */
    variants: {
      side: {
        top:    "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top    data-[state=open]:slide-in-from-top",
        bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left:   "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left  data-[state=open]:slide-in-from-left  sm:max-w-sm",
        right:  "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: { side: "right" },
  }
);

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      <DrawerPrimitive.Close className={cn(
        "absolute end-4 top-4 rounded-sm",
        "text-icon-muted hover:text-icon-default",
        "transition-colors duration-fast",
        "focus-visible:outline-none focus-visible:shadow-focus"
      )}>
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DrawerPrimitive.Close>
      {children}
    </DrawerPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = "SheetContent";

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col gap-stack-xs text-center sm:text-left", className)} {...props} />
);
SheetHeader.displayName = "SheetHeader";

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end gap-inline-sm mt-auto", className)} {...props} />
);
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title ref={ref} className={cn("text-lg font-semibold text-primary", className)} {...props} />
));
SheetTitle.displayName = "SheetTitle";

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description ref={ref} className={cn("text-sm text-secondary", className)} {...props} />
));
SheetDescription.displayName = "SheetDescription";

export {
  Sheet, SheetTrigger, SheetClose, SheetPortal, SheetOverlay, SheetContent,
  SheetHeader, SheetFooter, SheetTitle, SheetDescription,
};
