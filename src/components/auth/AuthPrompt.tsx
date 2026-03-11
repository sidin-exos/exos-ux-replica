import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface AuthPromptProps {
  feature: string;
  description?: string;
  variant?: "page" | "modal";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function AuthPromptContent({ feature, description }: Pick<AuthPromptProps, "feature" | "description">) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center text-center gap-6">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Lock className="w-8 h-8 text-primary" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-display font-semibold text-foreground">
          Sign in to access {feature}
        </h2>
        {description && (
          <p className="text-muted-foreground max-w-md">
            {description}
          </p>
        )}
      </div>
      <div className="flex flex-col items-center gap-3">
        <Button size="lg" onClick={() => navigate("/auth")} className="px-8">
          Sign In
        </Button>
        <button
          onClick={() => navigate("/auth?tab=sign-up")}
          className="text-sm text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
        >
          Create Account
        </button>
      </div>
    </div>
  );
}

export default function AuthPrompt({ feature, description, variant = "page", open, onOpenChange }: AuthPromptProps) {
  if (variant === "modal") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="sr-only">
            <DialogTitle>Sign in required</DialogTitle>
            <DialogDescription>Sign in to access {feature}</DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <AuthPromptContent feature={feature} description={description} />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-lg border-border/50 shadow-lg">
        <CardContent className="pt-10 pb-10 px-8">
          <AuthPromptContent feature={feature} description={description} />
        </CardContent>
      </Card>
    </div>
  );
}
