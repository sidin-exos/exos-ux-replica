import React from "react";
import ArchitectureNode from "./ArchitectureNode";
import ArchitectureContainer from "./ArchitectureContainer";
import ArchitectureArrow from "./ArchitectureArrow";
import {
  FileText,
  Building2,
  Users,
  Target,
  Shield,
  Compass,
  TrendingUp,
  Brain,
  CheckCircle,
  Unlock,
  FileOutput,
  LayoutDashboard,
  Map,
  Lightbulb,
  ShieldCheck,
  Lock,
  RotateCcw,
  ToggleLeft,
  LineChart,
  Cpu,
  Cloud,
  Server,
  ArrowUp,
  Database,
  Share2,
  CalendarClock,
  Zap,
} from "lucide-react";

// Color palette matching the Miro style
const COLORS = {
  blue: "#3b82f6",
  green: "#10b981",
  purple: "#8b5cf6",
  orange: "#f59e0b",
  pink: "#ec4899",
  cyan: "#06b6d4",
  red: "#ef4444",
  indigo: "#6366f1",
  security: "#dc2626",
};

const ExosArchitectureDiagram: React.FC = () => {
  return (
    <div className="w-full bg-[#fefdf8] rounded-2xl p-8 min-w-[900px]">
      {/* Title */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">
          EXOS Procurement Intelligence Architecture
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Privacy-preserving AI pipeline with enterprise on-premises deployment
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* SECTION A: CUSTOMER PREMISES (PRE-FLIGHT) */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <ArchitectureContainer
          title="Customer Premises (Pre-Flight)"
          titleColor={COLORS.green}
          variant="security"
          badge="Enterprise"
          badgeIcon={<Lock size={12} />}
          className="bg-green-50/30"
        >
          <div className="flex flex-col gap-6">
            {/* Row 1: User Input */}
            <ArchitectureContainer title="User Input" titleColor={COLORS.blue}>
              <div className="flex items-center justify-center gap-8">
                <ArchitectureNode
                  icon={<FileText size={28} />}
                  label="Scenario Wizard"
                  sublabel="Make vs Buy · TCO"
                  color={COLORS.blue}
                  number={1}
                />
                <ArchitectureNode
                  icon={<Building2 size={28} />}
                  label="Industry Context"
                  sublabel="Healthcare · Retail"
                  color={COLORS.blue}
                  number={2}
                />
                <ArchitectureNode
                  icon={<Users size={28} />}
                  label="Supplier Data"
                  sublabel="Contracts · Spend"
                  color={COLORS.blue}
                  number={3}
                />
                <ArchitectureNode
                  icon={<Target size={28} />}
                  label="Business Context"
                  sublabel="Goals · Constraints"
                  color={COLORS.blue}
                  number={4}
                />
              </div>
            </ArchitectureContainer>

            <div className="flex justify-center">
              <ArchitectureArrow direction="down" length={30} />
            </div>

            {/* Row 2: Context Preparation (Pre-Pipeline) */}
            <ArchitectureContainer
              title="Context Preparation"
              titleColor={COLORS.orange}
            >
              <div className="flex items-center justify-center gap-8">
                <div className="flex flex-col items-center gap-2 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <ArchitectureNode
                    icon={<Compass size={28} />}
                    label="Grounding Engine"
                    sublabel="Private Context Injection"
                    color={COLORS.orange}
                    number={5}
                  />
                </div>
                <ArchitectureArrow direction="right" length={40} />
                <div className="flex flex-col items-center gap-2 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <ArchitectureNode
                    icon={<TrendingUp size={28} />}
                    label="Market Intel"
                    sublabel="Ad-hoc · Scheduled · Triggered"
                    color={COLORS.orange}
                    number={6}
                  />
                  {/* Mode icons */}
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1 bg-orange-100 px-2 py-0.5 rounded text-[8px] font-medium text-orange-700">
                      <CalendarClock size={10} /> Scheduled
                    </div>
                    <div className="flex items-center gap-1 bg-orange-100 px-2 py-0.5 rounded text-[8px] font-medium text-orange-700">
                      <Zap size={10} /> Triggered
                    </div>
                  </div>
                  <span className="text-[9px] font-medium text-orange-500 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                    Perplexity Sonar Pro
                  </span>
                </div>
              </div>

              {/* Knowledge Base Feedback Loop */}
              <div className="mt-4 flex items-center justify-center gap-4">
                <ArchitectureArrow direction="left" length={60} label="Knowledge Base Feedback" labelPosition="top" dashed color={COLORS.orange} />
                <div className="flex flex-col items-center gap-1 p-3 bg-amber-50 rounded-lg border border-amber-300 border-dashed">
                  <Database size={20} className="text-amber-600" />
                  <span className="text-[9px] font-semibold text-amber-700">Knowledge Base</span>
                  <span className="text-[8px] text-amber-600">saved_intel_configs</span>
                  <span className="text-[8px] text-amber-600">market_insights</span>
                </div>
                <ArchitectureArrow direction="left" length={60} label="Grounding Data" labelPosition="top" dashed color={COLORS.orange} />
              </div>
            </ArchitectureContainer>

            <div className="flex justify-center">
              <ArchitectureArrow direction="down" length={30} />
            </div>

            {/* Row 3: Sentinel Anonymize */}
            <ArchitectureContainer
              title="Sentinel Layer"
              titleColor={COLORS.green}
            >
              <div className="flex justify-center">
                <div className="flex flex-col items-center gap-2 p-4 bg-green-50 rounded-lg border border-green-200">
                  <ArchitectureNode
                    icon={<Shield size={28} />}
                    label="Sentinel Anonymize"
                    sublabel="stepAnonymize() - Mask PII"
                    color={COLORS.green}
                    number={7}
                  />
                </div>
              </div>
            </ArchitectureContainer>

            <div className="flex justify-center">
              <ArchitectureArrow direction="down" length={30} />
            </div>

            {/* InfoSec Gate */}
            <div className="flex justify-center">
              <div className="flex flex-col items-center gap-2 p-4 bg-red-50 rounded-xl border-2 border-red-300 shadow-md">
                <div className="flex items-center gap-3">
                  <ArchitectureNode
                    icon={<ShieldCheck size={32} />}
                    label="InfoSec Gate"
                    sublabel="API Audit & Approval"
                    color={COLORS.security}
                  />
                  <div className="flex flex-col gap-1 text-[10px] text-red-700 bg-red-100 px-3 py-2 rounded-lg">
                    <span className="font-semibold">Security Controls:</span>
                    <span>• Request inspection</span>
                    <span>• Data leak prevention</span>
                    <span>• Audit logging</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ArchitectureContainer>

        {/* Arrow crossing security boundary - DOWN to Cloud */}
        <div className="flex justify-center">
          <ArchitectureArrow
            direction="down"
            length={40}
            label="Anonymized Request"
            labelPosition="right"
            color={COLORS.security}
            dashed
          />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* SECTION B: CLOUD SERVICES (EXTERNAL) */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <ArchitectureContainer
          title="Cloud Services (External)"
          titleColor={COLORS.purple}
          variant="dashed"
        >
          <div className="flex flex-col gap-6">
            {/* AI Gateway */}
            <ArchitectureContainer
              title="AI Gateway (stepReasoning)"
              titleColor={COLORS.purple}
              className="bg-purple-50/50"
            >
              <div className="flex items-center justify-center gap-6">
                <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border border-purple-200 shadow-sm">
                  <ArchitectureNode
                    icon={<Cloud size={28} />}
                    label="Lovable Gateway"
                    sublabel="Managed Service"
                    color={COLORS.purple}
                    number={8}
                  />
                </div>

                {/* Provider Toggle */}
                <div className="flex flex-col items-center gap-1">
                  <ToggleLeft size={24} className="text-purple-500" />
                  <span className="text-[9px] font-medium text-purple-600">
                    Provider Toggle
                  </span>
                </div>

                <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border border-purple-200 shadow-sm">
                  <ArchitectureNode
                    icon={<Server size={28} />}
                    label="Google AI Studio"
                    sublabel="BYOK"
                    color={COLORS.purple}
                  />
                </div>
              </div>

              {/* Models Badge */}
              <div className="flex justify-center mt-4">
                <div className="flex items-center gap-2 bg-purple-100 px-4 py-2 rounded-full border border-purple-200">
                  <Cpu size={14} className="text-purple-600" />
                  <span className="text-[10px] font-medium text-purple-700">
                    Models: Gemini 3 Flash · Gemini 2.5 Pro · GPT-5 · GPT-5.2
                  </span>
                </div>
              </div>

              {/* Deep Analysis Badge */}
              <div className="flex justify-center mt-3">
                <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-lg border border-purple-300 border-dashed">
                  <Brain size={14} className="text-purple-600" />
                  <span className="text-[10px] font-medium text-purple-700">
                    Chain-of-Experts: Analyst → Auditor → Synthesizer (multi-cycle)
                  </span>
                </div>
              </div>
            </ArchitectureContainer>

            {/* Observability */}
            <ArchitectureContainer
              title="Observability"
              titleColor={COLORS.cyan}
              className="bg-cyan-50/50"
            >
              <div className="flex items-center justify-center gap-4">
                <ArchitectureNode
                  icon={<LineChart size={28} />}
                  label="LangSmith Client"
                  sublabel="REST API Tracing"
                  color={COLORS.cyan}
                  number={9}
                />
                <div className="flex flex-col gap-1 text-[10px] text-cyan-700 bg-cyan-100 px-3 py-2 rounded-lg">
                  <span className="font-semibold">Fire-and-Forget:</span>
                  <span>• Pipeline traces</span>
                  <span>• Exponential backoff</span>
                  <span>• Non-blocking</span>
                </div>
              </div>
            </ArchitectureContainer>
          </div>
        </ArchitectureContainer>

        {/* Arrow from Cloud back to Customer Premises */}
        <div className="flex justify-center items-center gap-4">
          <ArchitectureArrow
            direction="down"
            length={40}
            label="AI Response"
            labelPosition="right"
            color={COLORS.purple}
          />
          {/* Retry Loop Indicator - pointing UP */}
          <div className="flex flex-col items-center gap-1 bg-orange-100 px-3 py-2 rounded-lg border border-orange-300">
            <ArrowUp size={20} className="text-orange-600" />
            <div className="flex items-center gap-1">
              <RotateCcw size={12} className="text-orange-600" />
              <span className="text-[9px] font-semibold text-orange-700">
                Retry Loop
              </span>
            </div>
            <span className="text-[8px] text-orange-600">(up to 3x)</span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* SECTION C: CUSTOMER PREMISES (POST-FLIGHT) */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <ArchitectureContainer
          title="Customer Premises (Post-Flight)"
          titleColor={COLORS.indigo}
          variant="security"
          badge="Secure"
          badgeIcon={<Lock size={12} />}
          className="bg-indigo-50/30"
        >
          <div className="flex flex-col gap-6">
            {/* Response Validation */}
            <ArchitectureContainer
              title="Response Validation (stepValidate)"
              titleColor={COLORS.pink}
            >
              <div className="flex items-center justify-center gap-6">
                <div className="flex flex-col items-center gap-2 p-4 bg-pink-50 rounded-lg border border-pink-200">
                  <ArchitectureNode
                    icon={<CheckCircle size={28} />}
                    label="Validation Check"
                    sublabel="Anti-Hallucination"
                    color={COLORS.pink}
                    number={10}
                  />
                </div>
                <div className="flex flex-col gap-1 text-[10px] text-pink-700 bg-pink-100 px-3 py-2 rounded-lg">
                  <span className="font-semibold">Validation Checks:</span>
                  <span>• Token Integrity (checkTokenIntegrity)</span>
                  <span>• Hallucination Detection</span>
                  <span>• Unsafe Content Detection</span>
                  <span>• Golden Case Matching</span>
                </div>
              </div>
              {/* Pass/Fail indicator */}
              <div className="flex justify-center mt-4 gap-4">
                <div className="flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full border border-green-300">
                  <span className="text-[10px] font-semibold text-green-700">
                    ✓ PASS → Continue
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-orange-100 px-3 py-1 rounded-full border border-orange-300">
                  <span className="text-[10px] font-semibold text-orange-700">
                    ✗ FAIL → Retry (up to 3x)
                  </span>
                </div>
              </div>
            </ArchitectureContainer>

            <div className="flex justify-center">
              <ArchitectureArrow
                direction="down"
                length={30}
                label="If Validation Passes"
                labelPosition="right"
              />
            </div>

            {/* Deanonymize */}
            <ArchitectureContainer
              title="Entity Restoration"
              titleColor={COLORS.indigo}
            >
              <div className="flex justify-center">
                <div className="flex flex-col items-center gap-2 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <ArchitectureNode
                    icon={<Unlock size={28} />}
                    label="Deanonymize"
                    sublabel="stepDeanonymize() - Restore Entities"
                    color={COLORS.indigo}
                    number={11}
                  />
                </div>
              </div>
            </ArchitectureContainer>

            <div className="flex justify-center">
              <ArchitectureArrow direction="down" length={30} />
            </div>

            {/* Output */}
            <ArchitectureContainer title="Output" titleColor={COLORS.cyan}>
              <div className="flex items-center justify-center gap-8">
                <ArchitectureNode
                  icon={<FileOutput size={28} />}
                  label="Executive Reports"
                  sublabel="PDF · Excel · Jira"
                  color={COLORS.cyan}
                  number={12}
                />
                <ArchitectureNode
                  icon={<LayoutDashboard size={28} />}
                  label="Dashboards"
                  sublabel="Kraljic · TCO · Risk"
                  color={COLORS.cyan}
                  number={13}
                />
                <ArchitectureNode
                  icon={<Map size={28} />}
                  label="Roadmaps"
                  sublabel="Action Plans"
                  color={COLORS.cyan}
                  number={14}
                />
                <ArchitectureNode
                  icon={<Lightbulb size={28} />}
                  label="Insights"
                  sublabel="Opportunities"
                  color={COLORS.cyan}
                  number={15}
                />
                <ArchitectureNode
                  icon={<Share2 size={28} />}
                  label="Shareable Links"
                  sublabel="128-bit · 5-day expiry"
                  color={COLORS.cyan}
                  number={16}
                />
              </div>
            </ArchitectureContainer>
          </div>
        </ArchitectureContainer>
      </div>

      {/* Legend */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex flex-wrap gap-6 justify-center text-xs">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded border-2"
              style={{
                borderColor: COLORS.green,
                backgroundColor: "#f0fdf4",
              }}
            />
            <span className="text-gray-600">Pre-Flight (On-Premises)</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded border-2 border-dashed"
              style={{
                borderColor: COLORS.purple,
                backgroundColor: "#faf5ff",
              }}
            />
            <span className="text-gray-600">Cloud Services (External)</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded border-2"
              style={{
                borderColor: COLORS.indigo,
                backgroundColor: "#eef2ff",
              }}
            />
            <span className="text-gray-600">Post-Flight (On-Premises)</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded border-2"
              style={{
                borderColor: COLORS.security,
                backgroundColor: "#fef2f2",
              }}
            />
            <span className="text-gray-600">Security Perimeter</span>
          </div>
          <div className="flex items-center gap-2">
            <RotateCcw size={14} className="text-orange-500" />
            <span className="text-gray-600">Retry Loop (3x max)</span>
          </div>
          <div className="flex items-center gap-2">
            <Database size={14} className="text-amber-500" />
            <span className="text-gray-600">Knowledge Base Persistence</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExosArchitectureDiagram;
