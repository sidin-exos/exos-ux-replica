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
  Newspaper,
  AlertTriangle,
  Brain,
  Zap,
  BarChart3,
  CheckCircle,
  Calculator,
  Quote,
  Unlock,
  FileOutput,
  LayoutDashboard,
  Map,
  Lightbulb,
  ShieldCheck,
  Lock,
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

            {/* Row 2: EXOS Intelligence Core (Local) */}
            <ArchitectureContainer
              title="EXOS Intelligence (Local)"
              titleColor={COLORS.green}
            >
              <div className="flex items-center justify-between gap-4">
                {/* Stage 1: Anonymizer */}
                <div className="flex flex-col items-center gap-2 p-4 bg-green-50 rounded-lg border border-green-200">
                  <span className="text-[10px] font-semibold text-green-700 uppercase">
                    Stage 1
                  </span>
                  <ArchitectureNode
                    icon={<Shield size={28} />}
                    label="Anonymizer"
                    sublabel="Data Masking"
                    color={COLORS.green}
                    number={5}
                  />
                </div>

                <ArchitectureArrow direction="right" length={30} />

                {/* Stage 2: Grounding */}
                <div className="flex flex-col items-center gap-2 p-4 bg-green-50 rounded-lg border border-green-200">
                  <span className="text-[10px] font-semibold text-green-700 uppercase">
                    Stage 2
                  </span>
                  <ArchitectureNode
                    icon={<Compass size={28} />}
                    label="Grounding"
                    sublabel="Context Injection"
                    color={COLORS.green}
                    number={6}
                  />
                </div>

                <ArchitectureArrow direction="right" length={30} />

                {/* Stage 3: Market Intel */}
                <div className="flex flex-col items-center gap-2 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <span className="text-[10px] font-semibold text-orange-700 uppercase">
                    Stage 3
                  </span>
                  <div className="flex gap-2">
                    <ArchitectureNode
                      icon={<TrendingUp size={24} />}
                      label="Trends"
                      color={COLORS.orange}
                      number={7}
                    />
                    <ArchitectureNode
                      icon={<Newspaper size={24} />}
                      label="News"
                      color={COLORS.orange}
                    />
                    <ArchitectureNode
                      icon={<AlertTriangle size={24} />}
                      label="Risks"
                      color={COLORS.orange}
                    />
                  </div>
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
                    number={8}
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

        {/* Cloud AI Agents (External) */}
        <ArchitectureContainer
          title="Cloud AI Agents (External)"
          titleColor={COLORS.purple}
          variant="dashed"
        >
          <div className="flex items-center justify-center gap-6">
            <div className="grid grid-cols-4 gap-4">
              <ArchitectureNode
                icon={<Brain size={24} />}
                label="Auditor"
                sublabel="Data Check"
                color={COLORS.purple}
                number={9}
              />
              <ArchitectureNode
                icon={<Zap size={24} />}
                label="Optimizer"
                sublabel="Savings"
                color={COLORS.purple}
                number={10}
              />
              <ArchitectureNode
                icon={<BarChart3 size={24} />}
                label="Strategist"
                sublabel="Analysis"
                color={COLORS.purple}
                number={11}
              />
              <ArchitectureNode
                icon={<CheckCircle size={24} />}
                label="Validator"
                sublabel="Quality"
                color={COLORS.purple}
                number={12}
              />
            </div>
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

        {/* Customer Premises Boundary - Validation & Output */}
        <ArchitectureContainer
          title="Customer Premises"
          titleColor={COLORS.security}
          variant="security"
          badgeIcon={<Lock size={12} />}
        >
          <div className="flex flex-col gap-6">
            {/* Validation Layer */}
            <div className="flex gap-6">
              <ArchitectureContainer
                title="Validation Layer"
                titleColor={COLORS.pink}
                className="flex-1"
              >
                <div className="flex items-center justify-center gap-6">
                  <ArchitectureNode
                    icon={<CheckCircle size={28} />}
                    label="Hallucination Check"
                    sublabel="Fact Verification"
                    color={COLORS.pink}
                    number={13}
                  />
                  <ArchitectureArrow direction="right" length={40} />
                  <ArchitectureNode
                    icon={<Calculator size={28} />}
                    label="Calculation Verify"
                    sublabel="Math Accuracy"
                    color={COLORS.pink}
                    number={14}
                  />
                  <ArchitectureArrow direction="right" length={40} />
                  <ArchitectureNode
                    icon={<Quote size={28} />}
                    label="Citation Check"
                    sublabel="Source Validation"
                    color={COLORS.pink}
                    number={15}
                  />
                </div>
              </ArchitectureContainer>

              <ArchitectureContainer
                title="De-anonymization"
                titleColor={COLORS.indigo}
                className="w-48"
              >
                <div className="flex flex-col items-center gap-4">
                  <ArchitectureNode
                    icon={<Unlock size={28} />}
                    label="Entity Restore"
                    sublabel="Real Names"
                    color={COLORS.indigo}
                    number={16}
                  />
                </div>
              </ArchitectureContainer>
            </div>

            <div className="flex justify-center">
              <ArchitectureArrow 
                direction="down" 
                length={30} 
                label="Verified Response"
                labelPosition="right"
              />
            </div>

            {/* Output */}
            <ArchitectureContainer title="Output" titleColor={COLORS.cyan}>
              <div className="flex items-center justify-center gap-8">
                <ArchitectureNode
                  icon={<FileOutput size={28} />}
                  label="Executive Reports"
                  sublabel="PDF with Citations"
                  color={COLORS.cyan}
                  number={17}
                />
                <ArchitectureNode
                  icon={<LayoutDashboard size={28} />}
                  label="Dashboards"
                  sublabel="Kraljic · TCO · Risk"
                  color={COLORS.cyan}
                  number={18}
                />
                <ArchitectureNode
                  icon={<Map size={28} />}
                  label="Roadmaps"
                  sublabel="Action Plans"
                  color={COLORS.cyan}
                  number={19}
                />
                <ArchitectureNode
                  icon={<Lightbulb size={28} />}
                  label="Insights"
                  sublabel="Opportunities"
                  color={COLORS.cyan}
                  number={20}
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
              style={{ borderColor: COLORS.security, backgroundColor: "#fef2f2" }}
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
              style={{ backgroundColor: COLORS.green }}
            />
            <span className="text-gray-600">Processing</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: COLORS.orange }}
            />
            <span className="text-gray-600">Market Intel</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: COLORS.purple }}
            />
            <span className="text-gray-600">AI Agents (External)</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: COLORS.pink }}
            />
            <span className="text-gray-600">Validation</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: COLORS.cyan }}
            />
            <span className="text-gray-600">Output</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExosArchitectureDiagram;
