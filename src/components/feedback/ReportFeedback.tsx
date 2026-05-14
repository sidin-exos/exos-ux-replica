import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Send,
  Loader2,
  Bug,
  Lightbulb,
  MousePointerClick,
  Database,
  Gauge,
  Palette,
  HelpCircle,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { routeFeedback } from "@/lib/route-feedback";

interface ReportFeedbackProps {
  scenarioId?: string;
}

const FEEDBACK_TYPES = [
  { value: "data_quality", label: "Data Quality", icon: Database },
  { value: "bug", label: "Bug Report", icon: Bug },
  { value: "feature", label: "Feature Suggestion", icon: Lightbulb },
  { value: "usability", label: "Usability Issue", icon: MousePointerClick },
  { value: "performance", label: "Performance", icon: Gauge },
  { value: "visual", label: "Visual / Design", icon: Palette },
  { value: "other", label: "Other", icon: HelpCircle },
];

const ReportFeedback = ({ scenarioId }: ReportFeedbackProps) => {
  const [rating, setRating] = useState(0);
  const [feedbackType, setFeedbackType] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!rating) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("scenario_feedback").insert({
        scenario_id: scenarioId ?? null,
        rating,
        feedback_text: feedbackText || null,
        feedback_type: feedbackType || null,
      });
      if (error) throw error;
      routeFeedback({
        source: "scenario_feedback",
        idempotency_key: crypto.randomUUID(),
        rating,
        feedback_type: feedbackType || undefined,
        feedback_text: feedbackText || undefined,
        scenario_id: scenarioId,
        page_url: window.location.href,
      });
      toast.success("Thank you for your feedback!");
      setSubmitted(true);
    } catch (err) {
      console.error("[ReportFeedback] submit failed:", err);
      toast.error("Could not submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      <Card className="card-elevated border-t-2 border-t-primary/60">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Rate this Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-2" />
              <p className="font-medium">Thank you for helping us improve!</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* 1-10 Rating Scale */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  How useful is this report?
                </Label>
                <div className="flex items-center justify-center gap-1 flex-wrap">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      className={cn(
                        "w-9 h-9 rounded-lg font-medium text-sm transition-all duration-200",
                        "border border-border hover:border-primary/50",
                        rating === value
                          ? "bg-primary text-primary-foreground border-primary shadow-md"
                          : rating > 0 && value <= rating
                          ? "bg-primary/20 text-primary border-primary/30"
                          : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                      )}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  {rating === 0
                    ? "1 (not useful) – 10 (excellent)"
                    : `${rating}/10`}
                </p>
              </div>

              {/* Feedback type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Feedback type (optional)
                </Label>
                <Select
                  value={feedbackType}
                  onValueChange={(v) => setFeedbackType(v)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select a category…" />
                  </SelectTrigger>
                  <SelectContent>
                    {FEEDBACK_TYPES.map(({ value, label, icon: Icon }) => (
                      <SelectItem key={value} value={value}>
                        <span className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                          {label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Comments */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Comments (optional)
                </Label>
                <Textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="What worked well, what could be better?"
                  className="min-h-[80px]"
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={rating === 0 || isSubmitting}
                className="w-full gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Submit Feedback
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ReportFeedback;
