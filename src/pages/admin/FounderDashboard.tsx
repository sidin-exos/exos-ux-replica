import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, TrendingUp, Users, AlertTriangle, Clock, Pencil, BarChart3 } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useFounderMetrics, useUpdateMetrics, useUpdateHypothesis } from "@/hooks/useFounderMetrics";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

const FounderDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin, isLoading: authLoading } = useAdminAuth();
  const { data: metrics, isLoading: metricsLoading } = useFounderMetrics();
  const updateMetrics = useUpdateMetrics();
  const updateHypothesis = useUpdateHypothesis();

  // Edit metrics dialog state
  const [metricsOpen, setMetricsOpen] = useState(false);
  const [editMrr, setEditMrr] = useState("");
  const [editUsers, setEditUsers] = useState("");
  const [editBurn, setEditBurn] = useState("");
  const [editRunway, setEditRunway] = useState("");

  // Hypothesis edit state
  const [editingHypothesis, setEditingHypothesis] = useState(false);
  const [hypothesisText, setHypothesisText] = useState("");

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate("/", { replace: true });
    }
  }, [authLoading, isAdmin, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const openMetricsDialog = () => {
    setEditMrr(String(metrics?.mrr ?? 0));
    setEditUsers(String(metrics?.active_users ?? 0));
    setEditBurn(String(metrics?.burn_rate ?? 0));
    setEditRunway(String(metrics?.runway_months ?? 12));
    setMetricsOpen(true);
  };

  const saveMetrics = () => {
    updateMetrics.mutate(
      {
        mrr: Number(editMrr),
        active_users: Number(editUsers),
        burn_rate: Number(editBurn),
        runway_months: Number(editRunway),
      },
      { onSuccess: () => setMetricsOpen(false) }
    );
  };

  const startEditHypothesis = () => {
    setHypothesisText(metrics?.strategic_hypothesis ?? "");
    setEditingHypothesis(true);
  };

  const saveHypothesis = () => {
    updateHypothesis.mutate(hypothesisText, {
      onSuccess: () => setEditingHypothesis(false),
    });
  };

  const metricCards = [
    { title: "MRR", icon: TrendingUp, value: `EUR ${metrics?.mrr ?? 0}` },
    { title: "Active Users", icon: Users, value: String(metrics?.active_users ?? 0) },
    { title: "Burn Rate", icon: AlertTriangle, value: `EUR ${metrics?.burn_rate ?? 0}/mo` },
    { title: "Runway", icon: Clock, value: `${metrics?.runway_months ?? 0} months` },
  ];

  return (
    <div className="min-h-screen gradient-hero">
      <Header />
      <main className="container max-w-6xl py-12 space-y-10">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl font-bold text-foreground">Command Center</h1>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/analytics">
              <BarChart3 className="w-4 h-4 mr-1" /> View Analytics
            </Link>
          </Button>
        </div>

        {/* Section 1: North Star Metrics */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-muted-foreground">North Star Metrics</h2>
            <Dialog open={metricsOpen} onOpenChange={setMetricsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={openMetricsDialog}>
                  <Pencil className="w-4 h-4 mr-1" /> Edit Metrics
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Metrics</DialogTitle>
                  <DialogDescription>Update your North Star numbers.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <label className="space-y-1">
                    <span className="text-sm text-muted-foreground">MRR (EUR)</span>
                    <Input type="number" value={editMrr} onChange={(e) => setEditMrr(e.target.value)} />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm text-muted-foreground">Active Users</span>
                    <Input type="number" value={editUsers} onChange={(e) => setEditUsers(e.target.value)} />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm text-muted-foreground">Burn Rate (EUR/mo)</span>
                    <Input type="number" value={editBurn} onChange={(e) => setEditBurn(e.target.value)} />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm text-muted-foreground">Runway (months)</span>
                    <Input type="number" value={editRunway} onChange={(e) => setEditRunway(e.target.value)} />
                  </label>
                </div>
                <DialogFooter>
                  <Button onClick={saveMetrics} disabled={updateMetrics.isPending}>
                    {updateMetrics.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {metricsLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="card-elevated rounded-xl p-5 animate-pulse h-28" />
                ))
              : metricCards.map((card) => (
                  <div key={card.title} className="card-elevated rounded-xl p-5 group hover:border-primary/30 transition-all duration-300">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <card.icon className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{card.title}</p>
                    <p className="font-display text-2xl font-bold text-foreground">{card.value}</p>
                  </div>
                ))}
          </div>
        </section>

        {/* Section 2: Strategic Hypothesis */}
        <section>
          <Card className="card-elevated">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="font-display text-lg">Strategic Hypothesis</CardTitle>
              {!editingHypothesis && (
                <Button variant="ghost" size="icon" onClick={startEditHypothesis}>
                  <Pencil className="w-4 h-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <div className="h-16 animate-pulse rounded bg-muted" />
              ) : editingHypothesis ? (
                <div className="space-y-3">
                  <Textarea
                    value={hypothesisText}
                    onChange={(e) => setHypothesisText(e.target.value)}
                    rows={4}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveHypothesis} disabled={updateHypothesis.isPending}>
                      {updateHypothesis.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingHypothesis(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground leading-relaxed">
                  {metrics?.strategic_hypothesis || "No hypothesis set yet."}
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default FounderDashboard;
