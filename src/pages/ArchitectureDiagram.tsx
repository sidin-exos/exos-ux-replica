import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { toPng, toSvg } from "html-to-image";
import { Download, Image, FileCode, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import { NavLink } from "@/components/NavLink";

const diagramDefinition = `%%{init: {
  'theme': 'dark',
  'themeVariables': { 
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
  },
  'flowchart': {
    'curve': 'basis',
    'padding': 20
  }
}}%%

flowchart LR
    subgraph INPUT["📥 USER INPUT LAYER"]
        direction TB
        A1["📋 Scenario Parameters<br/><i>Make vs Buy, TCO, Consolidation</i>"]
        A2["📄 Documents & Contracts<br/><i>SOWs, RFPs, Agreements</i>"]
        A3["🏢 Supplier Data<br/><i>Pricing, Performance, Terms</i>"]
        A4["🎯 Business Context<br/><i>Industry, Category, Constraints</i>"]
    end

    subgraph EXOS["🛡️ EXOS PROCUREMENT INTELLIGENCE"]
        direction TB
        
        subgraph STAGE1["Stage 1: Privacy"]
            B1["🔒 ANONYMIZER<br/><i>Mask sensitive commercial data</i><br/><i>Replace names, values, terms</i>"]
        end
        
        subgraph STAGE2["Stage 2: Context"]
            B2["🧭 GROUNDING ENGINE<br/><i>Inject industry context</i><br/><i>Apply category KPIs</i><br/><i>Add regulatory constraints</i>"]
        end
        
        subgraph STAGE3["Stage 3: Intelligence"]
            B3["🌐 MARKET INTEL<br/><i>Real-time supplier news</i><br/><i>Commodity price trends</i><br/><i>M&A activity signals</i>"]
        end
        
        subgraph STAGE4["Stage 4: Quality"]
            B4["✅ VALIDATOR<br/><i>Cross-check accuracy</i><br/><i>Detect hallucinations</i><br/><i>Verify calculations</i>"]
        end
        
        subgraph STAGE5["Stage 5: Restore"]
            B5["🔓 RESTORER<br/><i>De-anonymize results</i><br/><i>Map back to real entities</i>"]
        end
        
        B1 --> B2 --> B3 --> B4 --> B5
    end

    subgraph CLOUD["☁️ CLOUD AI AGENTS"]
        direction TB
        C1["🔍 AUDITOR<br/><i>Verify data integrity</i><br/><i>Flag inconsistencies</i>"]
        C2["⚡ OPTIMIZER<br/><i>Calculate savings</i><br/><i>Model scenarios</i>"]
        C3["📊 STRATEGIST<br/><i>Generate recommendations</i><br/><i>Risk assessment</i>"]
        C4["✔️ VALIDATOR<br/><i>Cross-check outputs</i><br/><i>Quality assurance</i>"]
        C1 --> C2 --> C3 --> C4
    end

    subgraph OUTPUT["📊 OUTPUT LAYER"]
        direction TB
        D1["📑 Executive Reports<br/><i>PDF summaries with citations</i>"]
        D2["📈 Interactive Dashboards<br/><i>Kraljic, Risk Matrix, TCO</i>"]
        D3["🗺️ Action Roadmaps<br/><i>Negotiation prep, timelines</i>"]
        D4["💡 Strategic Insights<br/><i>Market opportunities, risks</i>"]
    end

    INPUT -->|"Raw Data"| EXOS
    B3 <-->|"Anonymized Query"| CLOUD
    EXOS -->|"Enriched Analysis"| OUTPUT

    style INPUT fill:#1e293b,stroke:#2dd4bf,stroke-width:2px,color:#e2e8f0
    style EXOS fill:#0f172a,stroke:#00d4ff,stroke-width:3px,color:#e2e8f0
    style CLOUD fill:#1e293b,stroke:#2dd4bf,stroke-width:2px,color:#e2e8f0
    style OUTPUT fill:#1e293b,stroke:#2dd4bf,stroke-width:2px,color:#e2e8f0
    style STAGE1 fill:#0f172a,stroke:#2dd4bf,stroke-width:1px
    style STAGE2 fill:#0f172a,stroke:#2dd4bf,stroke-width:1px
    style STAGE3 fill:#0f172a,stroke:#2dd4bf,stroke-width:1px
    style STAGE4 fill:#0f172a,stroke:#2dd4bf,stroke-width:1px
    style STAGE5 fill:#0f172a,stroke:#2dd4bf,stroke-width:1px
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
