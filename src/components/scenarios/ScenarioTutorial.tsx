import { GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ScenarioTutorialProps {
  scenario: { title: string; description: string; previewDescription?: string };
  industryName?: string | null;
  categoryName?: string | null;
}

const ScenarioTutorial = ({
  scenario,
}: ScenarioTutorialProps) => {
  const displayContent = scenario.previewDescription || scenario.description;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-4 pb-4 px-5">
        <div className="flex items-center gap-2 mb-3">
          <GraduationCap className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-primary">
            About this scenario
          </span>
        </div>
        <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {displayContent}
        </div>
      </CardContent>
    </Card>
  );
};

export default ScenarioTutorial;
