import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface JobTitleInputProps {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
}

const SUGGESTIONS = [
  "Chief Procurement Officer (CPO)",
  "VP of Procurement",
  "Head of Procurement",
  "Procurement Director",
  "Procurement Manager",
  "Senior Buyer",
  "Category Manager",
  "Strategic Sourcing Manager",
  "Supply Chain Manager",
  "Head of Supply Chain",
  "Purchasing Manager",
  "Procurement Analyst",
  "Vendor Manager",
  "Contract Manager",
  "COO",
];

const JobTitleInput = ({ value, onChange, onBlur }: JobTitleInputProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = value.length >= 1
    ? SUGGESTIONS.filter((s) => s.toLowerCase().includes(value.toLowerCase()))
    : SUGGESTIONS;

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => {
          setTimeout(() => setShowSuggestions(false), 200);
          onBlur?.();
        }}
        placeholder="e.g. Procurement Manager"
        className="h-11"
      />
      {showSuggestions && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-md border bg-popover shadow-md">
          {filtered.map((s) => (
            <button
              key={s}
              type="button"
              className={cn(
                "w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                value === s && "bg-accent"
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(s);
                setShowSuggestions(false);
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobTitleInput;
