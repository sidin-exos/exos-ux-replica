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
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-xs font-medium">
        <FolderKanban className="h-3.5 w-3.5 text-muted-foreground" />
        {label}
      </Label>
      <Select
        value={value || "__none__"}
        onValueChange={(v) => onChange(v === "__none__" ? null : v)}
        disabled={isLoading}
      >
        <SelectTrigger className="w-full h-9">
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
    </div>
  );
}
