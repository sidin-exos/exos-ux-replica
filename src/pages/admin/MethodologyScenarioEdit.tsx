import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, Save, X, Plus, Check, Circle } from "lucide-react";
import Header from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  useCoachingCard,
  useFieldConfigs,
  useUpdateCoachingCard,
  useUpdateFieldConfigs,
} from "@/hooks/useMethodologyAdmin";
import type { CoachingCard, FieldConfig } from "@/hooks/useMethodologyAdmin";

// ---------------------------------------------------------------------------
// Shared style constants
// ---------------------------------------------------------------------------

const INPUT_CLS = "bg-white border-slate-200 rounded-md focus-visible:ring-teal-600";
const TEXTAREA_CLS = "bg-white border-slate-200 rounded-md focus-visible:ring-teal-600";
const LABEL_CLS = "text-sm font-semibold text-slate-900";
const HELP_CLS = "text-xs text-slate-400 mt-1";
const CARD_CLS = "bg-white border border-slate-200 rounded-lg shadow-none";

const GROUP_COLORS: Record<string, string> = {
  A: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  B: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  C: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  D: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  E: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
};

interface SubPrompt {
  label: string;
  is_critical?: boolean;
  data_type?: string;
}

// ---------------------------------------------------------------------------
// Sticky save bar
// ---------------------------------------------------------------------------

function StickySaveBar({
  label,
  isPending,
  saved,
  onClick,
}: {
  label: string;
  isPending: boolean;
  saved: boolean;
  onClick: () => void;
}) {
  return (
    <div className="sticky bottom-6 z-10 flex justify-end pointer-events-none">
      <div className="pointer-events-auto bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg px-4 py-3 shadow-lg">
        <Button
          onClick={onClick}
          disabled={isPending}
          className="w-full sm:w-auto min-w-[200px]"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : saved ? (
            <Check className="w-4 h-4 mr-2 text-green-300" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {saved ? "Saved" : label}
        </Button>
      </div>
    </div>
  );
}

function useSaveFlash(isPending: boolean, isSuccess: boolean) {
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (!isPending && isSuccess) {
      setSaved(true);
      const t = setTimeout(() => setSaved(false), 2000);
      return () => clearTimeout(t);
    }
  }, [isPending, isSuccess]);
  return saved;
}

// ---------------------------------------------------------------------------
// Coaching Card Tab
// ---------------------------------------------------------------------------

interface CoachingFieldDef {
  key: keyof CoachingCard;
  label: string;
  help: string;
  rows: number;
  type?: "select";
  options?: string[];
  section: number;
}

const SECTION_LABELS = [
  "Core Identity",
  "Quality & Risk",
  "Compliance",
  "Chatbot Behavior",
  "Navigation",
];

const COACHING_FIELDS: CoachingFieldDef[] = [
  { key: "purpose", label: "Purpose", help: "What this scenario produces and why it matters. Shown to chatbot for context.", rows: 3, section: 0 },
  { key: "min_required", label: "Minimum Required Inputs", help: "The bare minimum data the user must provide. Used by chatbot to coach users.", rows: 4, section: 0 },
  { key: "enhanced", label: "Enhanced Inputs", help: "Additional data that improves output quality. Absence triggers LOW CONFIDENCE flag.", rows: 4, section: 0 },
  { key: "common_failure", label: "Common Failure Mode", help: "What goes wrong when users provide poor input. Used by chatbot and input evaluator.", rows: 3, section: 1 },
  { key: "financial_impact", label: "Financial Impact of Gap", help: "The business cost of the failure mode. Shown to users as motivation to provide better data.", rows: 2, section: 1 },
  { key: "gdpr_guardrail", label: "GDPR Guardrail", help: "Scenario-specific privacy reminder shown before submission.", rows: 3, section: 2 },
  { key: "coaching_tips", label: "Coaching Tips", help: "Detailed guidance for the chatbot AI. Tells the chatbot what questions to ask and what to emphasize.", rows: 6, section: 3 },
  { key: "example_prompt", label: "Example Bot Prompt", help: "Example of what the chatbot should say when coaching this scenario.", rows: 6, section: 3 },
  { key: "trigger_phrases", label: "Trigger Phrases", help: "User phrases that suggest this scenario is the right tool.", rows: 2, section: 4 },
  { key: "navigation_guidance", label: "Navigation Guidance", help: "When to recommend this scenario to users.", rows: 2, section: 4 },
  { key: "confidence_dependency", label: "Confidence Dependency", help: "Confidence tier for this scenario.", rows: 0, type: "select", options: ["HIGH", "MEDIUM-HIGH", "MEDIUM"], section: 4 },
];

function CoachingCardTab({ card, slug }: { card: CoachingCard; slug: string }) {
  const [form, setForm] = useState<Record<string, string>>({});
  const updateCard = useUpdateCoachingCard();
  const saved = useSaveFlash(updateCard.isPending, updateCard.isSuccess);

  useEffect(() => {
    const values: Record<string, string> = {};
    for (const field of COACHING_FIELDS) {
      values[field.key] = (card[field.key] as string) ?? "";
    }
    setForm(values);
  }, [card]);

  const handleSave = useCallback(() => {
    const updates: Partial<CoachingCard> = {};
    for (const field of COACHING_FIELDS) {
      (updates as Record<string, string>)[field.key] = form[field.key] ?? "";
    }
    updateCard.mutate({ slug, updates });
  }, [form, slug, updateCard]);

  // Group fields by section
  let lastSection = -1;

  return (
    <div className="space-y-6">
      {COACHING_FIELDS.map((field) => {
        const showDivider = field.section !== lastSection && lastSection !== -1;
        const showSectionHeader = field.section !== lastSection;
        lastSection = field.section;

        return (
          <div key={field.key}>
            {showDivider && (
              <Separator className="my-2 bg-slate-200" />
            )}
            {showSectionHeader && (
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
                {SECTION_LABELS[field.section]}
              </p>
            )}
            <div className="space-y-1.5">
              <Label className={LABEL_CLS}>{field.label}</Label>
              {field.type === "select" ? (
                <Select
                  value={form[field.key] ?? ""}
                  onValueChange={(val) => setForm((prev) => ({ ...prev, [field.key]: val }))}
                >
                  <SelectTrigger className={INPUT_CLS}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Textarea
                  rows={field.rows}
                  className={TEXTAREA_CLS}
                  value={form[field.key] ?? ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                />
              )}
              <p className={HELP_CLS}>{field.help}</p>
            </div>
          </div>
        );
      })}

      <StickySaveBar
        label="Save Coaching Card"
        isPending={updateCard.isPending}
        saved={saved}
        onClick={handleSave}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Field Configuration Tab
// ---------------------------------------------------------------------------

interface BlockState {
  id: string;
  block_id: string;
  block_label: string;
  is_required: boolean;
  min_words: number;
  expected_data_type: string;
  expected_keywords: string[];
  deviation_type: string;
  sub_prompts: SubPrompt[];
}

function parseSubPrompts(json: unknown): SubPrompt[] {
  if (Array.isArray(json)) return json as SubPrompt[];
  return [];
}

function FieldConfigTab({ fields, slug }: { fields: FieldConfig[]; slug: string }) {
  const [blocks, setBlocks] = useState<BlockState[]>([]);
  const [keywordInput, setKeywordInput] = useState<Record<string, string>>({});
  const updateFields = useUpdateFieldConfigs();
  const saved = useSaveFlash(updateFields.isPending, updateFields.isSuccess);

  useEffect(() => {
    setBlocks(
      fields.map((f) => ({
        id: f.id,
        block_id: f.block_id,
        block_label: f.block_label,
        is_required: f.is_required,
        min_words: f.min_words,
        expected_data_type: f.expected_data_type,
        expected_keywords: f.expected_keywords ?? [],
        deviation_type: f.deviation_type,
        sub_prompts: parseSubPrompts(f.sub_prompts),
      }))
    );
  }, [fields]);

  const updateBlock = (idx: number, patch: Partial<BlockState>) => {
    setBlocks((prev) => prev.map((b, i) => (i === idx ? { ...b, ...patch } : b)));
  };

  const addKeyword = (idx: number) => {
    const keyword = (keywordInput[blocks[idx].block_id] ?? "").trim();
    if (!keyword) return;
    updateBlock(idx, {
      expected_keywords: [...blocks[idx].expected_keywords, keyword],
    });
    setKeywordInput((prev) => ({ ...prev, [blocks[idx].block_id]: "" }));
  };

  const removeKeyword = (blockIdx: number, kwIdx: number) => {
    updateBlock(blockIdx, {
      expected_keywords: blocks[blockIdx].expected_keywords.filter((_, i) => i !== kwIdx),
    });
  };

  const addSubPrompt = (idx: number) => {
    updateBlock(idx, {
      sub_prompts: [...blocks[idx].sub_prompts, { label: "", is_critical: false, data_type: "text" }],
    });
  };

  const updateSubPrompt = (blockIdx: number, spIdx: number, patch: Partial<SubPrompt>) => {
    const updated = blocks[blockIdx].sub_prompts.map((sp, i) =>
      i === spIdx ? { ...sp, ...patch } : sp
    );
    updateBlock(blockIdx, { sub_prompts: updated });
  };

  const removeSubPrompt = (blockIdx: number, spIdx: number) => {
    updateBlock(blockIdx, {
      sub_prompts: blocks[blockIdx].sub_prompts.filter((_, i) => i !== spIdx),
    });
  };

  const handleSave = useCallback(() => {
    updateFields.mutate({
      slug,
      blocks: blocks.map((b) => ({
        id: b.id,
        updates: {
          block_label: b.block_label,
          is_required: b.is_required,
          min_words: b.min_words,
          expected_data_type: b.expected_data_type,
          expected_keywords: b.expected_keywords,
          deviation_type: b.deviation_type,
          sub_prompts: b.sub_prompts as unknown as FieldConfig["sub_prompts"],
        },
      })),
    });
  }, [blocks, slug, updateFields]);

  return (
    <div className="space-y-6">
      {blocks.map((block, idx) => (
        <Card key={block.id} className={CARD_CLS}>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base font-semibold text-slate-800">
                {block.block_label}
              </CardTitle>
              <span className="text-xs text-slate-400 font-mono">{block.block_id}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Block Label — full width */}
            <div className="space-y-1.5">
              <Label className={LABEL_CLS}>Block Label</Label>
              <Input
                className={INPUT_CLS}
                value={block.block_label}
                onChange={(e) => updateBlock(idx, { block_label: e.target.value })}
              />
            </div>

            {/* Is Required + Min Words — 2-column */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 pt-6">
                <Checkbox
                  id={`req-${block.id}`}
                  checked={block.is_required}
                  onCheckedChange={(checked) =>
                    updateBlock(idx, { is_required: checked === true })
                  }
                />
                <Label htmlFor={`req-${block.id}`} className={LABEL_CLS}>
                  Is Required
                </Label>
              </div>
              <div className="space-y-1.5">
                <Label className={LABEL_CLS}>Min Words</Label>
                <Input
                  type="number"
                  className={INPUT_CLS}
                  value={block.min_words}
                  onChange={(e) => updateBlock(idx, { min_words: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* Expected Data Type + Deviation Type — 2-column */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className={LABEL_CLS}>Expected Data Type</Label>
                <Select
                  value={block.expected_data_type}
                  onValueChange={(val) => updateBlock(idx, { expected_data_type: val })}
                >
                  <SelectTrigger className={INPUT_CLS}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["narrative", "numeric", "structured", "document"].map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className={LABEL_CLS}>Deviation Type</Label>
                <Select
                  value={block.deviation_type}
                  onValueChange={(val) => updateBlock(idx, { deviation_type: val })}
                >
                  <SelectTrigger className={INPUT_CLS}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["0", "1", "1H", "2"].map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Expected Keywords — full width */}
            <div className="space-y-2">
              <Label className={LABEL_CLS}>Expected Keywords</Label>
              {block.expected_keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {block.expected_keywords.map((kw, kwIdx) => (
                    <span
                      key={kwIdx}
                      className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded px-2 py-0.5"
                    >
                      {kw}
                      <button
                        type="button"
                        onClick={() => removeKeyword(idx, kwIdx)}
                        className="text-blue-300 hover:text-blue-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="Add keyword..."
                  className={INPUT_CLS}
                  value={keywordInput[block.block_id] ?? ""}
                  onChange={(e) =>
                    setKeywordInput((prev) => ({ ...prev, [block.block_id]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addKeyword(idx);
                    }
                  }}
                />
                <Button variant="outline" size="sm" onClick={() => addKeyword(idx)}>
                  Add
                </Button>
              </div>
            </div>

            {/* Sub-Prompts (only for deviation_type 1 or 1H) */}
            {(block.deviation_type === "1" || block.deviation_type === "1H") && (
              <div className="space-y-3 border-t border-slate-200 pt-5">
                <Label className={LABEL_CLS}>Sub-Prompts</Label>
                {block.sub_prompts.map((sp, spIdx) => (
                  <div
                    key={spIdx}
                    className="flex items-start gap-3 p-3 rounded-md border border-slate-200 bg-slate-50"
                  >
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Label"
                        className={INPUT_CLS}
                        value={sp.label}
                        onChange={(e) =>
                          updateSubPrompt(idx, spIdx, { label: e.target.value })
                        }
                      />
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`crit-${block.id}-${spIdx}`}
                            checked={sp.is_critical ?? false}
                            onCheckedChange={(checked) =>
                              updateSubPrompt(idx, spIdx, { is_critical: checked === true })
                            }
                          />
                          <Label htmlFor={`crit-${block.id}-${spIdx}`} className="text-xs text-slate-600">
                            Critical
                          </Label>
                        </div>
                        <Select
                          value={sp.data_type ?? "text"}
                          onValueChange={(val) =>
                            updateSubPrompt(idx, spIdx, { data_type: val })
                          }
                        >
                          <SelectTrigger className={`w-[140px] h-8 text-xs ${INPUT_CLS}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["percentage", "currency", "integer", "date", "text", "selection"].map(
                              (opt) => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-slate-400 hover:text-destructive"
                      onClick={() => removeSubPrompt(idx, spIdx)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => addSubPrompt(idx)}>
                  <Plus className="w-4 h-4 mr-1" /> Add Sub-Prompt
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <StickySaveBar
        label="Save All Blocks"
        isPending={updateFields.isPending}
        saved={saved}
        onClick={handleSave}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Test Data Guidance Tab
// ---------------------------------------------------------------------------

interface GuidanceState {
  id: string;
  block_id: string;
  block_label: string;
  block_guidance: string;
  optimal_guidance: string;
  minimum_guidance: string;
  degraded_guidance: string;
}

const TIER_META: {
  key: keyof GuidanceState;
  label: string;
  help: string;
  color: string;
}[] = [
  { key: "block_guidance", label: "Block Guidance", help: "General guidance for test data generation for this block.", color: "text-slate-900" },
  { key: "optimal_guidance", label: "Optimal Tier", help: "What complete, high-quality test input looks like.", color: "text-green-700" },
  { key: "minimum_guidance", label: "Minimum Tier", help: "What bare-minimum viable input looks like.", color: "text-amber-600" },
  { key: "degraded_guidance", label: "Degraded Tier", help: "What poor input looks like — triggers failure mode.", color: "text-red-700" },
];

const TIER_DOT_COLORS: Record<string, string> = {
  block_guidance: "fill-slate-400",
  optimal_guidance: "fill-green-500",
  minimum_guidance: "fill-amber-500",
  degraded_guidance: "fill-red-500",
};

function TestDataTab({ fields, slug }: { fields: FieldConfig[]; slug: string }) {
  const [blocks, setBlocks] = useState<GuidanceState[]>([]);
  const updateFields = useUpdateFieldConfigs();
  const saved = useSaveFlash(updateFields.isPending, updateFields.isSuccess);

  useEffect(() => {
    setBlocks(
      fields.map((f) => ({
        id: f.id,
        block_id: f.block_id,
        block_label: f.block_label,
        block_guidance: f.block_guidance ?? "",
        optimal_guidance: f.optimal_guidance ?? "",
        minimum_guidance: f.minimum_guidance ?? "",
        degraded_guidance: f.degraded_guidance ?? "",
      }))
    );
  }, [fields]);

  const updateBlock = (idx: number, patch: Partial<GuidanceState>) => {
    setBlocks((prev) => prev.map((b, i) => (i === idx ? { ...b, ...patch } : b)));
  };

  const handleSave = useCallback(() => {
    updateFields.mutate({
      slug,
      blocks: blocks.map((b) => ({
        id: b.id,
        updates: {
          block_guidance: b.block_guidance || null,
          optimal_guidance: b.optimal_guidance || null,
          minimum_guidance: b.minimum_guidance || null,
          degraded_guidance: b.degraded_guidance || null,
        },
      })),
    });
  }, [blocks, slug, updateFields]);

  return (
    <div className="space-y-6">
      {blocks.map((block, idx) => (
        <Card key={block.id} className={CARD_CLS}>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base font-semibold text-slate-800">
                {block.block_label}
              </CardTitle>
              <span className="text-xs text-slate-400 font-mono">{block.block_id}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {TIER_META.map((tier) => (
              <div key={tier.key} className="space-y-1.5">
                <Label className={`${LABEL_CLS} flex items-center gap-1.5`}>
                  <Circle className={`w-2.5 h-2.5 ${TIER_DOT_COLORS[tier.key]}`} />
                  <span className={tier.color}>{tier.label}</span>
                </Label>
                <Textarea
                  rows={4}
                  className={TEXTAREA_CLS}
                  value={block[tier.key]}
                  onChange={(e) => updateBlock(idx, { [tier.key]: e.target.value })}
                />
                <p className={HELP_CLS}>{tier.help}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <StickySaveBar
        label="Save Test Data Guidance"
        isPending={updateFields.isPending}
        saved={saved}
        onClick={handleSave}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const MethodologyScenarioEdit = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { data: card, isLoading: cardLoading } = useCoachingCard(slug ?? "");
  const { data: fields, isLoading: fieldsLoading } = useFieldConfigs(slug ?? "");

  if (cardLoading || fieldsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="container max-w-6xl py-12">
          <p className="text-muted-foreground">Scenario not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/admin/methodology")}>
            Back to Methodology
          </Button>
        </main>
      </div>
    );
  }

  const groupColor = GROUP_COLORS[card.scenario_group] ?? "";

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="container max-w-6xl py-12 space-y-8">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList className="text-[13px] text-slate-400">
            <BreadcrumbItem>
              <BreadcrumbLink className="cursor-pointer hover:text-slate-600" onClick={() => navigate("/admin/methodology")}>
                Methodology
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-slate-600">{card.scenario_name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {card.scenario_name}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge className={`${groupColor} border-0`}>Group {card.scenario_group}</Badge>
            <Badge variant="outline" className="border-slate-300 text-slate-600">
              {card.confidence_dependency}
            </Badge>
            <span className="text-sm text-slate-400">#{card.scenario_id}</span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="coaching">
          <TabsList className="w-full justify-start bg-transparent border-b border-slate-200 rounded-none p-0 h-auto">
            <TabsTrigger
              value="coaching"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-slate-900 data-[state=active]:font-semibold text-slate-500 px-4 pb-3 pt-2"
            >
              Coaching Card
            </TabsTrigger>
            <TabsTrigger
              value="fields"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-slate-900 data-[state=active]:font-semibold text-slate-500 px-4 pb-3 pt-2"
            >
              Field Configuration
            </TabsTrigger>
            <TabsTrigger
              value="testdata"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-slate-900 data-[state=active]:font-semibold text-slate-500 px-4 pb-3 pt-2"
            >
              Test Data Guidance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="coaching" className="mt-6">
            <CoachingCardTab card={card} slug={slug!} />
          </TabsContent>

          <TabsContent value="fields" className="mt-6">
            {fields?.length ? (
              <FieldConfigTab fields={fields} slug={slug!} />
            ) : (
              <p className="text-muted-foreground">No field configuration found for this scenario.</p>
            )}
          </TabsContent>

          <TabsContent value="testdata" className="mt-6">
            {fields?.length ? (
              <TestDataTab fields={fields} slug={slug!} />
            ) : (
              <p className="text-muted-foreground">No field configuration found for this scenario.</p>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default MethodologyScenarioEdit;
