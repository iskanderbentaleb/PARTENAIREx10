import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RangeFilterProps {
  label: string;
  filterKey: string;
  updateFilter?: (key: string, value: any) => void;
  currentFilters?: Record<string, any>;
  minPlaceholder?: string;
  maxPlaceholder?: string;
  minValue?: number;
  maxValue?: number;
}

export function RangeFilter({
  label,
  filterKey,
  updateFilter = () => {},
  currentFilters = {},
  minPlaceholder = "Min",
  maxPlaceholder = "Max",
  minValue = 0, // ✅ Default to 0
  maxValue = 100,
}: RangeFilterProps) {
  const handleMinChange = (value: string) => {
    // Allow empty string, 0, and positive numbers
    if (value === "") {
      updateFilter(`${filterKey}_min`, undefined);
      return;
    }

    const numValue = Number(value);

    // Validate min value
    if (numValue < minValue) {
      updateFilter(`${filterKey}_min`, minValue);
      return;
    }
    if (numValue > maxValue) {
      updateFilter(`${filterKey}_min`, maxValue);
      return;
    }

    updateFilter(`${filterKey}_min`, numValue);
  };

  const handleMaxChange = (value: string) => {
    // Allow empty string, 0, and positive numbers
    if (value === "") {
      updateFilter(`${filterKey}_max`, undefined);
      return;
    }

    const numValue = Number(value);

    // Validate max value
    if (numValue > maxValue) {
      updateFilter(`${filterKey}_max`, maxValue);
      return;
    }
    if (numValue < minValue) {
      updateFilter(`${filterKey}_max`, minValue);
      return;
    }

    updateFilter(`${filterKey}_max`, numValue);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor={`${filterKey}_min`} className="text-xs">Min</Label>
          <Input
            id={`${filterKey}_min`}
            type="number"
            placeholder={minPlaceholder}
            value={currentFilters[`${filterKey}_min`] ?? ""} // ✅ Use nullish coalescing to allow 0
            onChange={(e) => handleMinChange(e.target.value)}
            min={minValue}
            max={maxValue}
            step="any" // ✅ Allow decimal values
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">Min: {minValue}</p>
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${filterKey}_max`} className="text-xs">Max</Label>
          <Input
            id={`${filterKey}_max`}
            type="number"
            placeholder={maxPlaceholder}
            value={currentFilters[`${filterKey}_max`] ?? ""} // ✅ Use nullish coalescing to allow 0
            onChange={(e) => handleMaxChange(e.target.value)}
            min={minValue}
            max={maxValue}
            step="any" // ✅ Allow decimal values
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">Max: {maxValue}</p>
        </div>
      </div>
    </div>
  );
}
