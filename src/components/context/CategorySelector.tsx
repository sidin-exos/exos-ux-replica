import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useProcurementCategories } from "@/hooks/useContextData";
import { FolderKanban } from "lucide-react";

interface CategorySelectorProps {
  value: string | null;
  onChange: (value: string | null) => void;
  label?: string;
  placeholder?: string;
}

export function CategorySelector({
  value,
  onChange,
  label = "Procurement Category",
  placeholder = "Select category...",
}: CategorySelectorProps) {
  const { data: categories, isLoading } = useProcurementCategories();

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-sm font-medium">
        <FolderKanban className="h-4 w-4 text-muted-foreground" />
        {label}
      </Label>
      <Select
        value={value || "__none__"}
        onValueChange={(v) => onChange(v === "__none__" ? null : v)}
        disabled={isLoading}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={isLoading ? "Loading..." : placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">No specific category</SelectItem>
          {categories?.map((category) => (
            <SelectItem key={category.id} value={category.slug}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Select a category to apply specific characteristics and benchmarks to
        the analysis
      </p>
    </div>
  );
}
