/**
 * DS v1.2 — Complete shadcn/ui Component Library
 * Token-driven via src/styles/tokens.css
 *
 * Import anything from this single entry point:
 *   import { Button, Calendar, useToast } from "@/components/ui"
 */

// A
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./accordion";
export { Alert, AlertTitle, AlertDescription } from "./alert";
export { Avatar } from "./avatar";
export type { AvatarProps } from "./avatar";

// B
export { Badge, badgeVariants } from "./badge";
export type { BadgeProps } from "./badge";
export {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis,
} from "./breadcrumb";
export { Button, buttonVariants } from "./button";
export type { ButtonProps } from "./button";

// C
export { Calendar } from "./calendar";
export type { CalendarProps } from "./calendar";
export {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
} from "./card";
export {
  Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, useCarousel,
} from "./carousel";
export type { CarouselApi } from "./carousel";
export { Checkbox } from "./checkbox";
export { Collapsible, CollapsibleTrigger, CollapsibleContent } from "./collapsible";
export {
  Command, CommandInput, CommandList, CommandEmpty, CommandGroup,
  CommandItem, CommandSeparator, CommandShortcut,
} from "./command";
export {
  ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem,
  ContextMenuCheckboxItem, ContextMenuRadioItem, ContextMenuLabel,
  ContextMenuSeparator, ContextMenuShortcut, ContextMenuGroup,
  ContextMenuPortal, ContextMenuSub, ContextMenuSubContent,
  ContextMenuSubTrigger, ContextMenuRadioGroup,
} from "./context-menu";

// D
export {
  Dialog, DialogPortal, DialogOverlay, DialogTrigger, DialogClose,
  DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
} from "./dialog";
export {
  Drawer, DrawerTrigger, DrawerPortal, DrawerOverlay, DrawerClose,
  DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription,
} from "./drawer";
export {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuGroup,
  DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent,
  DropdownMenuSubTrigger, DropdownMenuRadioGroup,
} from "./dropdown-menu";

// F
export {
  Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage, useFormField,
} from "./form";

// H
export { HoverCard, HoverCardTrigger, HoverCardContent } from "./hover-card";

// I
export { Input } from "./input";
export type { InputProps } from "./input";
export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "./input-otp";

// L
export { Label } from "./label";

// M
export {
  Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem,
  MenubarCheckboxItem, MenubarRadioItem, MenubarLabel, MenubarSeparator,
  MenubarShortcut, MenubarGroup, MenubarPortal, MenubarSub,
  MenubarSubTrigger, MenubarSubContent, MenubarRadioGroup,
} from "./menubar";

// N
export {
  NavigationMenu, NavigationMenuList, NavigationMenuItem,
  NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink,
  NavigationMenuViewport, NavigationMenuIndicator, navigationMenuTriggerStyle,
} from "./navigation-menu";

// P
export {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis,
} from "./pagination";
export { Popover, PopoverTrigger, PopoverAnchor, PopoverContent } from "./popover";
export { Progress } from "./progress";

// R
export { RadioGroup, RadioGroupItem } from "./radio-group";
export { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "./resizable";

// S
export { ScrollArea, ScrollBar } from "./scroll-area";
export {
  Select, SelectGroup, SelectValue, SelectTrigger, SelectContent,
  SelectLabel, SelectItem, SelectSeparator,
  SelectScrollUpButton, SelectScrollDownButton,
} from "./select";
export { Separator } from "./separator";
export {
  Sheet, SheetTrigger, SheetClose, SheetContent,
  SheetHeader, SheetFooter, SheetTitle, SheetDescription,
} from "./sheet";
export { Skeleton } from "./skeleton";
export { Slider } from "./slider";
export { Switch } from "./switch";

// T
export {
  Table, TableHeader, TableBody, TableFooter,
  TableRow, TableHead, TableCell, TableCaption,
} from "./table";
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";
export { Textarea } from "./textarea";
export type { TextareaProps } from "./textarea";
export {
  ToastProvider, ToastViewport, Toast, ToastAction, ToastClose,
  ToastTitle, ToastDescription, toastVariants,
} from "./toast";
export type { ToastProps, ToastActionElement } from "./toast";
export { useToast, toast } from "./use-toast";
export type { ToasterToast } from "./use-toast";
export { Toggle, toggleVariants } from "./toggle";
export { ToggleGroup, ToggleGroupItem } from "./toggle-group";
export {
  TooltipProvider, Tooltip, TooltipTrigger, TooltipContent,
} from "./tooltip";
