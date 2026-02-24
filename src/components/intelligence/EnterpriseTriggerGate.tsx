import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Shield, Zap } from "lucide-react";

export function EnterpriseTriggerGate() {
  return (
    <Card className="glass-effect border-primary/20">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto p-3 rounded-full bg-primary/10 w-fit mb-2">
          <Bell className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-xl flex items-center justify-center gap-2">
          Triggered Monitoring
          <Badge variant="default" className="text-xs">Enterprise</Badge>
        </CardTitle>
        <CardDescription className="max-w-md mx-auto">
          Continuous monitoring with automated trigger detection. The system regularly checks your conditions and initiates full-scale intelligence collection when triggers are confirmed.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-6">
        <div className="grid sm:grid-cols-3 gap-4 max-w-lg mx-auto">
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <Zap className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-xs text-muted-foreground">Real-time condition checks</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <Shield className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-xs text-muted-foreground">Automated alert escalation</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <Bell className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-xs text-muted-foreground">Full report on trigger</p>
          </div>
        </div>

        <Button variant="outline" asChild>
          <a href="mailto:hello@exos.dev?subject=Enterprise%20Intelligence%20Monitoring">
            Contact us to enable Enterprise features
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
