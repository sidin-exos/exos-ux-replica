import { useRef, useState } from "react";
import { toPng, toSvg } from "html-to-image";
import { Download, Image, FileCode, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import { NavLink } from "@/components/NavLink";
import DevWorkflowDiagram from "@/components/architecture/DevWorkflowDiagram";

const DevWorkflow = () => {
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
      link.download = "EXOS-Dev-Workflow.png";
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("PNG download error:", error);
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
      link.download = "EXOS-Dev-Workflow.svg";
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("SVG download error:", error);
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
            EXOS Development Workflow
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            AI-augmented development pipeline with Gemini Virtual Committee and
            human-in-the-loop quality gates.
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
            <DevWorkflowDiagram />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-effect rounded-xl p-4">
            <div className="text-primary font-semibold mb-2">
              🧠 Gemini Committee
            </div>
            <p className="text-sm text-muted-foreground">
              Strategy, Security, and Specification via Chain-of-Experts.
              Architect designs, Auditor validates, Tech Lead writes the spec.
            </p>
          </div>
          <div className="glass-effect rounded-xl p-4">
            <div className="text-primary font-semibold mb-2">
              🏭 Lovable Factory
            </div>
            <p className="text-sm text-muted-foreground">
              Code generation with instant preview. Paste the spec, get a
              working build in seconds.
            </p>
          </div>
          <div className="glass-effect rounded-xl p-4">
            <div className="text-primary font-semibold mb-2">
              💾 System Memory
            </div>
            <p className="text-sm text-muted-foreground">
              Linear captures decisions, LangSmith traces AI performance,
              DevEx Metrics track velocity and quality.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DevWorkflow;
