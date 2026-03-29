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
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-xs font-medium">
        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
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
          <SelectItem value="__none__">No specific industry</SelectItem>
          {industries?.map((industry) => (
            <SelectItem key={industry.id} value={industry.slug}>
              {industry.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
