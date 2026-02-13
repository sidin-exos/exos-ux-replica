import React from "react";
import {
  Crown,
  Database,
  ShieldCheck,
  Server,
  MessageSquare,
  LineChart,
  Search,
  Bot,
  CheckCircle,
  TrendingUp,
  Target,
  Users,
} from "lucide-react";
import ArchitectureNode from "./ArchitectureNode";
import ArchitectureContainer from "./ArchitectureContainer";
import ArchitectureArrow from "./ArchitectureArrow";

const COLORS = {
  ceo: "#e65100",
  cto: "#1565c0",
  ai: "#8b5cf6",
  delivery: "#f59e0b",
  growth: "#ef4444",
  futureHire: "#2e7d32",
  performanceBased: "#ef4444",
};

interface RoleCardProps {
  title: string;
  current: string;
  color: string;
  futureHire?: boolean;
  badgeLabel?: string;
  badgeColor?: string;
}

const RoleCard: React.FC<RoleCardProps> = ({ title, current, color, futureHire, badgeLabel, badgeColor }) => {
  const showBadge = futureHire || badgeLabel;
  const label = badgeLabel || "Future Hire";
  const bgColor = badgeColor || COLORS.futureHire;

  return (
    <div
      className="relative rounded-lg border-2 px-4 py-3 mb-4 bg-white/80"
      style={{ borderColor: color }}
    >
      {showBadge && (
        <span
          className="absolute -top-2.5 right-2 px-2 py-0.5 text-[9px] font-bold uppercase rounded text-white"
          style={{ backgroundColor: bgColor }}
        >
          {label}
        </span>
      )}
      <div className="text-sm font-bold" style={{ color }}>
        {title}
      </div>
      <div className="text-[10px] text-gray-600 mt-0.5">{current}</div>
    </div>
  );
};

interface FuncNodeProps {
  icon: React.ReactNode;
  name: string;
  current: string;
  focus: string;
  color: string;
}

const FuncNode: React.FC<FuncNodeProps> = ({ icon, name, current, focus, color }) => (
  <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white/60 px-3 py-2">
    <div
      className="w-9 h-9 rounded-md flex items-center justify-center shrink-0 mt-0.5"
      style={{ backgroundColor: color }}
    >
      <div className="text-white">{icon}</div>
    </div>
    <div className="min-w-0">
      <div className="text-xs font-semibold text-gray-800">{name}</div>
      <div className="text-[10px] text-gray-500">CURRENT: {current}</div>
      <div className="text-[10px] text-gray-500">FOCUS: {focus}</div>
    </div>
  </div>
);

const OrgChartDiagram: React.FC = () => {
  return (
    <div className="flex flex-col items-center gap-2 min-w-[1200px] py-6">
      {/* Row 1: CEO */}
      <div className="transform scale-125">
        <ArchitectureNode
          icon={<Crown size={28} />}
          label="YOU"
          sublabel="CEO & Product Owner"
          color={COLORS.ceo}
        />
      </div>

      {/* Row 2: Four arrows down */}
      <div className="flex items-start justify-center gap-20 mt-2">
        <ArchitectureArrow direction="down" length={40} color={COLORS.cto} />
        <ArchitectureArrow direction="down" length={40} color={COLORS.ai} />
        <ArchitectureArrow direction="down" length={40} color={COLORS.delivery} />
        <ArchitectureArrow direction="down" length={40} color={COLORS.growth} />
      </div>

      {/* Row 3: Three scope containers */}
      <div className="flex items-start gap-6 mt-1">
        {/* CTO Scope */}
        <ArchitectureContainer
          title="🛠️ CTO SCOPE (Engineering & Security)"
          titleColor={COLORS.cto}
          className="w-[280px]"
        >
          <RoleCard
            title="CTO / Lead Architect"
            current="🏛️ Gemini Architect + 🛡️ Auditor"
            color={COLORS.cto}
            futureHire
          />
          <div className="flex flex-col gap-2">
            <FuncNode
              icon={<Database size={16} />}
              name="Backend & DB"
              current="Supabase + Lovable SQL"
              focus="Schema, RLS, Edge Functions"
              color={COLORS.cto}
            />
            <FuncNode
              icon={<ShieldCheck size={16} />}
              name="InfoSec & Compliance"
              current="Gemini Auditor"
              focus="PII Masking, GDPR"
              color={COLORS.cto}
            />
            <FuncNode
              icon={<Server size={16} />}
              name="DevOps & CI/CD"
              current="Lovable Cloud"
              focus="Deployment, Stability"
              color={COLORS.cto}
            />
          </div>
        </ArchitectureContainer>

        {/* Head of AI Scope */}
        <ArchitectureContainer
          title="🧠 HEAD OF AI SCOPE (R&D & Prompts)"
          titleColor={COLORS.ai}
          className="w-[280px]"
        >
          <RoleCard
            title="Head of AI"
            current="🔨 Gemini Tech Lead + LangSmith"
            color={COLORS.ai}
            futureHire
          />
          <div className="flex flex-col gap-2">
            <FuncNode
              icon={<MessageSquare size={16} />}
              name="Prompt Engineering"
              current="Gemini + Linear Library"
              focus="System Prompts, Chains"
              color={COLORS.ai}
            />
            <FuncNode
              icon={<LineChart size={16} />}
              name="Evaluation (EvalOps)"
              current="LangSmith Traces"
              focus="Quality Metrics, Golden Datasets"
              color={COLORS.ai}
            />
            <FuncNode
              icon={<Search size={16} />}
              name="Knowledge Base (RAG)"
              current="Perplexity Integration"
              focus="Data Enrichment, Search"
              color={COLORS.ai}
            />
          </div>
        </ArchitectureContainer>

        {/* Delivery Scope */}
        <ArchitectureContainer
          title="🏭 DELIVERY SCOPE (Execution)"
          titleColor={COLORS.delivery}
          className="w-[240px]"
        >
          <div className="flex flex-col gap-2 mt-2">
            <FuncNode
              icon={<Bot size={16} />}
              name="Frontend Dev"
              current="Lovable (Opus 4.6)"
              focus="Fully Automated"
              color={COLORS.delivery}
            />
            <FuncNode
              icon={<CheckCircle size={16} />}
              name="QA & Testing"
              current="Human Visual Check"
              focus="Manual + Auto-Unit"
              color={COLORS.delivery}
            />
          </div>
        </ArchitectureContainer>

        {/* Head of Growth Scope */}
        <ArchitectureContainer
          title="📈 HEAD OF GROWTH (GTM & Revenue)"
          titleColor={COLORS.growth}
          className="w-[280px]"
        >
          <RoleCard
            title="Head of Growth"
            current="🚀 Performance-Based Hire"
            color={COLORS.growth}
            badgeLabel="Performance Based"
            badgeColor={COLORS.performanceBased}
          />
          <div className="flex flex-col gap-2">
            <FuncNode
              icon={<TrendingUp size={16} />}
              name="GTM Strategy"
              current="Founder-led"
              focus="Channels, Positioning"
              color={COLORS.growth}
            />
            <FuncNode
              icon={<Target size={16} />}
              name="Revenue & Metrics"
              current="Manual Tracking"
              focus="MRR, CAC, Retention"
              color={COLORS.growth}
            />
            <FuncNode
              icon={<Users size={16} />}
              name="Community & Partnerships"
              current="Not Started"
              focus="Outreach, Content"
              color={COLORS.growth}
            />
          </div>
        </ArchitectureContainer>
      </div>

      {/* Row 4: Dashed arrows from CTO & AI scopes to Delivery */}
      <div className="flex items-center justify-center gap-16 mt-2">
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-gray-500 mb-1">Specs & Requirements</span>
          <ArchitectureArrow direction="right" length={80} dashed color={COLORS.cto} />
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-gray-500 mb-1">Specs & Requirements</span>
          <ArchitectureArrow direction="left" length={80} dashed color={COLORS.ai} />
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-6 px-4 py-3 rounded-lg bg-white/60 border border-gray-200">
        {[
          { color: COLORS.ceo, label: "Human (You)" },
          { color: COLORS.cto, label: "Engineering & Security" },
          { color: COLORS.ai, label: "AI R&D & Prompts" },
          { color: COLORS.delivery, label: "Delivery / Factory" },
          { color: COLORS.growth, label: "Growth & Revenue" },
          { color: COLORS.futureHire, label: "Future Human Hire" },
          { color: COLORS.performanceBased, label: "Performance Based", dashed: true },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[10px] text-gray-600 font-medium">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrgChartDiagram;
