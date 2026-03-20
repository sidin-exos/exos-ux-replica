import { useRef, useState } from "react";
import { toPng, toSvg } from "html-to-image";
import { Download, Image, FileCode, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
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
      // Get the actual size of the diagram
      const element = diagramRef.current;
      const originalStyle = element.style.cssText;
      
      // Temporarily remove any clipping and ensure full size
      element.style.overflow = "visible";
      element.style.width = "auto";
      element.style.height = "auto";
      
      const dataUrl = await toPng(element, {
        quality: 1,
        pixelRatio: 3,
        backgroundColor: "#fefdf8",
        width: element.scrollWidth,
        height: element.scrollHeight,
        style: {
          overflow: "visible",
        },
      });

      // Restore original style
      element.style.cssText = originalStyle;

      const link = document.createElement("a");
      link.download = "EXOS-Architecture-Diagram.png";
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
      
      // Temporarily remove any clipping and ensure full size
      element.style.overflow = "visible";
      element.style.width = "auto";
      element.style.height = "auto";
      
      const dataUrl = await toSvg(element, {
        backgroundColor: "#fefdf8",
        width: element.scrollWidth,
        height: element.scrollHeight,
        style: {
          overflow: "visible",
        },
      });

      // Restore original style
      element.style.cssText = originalStyle;

      const link = document.createElement("a");
      link.download = "EXOS-Architecture-Diagram.svg";
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
            EXOS Architecture Diagram — v2.0
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Server-side AI pipeline architecture. Grounding, inference, and
            validation run on EXOS Cloud (Edge Functions + Postgres). Only
            anonymization and output rendering happen in the browser.
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

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-effect rounded-xl p-4">
            <div className="text-primary font-semibold mb-2">🛡️ Client Pre-Flight</div>
            <p className="text-sm text-muted-foreground">
              User data enters via 3-Block Meta-Pattern UI. PII is anonymized
              by the Sentinel before leaving the browser.
            </p>
          </div>
          <div className="glass-effect rounded-xl p-4">
            <div className="text-primary font-semibold mb-2">☁️ EXOS Cloud</div>
            <p className="text-sm text-muted-foreground">
              Server-side grounding from Postgres, AI inference (single-pass or
              multi-cycle Chain-of-Experts), validation against DB rules, and
              LangSmith tracing.
            </p>
          </div>
          <div className="glass-effect rounded-xl p-4">
            <div className="text-primary font-semibold mb-2">📊 Client Post-Flight</div>
            <p className="text-sm text-muted-foreground">
              Tokens restored to real PII, integrity verified, results rendered
              as dashboards, PDF, Excel, Jira exports, or 128-bit shareable links.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ArchitectureDiagram;
