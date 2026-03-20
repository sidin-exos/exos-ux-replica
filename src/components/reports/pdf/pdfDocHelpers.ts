// ── Parameter summarization ──

export function summarizeParameter(value: string, maxWords = 30): string {
  const words = value.trim().split(/\s+/);
  if (words.length <= maxWords) return value.trim();

  const fragments = value.split(/[.•\n]+/).map(s => s.trim()).filter(Boolean);

  const scored = fragments.map(f => {
    let score = 0;
    if (/[\d€$£¥%]/.test(f)) score += 3;
    if (/[A-Z]{2,}/.test(f)) score += 2;
    if (/±|mm|kg|g\b|alloy|CNC|SOC|GDPR|ISO|SaaS|B2B/.test(f)) score += 2;
    score += (f.match(/[A-Z][a-z]+/g) || []).length;
    return { text: f, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const result: string[] = [];
  let wordCount = 0;
  for (const { text } of scored) {
    const tw = text.split(/\s+/).length;
    if (wordCount + tw > maxWords && result.length > 0) break;
    result.push(text);
    wordCount += tw;
  }

  return result.join(", ");
}

// ── Markdown cleaning ──

export const cleanMarkdown = (text: string): string => {
  return text
    .replace(/\*\*\*/g, "")
    .replace(/\*\*/g, "")
    .replace(/^\s*\*\s+/gm, "")
    .replace(/^#{1,4}\s*/gm, "")
    .trim();
};

// ── Executive summary extraction ──

export const extractExecutiveSummary = (text: string): { findings: string[]; recommendations: string[] } => {
  const lines = text.split("\n").map(cleanMarkdown).filter((l) => l.length > 15);

  const findingPattern = /(\$|€|%|found|indicates?|presents?|analysis|current(ly)?|total|average|estimated|reveals?|shows?)/i;
  const recommendPattern = /\b(target|aim to|recommend|should|negotiate|consider|implement|prioritize|pursue|establish|ensure|leverage|explore)\b/i;

  const findings: string[] = [];
  const recommendations: string[] = [];

  for (const line of lines) {
    if (recommendations.length < 3 && recommendPattern.test(line)) {
      recommendations.push(line);
    } else if (findings.length < 3 && findingPattern.test(line)) {
      findings.push(line);
    }
    if (findings.length >= 3 && recommendations.length >= 3) break;
  }

  if (findings.length === 0 || recommendations.length === 0) {
    const pool = lines.slice(0, 6);
    const mid = Math.ceil(pool.length / 2);
    if (findings.length === 0) findings.push(...pool.slice(0, mid).slice(0, 3));
    if (recommendations.length === 0) recommendations.push(...pool.slice(mid).slice(0, 3));
  }

  return { findings, recommendations };
};

// ── Date formatting ──

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// ── Section categorization ──

export type SectionType = "findings" | "recommendations" | "risks" | "nextSteps" | "costDrivers" | "general";

export interface AnalysisSection {
  type: SectionType;
  title: string;
  lines: string[];
}

const sectionPatterns: Record<Exclude<SectionType, "general">, RegExp> = {
  costDrivers: /\b(cost\s*driver|key\s*cost|cost\s*factor|cost\s*breakdown|cost\s*component|cost\s*structure)\b/i,
  findings: /\b(finding|analysis|overview|assessment|current\s*state|summary|market|evaluation)\b/i,
  recommendations: /\b(recommend|action|strateg|approach|should|suggest|advise|optimi[sz])\b/i,
  risks: /\b(risk|challeng|threat|concern|limitation|vulnerabilit|caveat|warning)\b/i,
  nextSteps: /\b(next\s*step|implement|timeline|roadmap|action\s*plan|phase|mileston|rollout)\b/i,
};

export const categorizeAnalysisSections = (lines: string[]): AnalysisSection[] => {
  const sections: AnalysisSection[] = [];
  let current: AnalysisSection = { type: "general", title: "Analysis Overview", lines: [] };

  for (const rawLine of lines) {
    const hashMatch = rawLine.match(/^(#{1,4})\s*(.*)$/);
    const cleanLine = cleanMarkdown(rawLine);
    if (!cleanLine) continue;

    const isHeader =
      !!hashMatch ||
      (cleanLine.endsWith(":") && cleanLine.length < 80) ||
      (cleanLine.length < 60 && /^[A-Z]/.test(cleanLine) && !cleanLine.includes("."));

    if (isHeader) {
      if (current.lines.length > 0) {
        sections.push(current);
      }

      let detectedType: SectionType = "general";
      for (const [type, pattern] of Object.entries(sectionPatterns) as [Exclude<SectionType, "general">, RegExp][]) {
        if (pattern.test(cleanLine)) {
          detectedType = type;
          break;
        }
      }

      current = { type: detectedType, title: cleanLine.replace(/:$/, ""), lines: [] };
    } else {
      current.lines.push(cleanLine);
    }
  }

  if (current.lines.length > 0) {
    sections.push(current);
  }

  return sections;
};

export const hasMetricHighlight = (text: string): boolean => {
  return /(\$|€|£)\s*[\d,.]+|[\d,.]+\s*%|\b(aim\s+to|target)\b/i.test(text);
};

// ── Report hash for traceability ──

export const generateReportHash = (title: string, ts: string): string => {
  let hash = 0;
  const str = `${title}-${ts}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36).toUpperCase().slice(0, 8);
};

// ── TOC entries ──

export interface TocEntry {
  label: string;
  anchor: string;
  page: number;
}

export const buildTocEntries = (hasDashboards: boolean, hasParams: boolean, dashboardCount: number): TocEntry[] => {
  const entries: TocEntry[] = [];
  const dashboardPages = hasDashboards ? Math.ceil(dashboardCount / 2) : 0;
  const detailedAnalysisPage = 2 + dashboardPages;

  if (hasDashboards) entries.push({ label: "Analysis Visualizations", anchor: "section-visualizations", page: 2 });
  entries.push({ label: "Detailed Analysis", anchor: "section-detailed-analysis", page: detailedAnalysisPage });
  entries.push({ label: "Methodology & Limitations", anchor: "section-methodology", page: detailedAnalysisPage });
  if (hasParams) entries.push({ label: "Analysis Parameters", anchor: "section-parameters", page: detailedAnalysisPage });
  return entries;
};
