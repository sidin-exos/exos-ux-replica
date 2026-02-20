import React from "react";
import {
  Play,
  UserCircle,
  Bot,
  Database,
  Shield,
  Eye,
  Scale,
  Wrench,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  SlidersHorizontal,
  GitMerge,
  PlusCircle,
  Sparkles,
  Layers,
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
  amber: "#f59e0b",
};

const TestingPipelineDiagram: React.FC = () => {
  return (
    <div className="flex flex-col items-center gap-2 p-6 min-w-[700px]">
      {/* ── Trigger ── */}
      <ArchitectureNode
        icon={<Play size={28} />}
        label="Admin / CI-CD (Iterative Run)"
        sublabel="Triggers test batch"
        color={COLORS.orange}
      />

      <ArchitectureArrow direction="down" length={36} />

      {/* ── Phase 1: Synthesis Engine ── */}
      <ArchitectureContainer
        title="Phase 1: Synthesis Engine"
        titleColor={COLORS.orange}
        variant="dashed"
        className="w-full max-w-3xl"
      >
        <div className="flex flex-col items-center gap-4">
          {/* Entropy Controller — AI-Steered */}
          <div className="relative">
            <ArchitectureNode
              icon={<Sparkles size={28} />}
              label="Entropy Controller (AI-Steered)"
              sublabel="L1 (80% Structured) → L3 (90% Raw Dump)"
              color={COLORS.orange}
            />
            <div className="absolute -top-2 -left-2 flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200 px-2 py-0.5">
              <RefreshCw size={10} className="text-purple-500" />
              <span className="text-[8px] font-semibold text-purple-600 whitespace-nowrap">
                GEA Directives
              </span>
            </div>
          </div>

          <ArchitectureArrow direction="down" length={28} label="Sets entropy per persona" />

          {/* Persona row */}
          <div className="flex items-start justify-center gap-8 flex-wrap">
            <ArchitectureNode
              icon={<UserCircle size={28} />}
              label="executive_sponsor"
              sublabel="Dump & Go"
              color={COLORS.orange}
            />
            <ArchitectureNode
              icon={<UserCircle size={28} />}
              label="solo_procurement_hero"
              sublabel="Mixed"
              color={COLORS.orange}
            />
            <ArchitectureNode
              icon={<UserCircle size={28} />}
              label="tactical_category_mgr"
              sublabel="Over-detailed"
              color={COLORS.orange}
            />
          </div>

          <ArchitectureArrow direction="down" length={32} label="Feed personas" />

          {/* AI Generator */}
          <ArchitectureNode
            icon={<Bot size={28} />}
            label="AI Data Generator"
            sublabel="Gemini 3.1"
            color={COLORS.orange}
          />

          <ArchitectureArrow direction="down" length={32} label="Mixed Payload (JSON + Raw Text)" />

          {/* test_prompts table */}
          <ArchitectureNode
            icon={<Database size={28} />}
            label="test_prompts"
            sublabel="DB Table"
            color={COLORS.gray}
          />
        </div>
      </ArchitectureContainer>

      <ArchitectureArrow direction="down" length={36} />

      {/* ── Phase 2 + GEA Side Panel row ── */}
      <div className="flex items-start gap-6 w-full max-w-4xl">
        {/* Phase 2: Execution Pipeline */}
        <ArchitectureContainer
          title="Phase 2: Execution Pipeline"
          titleColor={COLORS.blue}
          variant="dashed"
          className="flex-1"
        >
          <div className="flex flex-col items-center gap-4">
            <ArchitectureNode
              icon={<Play size={28} />}
              label="Test Runner"
              sublabel="Fetches prompts"
              color={COLORS.blue}
            />

            <ArchitectureArrow direction="down" length={32} />

            <div className="relative">
              <ArchitectureNode
                icon={<Shield size={28} />}
                label="sentinel-analysis"
                sublabel="Edge Function"
                color={COLORS.blue}
              />
              <div className="absolute -top-2 -right-2 flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5">
                <RefreshCw size={10} className="text-red-500" />
                <span className="text-[8px] font-semibold text-red-600 whitespace-nowrap">
                  Retry 503 / Fallback
                </span>
              </div>
            </div>

            <div className="flex items-start justify-center gap-12 flex-wrap">
              <div className="flex flex-col items-center gap-2">
                <ArchitectureArrow direction="down" length={32} label="Extracted JSON" />
                <ArchitectureNode
                  icon={<Database size={28} />}
                  label="test_reports"
                  sublabel="DB Table"
                  color={COLORS.gray}
                />
              </div>
              <div className="flex flex-col items-center gap-2">
                <ArchitectureArrow direction="down" length={32} label="Traces" dashed color={COLORS.purple} />
                <ArchitectureNode
                  icon={<Eye size={28} />}
                  label="LangSmith"
                  sublabel="Observability"
                  color={COLORS.purple}
                />
              </div>
            </div>
          </div>
        </ArchitectureContainer>

        {/* GEA Module Side Panel */}
        <ArchitectureContainer
          title="Shared Experience Pool (GEA)"
          titleColor={COLORS.purple}
          variant="dashed"
          className="w-64"
        >
          <div className="flex flex-col items-center gap-3">
            <ArchitectureNode
              icon={<Layers size={28} />}
              label="Experience Pool"
              sublabel="Aggregates patterns"
              color={COLORS.purple}
            />
            <div className="text-[10px] text-center text-muted-foreground leading-snug px-2">
              Collects success/failure patterns across all test runs to generate evolutionary directives.
            </div>
            <div className="flex flex-col gap-1.5 w-full px-2">
              <div className="flex items-center gap-1.5 text-[10px]">
                <CheckCircle size={10} className="text-green-500 shrink-0" />
                <span className="text-muted-foreground">Solved cases tracked</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <AlertTriangle size={10} className="text-amber-500 shrink-0" />
                <span className="text-muted-foreground">Top failure patterns</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <Sparkles size={10} className="text-purple-500 shrink-0" />
                <span className="text-muted-foreground">Inference accuracy trend</span>
              </div>
            </div>
          </div>
        </ArchitectureContainer>
      </div>

      {/* Bi-directional labels */}
      <div className="flex items-center gap-4 text-[9px] text-purple-600 font-medium">
        <span>← Feeds patterns to GEA</span>
        <span>|</span>
        <span>Directives from GEA →</span>
      </div>

      <ArchitectureArrow direction="down" length={36} />

      {/* ── Phase 3: LLM Auditor ── */}
      <ArchitectureContainer
        title="Phase 3: LLM Auditor"
        titleColor={COLORS.purple}
        variant="dashed"
        className="w-full max-w-3xl"
      >
        <div className="flex flex-col items-center gap-4">
          {/* Triangulation inputs */}
          <div className="flex items-center gap-4 text-xs text-gray-500 font-medium flex-wrap justify-center">
            <span className="bg-orange-50 border border-orange-200 px-2.5 py-1 rounded text-orange-700">
              User Input (A)
            </span>
            <span className="bg-blue-50 border border-blue-200 px-2.5 py-1 rounded text-blue-700">
              Hidden Server Context (B)
            </span>
            <span className="bg-purple-50 border border-purple-200 px-2.5 py-1 rounded text-purple-700">
              AI Output (C)
            </span>
          </div>

          <ArchitectureArrow direction="down" length={24} label="Compare 3 sources" />

          <ArchitectureNode
            icon={<GitMerge size={28} />}
            label="Triangulation Engine"
            sublabel="Cross-validates A × B × C"
            color={COLORS.purple}
          />

          <ArchitectureArrow direction="down" length={24} />

          <ArchitectureNode
            icon={<Scale size={28} />}
            label="AI Judge"
            sublabel="Deep Reasoning"
            color={COLORS.purple}
          />

          <ArchitectureArrow direction="down" length={28} label="Evaluation Splits" />

          {/* 4 outcome boxes */}
          <div className="flex items-stretch justify-center gap-4 flex-wrap">
            <div className="border-l-4 border-green-500 bg-green-50 rounded-lg px-4 py-3 w-44">
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle size={14} className="text-green-600" />
                <span className="text-xs font-bold text-green-700">REDUNDANT_HIDE</span>
              </div>
              <p className="text-[10px] text-green-600 leading-snug">
                AI deduces perfectly from context B. Hide UI field.
              </p>
            </div>

            <div className="border-l-4 border-amber-500 bg-amber-50 rounded-lg px-4 py-3 w-44">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle size={14} className="text-amber-600" />
                <span className="text-xs font-bold text-amber-700">OPTIONAL_KEEP</span>
              </div>
              <p className="text-[10px] text-amber-600 leading-snug">
                Mixed accuracy. Keep UI field optional.
              </p>
            </div>

            <div className="border-l-4 border-red-500 bg-red-50 rounded-lg px-4 py-3 w-44">
              <div className="flex items-center gap-1.5 mb-1">
                <XCircle size={14} className="text-red-600" />
                <span className="text-xs font-bold text-red-700">CRITICAL_REQUIRE</span>
              </div>
              <p className="text-[10px] text-red-600 leading-snug">
                AI hallucinates. Force UI field required.
              </p>
            </div>

            <div className="border-l-4 border-blue-500 bg-blue-50 rounded-lg px-4 py-3 w-44">
              <div className="flex items-center gap-1.5 mb-1">
                <PlusCircle size={14} className="text-blue-600" />
                <span className="text-xs font-bold text-blue-700">SCHEMA_GAP</span>
              </div>
              <p className="text-[10px] text-blue-600 leading-snug">
                Persona asks for data not in schema. Recommend new field.
              </p>
            </div>
          </div>
        </div>
      </ArchitectureContainer>

      {/* ── Evolutionary Feedback Loop ── */}
      <div className="relative w-full max-w-3xl flex justify-center">
        <ArchitectureArrow direction="down" length={36} />
        {/* Dashed evolutionary loop label */}
        <div className="absolute -right-4 top-0 flex flex-col items-center gap-1">
          <div className="w-px h-8 border-l-2 border-dashed border-orange-400" />
          <div className="bg-orange-50 border border-orange-300 rounded-full px-3 py-1">
            <span className="text-[9px] font-bold text-orange-700 whitespace-nowrap flex items-center gap-1">
              <RefreshCw size={10} />
              Evolutionary Loop
            </span>
          </div>
          <div className="text-[8px] text-orange-600 text-center max-w-[120px]">
            Directives for Next Generation → Phase 1
          </div>
          <div className="w-px h-8 border-l-2 border-dashed border-orange-400" />
        </div>
      </div>

      {/* ── Final Action ── */}
      <ArchitectureNode
        icon={<Wrench size={28} />}
        label="Schema & UI Refactoring Backlog"
        sublabel="Update GenericScenarioWizard OR Supabase DB Schema"
        color={COLORS.green}
      />

      {/* ── Legend ── */}
      <div className="flex flex-wrap items-center justify-center gap-6 mt-8 pt-4 border-t border-gray-200 w-full max-w-3xl">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.blue }} />
          <span className="text-xs text-gray-600">Production Systems</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.orange }} />
          <span className="text-xs text-gray-600">Simulated Data</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.purple }} />
          <span className="text-xs text-gray-600">GEA / Evaluation</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 rounded border-2 border-dashed border-orange-400" />
          <span className="text-xs text-gray-600">Evolutionary Loop</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 rounded border-2 border-dashed border-red-400" />
          <span className="text-xs text-gray-600">Fail / Retry</span>
        </div>
      </div>
    </div>
  );
};

export default TestingPipelineDiagram;
