import { useRef, useState } from "react";
import { toPng, toSvg } from "html-to-image";
import { Download, Image, FileCode, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/layout/Header";
import { NavLink } from "@/components/NavLink";
import TestingPipelineDiagram from "@/components/architecture/TestingPipelineDiagram";
import LaunchTestBatch from "@/components/testing/LaunchTestBatch";
import RefactoringBacklog from "@/components/testing/RefactoringBacklog";

const TestingPipeline = () => {
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
      link.download = "EXOS-Testing-Pipeline.png";
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
      link.download = "EXOS-Testing-Pipeline.svg";
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
            EXOS Automated Testing Pipeline
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Entropy-based test synthesis, production execution, and LLM-as-a-Judge evaluation.
          </p>
        </div>

        <Tabs defaultValue="diagram" className="space-y-6">
          <TabsList>
            <TabsTrigger value="diagram">Pipeline Diagram</TabsTrigger>
            <TabsTrigger value="command-center">Command Center</TabsTrigger>
          </TabsList>

          {/* Tab 1: Diagram */}
          <TabsContent value="diagram" className="space-y-8">
            <div className="flex flex-wrap gap-4">
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
                <TestingPipelineDiagram />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-effect rounded-xl p-4">
                <div className="text-primary font-semibold mb-2">
                  🎲 Synthesis Engine
                </div>
                <p className="text-sm text-muted-foreground">
                  Generates realistic, messy procurement prompts from 3 buyer personas with varying data quality — from "dump &amp; go" to over-detailed inputs.
                </p>
              </div>
              <div className="glass-effect rounded-xl p-4">
                <div className="text-primary font-semibold mb-2">
                  ⚙️ Execution Pipeline
                </div>
                <p className="text-sm text-muted-foreground">
                  Runs generated prompts through the production sentinel-analysis function with automatic retry logic and LangSmith trace capture.
                </p>
              </div>
              <div className="glass-effect rounded-xl p-4">
                <div className="text-primary font-semibold mb-2">
                  ⚖️ LLM Auditor
                </div>
                <p className="text-sm text-muted-foreground">
                  An AI judge evaluates extraction quality, classifying each field as redundant, optional, or critical for the UI wizard.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Command Center */}
          <TabsContent value="command-center" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <LaunchTestBatch />
              </div>
              <div className="lg:col-span-2">
                <RefactoringBacklog />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default TestingPipeline;
