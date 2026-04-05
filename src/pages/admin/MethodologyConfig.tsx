import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Save, Check } from "lucide-react";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  useMethodologyConfigs,
  useUpdateMethodologyConfig,
} from "@/hooks/useMethodologyAdmin";

const CONFIG_LABELS: Record<string, string> = {
  bot_identity: "Bot Identity & Persona",
  conversation_architecture: "Conversation Architecture",
  escalation_protocol: "Escalation & Error Handling",
  gdpr_protocol: "GDPR Compliance Protocol",
  quick_references: "Quick Reference Cards",
};

const MethodologyConfig = () => {
  const navigate = useNavigate();
  const { data: configs, isLoading } = useMethodologyConfigs();
  const updateConfig = useUpdateMethodologyConfig();

  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [savedKey, setSavedKey] = useState<string | null>(null);

  useEffect(() => {
    if (configs) {
      const values: Record<string, string> = {};
      for (const c of configs) {
        values[c.key] = c.value;
      }
      setEditedValues(values);
    }
  }, [configs]);

  // Flash "Saved" on successful save
  useEffect(() => {
    if (!updateConfig.isPending && updateConfig.isSuccess) {
      const t = setTimeout(() => setSavedKey(null), 2000);
      return () => clearTimeout(t);
    }
  }, [updateConfig.isPending, updateConfig.isSuccess]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-6xl py-12 space-y-8">
        <Breadcrumb>
          <BreadcrumbList className="text-[13px] text-muted-foreground">
            <BreadcrumbItem>
              <BreadcrumbLink className="cursor-pointer hover:text-muted-foreground" onClick={() => navigate("/admin/methodology")}>
                Methodology
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-muted-foreground">Global Configuration</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Global Configuration</h1>
          <p className="text-muted-foreground mt-1">
            System-wide methodology settings that affect chatbot behavior across all scenarios.
          </p>
        </div>

        <div className="space-y-6">
          {configs?.map((config) => {
            const isDirty = editedValues[config.key] !== config.value;
            const justSaved = savedKey === config.key;
            return (
              <Card key={config.key} className="bg-card border border-border rounded-lg shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-foreground">
                    {CONFIG_LABELS[config.key] ?? config.key}
                  </CardTitle>
                  {config.description && (
                    <p className="text-sm text-muted-foreground">{config.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    rows={14}
                    className="font-mono text-sm bg-card border-border rounded-md focus-visible:ring-primary"
                    value={editedValues[config.key] ?? ""}
                    onChange={(e) =>
                      setEditedValues((prev) => ({ ...prev, [config.key]: e.target.value }))
                    }
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Last updated: {new Date(config.updated_at).toLocaleString()}
                    </p>
                    <Button
                      size="sm"
                      disabled={!isDirty || updateConfig.isPending}
                      onClick={() => {
                        setSavedKey(config.key);
                        updateConfig.mutate({
                          key: config.key,
                          value: editedValues[config.key],
                        });
                      }}
                    >
                      {updateConfig.isPending && savedKey === config.key ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : justSaved && !isDirty ? (
                        <Check className="w-4 h-4 mr-2 text-success" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      {justSaved && !isDirty ? "Saved" : "Save"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default MethodologyConfig;
