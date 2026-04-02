import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface PasswordStrengthMeterProps {
  password: string;
}

function evaluateStrength(password: string): { level: 0 | 1 | 2 | 3; label: string } {
  if (!password) return { level: 0, label: "" };

  let score = 0;
  if (password.length >= 10) score++;
  if (password.length >= 14) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { level: 1, label: "Weak" };
  if (score <= 3) return { level: 2, label: "Fair" };
  return { level: 3, label: "Strong" };
}

const PasswordStrengthMeter = ({ password }: PasswordStrengthMeterProps) => {
  const { level, label } = useMemo(() => evaluateStrength(password), [password]);

  if (!password) return null;

  const colors = [
    "bg-muted",
    "bg-destructive",
    "hsl(45 93% 47%)",
    "bg-primary",
  ];

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3].map((seg) => (
          <div
            key={seg}
            className={cn(
              "h-[3px] flex-1 rounded-full transition-colors",
              seg <= level
                ? level === 1
                  ? "bg-destructive"
                  : level === 2
                  ? "bg-amber-500"
                  : "bg-primary"
                : "bg-muted"
            )}
          />
        ))}
      </div>
      <p
        className={cn(
          "text-[11px]",
          level === 1
            ? "text-destructive"
            : level === 2
            ? "text-amber-500"
            : "text-primary"
        )}
      >
        {label}
      </p>
    </div>
  );
};

export default PasswordStrengthMeter;
