import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SelectFilterProps {
  label: string;
  filterKey: string;
  options: { value: string; label: string }[];
  updateFilter?: (key: string, value: any) => void;
  currentFilters?: Record<string, any>;
}

export function SelectFilter({
  label,
  filterKey,
  options,
  updateFilter = () => {},
  currentFilters = {}
}: SelectFilterProps) {
  // ✅ Use "all" as a special value instead of empty string
  const allOptions = [
    { value: "all", label: `All ${label}s` },
    ...options
  ];

  return (
    <div className="space-y-2">
      <Label htmlFor={filterKey} className="text-sm font-medium">{label}</Label>
      <Select
        value={currentFilters[filterKey] || "all"}
        onValueChange={(value) => {
          // ✅ If "all" is selected, remove the filter
          if (value === "all") {
            updateFilter(filterKey, undefined);
          } else {
            updateFilter(filterKey, value);
          }
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {allOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
