import { FileText, Shield, Cloud, FileCheck, ArrowRight, Lock, Sparkles, Database } from "lucide-react";

const DataFlowDiagram = () => {
  const stages = [
    {
      id: 1,
      title: "Your Input",
      subtitle: "Documents & Data",
      icon: FileText,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      description: "Upload procurement data, supplier quotes, and business context"
    },
    {
      id: 2,
      title: "EXOS Sentinel",
      subtitle: "Local Intelligence",
      icon: Shield,
      color: "from-primary to-accent",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/30",
      description: "Anonymize → Ground → Validate → Protect",
      isHighlighted: true
    },
    {
      id: 3,
      title: "Cloud AI",
      subtitle: "Analysis Engine",
      icon: Cloud,
      color: "from-violet-500 to-purple-600",
      bgColor: "bg-violet-500/10",
      borderColor: "border-violet-500/30",
      description: "Powerful reasoning on anonymized, context-rich prompts"
    },
    {
      id: 4,
      title: "Enriched Report",
      subtitle: "Your Insights",
      icon: FileCheck,
      color: "from-emerald-500 to-green-600",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
      description: "De-anonymized, validated recommendations ready for action"
    }
  ];

  return (
    <div className="relative">
      {/* Desktop Flow */}
      <div className="hidden lg:flex items-center justify-between gap-4">
        {stages.map((stage, index) => (
          <div key={stage.id} className="flex items-center flex-1">
            {/* Stage Card */}
            <div 
              className={`relative flex-1 p-6 rounded-2xl border ${stage.borderColor} ${stage.bgColor} transition-all duration-300 hover:scale-[1.02]`}
            >
              {stage.isHighlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                  Privacy Layer
                </div>
              )}
              
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stage.color} flex items-center justify-center mb-4`}>
                <stage.icon className="w-6 h-6 text-white" />
              </div>
              
              <h3 className="font-display font-semibold text-foreground mb-1">
                {stage.title}
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                {stage.subtitle}
              </p>
              <p className="text-sm text-foreground/70">
                {stage.description}
              </p>
            </div>
            
            {/* Arrow Connector */}
            {index < stages.length - 1 && (
              <div className="flex-shrink-0 px-2">
                <ArrowRight className="w-6 h-6 text-muted-foreground/50" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile Flow */}
      <div className="lg:hidden space-y-4">
        {stages.map((stage, index) => (
          <div key={stage.id}>
            <div 
              className={`relative p-5 rounded-xl border ${stage.borderColor} ${stage.bgColor}`}
            >
              {stage.isHighlighted && (
                <div className="absolute -top-3 left-4 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                  Privacy Layer
                </div>
              )}
              
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stage.color} flex items-center justify-center flex-shrink-0`}>
                  <stage.icon className="w-5 h-5 text-white" />
                </div>
                
                <div className="flex-1">
                  <h3 className="font-display font-semibold text-foreground">
                    {stage.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    {stage.subtitle}
                  </p>
                  <p className="text-sm text-foreground/70">
                    {stage.description}
                  </p>
                </div>
              </div>
            </div>
            
            {index < stages.length - 1 && (
              <div className="flex justify-center py-2">
                <ArrowRight className="w-5 h-5 text-muted-foreground/40 rotate-90" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Security Badges */}
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50">
          <Lock className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">End-to-End Protection</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50">
          <Database className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">Local Knowledge Base</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">Validated Outputs</span>
        </div>
      </div>
    </div>
  );
};

export default DataFlowDiagram;
