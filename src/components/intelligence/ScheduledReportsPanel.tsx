import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { QueryBuilder } from "@/components/intelligence/QueryBuilder";
import { useIndustryContexts, useProcurementCategories } from "@/hooks/useContextData";
import { useSavedIntelConfigs, type CreateIntelConfigParams } from "@/hooks/useSavedIntelConfigs";
import { CalendarClock, CalendarIcon, Info, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IntelQueryParams } from "@/hooks/useMarketIntelligence";

export function ScheduledReportsPanel() {
  const [step, setStep] = useState<"form" | "schedule">("form");
  const [pendingQuery, setPendingQuery] = useState<IntelQueryParams | null>(null);
  const [configName, setConfigName] = useState("");
  const [frequency, setFrequency] = useState("weekly");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [industrySlug, setIndustrySlug] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { data: industries } = useIndustryContexts();
  const { data: categories } = useProcurementCategories();
  const { configs, isLoading, loadConfigs, createConfig, deleteConfig, toggleActive } = useSavedIntelConfigs();

  useEffect(() => {
    loadConfigs("scheduled");
  }, [loadConfigs]);

  const handleQuerySubmit = (params: IntelQueryParams) => {
    setPendingQuery(params);
    setStep("schedule");
  };

  const handleSaveConfig = async () => {
    if (!pendingQuery || !configName.trim()) return;

    setIsSaving(true);
    const params: CreateIntelConfigParams = {
      config_type: "scheduled",
      name: configName.trim(),
      query_type: pendingQuery.queryType,
      query_text: pendingQuery.query,
      recency_filter: pendingQuery.recencyFilter,
      domain_filter: pendingQuery.domainFilter,
      context: pendingQuery.context,
      schedule_cron: frequency,
      grounding_target: {
        ...(industrySlug && { industry_slug: industrySlug }),
        ...(categorySlug && { category_slug: categorySlug }),
      },
    };

    const success = await createConfig(params);
    setIsSaving(false);

    if (success) {
      setStep("form");
      setPendingQuery(null);
      setConfigName("");
      setFrequency("weekly");
      setIndustrySlug("");
      setCategorySlug("");
      loadConfigs("scheduled");
    }
  };

  return (
    <div className="space-y-6">
      {step === "form" ? (
        <div className="space-y-6">
          <QueryBuilder
            onSubmit={handleQuerySubmit}
            isLoading={false}
            renderBeforeSubmit={
              <div className="space-y-3">
                <Separator />
                <div className="flex items-center gap-2 pt-1">
                  <CalendarClock className="w-4 h-4 text-primary" />
                  <Label className="text-sm font-semibold">Schedule Settings</Label>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Plan a Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          type="button"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Select Frequency</Label>
                    <Select value={frequency} onValueChange={setFrequency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="once">Single Request</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            }
          />
        </div>
      ) : (
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-primary" />
              Schedule Configuration
            </CardTitle>
            <CardDescription>
              Define when this query runs and where results are saved
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Configuration Name *</Label>
              <Input
                value={configName}
                onChange={e => setConfigName(e.target.value)}
                placeholder="e.g. Weekly Supplier Risk Monitor"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plan a Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Select Frequency</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Single Request</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">Auto-save results to Knowledge Base</Label>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-sm">Industry</Label>
                  <Select value={industrySlug} onValueChange={setIndustrySlug}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries?.map(ind => (
                        <SelectItem key={ind.slug} value={ind.slug}>{ind.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Category</Label>
                  <Select value={categorySlug} onValueChange={setCategorySlug}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map(cat => (
                        <SelectItem key={cat.slug} value={cat.slug}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Scheduled execution is being rolled out. Your configuration is saved and will activate automatically when available.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setStep("form"); setPendingQuery(null); }}>
                Back
              </Button>
              <Button onClick={handleSaveConfig} disabled={!configName.trim() || isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                Save Schedule
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved configs list */}
      {configs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Your Scheduled Reports ({configs.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {configs.map(config => (
              <div key={config.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{config.name}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0">{config.schedule_cron}</Badge>
                    {!config.is_active && <Badge variant="secondary" className="text-[10px] shrink-0">Paused</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{config.query_text}</p>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <Switch
                    checked={config.is_active}
                    onCheckedChange={(checked) => toggleActive(config.id, checked)}
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteConfig(config.id)}>
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
