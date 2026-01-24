import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useIndustryContexts } from "@/hooks/useContextData";
import { Building2 } from "lucide-react";

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
  placeholder = "Select industry...",
}: IndustrySelectorProps) {
  const { data: industries, isLoading } = useIndustryContexts();

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-sm font-medium">
        <Building2 className="h-4 w-4 text-muted-foreground" />
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
          <SelectItem value="__none__">No specific industry</SelectItem>
          {industries?.map((industry) => (
            <SelectItem key={industry.id} value={industry.slug}>
              {industry.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Select an industry to apply specific regulatory constraints and KPIs to
        the analysis
      </p>
    </div>
  );
}
