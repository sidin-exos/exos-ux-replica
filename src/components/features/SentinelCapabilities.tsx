import { EyeOff, Database, ShieldCheck, RotateCcw, Brain } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import exosLogo from "@/assets/logo-concept-layers.png";

const SentinelCapabilities = () => {
  const capabilities = [
    {
      icon: EyeOff,
      title: "Semantic Anonymizer",
      role: "Encoder",
      description: "Masks sensitive entities like company names, prices, and volumes with semantic tokens. Your real data never reaches external systems.",
      example: "Acme Corp → [SUPPLIER_A], $125,000 → [AMOUNT_B]"
    },
    {
      icon: Database,
      title: "Private Grounding",
      role: "Knowledge Injection",
      description: "Enriches anonymized prompts with industry benchmarks, historical cases, and category-specific strategies from local databases.",
      example: "Injects: industry constraints, procurement KPIs, past case patterns"
    },
    {
      icon: ShieldCheck,
      title: "Integrity Validator",
      role: "Anti-Hallucination",
      description: "Checks AI responses for preserved anonymization tokens, reasoning consistency, and factual grounding before output.",
      example: "Verifies all [SUPPLIER_X] tokens remain intact in response"
    },
    {
      icon: RotateCcw,
      title: "Context Restorer",
      role: "Decoder",
      description: "Seamlessly replaces anonymization tokens with your original data, delivering actionable insights with full context.",
      example: "[SUPPLIER_A] → Acme Corp, [AMOUNT_B] → $125,000"
    }
  ];

  return (
    <div className="relative">
      {/* Central Hub Visual */}
      <div className="hidden lg:flex justify-center mb-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-2xl gradient-primary flex items-center justify-center">
            <Brain className="w-12 h-12 text-primary-foreground" />
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-background border border-border rounded-full">
            <span className="text-xs font-medium text-foreground">EXOS Sentinel</span>
          </div>
        </div>
      </div>

      {/* Capabilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {capabilities.map((cap, index) => (
          <Card 
            key={cap.title}
            className="card-elevated border-border/50 overflow-hidden group hover:border-primary/30 transition-colors"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <cap.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-muted rounded-md text-muted-foreground">
                  {cap.role}
                </span>
              </div>
              <CardTitle className="font-display text-lg mt-3">{cap.title}</CardTitle>
              <CardDescription>
                {cap.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                <p className="text-xs font-mono text-foreground/70">
                  {cap.example}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Architecture Note - Sales Oriented */}
      <div className="mt-8 p-6 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
            <img src={exosLogo} alt="EXOS" className="w-full h-full object-contain scale-[1.8]" />
          </div>
          <div>
            <h4 className="font-display font-semibold text-foreground mb-2 text-lg">
              One Fine-Tuned Model. World-Class Cloud AI. Total Control.
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              EXOS Sentinel is a purpose-built AI model, fine-tuned on thousands of procurement scenarios to act as your 
              intelligent gateway. It orchestrates leading cloud AI engines—validating their outputs, injecting your 
              private context, and filtering hallucinations—so you get <span className="text-foreground font-medium">enterprise-grade reasoning</span> without 
              sacrificing data control.
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1 text-xs font-medium bg-primary/20 text-primary rounded-full">
                Fine-tuned for Procurement
              </span>
              <span className="px-3 py-1 text-xs font-medium bg-accent/20 text-accent rounded-full">
                Cloud AI Orchestration
              </span>
              <span className="px-3 py-1 text-xs font-medium bg-emerald-500/20 text-emerald-400 rounded-full">
                Anti-Hallucination Validation
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentinelCapabilities;
