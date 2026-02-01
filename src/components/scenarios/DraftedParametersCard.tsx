import { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Check, Pencil, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  DraftedParameters,
  PARAMETER_LABELS,
  formatSlug,
  CompanySize,
  Complexity,
  FinancialPressure,
  StrategicPriority,
  MarketConditions,
  DataQuality,
} from "@/lib/drafted-parameters";

interface DraftedParametersCardProps {
  parameters: DraftedParameters;
  onApprove: (params: DraftedParameters) => void;
  onRedraft: () => void;
  isGenerating: boolean;
  isRedrafting: boolean;
}

export function DraftedParametersCard({
  parameters,
  onApprove,
  onRedraft,
  isGenerating,
  isRedrafting,
}: DraftedParametersCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedParams, setEditedParams] = useState<DraftedParameters>(parameters);

  const handleApprove = () => {
    onApprove(isEditing ? editedParams : parameters);
  };

  const handleParamChange = <K extends keyof DraftedParameters>(
    key: K,
    value: DraftedParameters[K]
  ) => {
    setEditedParams(prev => ({ ...prev, [key]: value }));
  };

  const displayParams = isEditing ? editedParams : parameters;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">
              Proposed Test Case
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              Draft
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {displayParams.reasoning}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Parameter Display */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <ParameterRow
              label="Industry"
              value={formatSlug(displayParams.industry)}
              editing={isEditing}
            />
            <ParameterRow
              label="Category"
              value={formatSlug(displayParams.category)}
              editing={isEditing}
            />
            <ParameterRow
              label="Company Size"
              value={PARAMETER_LABELS.companySize[displayParams.companySize]}
              editing={isEditing}
              onEdit={isEditing ? (
                <ParamSelect
                  value={displayParams.companySize}
                  options={Object.entries(PARAMETER_LABELS.companySize)}
                  onChange={(v) => handleParamChange("companySize", v as CompanySize)}
                />
              ) : undefined}
            />
            <ParameterRow
              label="Complexity"
              value={PARAMETER_LABELS.complexity[displayParams.complexity]}
              editing={isEditing}
              onEdit={isEditing ? (
                <ParamSelect
                  value={displayParams.complexity}
                  options={Object.entries(PARAMETER_LABELS.complexity)}
                  onChange={(v) => handleParamChange("complexity", v as Complexity)}
                />
              ) : undefined}
            />
            <ParameterRow
              label="Financial"
              value={PARAMETER_LABELS.financialPressure[displayParams.financialPressure]}
              editing={isEditing}
              onEdit={isEditing ? (
                <ParamSelect
                  value={displayParams.financialPressure}
                  options={Object.entries(PARAMETER_LABELS.financialPressure)}
                  onChange={(v) => handleParamChange("financialPressure", v as FinancialPressure)}
                />
              ) : undefined}
            />
            <ParameterRow
              label="Priority"
              value={PARAMETER_LABELS.strategicPriority[displayParams.strategicPriority]}
              editing={isEditing}
              onEdit={isEditing ? (
                <ParamSelect
                  value={displayParams.strategicPriority}
                  options={Object.entries(PARAMETER_LABELS.strategicPriority)}
                  onChange={(v) => handleParamChange("strategicPriority", v as StrategicPriority)}
                />
              ) : undefined}
            />
            <ParameterRow
              label="Market"
              value={PARAMETER_LABELS.marketConditions[displayParams.marketConditions]}
              editing={isEditing}
              onEdit={isEditing ? (
                <ParamSelect
                  value={displayParams.marketConditions}
                  options={Object.entries(PARAMETER_LABELS.marketConditions)}
                  onChange={(v) => handleParamChange("marketConditions", v as MarketConditions)}
                />
              ) : undefined}
            />
            <ParameterRow
              label="Data Quality"
              value={PARAMETER_LABELS.dataQuality[displayParams.dataQuality]}
              editing={isEditing}
              onEdit={isEditing ? (
                <ParamSelect
                  value={displayParams.dataQuality}
                  options={Object.entries(PARAMETER_LABELS.dataQuality)}
                  onChange={(v) => handleParamChange("dataQuality", v as DataQuality)}
                />
              ) : undefined}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              onClick={handleApprove}
              disabled={isGenerating || isRedrafting}
              className="gap-2"
              size="sm"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {isGenerating ? "Generating..." : "Approve & Generate"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRedraft}
              disabled={isGenerating || isRedrafting}
              className="gap-2"
            >
              {isRedrafting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Redraft
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (!isEditing) {
                  setEditedParams(parameters);
                }
                setIsEditing(!isEditing);
              }}
              disabled={isGenerating || isRedrafting}
              className="gap-2"
            >
              {isEditing ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <Pencil className="w-4 h-4" />
              )}
              {isEditing ? "Done Editing" : "Edit"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ParameterRow({
  label,
  value,
  editing,
  onEdit,
}: {
  label: string;
  value: string;
  editing: boolean;
  onEdit?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-muted-foreground">{label}:</span>
      {editing && onEdit ? (
        onEdit
      ) : (
        <span className="font-medium text-foreground">{value}</span>
      )}
    </div>
  );
}

function ParamSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: [string, string][];
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-7 w-[160px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(([key, label]) => (
          <SelectItem key={key} value={key} className="text-xs">
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
