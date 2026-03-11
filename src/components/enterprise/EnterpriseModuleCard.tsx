import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnterpriseModuleCardProps {
  sysId: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  children?: ReactNode;
  className?: string;
}

const EnterpriseModuleCard = ({
  sysId,
  title,
  description,
  icon: Icon,
  children,
  className,
}: EnterpriseModuleCardProps) => {
  return (
    <div
      className={cn(
        "bg-card border border-border/50 border-t-2 border-t-primary shadow-sm rounded-sm",
        className
      )}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30">
        <span className="font-mono text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
          {sysId}
        </span>
        {Icon && <Icon className="w-4 h-4 text-primary" />}
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {description && (
        <p className="px-4 pt-2 text-xs text-muted-foreground">{description}</p>
      )}
      {children && <div className="p-4">{children}</div>}
    </div>
  );
};

export default EnterpriseModuleCard;
