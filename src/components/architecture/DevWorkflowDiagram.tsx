import React from "react";
import {
  UserCircle,
  Building2,
  ShieldCheck,
  Wrench,
  Bot,
  Hammer,
  ListTodo,
  LineChart,
  BarChart3,
} from "lucide-react";
import ArchitectureNode from "./ArchitectureNode";
import ArchitectureContainer from "./ArchitectureContainer";
import ArchitectureArrow from "./ArchitectureArrow";

const COLORS = {
  orange: "#f59e0b",
  blue: "#3b82f6",
  green: "#10b981",
  purple: "#8b5cf6",
  red: "#ef4444",
  gray: "#64748b",
};

const DevWorkflowDiagram: React.FC = () => {
  return (
    <div className="flex flex-col items-center gap-2 p-8 min-w-[700px]">
      {/* Title */}
      <h2 className="text-xl font-bold text-gray-800 mb-2">
        EXOS Development Workflow
      </h2>
      <p className="text-xs text-gray-500 mb-6">
        AI-Augmented Pipeline · Gemini Virtual Committee · Human-in-the-Loop
      </p>

      {/* ── Phase 1: YOU (Central Actor) ── */}
      <ArchitectureNode
        icon={<UserCircle />}
        label="YOU"
        sublabel="Product Owner & Pilot"
        color={COLORS.orange}
        className="scale-125"
      />

      {/* Arrow: YOU → Architect */}
      <ArchitectureArrow
        direction="down"
        length={50}
        label="1. Feature Request"
        color={COLORS.orange}
      />

      {/* ── Phase 2: Gemini Virtual Committee ── */}
      <ArchitectureContainer
        title="🧠 Gemini Virtual Committee"
        titleColor={COLORS.blue}
        variant="dashed"
        badge="Chain-of-Experts"
      >
        <div className="flex items-center justify-center gap-4 pt-2">
          <ArchitectureNode
            icon={<Building2 />}
            label="Architect"
            sublabel="Strategy & DB"
            color={COLORS.blue}
            number={2}
          />
          <ArchitectureArrow
            direction="right"
            length={60}
            label="High-Level Design"
            color={COLORS.blue}
          />
          <ArchitectureNode
            icon={<ShieldCheck />}
            label="Auditor"
            sublabel="Security & QA"
            color={COLORS.blue}
            number={3}
          />
          <ArchitectureArrow
            direction="right"
            length={60}
            label="Security Review"
            color={COLORS.blue}
          />
          <ArchitectureNode
            icon={<Wrench />}
            label="Tech Lead"
            sublabel="Implementation Spec"
            color={COLORS.blue}
            number={4}
          />
        </div>

        {/* Reject arrow: Auditor → Architect */}
        <div className="flex justify-center mt-3">
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-50 border border-red-200">
            <ArchitectureArrow
              direction="left"
              length={40}
              color={COLORS.red}
              dashed
            />
            <span className="text-[10px] font-semibold text-red-600">
              ❌ Risk Blocked
            </span>
          </div>
        </div>
      </ArchitectureContainer>

      {/* Arrow: Tech Lead → YOU (Final Prompt) */}
      <ArchitectureArrow
        direction="up"
        length={40}
        label="4. Final Lovable Prompt (Ready-to-Paste)"
        labelPosition="right"
        color={COLORS.blue}
      />

      {/* ── Feedback: YOU decides ── */}
      <div className="flex items-center gap-6 my-2">
        <div className="flex flex-col items-center gap-1">
          <ArchitectureArrow
            direction="left"
            length={50}
            label="❌ Reject & Iterate"
            color={COLORS.red}
            dashed
          />
          <span className="text-[9px] text-red-500">Back to Tech Lead</span>
        </div>
        <ArchitectureNode
          icon={<UserCircle />}
          label="YOU"
          sublabel="Review & Decide"
          color={COLORS.orange}
        />
        <div className="flex flex-col items-center gap-1">
          <ArchitectureArrow
            direction="right"
            length={50}
            label="✅ Approve"
            color={COLORS.green}
          />
          <span className="text-[9px] text-green-600">To Lovable Factory</span>
        </div>
      </div>

      {/* Arrow: YOU → Coder */}
      <ArchitectureArrow
        direction="down"
        length={40}
        label="5. Paste Spec"
        color={COLORS.orange}
      />

      {/* ── Phase 4: Lovable AI Factory ── */}
      <ArchitectureContainer
        title="🏭 Lovable AI Factory"
        titleColor={COLORS.orange}
        variant="dashed"
        badge="Code & Preview"
      >
        <div className="flex items-center justify-center gap-6 pt-2">
          <ArchitectureNode
            icon={<Bot />}
            label="Coder"
            sublabel="Code Generation"
            color={COLORS.orange}
            number={6}
          />
          <ArchitectureArrow
            direction="right"
            length={80}
            label="Generate Code"
            color={COLORS.orange}
          />
          <ArchitectureNode
            icon={<Hammer />}
            label="Builder"
            sublabel="Build & Preview"
            color={COLORS.orange}
            number={7}
          />
        </div>
      </ArchitectureContainer>

      {/* Arrow: Builder → YOU (Instant Preview) */}
      <ArchitectureArrow
        direction="up"
        length={40}
        label="7. Instant Preview"
        labelPosition="right"
        color={COLORS.orange}
      />

      {/* ── Phase 5: Feedback & Commit ── */}
      <div className="flex items-center gap-6 my-2">
        <div className="flex flex-col items-center gap-1">
          <ArchitectureArrow
            direction="left"
            length={50}
            label="❌ Reject & Iterate"
            color={COLORS.red}
            dashed
          />
          <span className="text-[9px] text-red-500">Back to Tech Lead</span>
        </div>
        <ArchitectureNode
          icon={<UserCircle />}
          label="YOU"
          sublabel="Visual Review & QA"
          color={COLORS.orange}
        />
        <div className="flex flex-col items-center gap-1">
          <ArchitectureArrow
            direction="right"
            length={50}
            label="✅ Approve & Deploy"
            color={COLORS.green}
          />
          <span className="text-[9px] text-green-600">To System Memory</span>
        </div>
      </div>

      {/* Arrow: YOU → Linear */}
      <ArchitectureArrow
        direction="down"
        length={40}
        label="8. Approve & Deploy"
        color={COLORS.green}
      />

      {/* ── Phase 6: System Memory & Ops ── */}
      <ArchitectureContainer
        title="💾 System Memory & Ops"
        titleColor={COLORS.green}
        variant="dashed"
      >
        <div className="flex items-center justify-center gap-6 pt-2">
          <ArchitectureNode
            icon={<ListTodo />}
            label="Linear"
            sublabel="Decisions & History"
            color={COLORS.green}
            number={9}
          />
          <ArchitectureArrow
            direction="right"
            length={60}
            label="Commit Logic"
            color={COLORS.green}
          />
          <ArchitectureNode
            icon={<BarChart3 />}
            label="DevEx Metrics"
            sublabel="Velocity & Quality"
            color={COLORS.purple}
            number={10}
          />
        </div>
        <div className="flex items-center justify-center gap-6 mt-4">
          <ArchitectureNode
            icon={<LineChart />}
            label="LangSmith"
            sublabel="AI Observability"
            color={COLORS.green}
            number={11}
          />
          <ArchitectureArrow
            direction="right"
            length={60}
            label="AI Performance Data"
            color={COLORS.purple}
            dashed
          />
          <span className="text-[10px] text-purple-500 font-medium">
            → DevEx Metrics
          </span>
        </div>
        {/* Builder → LangSmith connection note */}
        <div className="flex justify-center mt-3">
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 border border-green-200">
            <span className="text-[10px] text-green-700">
              Builder ─ ─ ─ → LangSmith (Runtime Logs & Traces)
            </span>
          </div>
        </div>
      </ArchitectureContainer>

      {/* ── Legend ── */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-8 px-4 py-3 rounded-lg bg-gray-50 border border-gray-200">
        <span className="text-xs font-semibold text-gray-600">Legend:</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.blue }} />
          <span className="text-[10px] text-gray-600">Gemini AI Roles</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.orange }} />
          <span className="text-[10px] text-gray-600">Human / Lovable Factory</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.green }} />
          <span className="text-[10px] text-gray-600">System Memory</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className="w-3 h-3 rounded border-2 border-dashed"
            style={{ borderColor: COLORS.purple }}
          />
          <span className="text-[10px] text-gray-600">Metrics & Observability</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className="w-3 h-3 rounded border-2 border-dashed"
            style={{ borderColor: COLORS.red }}
          />
          <span className="text-[10px] text-gray-600">Rejection / Risk</span>
        </div>
      </div>
    </div>
  );
};

export default DevWorkflowDiagram;
