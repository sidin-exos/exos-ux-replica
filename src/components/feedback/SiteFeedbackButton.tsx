import { useState } from "react";
import { MessageSquare, Send, Loader2, CheckCircle2, Bug, Lightbulb, MousePointerClick, Database, Gauge, Palette, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const FEEDBACK_TYPES = [
  { value: "bug", label: "Bug Report", icon: Bug },
  { value: "feature", label: "Feature Suggestion", icon: Lightbulb },
  { value: "usability", label: "Usability Issue", icon: MousePointerClick },
  { value: "data_quality", label: "Data Quality", icon: Database },
  { value: "performance", label: "Performance", icon: Gauge },
  { value: "visual", label: "Visual / Design", icon: Palette },
  { value: "other", label: "Other", icon: HelpCircle },
] as const;

interface SiteFeedbackButtonProps {
  scenarioId?: string;
  className?: string;
}

const SiteFeedbackButton = ({ scenarioId = "general", className }: SiteFeedbackButtonProps) => {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedbackType, setFeedbackType] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!rating) return;
    setIsSubmitting(true);
    const { error } = await supabase.from("scenario_feedback").insert({
      scenario_id: scenarioId,
      rating,
      feedback_text: feedbackText || null,
      feedback_type: feedbackType || null,
    } as any);
    setIsSubmitting(false);
    if (error) {
      toast.error("Failed to submit feedback");
    } else {
      toast.success("Thank you for your feedback!");
      setSubmitted(true);
      setTimeout(() => {
        setOpen(false);
        setRating(0);
        setFeedbackType("");
        setFeedbackText("");
        setSubmitted(false);
      }, 1500);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="default"
        onClick={() => setOpen(true)}
        className={cn("gap-2 border-border/80 text-muted-foreground hover:text-foreground hover:border-primary/60", className)}
      >
        <MessageSquare className="w-4 h-4" />
        Leave Feedback
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Leave Feedback</DialogTitle>
            <DialogDescription>
              Help us improve — rate your experience and share your thoughts.
            </DialogDescription>
          </DialogHeader>

          {!submitted ? (
            <div className="space-y-5">
              {/* 1-10 Rating Scale */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Rating</Label>
                <div className="flex items-center justify-center gap-1">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((value) => (
                    <button
                      key={value}
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
                    ? "Click to rate from 1 (poor) to 10 (excellent)"
                    : `${rating}/10`}
                </p>
              </div>

              {/* Feedback Type Selector */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Feedback Type (optional)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {FEEDBACK_TYPES.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setFeedbackType(feedbackType === value ? "" : value)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                        "border border-border hover:border-primary/50",
                        feedbackType === value
                          ? "bg-primary text-primary-foreground border-primary shadow-md"
                          : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comments */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Comments (optional)</Label>
                <Textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="What could be improved?"
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
          ) : (
            <div className="text-center py-6">
              <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-2" />
              <p className="font-medium">Thank you!</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SiteFeedbackButton;
