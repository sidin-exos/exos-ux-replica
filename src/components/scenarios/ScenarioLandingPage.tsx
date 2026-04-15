import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { icons } from "lucide-react";
import { Quote, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

interface ScenarioLandingPageProps {
  metaTitle: string;
  metaDescription: string;
  canonicalPath: string;
  category: string;
  h1: string;
  subtitle: string;
  heroMetric: string;
  heroMetricLabel: string;
  whatItDoesTitle: string;
  whatItDoesParagraph: string;
  features: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  whoItIsFor: Array<{
    role: string;
    need: string;
  }>;
  proof?: {
    quote: string;
    person: string;
    company: string;
    metric: string;
  };
  relatedScenarios: Array<{
    name: string;
    path: string;
    description: string;
  }>;
}

const ScenarioLandingPage = ({
  metaTitle,
  metaDescription,
  canonicalPath,
  category,
  h1,
  subtitle,
  heroMetric,
  heroMetricLabel,
  whatItDoesTitle,
  whatItDoesParagraph,
  features,
  whoItIsFor,
  proof,
  relatedScenarios,
}: ScenarioLandingPageProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={`https://exosproc.com${canonicalPath}`} />
      </Helmet>

      <Header />

      {/* ── HERO ── */}
      <section className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4 text-xs font-medium tracking-wide">
            {category}
          </Badge>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            {h1}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            {subtitle}
          </p>

          <Card className="inline-block mb-8 border-success/30 bg-success/5">
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-bold text-success">{heroMetric}</p>
              <p className="text-sm text-muted-foreground mt-1">{heroMetricLabel}</p>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button variant="hero" size="lg" asChild>
              <Link to="/auth">
                Start Free Trial <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/features">See All Scenarios</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── WHAT IT DOES ── */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl font-bold mb-4 text-center">{whatItDoesTitle}</h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
            {whatItDoesParagraph}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => {
              const LucideIcon = (icons as Record<string, any>)[f.icon];
              return (
                <Card key={f.title} className="border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="p-6">
                    {LucideIcon && <LucideIcon className="h-8 w-8 text-primary mb-3" />}
                    <h3 className="font-semibold mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR ── */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-3xl font-bold mb-8 text-center">Who This Is For</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {whoItIsFor.map((w) => (
              <div key={w.role} className="p-5 rounded-lg border border-border/50 bg-card">
                <p className="font-semibold mb-1">{w.role}</p>
                <p className="text-sm text-muted-foreground">{w.need}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROOF ── */}
      {proof && (
        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-3xl mx-auto">
            <Card className="border-border/50">
              <CardContent className="p-8">
                <Quote className="h-8 w-8 text-primary/40 mb-4" />
                <blockquote className="text-lg italic text-foreground mb-4">
                  "{proof.quote}"
                </blockquote>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="font-semibold">{proof.person}</p>
                    <p className="text-sm text-muted-foreground">{proof.company}</p>
                  </div>
                  <Badge variant="secondary">{proof.metric}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* ── RELATED SCENARIOS ── */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl font-bold mb-8 text-center">
            Related Procurement Scenarios
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedScenarios.map((s) => (
              <Card
                key={s.path}
                className="border-border/50 hover:border-primary/30 hover:shadow-md transition-all"
              >
                <CardContent className="p-6">
                  <Link
                    to={s.path}
                    className="font-semibold text-primary hover:underline underline-offset-4"
                  >
                    {s.name}
                  </Link>
                  <p className="text-sm text-muted-foreground mt-2">{s.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-16 px-4 gradient-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl font-bold mb-3">
            Ready to Prevent Value Leakage?
          </h2>
          <p className="text-primary-foreground/80 mb-8">
            Join EU procurement teams using EXOS to make faster, better-grounded decisions.
          </p>
          <Button
            size="lg"
            variant="outline"
            className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
            asChild
          >
            <Link to="/auth">Start Free Trial</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ScenarioLandingPage;
