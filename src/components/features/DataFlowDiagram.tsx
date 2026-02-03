import { FileText, Shield, Cloud, FileCheck, ArrowRight, ChevronRight } from "lucide-react";

const DataFlowDiagram = () => {
  const layers = [
    {
      id: 1,
      label: "Layer 1",
      title: "User Input",
      icon: FileText,
      items: ["Scenario Data", "Documents", "Supplier Info"],
    },
    {
      id: 2,
      label: "Layer 2",
      title: "EXOS Procurement Intelligence",
      subtitle: "Core Engine",
      icon: Shield,
      isHighlighted: true,
      items: [
        { step: "1", name: "Anonymizer", desc: "Protect sensitive commercial data" },
        { step: "2", name: "Grounding", desc: "Inject industry & category context" },
        { step: "3", name: "Market Intel", desc: "Amplify with real-time market data" },
        { step: "4", name: "Validator", desc: "Filter hallucinations & verify logic" },
        { step: "5", name: "Restorer", desc: "De-anonymize for actionable output" },
      ],
    },
    {
      id: 3,
      label: "Layer 3",
      title: "Cloud AI",
      subtitle: "Expert Reasoning",
      icon: Cloud,
      items: ["Auditor Agent", "Optimizer Agent", "Strategist Agent"],
    },
    {
      id: 4,
      label: "Layer 4",
      title: "Output",
      icon: FileCheck,
      items: ["Validated Report", "Interactive Dashboards", "Action Roadmaps"],
    },
  ];

  return (
    <div className="relative">
      {/* Desktop Schematic Flow */}
      <div className="hidden lg:block">
        <div className="relative bg-muted/20 border border-border/50 rounded-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="text-sm font-mono text-muted-foreground tracking-wider">
              EXOS ARCHITECTURE v3.0
            </span>
          </div>

          {/* Flow Diagram */}
          <div className="flex items-stretch justify-between gap-3">
            {layers.map((layer, index) => (
              <div key={layer.id} className="flex items-center flex-1">
                {/* Layer Box */}
                <div
                  className={`flex-1 rounded-xl border-2 p-5 transition-all ${
                    layer.isHighlighted
                      ? "border-primary bg-primary/5"
                      : "border-border/60 bg-background/50"
                  }`}
                >
                  {/* Layer Label */}
                  <div className="text-center mb-4">
                    <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                      {layer.label}
                    </span>
                    <h4 className="font-display font-semibold text-foreground text-base">
                      {layer.title}
                    </h4>
                    {layer.subtitle && (
                      <span className="text-xs text-muted-foreground">
                        ({layer.subtitle})
                      </span>
                    )}
                  </div>

                  {/* Layer Content */}
                  <div className="space-y-2">
                    {layer.isHighlighted
                      ? (layer.items as Array<{ step: string; name: string; desc: string }>).map(
                          (item) => (
                            <div
                              key={item.step}
                              className="flex items-center gap-2 px-3 py-1.5 rounded bg-primary/10 border border-primary/20"
                            >
                              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0">
                                {item.step}
                              </span>
                              <div className="min-w-0">
                                <span className="text-xs font-medium text-foreground block truncate">
                                  {item.name}
                                </span>
                                <span className="text-[10px] text-muted-foreground block truncate">
                                  {item.desc}
                                </span>
                              </div>
                            </div>
                          )
                        )
                      : (layer.items as string[]).map((item) => (
                          <div
                            key={item}
                            className="px-3 py-1.5 rounded bg-muted/50 border border-border/30"
                          >
                            <span className="text-xs text-foreground/80">{item}</span>
                          </div>
                        ))}
                  </div>
                </div>

                {/* Arrow Connector */}
                {index < layers.length - 1 && (
                  <div className="flex-shrink-0 px-2">
                    <ChevronRight className="w-6 h-6 text-muted-foreground/40" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Flow Lines Decoration */}
          <div className="absolute top-1/2 left-8 right-8 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent -z-10" />
        </div>
      </div>

      {/* Mobile Schematic Flow */}
      <div className="lg:hidden">
        <div className="bg-muted/20 border border-border/50 rounded-xl p-5">
          <div className="text-center mb-5">
            <span className="text-sm font-mono text-muted-foreground tracking-wider">
              EXOS ARCHITECTURE v3.0
            </span>
          </div>

          <div className="space-y-4">
            {layers.map((layer, index) => (
              <div key={layer.id}>
                <div
                  className={`rounded-lg border-2 p-4 ${
                    layer.isHighlighted
                      ? "border-primary bg-primary/5"
                      : "border-border/60 bg-background/50"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-mono text-muted-foreground uppercase">
                      {layer.label}
                    </span>
                    <span className="font-display font-semibold text-foreground text-base">
                      {layer.title}
                    </span>
                    {layer.subtitle && (
                      <span className="text-xs text-muted-foreground">
                        ({layer.subtitle})
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {layer.isHighlighted
                      ? (layer.items as Array<{ step: string; name: string; desc: string }>).map(
                          (item) => (
                            <span
                              key={item.step}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-primary/10 border border-primary/20"
                            >
                              <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                                {item.step}
                              </span>
                              <span className="text-xs text-foreground">{item.name}</span>
                            </span>
                          )
                        )
                      : (layer.items as string[]).map((item) => (
                          <span
                            key={item}
                            className="px-2.5 py-1 rounded bg-muted/50 border border-border/30 text-xs text-foreground/80"
                          >
                            {item}
                          </span>
                        ))}
                  </div>
                </div>

                {index < layers.length - 1 && (
                  <div className="flex justify-center py-2">
                    <ArrowRight className="w-5 h-5 text-muted-foreground/40 rotate-90" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataFlowDiagram;
