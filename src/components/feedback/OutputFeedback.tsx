import { useState } from "react";
import { motion } from "framer-motion";
import { Star, MessageSquare, Send, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface OutputFeedbackProps {
  onFeedbackSubmit?: (rating: number, feedback: string) => void;
  onGenerateReport?: () => void;
}

const OutputFeedback = ({ onFeedbackSubmit, onGenerateReport }: OutputFeedbackProps) => {
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleRatingClick = (value: number) => {
    setRating(value);
    // Only show feedback form for lower ratings
    if (value <= 6) {
      setShowFeedbackForm(true);
    }
  };

  const handleSubmitFeedback = () => {
    if (rating) {
      onFeedbackSubmit?.(rating, feedback);
      setSubmitted(true);
    }
  };

  const getRatingLabel = (value: number) => {
    if (value <= 3) return "Needs Improvement";
    if (value <= 5) return "Below Expectations";
    if (value <= 7) return "Meets Expectations";
    if (value <= 9) return "Great Result";
    return "Excellent!";
  };

  const displayRating = hoveredRating ?? rating;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-lg border border-border bg-card/50 p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-5 h-5 text-primary" />
        <h4 className="font-display font-semibold">How satisfied are you with this output?</h4>
      </div>

      {!submitted ? (
        <>
          {/* Rating Scale */}
          <div className="flex items-center justify-center gap-1 mb-3">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((value) => (
              <button
                key={value}
                onClick={() => handleRatingClick(value)}
                onMouseEnter={() => setHoveredRating(value)}
                onMouseLeave={() => setHoveredRating(null)}
                className={cn(
                  "w-9 h-9 rounded-lg font-medium text-sm transition-all duration-200",
                  "border border-border hover:border-primary/50",
                  rating === value
                    ? "gradient-primary text-primary-foreground border-primary shadow-md"
                    : displayRating && value <= displayRating
                    ? "bg-primary/20 text-primary border-primary/30"
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                )}
              >
                {value}
              </button>
            ))}
          </div>

          {/* Rating Label */}
          <div className="text-center mb-4">
            <span className="text-sm text-muted-foreground">
              {displayRating ? (
                <span className="text-foreground font-medium">
                  {displayRating}/10 – {getRatingLabel(displayRating)}
                </span>
              ) : (
                "Click to rate from 1 (poor) to 10 (excellent)"
              )}
            </span>
          </div>

          {/* Feedback Form Toggle */}
          {rating && (
            <div className="space-y-3">
              <button
                onClick={() => setShowFeedbackForm(!showFeedbackForm)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-center"
              >
                <MessageSquare className="w-4 h-4" />
                {showFeedbackForm ? "Hide feedback form" : "Give detailed feedback"}
                {showFeedbackForm ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {/* Feedback Textarea */}
              {showFeedbackForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-3"
                >
                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="What could be improved? What was missing or incorrect?"
                    className="min-h-[100px] bg-background"
                  />
                  <Button
                    onClick={handleSubmitFeedback}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Submit Feedback
                  </Button>
                </motion.div>
              )}

              {/* Generate Report Button - Show when satisfied (7+) */}
              {rating >= 7 && !showFeedbackForm && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pt-2"
                >
                  <Button
                    onClick={onGenerateReport}
                    variant="hero"
                    size="lg"
                    className="w-full gap-2"
                  >
                    Generate Full Report
                    <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                  </Button>
                </motion.div>
              )}
            </div>
          )}
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-4"
        >
          <div className="w-12 h-12 rounded-full bg-success/20 mx-auto mb-3 flex items-center justify-center">
            <Star className="w-6 h-6 text-success" />
          </div>
          <p className="font-medium text-foreground mb-1">Thank you for your feedback!</p>
          <p className="text-sm text-muted-foreground">
            Your input helps us improve the analysis quality.
          </p>
          
          {/* Still show generate report after feedback */}
          {rating && rating >= 5 && (
            <Button
              onClick={onGenerateReport}
              variant="hero"
              size="lg"
              className="mt-4 gap-2"
            >
              Generate Full Report
              <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default OutputFeedback;
