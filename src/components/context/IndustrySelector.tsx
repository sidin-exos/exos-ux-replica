import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useIndustryContexts } from "@/hooks/useContextData";
import { Building2, Search } from "lucide-react";

interface IndustrySelectorProps {
  value: string | null;
  onChange: (value: string | null) => void;
  label?: string;
  placeholder?: string;
}

export function IndustrySelector({
  value,
  onChange,
  label = "Industry Context",
}: IndustrySelectorProps) {
  const { data: industries, isLoading } = useIndustryContexts();
  const [search, setSearch] = useState("");

  const filtered = (industries || []).filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-xs font-medium">
        <Building2 className="h-3.5 w-3.5 text-primary" />
        {label}
      </Label>
      <div className="relative mb-1.5">
        <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          className="h-8 pl-7 text-xs border-primary/20 focus-visible:ring-primary/30"
          placeholder="Search industries..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="border border-primary/15 rounded-md p-2 max-h-48 overflow-y-auto space-y-1">
        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-primary/5 rounded px-1 py-0.5">
          <Checkbox
            checked={value === null}
            onCheckedChange={() => onChange(null)}
          />
          <span className="text-xs text-muted-foreground">No specific industry</span>
        </label>
        {isLoading ? (
          <p className="text-xs text-muted-foreground px-1 py-2">Loading...</p>
        ) : (
          filtered.map(industry => (
            <label key={industry.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-primary/5 rounded px-1 py-0.5">
              <Checkbox
                checked={value === industry.slug}
                onCheckedChange={() => onChange(value === industry.slug ? null : industry.slug)}
              />
              <span className="text-xs">{industry.name}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}
