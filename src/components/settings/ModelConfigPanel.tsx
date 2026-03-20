import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Loader2, CheckCircle2, AlertCircle, Cpu } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useModelConfig } from "@/contexts/ModelConfigContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const GOOGLE_MODELS = [
  { value: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro", description: "Latest Pro model (default)" },
  { value: "gemini-3-flash-preview", label: "Gemini 3 Flash", description: "Fast & balanced" },
  { value: "gemini-3-pro-preview", label: "Gemini 3 Pro", description: "Highest quality reasoning" },
  { value: "gemini-3.1-flash-lite-preview", label: "Gemini 3.1 Flash Lite", description: "Fast & cost-efficient" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro", description: "Previous-gen powerhouse" },
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", description: "Previous-gen balanced" },
];

export function ModelConfigPanel() {
  const { model, lastTested, setModel, markTested } = useModelConfig();
  const [isTesting, setIsTesting] = useState(false);

  const handleTestConnection = async () => {
    setIsTesting(true);

    try {
      const { data, error } = await supabase.functions.invoke("sentinel-analysis", {
        body: {
          systemPrompt: "Respond with exactly: OK",
          userPrompt: "Connection test",
          googleModel: model,
          enableTestLogging: false,
        },
      });

      if (error) {
        throw new Error(error.message || "Connection test failed");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      markTested();
      toast.success("Connection Successful", { description: `Model ${model} is responding` });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Connection Failed", { description: message });
    } finally {
      setIsTesting(false);
    }
  };

  const getLastTestedText = () => {
    if (!lastTested) return "Not tested";
    try {
      return `Last tested ${formatDistanceToNow(new Date(lastTested), { addSuffix: true })}`;
    } catch {
      return "Not tested";
    }
  };

  return (
    <Card className="card-elevated">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-primary" />
          <CardTitle className="font-display text-lg">AI Model Configuration</CardTitle>
        </div>
        <CardDescription>
          Configure the AI model for Sentinel analysis (Google AI Studio)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="model-select" className="text-sm font-medium">
            Model
          </Label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger id="model-select" className="bg-background">
              <SelectValue placeholder="Select a model..." />
            </SelectTrigger>
            <SelectContent>
              {GOOGLE_MODELS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  <div className="flex flex-col">
                    <span>{m.label}</span>
                    <span className="text-xs text-muted-foreground">{m.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Test Connection */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="gap-2"
            >
              {isTesting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : lastTested ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-muted-foreground" />
              )}
              {isTesting ? "Testing..." : "Test Connection"}
            </Button>
            <span className="text-xs text-muted-foreground">
              {getLastTestedText()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
