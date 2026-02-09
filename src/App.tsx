import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ModelConfigProvider } from "@/contexts/ModelConfigContext";
import Index from "./pages/Index";
import Features from "./pages/Features";
import Reports from "./pages/Reports";
import Pricing from "./pages/Pricing";
import FAQ from "./pages/FAQ";
import GeneratedReport from "./pages/GeneratedReport";
import DashboardShowcase from "./pages/DashboardShowcase";
import MarketIntelligence from "./pages/MarketIntelligence";
import ArchitectureDiagram from "./pages/ArchitectureDiagram";
import DevWorkflow from "./pages/DevWorkflow";
import OrgChart from "./pages/OrgChart";
import Auth from "./pages/Auth";
import Account from "./pages/Account";
import FounderDashboard from "./pages/admin/FounderDashboard";
import NotFound from "./pages/NotFound";
import { ChatWidget } from "./components/chat/ChatWidget";

const queryClient = new QueryClient();

const App = () => (
  <ModelConfigProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ChatWidget />
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
            <Route path="/dev-workflow" element={<DevWorkflow />} />
            <Route path="/org-chart" element={<OrgChart />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/account" element={<Account />} />
            <Route path="/admin/dashboard" element={<FounderDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ModelConfigProvider>
);

export default App;
