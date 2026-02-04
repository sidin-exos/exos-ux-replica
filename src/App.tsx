import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Features from "./pages/Features";
import Reports from "./pages/Reports";
import Pricing from "./pages/Pricing";
import FAQ from "./pages/FAQ";
import GeneratedReport from "./pages/GeneratedReport";
import DashboardShowcase from "./pages/DashboardShowcase";
import MarketIntelligence from "./pages/MarketIntelligence";
import ArchitectureDiagram from "./pages/ArchitectureDiagram";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/features" element={<Features />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/report" element={<GeneratedReport />} />
          <Route path="/dashboards" element={<DashboardShowcase />} />
          <Route path="/market-intelligence" element={<MarketIntelligence />} />
          <Route path="/architecture" element={<ArchitectureDiagram />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
