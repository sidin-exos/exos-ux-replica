import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
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
import TestingPipeline from "./pages/TestingPipeline";
import OrgChart from "./pages/OrgChart";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Account from "./pages/Account";
import FounderDashboard from "./pages/admin/FounderDashboard";
import RiskPlatform from "./pages/enterprise/RiskPlatform";
import InflationPlatform from "./pages/enterprise/InflationPlatform";
import PdfTestPage from "./pages/PdfTestPage";
import LangChainSkills from "./pages/LangChainSkills";
import NotFound from "./pages/NotFound";
import MobileBottomNav from "./components/layout/MobileBottomNav";
import ProtectedRoute from "./components/ProtectedRoute";
const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <ModelConfigProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <div className="pb-14 md:pb-0">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/features" element={<Features />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/report" element={<GeneratedReport />} />
            <Route path="/dashboards" element={<ProtectedRoute requireSuperAdmin><DashboardShowcase /></ProtectedRoute>} />
            <Route path="/market-intelligence" element={<MarketIntelligence />} />
            <Route path="/architecture" element={<ProtectedRoute requireSuperAdmin><ArchitectureDiagram /></ProtectedRoute>} />
            <Route path="/dev-workflow" element={<ProtectedRoute requireSuperAdmin><DevWorkflow /></ProtectedRoute>} />
            <Route path="/testing-pipeline" element={<ProtectedRoute requireSuperAdmin><TestingPipeline /></ProtectedRoute>} />
            <Route path="/org-chart" element={<ProtectedRoute requireSuperAdmin><OrgChart /></ProtectedRoute>} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
            <Route path="/admin/dashboard" element={<ProtectedRoute requireSuperAdmin><FounderDashboard /></ProtectedRoute>} />
            <Route path="/enterprise/risk" element={<RiskPlatform />} />
            <Route path="/enterprise/inflation" element={<InflationPlatform />} />
            <Route path="/pdf-test" element={<PdfTestPage />} />
            <Route path="/langchain-skills" element={<LangChainSkills />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </div>
          <MobileBottomNav />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ModelConfigProvider>
  </ThemeProvider>
);

export default App;
