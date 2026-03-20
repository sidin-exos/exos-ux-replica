import { useRef, useState } from "react";
import { toPng, toSvg } from "html-to-image";
import { Download, Image, FileCode, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import { NavLink } from "@/components/NavLink";
import OrgChartDiagram from "@/components/architecture/OrgChartDiagram";

const OrgChart = () => {
  const diagramRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadAsPNG = async () => {
    if (!diagramRef.current) return;
    setIsDownloading(true);
    try {
      const element = diagramRef.current;
      const originalStyle = element.style.cssText;
      element.style.overflow = "visible";
      element.style.width = "auto";
      element.style.height = "auto";

      const dataUrl = await toPng(element, {
        quality: 1,
        pixelRatio: 3,
        backgroundColor: "#fefdf8",
        width: element.scrollWidth,
        height: element.scrollHeight,
        style: { overflow: "visible" },
      });

      element.style.cssText = originalStyle;
      const link = document.createElement("a");
      link.download = "EXOS-Team-Structure.png";
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("PNG download error:", error);
      toast.error("Download failed", { description: "Could not generate PNG image." });
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadAsSVG = async () => {
    if (!diagramRef.current) return;
    setIsDownloading(true);
    try {
      const element = diagramRef.current;
      const originalStyle = element.style.cssText;
      element.style.overflow = "visible";
      element.style.width = "auto";
      element.style.height = "auto";

      const dataUrl = await toSvg(element, {
        backgroundColor: "#fefdf8",
        width: element.scrollWidth,
        height: element.scrollHeight,
        style: { overflow: "visible" },
      });

      element.style.cssText = originalStyle;
      const link = document.createElement("a");
      link.download = "EXOS-Team-Structure.svg";
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("SVG download error:", error);
      toast.error("Download failed", { description: "Could not generate SVG image." });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="gradient-hero min-h-screen">
      <Header />
      <main className="container py-8 md:py-12">
        <div className="mb-8">
          <NavLink
            to="/features"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Technology
          </NavLink>

          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            EXOS Team Structure
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            AI-first organization with clear scope boundaries and future hire
            roadmap.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 mb-8">
          <Button
            variant="hero"
            onClick={downloadAsPNG}
            disabled={isDownloading}
            className="gap-2"
          >
            <Image className="w-4 h-4" />
            Download PNG
            <Download className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            onClick={downloadAsSVG}
            disabled={isDownloading}
            className="gap-2"
          >
            <FileCode className="w-4 h-4" />
            Download SVG
            <Download className="w-4 h-4" />
          </Button>
        </div>

        <div className="card-elevated rounded-2xl p-4 md:p-8 overflow-x-auto">
          <div ref={diagramRef}>
            <OrgChartDiagram />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-effect rounded-xl p-4">
            <div className="text-primary font-semibold mb-2">
              🛠️ CTO Scope
            </div>
            <p className="text-sm text-muted-foreground">
              Engineering, Security, and Infrastructure. Currently filled by
              Gemini Architect & Auditor with Lovable Cloud for DevOps.
            </p>
          </div>
          <div className="glass-effect rounded-xl p-4">
            <div className="text-primary font-semibold mb-2">
              🧠 Head of AI
            </div>
            <p className="text-sm text-muted-foreground">
              Prompt Engineering, Evaluation, and Knowledge Management. Gemini
              Tech Lead + LangSmith tracing for quality.
            </p>
          </div>
          <div className="glass-effect rounded-xl p-4">
            <div className="text-primary font-semibold mb-2">
              🏭 Delivery
            </div>
            <p className="text-sm text-muted-foreground">
              Automated code generation via Lovable with human QA oversight.
              Fully automated frontend, manual + auto-unit testing.
            </p>
          </div>
          <div className="glass-effect rounded-xl p-4">
            <div className="text-primary font-semibold mb-2">
              📈 Head of Growth
            </div>
            <p className="text-sm text-muted-foreground">
              Go-to-market strategy, revenue metrics, and community building.
              Performance-based role focused on traction and growth.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrgChart;
