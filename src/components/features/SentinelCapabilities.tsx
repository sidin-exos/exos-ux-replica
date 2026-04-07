import { EyeOff, Database, ShieldCheck, RotateCcw, Brain } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useThemedLogo } from "@/hooks/useThemedLogo";

const SentinelCapabilities = () => {
  const exosLogo = useThemedLogo();
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
      title: "Private Grounding + Live Intel",
      role: "Knowledge Injection",
      description: "Enriches anonymized prompts with industry benchmarks, category strategies, and real-time market intelligence from verified sources.",
      example: "Injects: industry KPIs, supplier news, M&A alerts, commodity trends"
    },
    {
      icon: ShieldCheck,
      title: "Integrity Validator",
      role: "Anti-Hallucination",
      description: "Checks AI responses for preserved anonymization tokens, reasoning consistency, and factual grounding before delivery.",
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
    <div role="img" aria-label="EXOS Sentinel Pipeline capabilities" className="relative">
      {/* Central Hub Visual */}

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

    </div>
  );
};

export default SentinelCapabilities;
