import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ModelConfigProvider } from "@/contexts/ModelConfigContext";
import NotFound from "./pages/NotFound";
import MobileBottomNav from "./components/layout/MobileBottomNav";
import ProtectedRoute from "./components/ProtectedRoute";
import PageLoadingFallback from "./components/layout/PageLoadingFallback";

// Lazy-loaded page components
const Index = lazy(() => import("./pages/Index"));
const Welcome = lazy(() => import("./pages/Welcome"));
const Features = lazy(() => import("./pages/Features"));
const Reports = lazy(() => import("./pages/Reports"));
const Pricing = lazy(() => import("./pages/Pricing"));
const FAQ = lazy(() => import("./pages/FAQ"));
const GeneratedReport = lazy(() => import("./pages/GeneratedReport"));
const DashboardShowcase = lazy(() => import("./pages/DashboardShowcase"));
const MarketIntelligence = lazy(() => import("./pages/MarketIntelligence"));
const ArchitectureDiagram = lazy(() => import("./pages/ArchitectureDiagram"));
const DevWorkflow = lazy(() => import("./pages/DevWorkflow"));
const TestingPipeline = lazy(() => import("./pages/TestingPipeline"));
const OrgChart = lazy(() => import("./pages/OrgChart"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Account = lazy(() => import("./pages/Account"));
const FounderDashboard = lazy(() => import("./pages/admin/FounderDashboard"));
const RiskPlatform = lazy(() => import("./pages/enterprise/RiskPlatform"));
const InflationPlatform = lazy(() => import("./pages/enterprise/InflationPlatform"));
const PdfTestPage = lazy(() => import("./pages/PdfTestPage"));
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
          <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            <Route path="/welcome" element={<Welcome />} />
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
            <Route path="/pdf-test" element={<ProtectedRoute requireSuperAdmin><PdfTestPage /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          </div>
          <MobileBottomNav />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ModelConfigProvider>
  </ThemeProvider>
);

export default App;
