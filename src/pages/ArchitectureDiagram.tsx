import { useRef, useState } from "react";
import { toPng, toSvg } from "html-to-image";
import { Download, Image, FileCode, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import { NavLink } from "@/components/NavLink";
import ExosArchitectureDiagram from "@/components/architecture/ExosArchitectureDiagram";

const ArchitectureDiagram = () => {
  const diagramRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadAsPNG = async () => {
    if (!diagramRef.current) return;

    setIsDownloading(true);
    try {
      const dataUrl = await toPng(diagramRef.current, {
        quality: 1,
        pixelRatio: 3,
        backgroundColor: "#fefdf8",
      });

      const link = document.createElement("a");
      link.download = "EXOS-Architecture-Diagram.png";
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
      const dataUrl = await toSvg(diagramRef.current, {
        backgroundColor: "#fefdf8",
      });

      const link = document.createElement("a");
      link.download = "EXOS-Architecture-Diagram.svg";
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
            EXOS Architecture Diagram
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            The complete data flow architecture of EXOS Procurement
            Intelligence, showing the privacy-preserving pipeline with Cloud AI
            integration.
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
            <ExosArchitectureDiagram />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-effect rounded-xl p-4">
            <div className="text-primary font-semibold mb-2">📥 User Input</div>
            <p className="text-sm text-muted-foreground">
              Scenario data, documents, and supplier information enter the
              pipeline.
            </p>
          </div>
          <div className="glass-effect rounded-xl p-4">
            <div className="text-primary font-semibold mb-2">
              🛡️ EXOS Intelligence
            </div>
            <p className="text-sm text-muted-foreground">
              5-stage pipeline: Anonymize → Ground → Market Intel → Validate →
              Restore.
            </p>
          </div>
          <div className="glass-effect rounded-xl p-4">
            <div className="text-primary font-semibold mb-2">☁️ Cloud AI</div>
            <p className="text-sm text-muted-foreground">
              Expert agents: Auditor, Optimizer, Strategist, and Validator.
            </p>
          </div>
          <div className="glass-effect rounded-xl p-4">
            <div className="text-primary font-semibold mb-2">📊 Output</div>
            <p className="text-sm text-muted-foreground">
              Executive reports, interactive dashboards, and action roadmaps.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ArchitectureDiagram;
