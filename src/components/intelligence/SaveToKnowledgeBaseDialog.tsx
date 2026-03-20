import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIndustryContexts, useProcurementCategories } from "@/hooks/useContextData";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { Database, Loader2 } from "lucide-react";
import type { IntelResult } from "@/hooks/useMarketIntelligence";

interface SaveToKnowledgeBaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: IntelResult;
}

export function SaveToKnowledgeBaseDialog({ open, onOpenChange, result }: SaveToKnowledgeBaseDialogProps) {
  const [industrySlug, setIndustrySlug] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { data: industries, isLoading: loadingIndustries } = useIndustryContexts();
  const { data: categories, isLoading: loadingCategories } = useProcurementCategories();

  const selectedIndustry = industries?.find(i => i.slug === industrySlug);
  const selectedCategory = categories?.find(c => c.slug === categorySlug);

  const handleSave = async () => {
    if (!industrySlug || !categorySlug) {
      toast.error("Please select both industry and category");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.rpc("save_intel_to_knowledge_base", {
        p_content: result.summary,
        p_citations: result.citations as unknown as Json,
        p_industry_slug: industrySlug,
        p_industry_name: selectedIndustry?.name || industrySlug,
        p_category_slug: categorySlug,
        p_category_name: selectedCategory?.name || categorySlug,
        p_key_trends: [],
        p_risk_signals: [],
        p_opportunities: [],
        p_model_used: result.model,
        p_confidence_score: 0.8,
        p_processing_time_ms: result.processingTimeMs,
      });

      if (error) throw error;

      toast.success("Saved to Knowledge Base — this intel will now ground future AI analyses");
      onOpenChange(false);
    } catch (err: any) {
      console.error("Error saving to knowledge base:", err);
      toast.error(err.message || "Failed to save to knowledge base");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Save to Knowledge Base
          </DialogTitle>
          <DialogDescription>
            Tag this intelligence with an industry and category. It will be automatically used for grounding future AI analyses.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Industry *</Label>
            <Select value={industrySlug} onValueChange={setIndustrySlug}>
              <SelectTrigger>
                <SelectValue placeholder={loadingIndustries ? "Loading..." : "Select industry"} />
              </SelectTrigger>
              <SelectContent>
                {industries?.map(ind => (
                  <SelectItem key={ind.slug} value={ind.slug}>{ind.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Category *</Label>
            <Select value={categorySlug} onValueChange={setCategorySlug}>
              <SelectTrigger>
                <SelectValue placeholder={loadingCategories ? "Loading..." : "Select category"} />
              </SelectTrigger>
              <SelectContent>
                {categories?.map(cat => (
                  <SelectItem key={cat.slug} value={cat.slug}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={!industrySlug || !categorySlug || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Saving...
              </>
            ) : (
              "Save to Knowledge Base"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
