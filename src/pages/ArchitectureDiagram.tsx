import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { toPng, toSvg } from "html-to-image";
import { Download, Image, FileCode, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import { NavLink } from "@/components/NavLink";

const diagramDefinition = `%%{init: {'theme': 'dark', 'themeVariables': { 
  'primaryColor': '#2dd4bf',
  'primaryTextColor': '#0f1419',
  'primaryBorderColor': '#00d4ff',
  'lineColor': '#2dd4bf',
  'secondaryColor': '#1e293b',
  'tertiaryColor': '#0f172a',
  'background': '#0f1419',
  'mainBkg': '#1e293b',
  'nodeBorder': '#2dd4bf',
  'clusterBkg': '#1e293b',
  'clusterBorder': '#2dd4bf',
  'titleColor': '#e2e8f0',
  'edgeLabelBackground': '#1e293b',
  'nodeTextColor': '#e2e8f0'
}}}%%

flowchart TB
    subgraph INPUT["📥 USER INPUT"]
        A1["📋 Scenario Data"]
        A2["📄 Documents"]
        A3["🏢 Supplier Info"]
    end
    
    subgraph EXOS["🛡️ EXOS INTELLIGENCE"]
        direction TB
        B1["🔒 Anonymizer"]
        B2["🧭 Grounding"]
        B3["🌐 Market Intel"]
        B4["✅ Validator"]
        B5["🔓 Restorer"]
        B1 --> B2 --> B3 --> B4 --> B5
    end
    
    subgraph CLOUD["☁️ CLOUD AI"]
        C1["🔍 Auditor Agent"]
        C2["⚡ Optimizer Agent"]
        C3["📊 Strategist Agent"]
        C4["✔️ Validator Agent"]
    end
    
    subgraph OUTPUT["📊 OUTPUT"]
        D1["📑 Executive Reports"]
        D2["📈 Interactive Dashboards"]
        D3["🗺️ Action Roadmaps"]
    end
    
    INPUT --> EXOS
    EXOS <--> CLOUD
    EXOS --> OUTPUT

    style INPUT fill:#1e293b,stroke:#2dd4bf,stroke-width:2px,color:#e2e8f0
    style EXOS fill:#0f172a,stroke:#00d4ff,stroke-width:3px,color:#e2e8f0
    style CLOUD fill:#1e293b,stroke:#2dd4bf,stroke-width:2px,color:#e2e8f0
    style OUTPUT fill:#1e293b,stroke:#2dd4bf,stroke-width:2px,color:#e2e8f0
`;

const ArchitectureDiagram = () => {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [renderKey] = useState(() => `exos-arch-${Date.now()}`);

  useEffect(() => {
    let isMounted = true;

    const renderDiagram = async () => {
      mermaid.initialize({
        startOnLoad: false,
        theme: "dark",
        securityLevel: "loose",
        fontFamily: "Space Grotesk, Inter, system-ui, sans-serif",
        flowchart: {
          htmlLabels: true,
          curve: "basis",
          padding: 20,
          nodeSpacing: 50,
          rankSpacing: 80,
        },
      });

      try {
        const { svg } = await mermaid.render(renderKey, diagramDefinition);
        if (isMounted) {
          // Add inline styles to the SVG string
          const styledSvg = svg.replace(
            '<svg ',
            '<svg style="max-width: 100%; height: auto; background: #0f1419; border-radius: 12px; padding: 24px;" '
          );
          setSvgContent(styledSvg);
        }
      } catch (error) {
        console.error("Mermaid rendering error:", error);
      }
    };

    renderDiagram();

    return () => {
      isMounted = false;
    };
  }, [renderKey]);

  const downloadAsPNG = async () => {
    if (!mermaidRef.current || !svgContent) return;
    
    setIsDownloading(true);
    try {
      const svgElement = mermaidRef.current.querySelector("svg");
      if (!svgElement) return;

      const dataUrl = await toPng(svgElement as unknown as HTMLElement, {
        quality: 1,
        pixelRatio: 3,
        backgroundColor: "#0f1419",
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
    if (!mermaidRef.current || !svgContent) return;

    setIsDownloading(true);
    try {
      const svgElement = mermaidRef.current.querySelector("svg");
      if (!svgElement) return;

      const dataUrl = await toSvg(svgElement as unknown as HTMLElement, {
        backgroundColor: "#0f1419",
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
          <NavLink to="/features" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Technology
          </NavLink>
          
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            EXOS Architecture Diagram
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            The complete data flow architecture of EXOS Procurement Intelligence, 
            showing the 5-stage privacy-preserving pipeline with Cloud AI integration.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 mb-8">
          <Button 
            variant="hero" 
            onClick={downloadAsPNG}
            disabled={!svgContent || isDownloading}
            className="gap-2"
          >
            <Image className="w-4 h-4" />
            Download PNG
            <Download className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            onClick={downloadAsSVG}
            disabled={!svgContent || isDownloading}
            className="gap-2"
          >
            <FileCode className="w-4 h-4" />
            Download SVG
            <Download className="w-4 h-4" />
          </Button>
        </div>

        <div className="card-elevated rounded-2xl p-4 md:p-8 overflow-x-auto">
          <div 
            ref={mermaidRef} 
            className="min-w-[600px] flex justify-center items-center"
            style={{ minHeight: "500px" }}
          >
            {svgContent ? (
              <div dangerouslySetInnerHTML={{ __html: svgContent }} />
            ) : (
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Loading diagram...
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-effect rounded-xl p-4">
            <div className="text-primary font-semibold mb-2">📥 User Input</div>
            <p className="text-sm text-muted-foreground">
              Scenario data, documents, and supplier information enter the pipeline.
            </p>
          </div>
          <div className="glass-effect rounded-xl p-4">
            <div className="text-primary font-semibold mb-2">🛡️ EXOS Intelligence</div>
            <p className="text-sm text-muted-foreground">
              5-stage pipeline: Anonymize → Ground → Market Intel → Validate → Restore.
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
