import { useState } from "react";
import { FileText, Shield, Cloud, FileCheck, Lock, Compass, Globe, CheckCircle, RefreshCw, FileBarChart, LayoutDashboard, Map, ClipboardList, FileSpreadsheet, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CloudAgent {
  name: string;
  short: string;
  role: string;
  output: string;
}

const cloudAgents: CloudAgent[] = [
  {
    name: "Auditor Agent",
    short: "AUD",
    role: "Challenges assumptions, verifies arithmetic (ROI, NPV, break-even).",
    output: "Validation log · flagged risks · math corrections",
  },
  {
    name: "Optimizer Agent",
    short: "OPT",
    role: "Refines parameters, identifies cost levers and savings opportunities.",
    output: "Optimized scenario · ranked levers · sensitivity",
  },
  {
    name: "Strategist Agent",
    short: "STR",
    role: "Synthesizes findings into a board-ready recommendation.",
    output: "Executive summary · roadmap · trade-off matrix",
  },
];

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

  const inputIcons = [
    { icon: ClipboardList, label: "Scenario Data", desc: "Goals & parameters" },
    { icon: FileSpreadsheet, label: "Documents", desc: "Contracts & specs" },
    { icon: Building2, label: "Supplier Info", desc: "Vendor profiles" },
  ];

  const outputIcons = [
    { icon: FileBarChart, label: "Validated Report", desc: "Board-ready analysis" },
    { icon: LayoutDashboard, label: "Interactive Dashboards", desc: "Drill-down visuals" },
    { icon: Map, label: "Action Roadmaps", desc: "Sequenced next steps" },
  ];

  return (
    <div role="img" aria-label="EXOS privacy-first data flow diagram" className="relative">
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

            {/* Layer 3: Cloud AI — Bloomberg-style tabbed */}
            <div className="w-full max-w-2xl">
              <CloudAILayerCard />
            </div>

            {/* Down Arrow: Cloud AI → User Interface */}
            <VerticalConnector />

            {/* Layer 4: User Interface — 3 icons */}
            <div className="w-full max-w-2xl">
              <OutputLayerCard icons={outputIcons} />
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

          {/* Layer 3: Cloud AI — Bloomberg-style tabbed */}
          <CloudAILayerCard mobile />
          <MobileConnector />

          {/* Layer 4: Output — 3 icons */}
          <OutputLayerCard icons={outputIcons} mobile />
        </div>
      </div>
    </div>
  );
};

/* Output Layer Card — 3 icon tiles */
interface OutputIcon {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
}

const OutputLayerCard = ({ icons, mobile = false }: { icons: OutputIcon[]; mobile?: boolean }) => {
  return (
    <div
      className={cn(
        "glass-effect rounded-xl border border-border/40",
        mobile ? "p-4" : "p-5"
      )}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-muted">
            <FileCheck className="w-4 h-4 text-primary" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-muted-foreground tracking-[0.15em] uppercase">
              Layer 4
            </span>
            <h4 className="font-display font-semibold text-foreground text-base leading-tight">
              User Interface
            </h4>
          </div>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground tracking-[0.15em] uppercase">
          3 Outputs
        </span>
      </div>

      {/* 3 icon tiles */}
      <div className="grid grid-cols-3 gap-3">
        {icons.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="group flex flex-col items-center text-center p-3 rounded-lg border border-border/30 bg-muted/30 hover:bg-muted/50 hover:border-primary/40 transition-colors"
            >
              <div className="relative mb-2">
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative w-11 h-11 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md shadow-primary/20">
                  <Icon className="w-5 h-5 text-primary-foreground" />
                </div>
              </div>
              <span className={cn(
                "font-medium text-foreground leading-tight",
                mobile ? "text-[10px]" : "text-xs"
              )}>
                {item.label}
              </span>
              {!mobile && (
                <span className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                  {item.desc}
                </span>
              )}
            </div>
          );
        })}
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
      <svg aria-hidden="true" className="w-full h-full" viewBox="0 0 64 32">
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
    <svg aria-hidden="true" className="w-full h-full" viewBox="0 0 20 48">
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

/* Vertical Bidirectional Connector (up+down arrows) */
const VerticalBidirectionalConnector = () => (
  <div className="relative h-12 w-5 my-2">
    <svg aria-hidden="true" className="w-full h-full" viewBox="0 0 20 48">
      <path
        d="M10 6 L10 42"
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeDasharray="6 6"
        className="animate-flow-line"
      />
      <path
        d="M6 38 L10 46 L14 38"
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 10 L10 2 L14 10"
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);


/* Mobile Vertical Connector */
const MobileConnector = () => (
  <div className="flex justify-center py-1">
    <div className="relative w-6 h-6">
      <svg aria-hidden="true" className="w-full h-full" viewBox="0 0 24 24">
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

/* Bloomberg-style tabbed Cloud AI Layer Card */
const CloudAILayerCard = ({ mobile = false }: { mobile?: boolean }) => {
  const [activeTab, setActiveTab] = useState(0);
  const agent = cloudAgents[activeTab];

  return (
    <div
      className={cn(
        "glass-effect rounded-xl border border-border/40",
        mobile ? "p-4" : "p-5"
      )}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-muted">
            <Cloud className="w-4 h-4 text-primary" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-muted-foreground tracking-[0.15em] uppercase">
              Layer 3
            </span>
            <h4 className="font-display font-semibold text-foreground text-base leading-tight">
              Cloud AI
            </h4>
          </div>
        </div>
      </div>

      {/* Tab strip */}
      <div role="tablist" className="flex gap-0 border-b border-border/40 mb-3">
        {cloudAgents.map((a, i) => {
          const isActive = i === activeTab;
          return (
            <button
              key={a.short}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(i)}
              className={cn(
                "flex-1 px-2 py-2 text-xs font-mono tracking-wider uppercase transition-colors border-b-2 -mb-px",
                isActive
                  ? "text-primary border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground hover:border-border"
              )}
            >
              <span className="font-semibold">{a.short}</span>
              <span className="hidden sm:inline ml-1.5 normal-case tracking-normal text-[11px]">
                {a.name.replace(" Agent", "")}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab content — data table style */}
      <div className="space-y-2 font-mono text-xs">
        <div className="flex gap-3">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-16 pt-0.5 shrink-0">
            Role
          </span>
          <span className="text-foreground/90 leading-snug normal-case font-sans">
            {agent.role}
          </span>
        </div>
        <div className="flex gap-3">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-16 pt-0.5 shrink-0">
            Output
          </span>
          <span className="text-foreground/80 leading-snug normal-case font-sans">
            {agent.output}
          </span>
        </div>
        <div className="flex gap-3">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-16 pt-0.5 shrink-0">
            Status
          </span>
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Active
          </span>
        </div>
      </div>
    </div>
  );
};

export default DataFlowDiagram;
