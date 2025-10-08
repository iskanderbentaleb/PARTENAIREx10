"use client"

import * as React from "react"
import { ChevronDownIcon, CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { type DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DateRangePickerFilterProps {
  updateFilter?: (key: string, value: any) => void;
  currentFilters?: Record<string, any>;
}

export function DateRangePickerFilter({
  updateFilter = () => {},
  currentFilters = {}
}: DateRangePickerFilterProps) {
  const [range, setRange] = React.useState<DateRange | undefined>(undefined);
  const [open, setOpen] = React.useState(false); // ✅ Add state to control popover

  const handleApplyDates = () => {
    if (range?.from && range?.to) {
      updateFilter("startDate", format(range.from, "yyyy-MM-dd"));
      updateFilter("endDate", format(range.to, "yyyy-MM-dd"));
      setOpen(false); // ✅ Close popover after applying
    }
  };

  const clearDates = () => {
    setRange(undefined);
    updateFilter("startDate", undefined);
    updateFilter("endDate", undefined);
    setOpen(false); // ✅ Close popover after clearing
  };

  const resetSelection = () => {
    setRange(undefined);
    setOpen(false); // ✅ Close popover after resetting selection
  };

  // Display text for the button
  const displayText = currentFilters.startDate && currentFilters.endDate
    ? `${format(new Date(currentFilters.startDate), "LLL dd, y")} - ${format(new Date(currentFilters.endDate), "LLL dd, y")}`
    : "Pick a date range";

  return (
    <div className="space-y-2">
      <Label htmlFor="date-range" className="text-sm font-medium">Date Range</Label>
      <div className="flex flex-col gap-2 ">
        <Popover open={open} onOpenChange={setOpen}> {/* ✅ Control popover state */}
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id="date-range"
              className={cn(
                "w-full justify-between font-normal h-10",
                !currentFilters.startDate && "text-muted-foreground"
              )}
            >
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                {displayText}
              </div>
              <ChevronDownIcon className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0"
            align="start"
            sideOffset={8}
          >
            <div className="p-2">
              <Calendar
                // initialFocus
                mode="range"
                defaultMonth={range?.from}
                selected={range}
                onSelect={setRange}
                numberOfMonths={2}
                className="w-150 rounded-md border"
                showOutsideDays={true}
                captionLayout="dropdown"
                fromYear={2025}
                toYear={new Date().getFullYear()} // Show 5 years into the future
              />
              <div className="mt-4 flex justify-between items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearDates}
                  className="px-3 py-2"
                >
                  Clear Dates
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetSelection} // ✅ Use the new function
                    className="px-3 py-2"
                  >
                    Reset Selection
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleApplyDates} // ✅ This will now close the popover
                    className="px-4 py-2"
                    disabled={!range?.from || !range?.to}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {(currentFilters.startDate && currentFilters.endDate) && (
          <div className="text-xs text-muted-foreground px-1">
            {`${format(new Date(currentFilters.startDate), "MMM dd, yyyy")} to ${format(new Date(currentFilters.endDate), "MMM dd, yyyy")}`}
          </div>
        )}
      </div>
    </div>
  );
}
