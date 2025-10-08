import * as React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ListFilter, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterPopoverProps {
  children: React.ReactNode;
  onApplyFilters?: (filters: Record<string, any>) => void;
  onClearFilters?: () => void;
  className?: string;
}

export function FilterPopover({
  children,
  onApplyFilters,
  onClearFilters,
  className
}: FilterPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const [filters, setFilters] = React.useState<Record<string, any>>({});

  const handleApply = () => {
    onApplyFilters?.(filters);
    setOpen(false);
  };

  const handleClear = () => {
    setFilters({});
    onClearFilters?.();
    setOpen(false);
  };

  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // ✅ Enhanced children with props
  const enhancedChildren = React.Children.map(children, child => {
    if (!React.isValidElement(child)) return child;

    // Skip Fragments and process their children
    if (child.type === React.Fragment) {
      return React.Children.map(child.props.children, fragmentChild => {
        if (!React.isValidElement(fragmentChild)) return fragmentChild;
        return React.cloneElement(fragmentChild as React.ReactElement<any>, {
          updateFilter,
          currentFilters: filters
        });
      });
    }

    // Regular components
    return React.cloneElement(child as React.ReactElement<any>, {
      updateFilter,
      currentFilters: filters
    });
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "bg-zinc-900 text-white hover:bg-zinc-700 dark:hover:bg-zinc-800",
            className
          )}
        >
          <ListFilter className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-96 p-4 max-h-[80vh] overflow-y-auto"
        align="end"
        sideOffset={5}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium leading-none">Filters</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {enhancedChildren}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleClear}
              className="flex-1"
            >
              Clear All
            </Button>
            <Button
              onClick={handleApply}
              className="flex-1"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
