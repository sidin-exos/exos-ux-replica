import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ScenarioTutorialProps {
  scenario: { title: string; description: string; previewDescription?: string };
  industryName?: string | null;
  categoryName?: string | null;
}

const ScenarioTutorial = ({
  scenario,
  industryName = null,
  categoryName = null,
}: ScenarioTutorialProps) => {
  const [aiContent, setAiContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchTutorial = useCallback(
    async (industry: string | null, category: string | null) => {
      // No context → static description, no AI call
      if (!industry && !category) {
        setAiContent(null);
        return;
      }

      // Cancel any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);

      try {
        const { data, error } = await supabase.functions.invoke(
          "scenario-tutorial",
          {
            body: {
              scenarioTitle: scenario.title,
              industryName: industry,
              categoryName: category,
            },
          }
        );

        if (controller.signal.aborted) return;

        if (error) throw error;

        if (data?.content) {
          setAiContent(data.content);
        } else {
          setAiContent(null);
        }
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error("[ScenarioTutorial] Error:", err);
        toast.error("Couldn't personalize tutorial", {
          description: "Showing default description instead.",
        });
        setAiContent(null);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [scenario.title]
  );

  useEffect(() => {
    // Debounce 500ms
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchTutorial(industryName ?? null, categoryName ?? null);
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [industryName, categoryName, fetchTutorial]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const isPersonalized = !!aiContent;
  const displayContent = aiContent || scenario.description;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-4 pb-4 px-5">
        <div className="flex items-center gap-2 mb-3">
          <GraduationCap className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-primary">
            About this scenario
          </span>
          {isPersonalized && !isLoading && (
            <Badge
              variant="secondary"
              className="ml-auto text-xs gap-1 bg-primary/10 text-primary border-primary/20"
            >
              <Sparkles className="w-3 h-3" />
              Personalized for your context
            </Badge>
          )}
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                <span className="text-xs text-muted-foreground">
                  Personalizing for your context...
                </span>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </motion.div>
          ) : (
            <motion.div
              key={isPersonalized ? "ai" : "static"}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap"
            >
              {displayContent}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default ScenarioTutorial;
