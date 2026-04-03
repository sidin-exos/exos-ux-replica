import { FileText, Shield, Cloud, FileCheck, Lock, Compass, Globe, CheckCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const DataFlowDiagram = () => {
  const pipelineSteps = [
    { id: 1, name: "Anonymizer", icon: Lock, desc: "Masks sensitive data" },
    { id: 2, name: "Grounding", icon: Compass, desc: "Injects context" },
    { id: 3, name: "Market Intel", icon: Globe, desc: "Live enrichment" },
    { id: 4, name: "Validator", icon: CheckCircle, desc: "Anti-hallucination" },
    { id: 5, name: "Restorer", icon: RefreshCw, desc: "De-anonymizes" },
  ];

  const layers = {
    input: {
      title: "User Input",
      subtitle: "Layer 1",
      icon: FileText,
      items: ["Scenario Data", "Documents", "Supplier Info"],
    },
    cloud: {
      title: "Cloud AI",
      subtitle: "Layer 3",
      icon: Cloud,
      items: ["Auditor Agent", "Optimizer Agent", "Strategist Agent"],
    },
    output: {
      title: "User Interface",
      subtitle: "Layer 4",
      icon: FileCheck,
      items: ["Validated Report", "Interactive Dashboards", "Action Roadmaps"],
    },
  };

  return (
    <div className="relative">
      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <div className="relative">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="text-xs font-mono text-muted-foreground tracking-[0.2em] uppercase">
              EXOS Architecture
            </span>
          </div>

          {/* Main Flow - Vertical Layout */}
          <div className="flex flex-col items-center">
            {/* Layer 1: User Input */}
            <div className="w-full max-w-sm">
              <LayerCard layer={layers.input} centered />
            </div>

            {/* Down Arrow: Input → Core Engine */}
            <VerticalConnector />

            {/* Layer 2: EXOS Intelligence (Core Engine) */}
            <div className="relative z-20 w-full max-w-2xl">
              <div className="relative rounded-2xl border-2 border-primary/50 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 backdrop-blur-sm">
                <div className="absolute inset-0 rounded-2xl bg-primary/5 blur-xl -z-10" />
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 mb-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="text-xs font-mono text-primary uppercase tracking-wider">Core Engine</span>
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    EXOS Procurement Intelligence
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">Privacy-Preserving Analysis Pipeline</p>
                </div>

                {/* 5-Stage Pipeline */}
                <div className="flex items-center justify-between gap-2">
                  {pipelineSteps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                      <div className="group relative flex flex-col items-center">
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full bg-primary/30 animate-pulse-dot" />
                          <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
                            <step.icon className="w-4 h-4 text-primary-foreground" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-background border border-primary text-[10px] font-bold text-primary flex items-center justify-center">
                            {step.id}
                          </div>
                        </div>
                        <span className="text-[10px] font-medium text-foreground mt-2 text-center whitespace-nowrap">
                          {step.name}
                        </span>
                        <div className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                            {step.desc}
                          </span>
                        </div>
                      </div>
                      {index < pipelineSteps.length - 1 && (
                        <div className="w-6 h-px bg-gradient-to-r from-primary/60 to-primary/30 mx-1" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bidirectional Arrow: Core Engine ↔ Cloud AI */}
            <VerticalBidirectionalConnector />

            {/* Layer 3: Cloud AI */}
            <div className="w-full max-w-sm">
              <LayerCard layer={layers.cloud} centered />
            </div>

            {/* Down Arrow: Cloud AI → User Interface */}
            <VerticalConnector />

            {/* Layer 4: User Interface */}
            <div className="w-full max-w-sm">
              <LayerCard layer={layers.output} centered />
            </div>
          </div>

          {/* Decorative Background Grid */}
          <div className="absolute inset-0 -z-20 opacity-[0.03]">
            <div className="absolute inset-0" style={{
              backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
              backgroundSize: "40px 40px"
            }} />
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        <div className="text-center mb-6">
          <span className="text-xs font-mono text-muted-foreground tracking-[0.2em] uppercase">
            EXOS Architecture
          </span>
        </div>

        <div className="space-y-4">
          {/* Layer 1: Input */}
          <MobileLayerCard layer={layers.input} />
          <MobileConnector />

          {/* Layer 2: EXOS Core */}
          <div className="rounded-xl border-2 border-primary/50 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-primary/20">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Layer 2 • Core Engine</span>
                <h4 className="font-display font-semibold text-foreground text-sm">EXOS Intelligence</h4>
              </div>
            </div>

            {/* Mobile Pipeline Steps */}
            <div className="grid grid-cols-5 gap-1">
              {pipelineSteps.map((step) => (
                <div key={step.id} className="flex flex-col items-center">
                  <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <step.icon className="w-3 h-3 text-primary-foreground" />
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-background border border-primary text-[8px] font-bold text-primary flex items-center justify-center">
                      {step.id}
                    </span>
                  </div>
                  <span className="text-[9px] text-foreground mt-1.5 text-center leading-tight">
                    {step.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <MobileConnector />

          {/* Layer 3: Cloud AI */}
          <MobileLayerCard layer={layers.cloud} />
          <MobileConnector />

          {/* Layer 4: Output */}
          <MobileLayerCard layer={layers.output} />
        </div>
      </div>
    </div>
  );
};

/* Layer Card Component */
interface LayerCardProps {
  layer: {
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    items: string[];
  };
  centered?: boolean;
}

const LayerCard = ({ layer, centered }: LayerCardProps) => {
  const Icon = layer.icon;
  return (
    <div className={cn(
      "glass-effect rounded-xl p-5 animate-float-subtle",
      centered && "mx-auto"
    )} style={{ animationDelay: "0.5s" }}>
      <div className={cn("mb-4", centered && "text-center")}>
        <div className={cn("inline-flex items-center gap-2", centered && "justify-center w-full")}>
          <div className="p-1.5 rounded-lg bg-muted">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground">{layer.subtitle}</span>
            <h4 className="font-display font-semibold text-foreground text-base leading-tight">{layer.title}</h4>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {layer.items.map((item) => (
          <div
            key={item}
            className="px-3 py-1.5 rounded-lg bg-muted/50 border border-border/30 text-xs text-foreground/80"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
};

/* Mobile Layer Card */
const MobileLayerCard = ({ layer }: { layer: LayerCardProps["layer"] }) => {
  const Icon = layer.icon;
  return (
    <div className="glass-effect rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-muted">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div>
          <span className="text-xs text-muted-foreground">{layer.subtitle}</span>
          <h4 className="font-display font-semibold text-foreground text-sm">{layer.title}</h4>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {layer.items.map((item) => (
          <span
            key={item}
            className="px-2.5 py-1 rounded-lg bg-muted/50 border border-border/30 text-xs text-foreground/80"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

/* Animated Horizontal Connector */
const AnimatedConnector = ({ direction, className, bidirectional = false }: { direction: "left" | "right"; className?: string; bidirectional?: boolean }) => {
  return (
    <div className={cn("w-16 h-8 flex items-center", className)}>
      <svg className="w-full h-full" viewBox="0 0 64 32">
        {/* Gradient Definition */}
        <defs>
          <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        {/* Static Line */}
        <path
          d="M0 16 L64 16"
          fill="none"
          stroke="url(#flowGradient)"
          strokeWidth="2"
        />
        {/* Animated Dashes */}
        <path
          d="M0 16 L64 16"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeDasharray="8 8"
          className="animate-flow-line"
        />
        {/* Right Arrow */}
        <path
          d={direction === "right" || bidirectional ? "M56 12 L64 16 L56 20" : "M8 12 L0 16 L8 20"}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Left Arrow (for bidirectional) */}
        {bidirectional && (
          <path
            d="M8 12 L0 16 L8 20"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </div>
  );
};
/* Vertical Down Arrow Connector */
const VerticalConnector = () => (
  <div className="relative h-12 w-5 my-2">
    <svg className="w-full h-full" viewBox="0 0 20 48">
      <path
        d="M10 0 L10 40"
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeDasharray="6 6"
        className="animate-flow-line"
        style={{ animationDirection: "reverse" }}
      />
      <path
        d="M6 38 L10 46 L14 38"
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);


const MobileConnector = () => (
  <div className="flex justify-center py-1">
    <div className="relative w-6 h-6">
      <svg className="w-full h-full" viewBox="0 0 24 24">
        <path
          d="M12 0 L12 24"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeDasharray="4 4"
          className="animate-flow-line"
          style={{ animationDirection: "reverse" }}
        />
        <path
          d="M8 18 L12 24 L16 18"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  </div>
);

export default DataFlowDiagram;
