import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScenarioCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  status: "available" | "coming-soon";
  onClick?: () => void;
  isActive?: boolean;
}

const ScenarioCard = ({
  title,
  description,
  icon: Icon,
  status,
  onClick,
  isActive,
}: ScenarioCardProps) => {
  return (
    <button
      onClick={status === "available" ? onClick : undefined}
      disabled={status === "coming-soon"}
      className={cn(
        "group relative w-full p-6 rounded-xl text-left transition-all duration-300",
        "card-elevated hover:border-primary/50",
        isActive && "border-primary glow-effect",
        status === "coming-soon" && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-300",
            isActive
              ? "gradient-primary"
              : "bg-secondary group-hover:bg-primary/20"
          )}
        >
          <Icon
            className={cn(
              "w-6 h-6 transition-colors",
              isActive ? "text-primary-foreground" : "text-primary"
            )}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display font-semibold text-foreground">
              {title}
            </h3>
            {status === "coming-soon" && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-warning/20 text-warning">
                Coming Soon
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        </div>
      </div>

      {status === "available" && (
        <div
          className={cn(
            "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
            "bg-gradient-to-r from-primary/5 to-accent/5"
          )}
        />
      )}
    </button>
  );
};

export default ScenarioCard;
