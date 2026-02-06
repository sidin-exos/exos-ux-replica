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
        {/* Customer Premises Boundary */}
        <ArchitectureContainer
          title="Customer Premises"
          titleColor={COLORS.security}
          variant="security"
          badge="Enterprise"
          badgeIcon={<Lock size={12} />}
          className="bg-red-50/30"
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
              title="Context Preparation (Pre-Pipeline)"
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
                    sublabel="Perplexity Integration"
                    color={COLORS.orange}
                    number={6}
                  />
                </div>
              </div>
            </ArchitectureContainer>

            <div className="flex justify-center">
              <ArchitectureArrow direction="down" length={30} />
            </div>

            {/* Row 3: EXOS Decision Pipeline (graph.ts) */}
            <ArchitectureContainer
              title="EXOS Decision Pipeline (graph.ts)"
              titleColor={COLORS.green}
            >
              <div className="flex items-center justify-between gap-4">
                {/* Stage 1: Sentinel Anonymize */}
                <div className="flex flex-col items-center gap-2 p-4 bg-green-50 rounded-lg border border-green-200">
                  <span className="text-[10px] font-semibold text-green-700 uppercase">
                    Stage 1
                  </span>
                  <ArchitectureNode
                    icon={<Shield size={28} />}
                    label="Sentinel Anonymize"
                    sublabel="stepAnonymize()"
                    color={COLORS.green}
                    number={7}
                  />
                </div>

                <ArchitectureArrow direction="right" length={30} />

                {/* Stage 2: AI Reasoning with Retry Loop */}
                <div className="flex flex-col items-center gap-2 p-4 bg-purple-50 rounded-lg border border-purple-200 relative">
                  <span className="text-[10px] font-semibold text-purple-700 uppercase">
                    Stage 2
                  </span>
                  <div className="flex items-center gap-4">
                    <ArchitectureNode
                      icon={<Brain size={28} />}
                      label="AI Reasoning"
                      sublabel="via Edge Function"
                      color={COLORS.purple}
                      number={8}
                    />
                    <ArchitectureArrow direction="right" length={30} />
                    <ArchitectureNode
                      icon={<CheckCircle size={28} />}
                      label="Validation"
                      sublabel="Anti-Hallucination"
                      color={COLORS.pink}
                      number={9}
                    />
                  </div>
                  {/* Retry Loop Indicator */}
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-orange-100 px-2 py-1 rounded-full border border-orange-300">
                    <RotateCcw size={12} className="text-orange-600" />
                    <span className="text-[9px] font-semibold text-orange-700">
                      Retry Loop (up to 3x)
                    </span>
                  </div>
                </div>

                <ArchitectureArrow direction="right" length={30} />

                {/* Stage 3: Deanonymize */}
                <div className="flex flex-col items-center gap-2 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <span className="text-[10px] font-semibold text-indigo-700 uppercase">
                    Stage 3
                  </span>
                  <ArchitectureNode
                    icon={<Unlock size={28} />}
                    label="Deanonymize"
                    sublabel="Entity Restoration"
                    color={COLORS.indigo}
                    number={10}
                  />
                </div>
              </div>
            </ArchitectureContainer>

            <div className="flex justify-center">
              <ArchitectureArrow
                direction="down"
                length={30}
                label="Masked Request"
                labelPosition="right"
              />
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

        {/* Arrow crossing security boundary */}
        <div className="flex justify-center">
          <ArchitectureArrow
            direction="down"
            length={40}
            label="Anonymized Only"
            labelPosition="right"
            color={COLORS.security}
            dashed
          />
        </div>

        {/* Cloud Services (External) */}
        <ArchitectureContainer
          title="Cloud Services (External)"
          titleColor={COLORS.purple}
          variant="dashed"
        >
          <div className="flex flex-col gap-6">
            {/* AI Gateway */}
            <ArchitectureContainer
              title="AI Gateway"
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
                    number={11}
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
                    number={12}
                  />
                </div>
              </div>

              {/* Models Badge */}
              <div className="flex justify-center mt-4">
                <div className="flex items-center gap-2 bg-purple-100 px-4 py-2 rounded-full border border-purple-200">
                  <Cpu size={14} className="text-purple-600" />
                  <span className="text-[10px] font-medium text-purple-700">
                    Models: Gemini 3 Flash · Gemini 2.5 Pro · GPT-5
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
                  number={13}
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

        {/* Arrow returning to security boundary */}
        <div className="flex justify-center">
          <ArchitectureArrow
            direction="down"
            length={40}
            label="AI Response"
            labelPosition="right"
            color={COLORS.purple}
          />
        </div>

        {/* Customer Premises Boundary - Output */}
        <ArchitectureContainer
          title="Customer Premises (Output)"
          titleColor={COLORS.security}
          variant="security"
          badgeIcon={<Lock size={12} />}
        >
          <div className="flex flex-col gap-6">
            {/* Output */}
            <ArchitectureContainer title="Output" titleColor={COLORS.cyan}>
              <div className="flex items-center justify-center gap-8">
                <ArchitectureNode
                  icon={<FileOutput size={28} />}
                  label="Executive Reports"
                  sublabel="PDF with Citations"
                  color={COLORS.cyan}
                  number={14}
                />
                <ArchitectureNode
                  icon={<LayoutDashboard size={28} />}
                  label="Dashboards"
                  sublabel="Kraljic · TCO · Risk"
                  color={COLORS.cyan}
                  number={15}
                />
                <ArchitectureNode
                  icon={<Map size={28} />}
                  label="Roadmaps"
                  sublabel="Action Plans"
                  color={COLORS.cyan}
                  number={16}
                />
                <ArchitectureNode
                  icon={<Lightbulb size={28} />}
                  label="Insights"
                  sublabel="Opportunities"
                  color={COLORS.cyan}
                  number={17}
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
                borderColor: COLORS.security,
                backgroundColor: "#fef2f2",
              }}
            />
            <span className="text-gray-600">Security Perimeter</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: COLORS.blue }}
            />
            <span className="text-gray-600">User Input</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: COLORS.orange }}
            />
            <span className="text-gray-600">Context Preparation</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: COLORS.green }}
            />
            <span className="text-gray-600">Sentinel Pipeline</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: COLORS.purple }}
            />
            <span className="text-gray-600">AI Gateway</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: COLORS.cyan }}
            />
            <span className="text-gray-600">Observability / Output</span>
          </div>
          <div className="flex items-center gap-2">
            <RotateCcw size={14} className="text-orange-500" />
            <span className="text-gray-600">Retry Loop</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExosArchitectureDiagram;
