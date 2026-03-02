import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { getCategoryLabel, scenarios, type Scenario } from "@/lib/scenarios";
import { Layers, Eye } from "lucide-react";

const CATEGORY_DESCRIPTIONS: Record<Scenario["category"], string> = {
  analysis: "Optimize costs, consolidate volumes, and calculate savings across your procurement portfolio.",
  planning: "Source efficiently, gather requirements, and plan your procurement strategy.",
  risk: "Assess supplier risks, manage disruptions, and build resilient supply chains.",
  documentation: "Generate, review, and manage procurement documents and contracts.",
};

interface ScenarioPreviewPanelProps {
  scenario: Scenario | null;
  activeCategory?: Scenario["category"] | null;
}

const ScenarioPreviewPanel = ({ scenario, activeCategory }: ScenarioPreviewPanelProps) => {
  const categoryScenarioCount = activeCategory
    ? scenarios.filter((s) => s.category === activeCategory).length
    : 0;

  return (
    <div className="sticky top-24">
      <div className="card-elevated rounded-2xl p-6 min-h-[320px] flex flex-col">
        <AnimatePresence mode="wait">
          {scenario ? (
            <motion.div
              key={scenario.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4"
            >
              {/* Icon + Title */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <scenario.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold text-foreground">
                    {scenario.title}
                  </h3>
                  <Badge variant="outline" className="text-xs mt-0.5 border-info/30 text-info">
                    {getCategoryLabel(scenario.category)}
                  </Badge>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed">
                {scenario.description}
              </p>

              {/* Outputs */}
              {scenario.outputs && scenario.outputs.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-2">
                    Outputs
                  </p>
                  <ul className="space-y-1">
                    {scenario.outputs.slice(0, 5).map((output, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-copper mt-0.5">•</span>
                        {output}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Status */}
              {scenario.status === "coming-soon" && (
                <Badge variant="secondary" className="w-fit text-xs">
                  Coming Soon
                </Badge>
              )}
            </motion.div>
          ) : activeCategory ? (
            <motion.div
              key={`cat-${activeCategory}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-iris/15 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-iris" />
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold text-foreground">
                    {getCategoryLabel(activeCategory)}
                  </h3>
                  <Badge variant="outline" className="text-xs mt-0.5 border-info/30 text-info">
                    {categoryScenarioCount} scenario{categoryScenarioCount !== 1 ? "s" : ""}
                  </Badge>
                </div>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {CATEGORY_DESCRIPTIONS[activeCategory]}
              </p>

              <div className="flex items-center gap-2 text-xs text-muted-foreground/70 pt-2 border-t border-border/30">
                <Eye className="w-3.5 h-3.5" />
                Hover a scenario to see details
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full flex-1 text-center gap-3 py-8"
            >
              <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center">
                <Eye className="w-6 h-6 text-muted-foreground/50" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hover over a scenario</p>
                <p className="text-xs text-muted-foreground/70 mt-1">to see a detailed preview here</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ScenarioPreviewPanel;
