import { useState, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useCaseLibrary, INDUSTRIES } from "@/lib/use-case-library";
import type { UseCase } from "@/lib/use-case-library";

interface Props {
  /** "scenarios" | "risk" | "enterprise" — enterprise shows both */
  type: "scenarios" | "risk" | "enterprise";
}

function pickRandom(arr: UseCase[], count: number): UseCase[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

const PillarUseCaseDropdown = ({ type }: Props) => {
  const [open, setOpen] = useState(false);

  const cases = useMemo(() => {
    // Gather use cases across all industries
    const all: UseCase[] = [];
    for (const entry of useCaseLibrary) {
      if (type === "scenarios") {
        all.push(...entry.scenarios);
      } else if (type === "risk") {
        all.push(...entry.risk);
      } else {
        all.push(...entry.scenarios, ...entry.risk);
      }
    }
    return pickRandom(all, 3);
  }, [type]);

  if (cases.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium cursor-pointer mt-1 transition-colors">
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
        Example use cases
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2">
        {cases.map((uc, i) => (
          <div key={i} className="text-xs text-muted-foreground leading-relaxed pl-3 border-l-2 border-primary/20">
            <span className="font-medium text-foreground">{uc.title}</span>
            <span className="mx-1">—</span>
            {uc.hook}
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default PillarUseCaseDropdown;
