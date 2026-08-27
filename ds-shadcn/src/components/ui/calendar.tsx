import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months:        "flex flex-col sm:flex-row gap-4",
        month:         "flex flex-col gap-4",
        caption:       "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium text-primary",
        nav:           "flex items-center gap-1",
        nav_button: cn(
          "inline-flex items-center justify-center h-7 w-7 rounded-control",
          "border border-default bg-transparent text-icon-default",
          "hover:bg-action-ghost-hover hover:text-primary",
          "focus-visible:outline-none focus-visible:shadow-focus",
          "disabled:pointer-events-none disabled:text-disabled",
          "transition-colors duration-fast"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next:     "absolute right-1",
        table:     "w-full border-collapse",
        head_row:  "flex",
        head_cell: "text-muted rounded-control w-9 font-normal text-xs flex items-center justify-center",
        row:       "flex w-full mt-1",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
          "[&:has([aria-selected])]:bg-action-primary-subtle",
          "[&:has([aria-selected].day-range-start)]:rounded-l-control",
          "[&:has([aria-selected].day-range-end)]:rounded-r-control",
          "[&:has([aria-selected].day-outside)]:bg-action-primary-subtle/50"
        ),
        day: cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-control",
          "text-sm font-normal text-primary",
          "hover:bg-action-ghost-hover",
          "focus-visible:outline-none focus-visible:shadow-focus",
          "aria-selected:opacity-100",
          "transition-colors duration-fast"
        ),
        day_range_start: "day-range-start bg-action-primary text-on-accent hover:bg-action-primary-hover",
        day_range_end:   "day-range-end bg-action-primary text-on-accent hover:bg-action-primary-hover",
        day_selected:    "bg-action-primary text-on-accent hover:bg-action-primary-hover focus:bg-action-primary",
        day_today:       "bg-secondary font-semibold text-primary",
        day_outside:     "day-outside text-muted opacity-50",
        day_disabled:    "text-disabled opacity-50 pointer-events-none",
        // v1.2: range uses color/action/primary/bg-subtle token
        day_range_middle:"aria-selected:bg-action-primary-subtle aria-selected:text-primary",
        day_hidden:      "invisible",
        ...classNames,
      }}
      components={{
        IconLeft:  () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}

export { Calendar };
