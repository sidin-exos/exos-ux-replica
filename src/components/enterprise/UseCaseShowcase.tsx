import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Building2, Lightbulb, BookOpen, RefreshCw } from "lucide-react";
import { USE_CASE_LIBRARY, INDUSTRIES, type UseCase, type IndustryName } from "@/lib/use-case-library";

type Platform = "scenarios" | "risk";

interface UseCaseShowcaseProps {
  platform: Platform;
  /** Compact card for sidebar placement, full section for standalone */
  variant?: "card" | "section";
  className?: string;
}

export function UseCaseShowcase({ platform, variant = "card", className }: UseCaseShowcaseProps) {
  const [industry, setIndustry] = useState<IndustryName>(INDUSTRIES[0]);
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const cases = useMemo(() => {
    const lib = USE_CASE_LIBRARY[industry];
    const all = platform === "scenarios" ? lib.scenarios : lib.risk;
    // For risk platform, only show DM- monitoring scenarios
    return platform === "risk" ? all.filter((uc) => uc.ref.startsWith("DM-")) : all;
  }, [industry, platform]);

  const current = cases[index] || cases[0];
  const total = cases.length;

  const handleIndustryChange = (val: string) => {
    setIndustry(val as IndustryName);
    setIndex(0);
    setExpanded(false);
  };

  const shuffle = useCallback(() => {
    const randomIdx = Math.floor(Math.random() * total);
    setIndex(randomIdx);
    setExpanded(false);
  }, [total]);

  if (!current) return null;

  // Truncate description for compact view
  const descPreview = current.description.length > 200
    ? current.description.slice(0, 200) + "…"
    : current.description;

  if (variant === "section") {
    return (
      <section className={className}>
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">
            Industry <span className="text-gradient">Use Cases</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-6">
            See how procurement teams across 30 industries use EXOS
            {platform === "scenarios" ? " analytical scenarios" : " risk assessment"} to drive measurable results.
          </p>
          <div className="flex justify-center">
            <Select value={industry} onValueChange={handleIndustryChange}>
              <SelectTrigger className="w-72 h-9">
                <Building2 className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {INDUSTRIES.map((ind) => (
                  <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cases.map((uc, i) => (
            <UseCaseCard key={`${industry}-${i}`} useCase={uc} index={i} />
          ))}
        </div>
      </section>
    );
  }

  // Card variant — compact sidebar
  return (
    <Card className={`border-border/50 bg-card/50 ${className || ""}`}>
      <CardContent className="pt-5 pb-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-primary" />
            Use Cases
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground hover:text-primary gap-1.5"
            onClick={shuffle}
          >
            <RefreshCw className="w-3 h-3" />
            More Use Cases
          </Button>
        </div>

        {/* Industry picker */}
        <Select value={industry} onValueChange={handleIndustryChange}>
          <SelectTrigger className="w-full h-8 text-xs">
            <Building2 className="w-3 h-3 mr-1 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-56">
            {INDUSTRIES.map((ind) => (
              <SelectItem key={ind} value={ind} className="text-xs">{ind}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Current use case */}
        <div className="space-y-1.5">
          <div className="flex items-start gap-2">
            <Badge variant="secondary" className="text-[10px] shrink-0 mt-0.5">{current.ref}</Badge>
            <p className="text-xs font-semibold text-foreground leading-snug">{current.title}</p>
          </div>
          <div className="text-xs text-muted-foreground leading-relaxed space-y-2">
            {(expanded ? current.description : descPreview)
              .split(/\n\n|(?=(?:SITUATION:|HOW TO USE EXOS:|WHAT YOU RECEIVE:|WHY IT MATTERS:))/)
              .filter(Boolean)
              .map((paragraph, i) => {
                const match = paragraph.match(/^(SITUATION:|HOW TO USE EXOS:|WHAT YOU RECEIVE:|WHY IT MATTERS:)\s*/);
                if (match) {
                  return (
                    <p key={i}>
                      <span className="font-semibold text-foreground">{match[1]}</span>{" "}
                      {paragraph.slice(match[0].length)}
                    </p>
                  );
                }
                return <p key={i}>{paragraph.trim()}</p>;
              })}
          </div>
          {current.description.length > 200 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors underline underline-offset-2"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
          {current.teachingPoint && (
            <div className="pt-2 border-t border-border/40">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">💡 Tip: </span>
                {current.teachingPoint}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function UseCaseCard({ useCase, index }: { useCase: UseCase; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const preview = useCase.description.length > 180
    ? useCase.description.slice(0, 180) + "…"
    : useCase.description;

  return (
    <Card
      className="card-elevated border-border/50 animate-fade-up"
      style={{ animationDelay: `${100 + index * 60}ms` }}
    >
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-[10px]">{useCase.ref}</Badge>
          <Badge variant="outline" className="text-[10px]">{useCase.feature}</Badge>
        </div>
        <h3 className="text-sm font-semibold text-foreground leading-snug">{useCase.title}</h3>
        <div className="text-xs text-muted-foreground leading-relaxed space-y-2">
          {(expanded ? useCase.description : preview)
            .split(/(?=(?:SITUATION:|HOW TO USE EXOS:|WHAT YOU RECEIVE:|WHY IT MATTERS:))/)
            .filter(Boolean)
            .map((paragraph, i) => {
              const match = paragraph.match(/^(SITUATION:|HOW TO USE EXOS:|WHAT YOU RECEIVE:|WHY IT MATTERS:)\s*/);
              if (match) {
                return (
                  <p key={i}>
                    <span className="font-semibold text-foreground">{match[1]}</span>{" "}
                    {paragraph.slice(match[0].length)}
                  </p>
                );
              }
              return <p key={i}>{paragraph.trim()}</p>;
            })}
        </div>
        {useCase.description.length > 180 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[11px] text-primary hover:text-primary/80 transition-colors"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}
        {useCase.hook && (
          <div className="pt-2 border-t border-border/40">
            <p className="text-[11px] text-muted-foreground leading-relaxed italic">
              <BookOpen className="w-3 h-3 inline mr-1 text-primary/60" />
              {useCase.hook.length > 150 && !expanded
                ? useCase.hook.slice(0, 150) + "…"
                : useCase.hook}
            </p>
          </div>
        )}
        
      </CardContent>
    </Card>
  );
}

export default UseCaseShowcase;
