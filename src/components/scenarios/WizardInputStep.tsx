import { useState, type RefObject } from "react";
import { motion } from "framer-motion";
import { ArrowRight, AlertTriangle, FlaskConical, Loader2, Wand2, MessageSquare, CheckCircle2, AlertCircle, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MasterXMLPreview } from "@/components/sentinel/MasterXMLPreview";
import { FinalXMLPreview } from "@/components/sentinel/FinalXMLPreview";
import StrategySelector, { StrategyType, strategyPresets } from "./StrategySelector";
import DashboardSelector from "./DashboardSelector";
import { IndustrySelector } from "@/components/context/IndustrySelector";
import { CategorySelector } from "@/components/context/CategorySelector";
import { ContextPreview } from "@/components/context/ContextPreview";
import { IndustryContextEditor, type IndustryContextOverrides } from "@/components/context/IndustryContextEditor";
import { CategoryContextEditor, type CategoryContextOverrides } from "@/components/context/CategoryContextEditor";
import { MarketInsightsBanner } from "@/components/insights/MarketInsightsBanner";
import { BusinessContextField } from "./BusinessContextField";
import { ModelSelector, type AIModel } from "./ModelSelector";
import { DraftedParametersCard } from "./DraftedParametersCard";
import { ScenarioChatAssistant } from "./ScenarioChatAssistant";
import ScenarioFileAttachment from "./ScenarioFileAttachment";
import ScenarioTutorial from "./ScenarioTutorial";
import type { Scenario, ScenarioRequiredField } from "@/lib/scenarios";
import type { DashboardType } from "@/lib/dashboard-mappings";
import type { DraftedParameters } from "@/lib/drafted-parameters";
import { toast } from "sonner";

const DataRequirementsCollapsible = ({ dataRequirements }: { dataRequirements: { title: string; sections: { heading: string; description: string }[] } }) => {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors text-sm font-medium text-foreground">
          <span>💡</span>
          <span>What data do I need to prepare?</span>
          <ChevronRight className={`ml-auto h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-90" : ""}`} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-3 border border-border rounded-lg p-4 bg-muted/30 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{dataRequirements.title}</p>
          {dataRequirements.sections.map((s, i) => (
            <div key={i}>
              <p className="text-sm font-medium text-foreground">{s.heading}</p>
              <p className="text-sm text-muted-foreground">{s.description}</p>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

interface WizardInputStepProps {
  scenario: Scenario;
  formData: Record<string, string>;
  strategyValue: StrategyType;
  industrySlug: string | null;
  categorySlug: string | null;
  industryOverrides: IndustryContextOverrides;
  categoryOverrides: CategoryContextOverrides;
  selectedModel: AIModel;
  selectedDashboards: DashboardType[];
  attachedFileIds: string[];
  draftedParams: DraftedParameters | null;
  isDrafting: boolean;
  isGeneratingFromDraft: boolean;
  testDataMetadata: { source: "ai" | "static"; score?: number; reasoning?: string } | null;
  showTechnicalDetails: boolean;
  showChatAssistant: boolean;
  isMarketInsightsActive: boolean;
  hasMarketInsights: boolean;
  marketInsight: any;
  industryContext: any;
  categoryContext: any;
  evaluation: any;
  fieldRefs: RefObject<Record<string, HTMLElement | null>>;
  onNext: () => void;
  onFieldChange: (fieldId: string, value: string) => void;
  onStrategyChange: (value: StrategyType) => void;
  onIndustryChange: (slug: string | null) => void;
  onCategoryChange: (slug: string | null) => void;
  onIndustryOverridesChange: (overrides: IndustryContextOverrides) => void;
  onCategoryOverridesChange: (overrides: CategoryContextOverrides) => void;
  onModelChange: (model: AIModel) => void;
  onDashboardsChange: (dashboards: DashboardType[]) => void;
  onAttachedFilesChange: (ids: string[]) => void;
  onToggleChatAssistant: () => void;
  onActivateMarketInsights: () => void;
  onSetFormData: (fn: (prev: Record<string, string>) => Record<string, string>) => void;
  onDraftTestCase: () => void;
  onApproveAndGenerate: (params: DraftedParameters) => void;
  onStaticGenerate: () => void;
}

const renderField = (
  field: ScenarioRequiredField,
  formData: Record<string, string>,
  onFieldChange: (fieldId: string, value: string) => void,
  fieldRefs: RefObject<Record<string, HTMLElement | null>>,
  skipBusinessContextField = false,
) => {
  const commonClasses = "bg-background";

  if (field.id === "industryContext" && !skipBusinessContextField) {
    return (
      <BusinessContextField
        value={formData[field.id] || ""}
        onChange={(value) => onFieldChange(field.id, value)}
        placeholder={field.placeholder || field.description}
      />
    );
  }

  if (field.type === "select" && field.options) {
    return (
      <Select
        value={formData[field.id] || ""}
        onValueChange={(value) => onFieldChange(field.id, value)}
      >
        <SelectTrigger
          ref={(el) => { if (fieldRefs.current) fieldRefs.current[field.id] = el; }}
          className={commonClasses}
        >
          <SelectValue placeholder="Select an option..." />
        </SelectTrigger>
        <SelectContent>
          {field.options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (field.type === "textarea") {
    return (
      <Textarea
        ref={(el) => { if (fieldRefs.current) fieldRefs.current[field.id] = el; }}
        placeholder={field.placeholder || field.description}
        value={formData[field.id] || ""}
        onChange={(e) => onFieldChange(field.id, e.target.value)}
        className={`${commonClasses} min-h-[120px]`}
        rows={5}
      />
    );
  }

  if (field.type === "text" && field.label.toLowerCase().includes("text")) {
    return (
      <Textarea
        ref={(el) => { if (fieldRefs.current) fieldRefs.current[field.id] = el; }}
        placeholder={field.placeholder || field.description}
        value={formData[field.id] || ""}
        onChange={(e) => onFieldChange(field.id, e.target.value)}
        className={commonClasses}
        rows={4}
      />
    );
  }

  return (
    <Input
      ref={(el) => { if (fieldRefs.current) fieldRefs.current[field.id] = el; }}
      type={field.type === "number" || field.type === "percentage" || field.type === "currency" ? "number" : "text"}
      placeholder={field.description}
      value={formData[field.id] || ""}
      onChange={(e) => onFieldChange(field.id, e.target.value)}
      className={commonClasses}
    />
  );
};

const WizardInputStep = ({
  scenario,
  formData,
  strategyValue,
  industrySlug,
  categorySlug,
  industryOverrides,
  categoryOverrides,
  selectedModel,
  selectedDashboards,
  attachedFileIds,
  draftedParams,
  isDrafting,
  isGeneratingFromDraft,
  testDataMetadata,
  showTechnicalDetails,
  showChatAssistant,
  isMarketInsightsActive,
  hasMarketInsights,
  marketInsight,
  industryContext,
  categoryContext,
  evaluation,
  fieldRefs,
  onNext,
  onFieldChange,
  onStrategyChange,
  onIndustryChange,
  onCategoryChange,
  onIndustryOverridesChange,
  onCategoryOverridesChange,
  onModelChange,
  onDashboardsChange,
  onAttachedFilesChange,
  onToggleChatAssistant,
  onActivateMarketInsights,
  onSetFormData,
  onDraftTestCase,
  onApproveAndGenerate,
  onStaticGenerate,
}: WizardInputStepProps) => {
  return (
    <motion.div
      key="input"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <ScenarioTutorial
        scenario={scenario}
        industryName={industryContext?.name ?? null}
        categoryName={categoryContext?.name ?? null}
      />

      {scenario.dataRequirements && (
        <DataRequirementsCollapsible dataRequirements={scenario.dataRequirements} />
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={onToggleChatAssistant}
        className="gap-2"
      >
        <MessageSquare className="w-4 h-4" />
        {showChatAssistant ? "Hide chatbot" : "Use chatbot to enter data"}
      </Button>

      {showChatAssistant && (
        <ScenarioChatAssistant
          scenarioId={scenario.id}
          requiredFields={scenario.requiredFields.map((f) => ({
            id: f.id,
            label: f.label,
            description: f.description,
            required: f.required,
            type: f.type,
            placeholder: f.placeholder,
          }))}
          dataRequirements={
            scenario.dataRequirements
              ? scenario.dataRequirements.sections
                  .map((s) => `${s.heading}: ${s.description}`)
                  .join("\n")
              : ""
          }
          onApply={(fields) => {
            onSetFormData((prev) => ({ ...prev, ...fields }));
            onToggleChatAssistant();
            toast.success(`${Object.keys(fields).length} field(s) populated from chat`);
          }}
          onClose={onToggleChatAssistant}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold mb-1">Enter Your Data</h3>
          <p className="text-sm text-muted-foreground">
            Fields marked with <span className="text-destructive">*</span> are required for the analysis. Optional fields improve recommendation accuracy.
          </p>
        </div>

        {showTechnicalDetails && (
          <div className="flex items-center gap-2">
            {testDataMetadata && (
              <span className="text-xs text-muted-foreground">
                {testDataMetadata.source === "ai" ? <>Score: {testDataMetadata.score}/100</> : "Static"}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={onDraftTestCase} disabled={isDrafting || isGeneratingFromDraft} className="gap-2 text-muted-foreground hover:text-foreground">
              {isDrafting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {isDrafting ? "Drafting..." : "Draft Test Case"}
            </Button>
            <Button variant="ghost" size="sm" onClick={onStaticGenerate} disabled={isDrafting || isGeneratingFromDraft} className="gap-2 text-muted-foreground hover:text-foreground">
              <FlaskConical className="w-4 h-4" />
              Static
            </Button>
          </div>
        )}
      </div>

      {showTechnicalDetails && draftedParams && (
        <DraftedParametersCard
          parameters={draftedParams}
          onApprove={onApproveAndGenerate}
          onRedraft={onDraftTestCase}
          isGenerating={isGeneratingFromDraft}
          isRedrafting={isDrafting}
        />
      )}

      <MasterXMLPreview scenarioType={scenario.id} />

      {/* Context Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg border border-border bg-card/50">
        <IndustrySelector value={industrySlug} onChange={onIndustryChange} />
        <CategorySelector value={categorySlug} onChange={onCategoryChange} />
      </div>

      {industrySlug && (
        <IndustryContextEditor
          industrySlug={industrySlug}
          overrides={industryOverrides}
          onOverridesChange={onIndustryOverridesChange}
        />
      )}

      {categorySlug && (
        <CategoryContextEditor
          categorySlug={categorySlug}
          overrides={categoryOverrides}
          onOverridesChange={onCategoryOverridesChange}
        />
      )}

      {hasMarketInsights && marketInsight && (
        <MarketInsightsBanner
          insight={marketInsight}
          onActivate={onActivateMarketInsights}
          isActivated={isMarketInsightsActive}
        />
      )}

      {(industrySlug || categorySlug) && (
        <ContextPreview industrySlug={industrySlug} categorySlug={categorySlug} showXML={true} />
      )}

      {scenario.strategySelector && (
        <div className="mb-6">
          <StrategySelector
            value={strategyValue}
            onChange={onStrategyChange}
            title={strategyPresets[scenario.strategySelector].title}
            description={strategyPresets[scenario.strategySelector].description}
            options={strategyPresets[scenario.strategySelector].options}
          />
        </div>
      )}

      {/* Required Fields */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Required Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scenario.requiredFields
            .filter((f) => f.required)
            .map((field) => {
              if (field.id === "industryContext") {
                return (
                  <div key={field.id} className="md:col-span-2">
                    {renderField(field, formData, onFieldChange, fieldRefs)}
                  </div>
                );
              }
              const blockEval = evaluation?.blocks.find((b: any) => b.fieldId === field.id);
              return (
                <div key={field.id} className={`space-y-2 ${field.type === "textarea" ? "md:col-span-2" : ""}`}>
                  <Label className="flex items-center gap-1">
                    {field.label}
                    <span className="text-destructive">*</span>
                    {field.type === "percentage" && <span className="text-muted-foreground text-xs">(%)</span>}
                    {field.type === "currency" && <span className="text-muted-foreground text-xs">($)</span>}
                    {blockEval && blockEval.status === "pass" && <CheckCircle2 className="w-3.5 h-3.5 text-success ml-1" />}
                    {blockEval && blockEval.status === "warning" && <AlertCircle className="w-3.5 h-3.5 text-warning ml-1" />}
                    {blockEval && blockEval.status === "fail" && <AlertTriangle className="w-3.5 h-3.5 text-destructive ml-1" />}
                  </Label>
                  {renderField(field, formData, onFieldChange, fieldRefs)}
                </div>
              );
            })}
        </div>
      </div>

      {/* Optional Fields */}
      {scenario.requiredFields.some((f) => !f.required) && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Optional Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scenario.requiredFields
              .filter((f) => !f.required)
              .map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label className="flex items-center gap-1">
                    {field.label}
                    {field.type === "percentage" && <span className="text-muted-foreground text-xs">(%)</span>}
                    {field.type === "currency" && <span className="text-muted-foreground text-xs">($)</span>}
                  </Label>
                  {renderField(field, formData, onFieldChange, fieldRefs)}
                </div>
              ))}
          </div>
        </div>
      )}

      <DashboardSelector scenarioId={scenario.id} selectedDashboards={selectedDashboards} onSelectionChange={onDashboardsChange} />
      <ScenarioFileAttachment selectedFileIds={attachedFileIds} onSelectionChange={onAttachedFilesChange} />
      <ModelSelector value={selectedModel} onChange={onModelChange} />

      <FinalXMLPreview
        scenarioType={scenario.id}
        scenarioData={formData}
        industry={industryContext || null}
        category={categoryContext || null}
        strategyValue={strategyValue}
      />

      <div className="flex justify-end">
        <Button variant="hero" size="lg" onClick={onNext} className="gap-2">
          Review Data
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

export default WizardInputStep;
