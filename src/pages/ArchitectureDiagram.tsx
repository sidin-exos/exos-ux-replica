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
    'primaryColor': '#3b82f6',
    'primaryTextColor': '#ffffff',
    'primaryBorderColor': '#60a5fa',
    'lineColor': '#94a3b8',
    'secondaryColor': '#374151',
    'tertiaryColor': '#1f2937',
    'background': '#111827',
    'mainBkg': '#1f2937',
    'nodeBorder': '#60a5fa',
    'clusterBkg': '#1f2937',
    'clusterBorder': '#374151',
    'titleColor': '#f3f4f6',
    'edgeLabelBackground': '#374151',
    'nodeTextColor': '#f3f4f6'
  },
  'flowchart': {
    'curve': 'basis',
    'padding': 15,
    'nodeSpacing': 30,
    'rankSpacing': 40
  }
}}%%

flowchart TB
    subgraph LAYER1["🔷 LAYER 1: USER INPUT"]
        direction LR
        A1["📋 Scenario Wizard<br/>Make vs Buy · TCO · Consolidation"]
        A2["🏢 Industry + Category<br/>Healthcare · IT Services"]
        A3["📄 Business Context<br/>Constraints · Objectives"]
    end

    subgraph LAYER2["🔷 LAYER 2: EXOS INTELLIGENCE"]
        direction TB
        
        subgraph STAGE1["Stage 1 · Anonymizer"]
            B1a["🔒 Sensitive Data Masking"]
            B1b["🏷️ Entity Replacement<br/>SUPPLIER_A · CONTRACT_1"]
        end
        
        subgraph STAGE2["Stage 2 · Grounding Engine"]
            B2a["🧭 Industry Context<br/>Regulations · Standards"]
            B2b["📊 Category KPIs<br/>Benchmarks · Metrics"]
            B2c["🎯 XML Prompt Factory<br/>Chain-of-Experts Protocol"]
        end
        
        subgraph STAGE3["Stage 3 · Local Reasoning"]
            B3a["🔍 Anonymized XML<br/>Structured Analysis"]
            B3b["📝 Chain-of-Experts Protocol"]
        end
    end

    subgraph LAYER3["🔷 LAYER 3: CLOUD AI"]
        direction TB
        
        subgraph AGENTS["AI Agent Pipeline"]
            direction LR
            C1["🔍 Auditor<br/>Data Integrity"]
            C2["⚡ Optimizer<br/>Savings Analysis"]
            C3["📊 Strategist<br/>Recommendations"]
            C4["✅ Validator<br/>Quality Check"]
        end
        
        subgraph MARKET["Market Intelligence"]
            direction LR
            M1["📰 Supplier News<br/>Real-time Signals"]
            M2["📈 Price Trends<br/>Commodity Data"]
            M3["🔔 Risk Alerts<br/>M&A · Disruptions"]
        end
    end

    subgraph LAYER4["🔷 LAYER 4: VALIDATION"]
        direction LR
        V1["✓ Hallucination Check"]
        V2["✓ Calculation Verify"]
        V3["✓ Citation Validation"]
    end

    subgraph LAYER5["🔷 LAYER 5: DE-ANONYMIZATION"]
        direction LR
        D1["🔓 Entity Restoration<br/>SUPPLIER_A → Acme Corp"]
        D2["📋 Real Values Mapped"]
    end

    subgraph LAYER6["🔷 LAYER 6: OUTPUT"]
        direction LR
        O1["📑 Executive Reports<br/>PDF with Citations"]
        O2["📊 Dashboards<br/>Kraljic · TCO · Risk"]
        O3["🗺️ Roadmaps<br/>Negotiation Prep"]
        O4["💡 Insights<br/>Opportunities"]
    end

    LAYER1 --> LAYER2
    B1a --> B1b
    B1b --> STAGE2
    B2a --> B2c
    B2b --> B2c
    B2c --> STAGE3
    B3a --> B3b
    STAGE3 --> LAYER3
    C1 --> C2 --> C3 --> C4
    M1 --> C3
    M2 --> C2
    M3 --> C3
    LAYER3 --> LAYER4
    V1 --> V2 --> V3
    LAYER4 --> LAYER5
    D1 --> D2
    LAYER5 --> LAYER6

    classDef inputNode fill:#3b82f6,stroke:#60a5fa,stroke-width:2px,color:#fff
    classDef processNode fill:#10b981,stroke:#34d399,stroke-width:2px,color:#fff
    classDef aiNode fill:#8b5cf6,stroke:#a78bfa,stroke-width:2px,color:#fff
    classDef marketNode fill:#f59e0b,stroke:#fbbf24,stroke-width:2px,color:#fff
    classDef validateNode fill:#ec4899,stroke:#f472b6,stroke-width:2px,color:#fff
    classDef outputNode fill:#06b6d4,stroke:#22d3ee,stroke-width:2px,color:#fff

    class A1,A2,A3 inputNode
    class B1a,B1b,B2a,B2b,B2c,B3a,B3b,D1,D2 processNode
    class C1,C2,C3,C4 aiNode
    class M1,M2,M3 marketNode
    class V1,V2,V3 validateNode
    class O1,O2,O3,O4 outputNode
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
