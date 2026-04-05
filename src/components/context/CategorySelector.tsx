import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useProcurementCategories } from "@/hooks/useContextData";
import { FolderKanban, Search } from "lucide-react";

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
}: CategorySelectorProps) {
  const { data: categories, isLoading } = useProcurementCategories();
  const [search, setSearch] = useState("");

  const filtered = (categories || []).filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-xs font-medium">
        <FolderKanban className="h-3.5 w-3.5 text-iris" />
        {label}
      </Label>
      <div className="relative mb-1.5">
        <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          className="h-8 pl-7 text-xs border-iris/20 focus-visible:ring-iris/30"
          placeholder="Search categories..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="border border-iris/15 rounded-md p-2 max-h-48 overflow-y-auto space-y-1">
        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-iris/5 rounded px-1 py-0.5">
          <Checkbox
            checked={value === null}
            onCheckedChange={() => onChange(null)}
          />
          <span className="text-xs text-muted-foreground">No specific category</span>
        </label>
        {isLoading ? (
          <p className="text-xs text-muted-foreground px-1 py-2">Loading...</p>
        ) : (
          filtered.map(category => (
            <label key={category.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-iris/5 rounded px-1 py-0.5">
              <Checkbox
                checked={value === category.slug}
                onCheckedChange={() => onChange(value === category.slug ? null : category.slug)}
              />
              <span className="text-xs">{category.name}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}
