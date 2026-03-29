import { useState } from "react";
import { ChevronDown, Cpu, Zap, Brain, Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useShareableMode } from "@/hooks/useShareableMode";

export type AIModel =
  | "gemini-3.1-pro-preview"
  | "gemini-3-flash-preview"
  | "gemini-3-pro-preview"
  | "gemini-3.1-flash-lite-preview"
  | "gemini-2.5-flash"
  | "gemini-2.5-pro";

interface ModelOption {
  value: AIModel;
  label: string;
  description: string;
  icon: React.ReactNode;
  tier: "fast" | "balanced" | "premium";
}

const modelOptions: ModelOption[] = [
  {
    value: "gemini-3.1-pro-preview",
    label: "Gemini 3.1 Pro",
    description: "Latest Pro model (default).",
    icon: <Brain className="w-4 h-4 text-purple-500" />,
    tier: "premium",
  },
  {
    value: "gemini-3-flash-preview",
    label: "Gemini 3 Flash",
    description: "Fast & balanced.",
    icon: <Zap className="w-4 h-4 text-yellow-500" />,
    tier: "fast",
  },
  {
    value: "gemini-3-pro-preview",
    label: "Gemini 3 Pro",
    description: "Highest quality reasoning.",
    icon: <Brain className="w-4 h-4 text-purple-500" />,
    tier: "premium",
  },
  {
    value: "gemini-3.1-flash-lite-preview",
    label: "Gemini 3.1 Flash Lite",
    description: "Fast & cost-efficient.",
    icon: <Zap className="w-4 h-4 text-success" />,
    tier: "fast",
  },
  {
    value: "gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    description: "Previous-gen powerhouse.",
    icon: <Brain className="w-4 h-4 text-indigo-500" />,
    tier: "premium",
  },
  {
    value: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    description: "Previous-gen balanced.",
    icon: <Sparkles className="w-4 h-4 text-blue-500" />,
    tier: "balanced",
  },
];

interface ModelSelectorProps {
  value: AIModel;
  onChange: (model: AIModel) => void;
}

export const DEFAULT_MODEL: AIModel = "gemini-3.1-pro-preview";

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { showTechnicalDetails } = useShareableMode();

  // Hide entirely in shareable mode
  if (!showTechnicalDetails) {
    return null;
  }

  const selectedModel = modelOptions.find((m) => m.value === value);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group w-full justify-between p-3 rounded-lg border border-dashed border-border hover:border-primary/50 bg-card/30">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4" />
          <span className="font-medium">AI Model</span>
          {selectedModel && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {selectedModel.label}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-2">
        <div className="p-4 rounded-lg border border-border bg-card/50 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Select the AI model for analysis. Default: Gemini 3.1 Pro.
            </p>
          </div>

          <Select value={value} onValueChange={(v) => onChange(v as AIModel)}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {selectedModel && (
                  <div className="flex items-center gap-2">
                    {selectedModel.icon}
                    <span>{selectedModel.label}</span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {modelOptions.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  <div className="flex items-center gap-3">
                    {model.icon}
                    <div className="flex flex-col">
                      <span className="font-medium">{model.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {model.description}
                      </span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Zap className="w-3 h-3 text-yellow-500" />
              <span>Fast</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Sparkles className="w-3 h-3 text-success" />
              <span>Balanced</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Brain className="w-3 h-3 text-purple-500" />
              <span>Premium</span>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
