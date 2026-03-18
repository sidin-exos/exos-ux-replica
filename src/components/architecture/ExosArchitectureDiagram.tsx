import React from "react";
import ArchitectureNode from "./ArchitectureNode";
import ArchitectureContainer from "./ArchitectureContainer";
import ArchitectureArrow from "./ArchitectureArrow";
import {
  Shield,
  Server,
  Database,
  Brain,
  CheckCircle,
  FileText,
  BarChart3,
  Lock,
  Eye,
  Layers,
  Globe,
  Briefcase,
  FileSpreadsheet,
  Share2,
  RefreshCw,
  Search,
  Cpu,
  MonitorSmartphone,
  Cloud,
  ShieldCheck,
  AlertTriangle,
  Activity,
} from "lucide-react";

const COLORS = {
  blue: "#3b82f6",
  green: "#22c55e",
  purple: "#8b5cf6",
  orange: "#f59e0b",
  pink: "#ec4899",
  cyan: "#06b6d4",
  red: "#ef4444",
  indigo: "#6366f1",
  emerald: "#10b981",
  slate: "#64748b",
};

const ExosArchitectureDiagram: React.FC = () => {
  return (
    <div className="flex flex-col items-center gap-2 min-w-[900px] p-4" style={{ backgroundColor: "#fefdf8" }}>
      {/* Title */}
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">EXOS Procurement Intelligence — v2.0 Architecture</h2>
        <p className="text-sm text-gray-500 mt-1">Privacy-Preserving Server-Side AI Pipeline</p>
      </div>

      {/* LAYER 1 — CUSTOMER PREMISES: PRE-FLIGHT */}
      <ArchitectureContainer
        title="Layer 1 — Customer Premises (Client Pre-Flight)"
        titleColor={COLORS.blue}
        variant="solid"
        badge="BROWSER"
        badgeIcon={<MonitorSmartphone className="w-4 h-4" />}
        className="w-full"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">3-Block Meta-Pattern UI</div>
          <div className="flex flex-wrap justify-center gap-6">
            <ArchitectureNode icon={<Layers className="w-6 h-6" />} label="Scenario Wizard" sublabel="6 scenario types" color={COLORS.blue} number={1} />
            <ArchitectureNode icon={<Globe className="w-6 h-6" />} label="Industry Context" sublabel="Sector-specific KPIs" color={COLORS.blue} number={2} />
            <ArchitectureNode icon={<Briefcase className="w-6 h-6" />} label="Supplier Data" sublabel="Multi-supplier input" color={COLORS.blue} number={3} />
            <ArchitectureNode icon={<FileText className="w-6 h-6" />} label="Business Context" sublabel="Saved contexts" color={COLORS.blue} number={4} />
          </div>

          <ArchitectureArrow direction="down" length={30} />

          <ArchitectureContainer
            title="Sentinel Anonymizer"
            titleColor={COLORS.red}
            variant="security"
            badgeIcon={<Shield className="w-4 h-4" />}
            badge="TRUST BOUNDARY"
          >
            <div className="flex items-center gap-4 justify-center py-2">
              <ArchitectureNode icon={<Lock className="w-6 h-6" />} label="PII Masking" sublabel="PII → [COMPANY_A] tokens" color={COLORS.red} number={5} />
              <div className="text-xs text-gray-500 max-w-48 leading-tight">
                All personally identifiable information is intercepted and replaced with anonymous tokens <strong>before</strong> leaving the browser.
              </div>
            </div>
          </ArchitectureContainer>
        </div>
      </ArchitectureContainer>

      {/* Arrow Layer 1 → Layer 2 */}
      <div className="flex flex-col items-center">
        <ArchitectureArrow direction="down" length={40} label="Anonymized Payload" color={COLORS.red} />
      </div>

      {/* LAYER 2 — EXOS CLOUD SERVICES */}
      <ArchitectureContainer
        title="Layer 2 — EXOS Cloud Services (Edge Functions + Postgres)"
        titleColor={COLORS.purple}
        variant="solid"
        badge="SERVER"
        badgeIcon={<Cloud className="w-4 h-4" />}
        className="w-full"
      >
        <div className="flex flex-col items-center gap-4">
          {/* Server-Side Grounding */}
          <ArchitectureContainer title="Server-Side Grounding" titleColor={COLORS.emerald} variant="dashed" badgeIcon={<Database className="w-3.5 h-3.5" />}>
            <div className="flex items-center gap-4 justify-center py-2">
              <ArchitectureNode icon={<Search className="w-6 h-6" />} label="Context Injection" sublabel="DB → system prompt" color={COLORS.emerald} number={6} />
              <div className="text-xs text-gray-500 max-w-56 leading-tight">
                Fetches <code className="text-emerald-700 bg-emerald-50 px-1 rounded text-[10px]">industry_contexts</code>,{" "}
                <code className="text-emerald-700 bg-emerald-50 px-1 rounded text-[10px]">procurement_categories</code>,{" "}
                <code className="text-emerald-700 bg-emerald-50 px-1 rounded text-[10px]">market_insights</code>{" "}
                from Postgres and injects into the system prompt.
              </div>
            </div>
          </ArchitectureContainer>

          <ArchitectureArrow direction="down" length={30} />

          {/* AI Gateway */}
          <ArchitectureContainer title="AI Gateway & Processing" titleColor={COLORS.indigo} variant="dashed" badgeIcon={<Brain className="w-3.5 h-3.5" />}>
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-lg border border-indigo-200">
                  <Cpu className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-medium text-indigo-700">EXOS Gateway</span>
                </div>
                <span className="text-xs text-gray-400">← toggle →</span>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
                  <Server className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-700">Google AI Studio</span>
                </div>
              </div>
              <div className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-medium text-gray-600">
                Gemini 3 Flash · Gemini 2.5 Pro · GPT-5 · GPT-5.2
              </div>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center gap-1 px-4 py-2 bg-indigo-50 rounded-lg border border-indigo-100">
                  <ArchitectureNode icon={<Brain className="w-5 h-5" />} label="Single-Pass" sublabel="Standard analysis" color={COLORS.indigo} number={7} />
                </div>
                <span className="text-xs text-gray-400 font-medium">OR</span>
                <div className="flex flex-col items-center gap-1 px-4 py-2 bg-purple-50 rounded-lg border border-purple-100">
                  <ArchitectureNode icon={<Layers className="w-5 h-5" />} label="Deep Analytics" sublabel="3-cycle pipeline" color={COLORS.purple} number={8} />
                  <div className="text-[10px] text-purple-600 font-medium mt-1">Analyst → Auditor → Synthesizer</div>
                </div>
              </div>
            </div>
          </ArchitectureContainer>

          <ArchitectureArrow direction="down" length={30} />

          {/* Server-Side Validation */}
          <ArchitectureContainer title="Server-Side Validation Engine" titleColor={COLORS.orange} variant="dashed" badgeIcon={<ShieldCheck className="w-3.5 h-3.5" />}>
            <div className="flex items-center gap-4 justify-center py-2">
              <ArchitectureNode icon={<CheckCircle className="w-6 h-6" />} label="Response Validation" sublabel="validation_rules table" color={COLORS.orange} number={9} />
              <div className="flex flex-col gap-1 text-xs text-gray-500 max-w-52 leading-tight">
                <div className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-orange-500" /> Hallucination detection</div>
                <div className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-orange-500" /> Unsafe content filtering</div>
                <div className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-orange-500" /> Required keyword checks</div>
                <div className="flex items-center gap-1 mt-1 text-orange-600 font-medium"><RefreshCw className="w-3 h-3" /> FAIL → Retry (up to 3×)</div>
              </div>
            </div>
          </ArchitectureContainer>

          {/* LangSmith */}
          <div className="flex items-center gap-3 px-4 py-2 bg-cyan-50 rounded-lg border border-cyan-200">
            <Activity className="w-4 h-4 text-cyan-600" />
            <div>
              <div className="text-xs font-medium text-cyan-700">LangSmith Observability</div>
              <div className="text-[10px] text-cyan-500">Fire-and-forget tracing · No raw prompts (privacy-safe)</div>
            </div>
          </div>

          {/* DB Layer strip */}
          <div className="w-full mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Postgres DB Layer</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {["industry_contexts", "procurement_categories", "market_insights", "validation_rules", "saved_intel_configs"].map((table) => (
                <span key={table} className="px-2 py-0.5 bg-white rounded border border-gray-300 text-[10px] font-mono text-gray-600">{table}</span>
              ))}
            </div>
          </div>
        </div>
      </ArchitectureContainer>

      {/* Arrow Layer 2 → Layer 3 */}
      <div className="flex flex-col items-center">
        <ArchitectureArrow direction="down" length={40} label="Validated AI Response" color={COLORS.green} />
      </div>

      {/* LAYER 3 — CUSTOMER PREMISES: POST-FLIGHT */}
      <ArchitectureContainer
        title="Layer 3 — Customer Premises (Client Post-Flight)"
        titleColor={COLORS.green}
        variant="solid"
        badge="BROWSER"
        badgeIcon={<MonitorSmartphone className="w-4 h-4" />}
        className="w-full"
      >
        <div className="flex flex-col items-center gap-4">
          <ArchitectureNode icon={<Eye className="w-6 h-6" />} label="Entity Deanonymizer" sublabel="[COMPANY_A] → real PII (browser-only)" color={COLORS.green} number={10} />
          <ArchitectureArrow direction="down" length={24} />
          <ArchitectureNode icon={<ShieldCheck className="w-6 h-6" />} label="Token Integrity Check" sublabel="Verify no tokens lost or hallucinated" color={COLORS.emerald} number={11} />
          <ArchitectureArrow direction="down" length={24} />
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Output Engine</div>
          <div className="flex flex-wrap justify-center gap-6">
            <ArchitectureNode icon={<BarChart3 className="w-6 h-6" />} label="Dashboard Renderer" sublabel="Parses <dashboard-data> JSON" color={COLORS.cyan} number={12} />
            <ArchitectureNode icon={<FileText className="w-6 h-6" />} label="PDF Generator" sublabel="Executive reports" color={COLORS.pink} number={13} />
            <ArchitectureNode icon={<FileSpreadsheet className="w-6 h-6" />} label="Excel / Jira" sublabel="Structured exports" color={COLORS.orange} number={14} />
            <ArchitectureNode icon={<Share2 className="w-6 h-6" />} label="Shareable Links" sublabel="128-bit · 5-day expiry" color={COLORS.indigo} number={15} />
          </div>
        </div>
      </ArchitectureContainer>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-6 mt-6 px-4 py-3 bg-white rounded-xl border border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2" style={{ borderColor: COLORS.blue, backgroundColor: `${COLORS.blue}20` }} />
          <span className="text-xs text-gray-600">Client Pre-Flight</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2" style={{ borderColor: COLORS.purple, backgroundColor: `${COLORS.purple}20` }} />
          <span className="text-xs text-gray-600">EXOS Cloud (Server)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2" style={{ borderColor: COLORS.green, backgroundColor: `${COLORS.green}20` }} />
          <span className="text-xs text-gray-600">Client Post-Flight</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2" style={{ borderColor: COLORS.red, backgroundColor: `${COLORS.red}20` }} />
          <span className="text-xs text-gray-600">Trust Boundary (PII)</span>
        </div>
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-xs text-gray-600">Postgres Persistence</span>
        </div>
      </div>
    </div>
  );
};

export default ExosArchitectureDiagram;
