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

interface PrintDateRangePickerProps {
  onDateChange: (range: { startDate?: string; endDate?: string }) => void;
  currentRange?: { startDate?: string; endDate?: string };
}

export function PrintDateRangePicker({
  onDateChange,
  currentRange
}: PrintDateRangePickerProps) {
  const [range, setRange] = React.useState<DateRange | undefined>(
    currentRange?.startDate && currentRange?.endDate
      ? {
          from: new Date(currentRange.startDate),
          to: new Date(currentRange.endDate),
        }
      : undefined
  );
  const [open, setOpen] = React.useState(false);

  const handleApplyDates = () => {
    if (range?.from && range?.to) {
      onDateChange({
        startDate: format(range.from, "yyyy-MM-dd"),
        endDate: format(range.to, "yyyy-MM-dd"),
      });
      setOpen(false);
    }
  };

  const clearDates = () => {
    setRange(undefined);
    onDateChange({});
    setOpen(false);
  };

  const resetSelection = () => {
    setRange(undefined);
    setOpen(false);
  };

  // Display text for the button
  const displayText = range?.from && range?.to
    ? `${format(range.from, "LLL dd, y")} - ${format(range.to, "LLL dd, y")}`
    : "Pick a date range";

  return (
    <div className="space-y-2">
      <Label htmlFor="date-range" className="text-sm font-medium">Date Range</Label>
      <div className="flex flex-col gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id="date-range"
              className={cn(
                "w-full justify-between font-normal h-10",
                !range?.from && "text-muted-foreground"
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
                mode="range"
                defaultMonth={range?.from}
                selected={range}
                onSelect={setRange}
                numberOfMonths={2}
                className="rounded-md border"
                showOutsideDays={true}
                captionLayout="dropdown"
                fromYear={2020}
                toYear={new Date().getFullYear() + 1}
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
                    onClick={resetSelection}
                    className="px-3 py-2"
                  >
                    Reset Selection
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleApplyDates}
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

        {range?.from && range?.to && (
          <div className="text-xs text-muted-foreground px-1">
            {`${format(range.from, "MMM dd, yyyy")} to ${format(range.to, "MMM dd, yyyy")}`}
          </div>
        )}
      </div>
    </div>
  );
}
