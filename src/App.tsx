import { lazy, Suspense } from "react";
import * as Sentry from "@sentry/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ModelConfigProvider } from "@/contexts/ModelConfigContext";
import { isAuthError } from "@/lib/auth-utils";
import NotFound from "./pages/NotFound";
import MobileBottomNav from "./components/layout/MobileBottomNav";
import ProtectedRoute from "./components/ProtectedRoute";
import PageLoadingFallback from "./components/layout/PageLoadingFallback";
import AnalyticsDashboard from "./pages/admin/AnalyticsDashboard";
import SentryErrorFallback from "./components/SentryErrorFallback";
import SentryUserSync from "./components/SentryUserSync";

// Lazy-loaded page components
const Index = lazy(() => import("./pages/Index"));
const Welcome = lazy(() => import("./pages/Welcome"));
const Features = lazy(() => import("./pages/Features"));

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
const MethodologyDashboard = lazy(() => import("./pages/admin/MethodologyDashboard"));
const MethodologyScenarioEdit = lazy(() => import("./pages/admin/MethodologyScenarioEdit"));
const MethodologyConfig = lazy(() => import("./pages/admin/MethodologyConfig"));
const MethodologyHistory = lazy(() => import("./pages/admin/MethodologyHistory"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      onError: (error) => {
        if (!isAuthError(error)) {
          Sentry.captureException(error, {
            tags: { source: "react-query-mutation" },
          });
        }
      },
    },
  },
});

const App = () => (
  <Sentry.ErrorBoundary fallback={<SentryErrorFallback />}>
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <ModelConfigProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <SentryUserSync />
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <div className="pb-14 md:pb-0">
          <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/" element={<Index />} />
            <Route path="/features" element={<Features />} />
            <Route path="/reports" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/faq" element={<ProtectedRoute><FAQ /></ProtectedRoute>} />
            <Route path="/report" element={<ProtectedRoute><GeneratedReport /></ProtectedRoute>} />
            <Route path="/dashboards" element={<ProtectedRoute requireSuperAdmin><DashboardShowcase /></ProtectedRoute>} />
            <Route path="/market-intelligence" element={<ProtectedRoute><MarketIntelligence /></ProtectedRoute>} />
            <Route path="/architecture" element={<ProtectedRoute requireSuperAdmin><ArchitectureDiagram /></ProtectedRoute>} />
            <Route path="/dev-workflow" element={<ProtectedRoute requireSuperAdmin><DevWorkflow /></ProtectedRoute>} />
            <Route path="/testing-pipeline" element={<ProtectedRoute requireSuperAdmin><TestingPipeline /></ProtectedRoute>} />
            <Route path="/org-chart" element={<ProtectedRoute requireSuperAdmin><OrgChart /></ProtectedRoute>} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
            <Route path="/admin/dashboard" element={<ProtectedRoute requireSuperAdmin><FounderDashboard /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute requireSuperAdmin><AnalyticsDashboard /></ProtectedRoute>} />
            <Route path="/enterprise/risk" element={<ProtectedRoute><RiskPlatform /></ProtectedRoute>} />
            <Route path="/enterprise/inflation" element={<ProtectedRoute><InflationPlatform /></ProtectedRoute>} />
            <Route path="/pdf-test" element={<ProtectedRoute requireSuperAdmin><PdfTestPage /></ProtectedRoute>} />
            <Route path="/admin/methodology" element={<ProtectedRoute requireSuperAdmin><MethodologyDashboard /></ProtectedRoute>} />
            <Route path="/admin/methodology/config" element={<ProtectedRoute requireSuperAdmin><MethodologyConfig /></ProtectedRoute>} />
            <Route path="/admin/methodology/history" element={<ProtectedRoute requireSuperAdmin><MethodologyHistory /></ProtectedRoute>} />
            <Route path="/admin/methodology/:slug" element={<ProtectedRoute requireSuperAdmin><MethodologyScenarioEdit /></ProtectedRoute>} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
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
  </Sentry.ErrorBoundary>
);

export default App;
