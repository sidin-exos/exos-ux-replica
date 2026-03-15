import { useState } from "react";
import { CheckCircle2, Circle, ExternalLink, BookOpen, Cpu, Network, Layers, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type Skill = {
  id: string;
  name: string;
  displayName: string;
  description: string;
  details: string;
  category: string;
  tags: string[];
  installCmd: string;
  docsUrl: string;
};

const SKILLS: Skill[] = [
  // Getting Started
  {
    id: "framework-selection",
    name: "framework-selection",
    displayName: "Framework Selection",
    description: "Compare LangChain, LangGraph, and Deep Agents to pick the right framework for your project.",
    details:
      "Provides a side-by-side comparative analysis of LangChain, LangGraph, and Deep Agents. Helps you understand trade-offs around complexity, state management, and human-in-the-loop needs so you can make an informed decision without reading through multiple docs sites.",
    category: "Getting Started",
    tags: ["comparison", "architecture"],
    installCmd: "npx skills add framework-selection",
    docsUrl: "https://github.com/langchain-ai/langchain-skills",
  },
  {
    id: "langchain-dependencies",
    name: "langchain-dependencies",
    displayName: "LangChain Dependencies",
    description: "Comprehensive reference for package versions and dependency management (Python & TypeScript).",
    details:
      "Covers the full dependency graph for LangChain, LangGraph, and related packages across both Python and TypeScript ecosystems. Includes version pinning recommendations and common compatibility pitfalls.",
    category: "Getting Started",
    tags: ["dependencies", "packages", "python", "typescript"],
    installCmd: "npx skills add langchain-dependencies",
    docsUrl: "https://github.com/langchain-ai/langchain-skills",
  },
  // Deep Agents
  {
    id: "deep-agents-core",
    name: "deep-agents-core",
    displayName: "Deep Agents Core",
    description: "Agent architecture, harness setup, and SKILL.md format for building Deep Agent applications.",
    details:
      "Covers the foundational architecture patterns for Deep Agents: how to structure your agent harness, define the SKILL.md specification, and wire up tools and middleware. The essential starting point for any Deep Agents project.",
    category: "Deep Agents",
    tags: ["architecture", "harness", "skill-format"],
    installCmd: "npx skills add deep-agents-core",
    docsUrl: "https://github.com/langchain-ai/langchain-skills",
  },
  {
    id: "deep-agents-memory",
    name: "deep-agents-memory",
    displayName: "Deep Agents Memory",
    description: "Memory, persistence, and filesystem middleware patterns for Deep Agents.",
    details:
      "Explains how to implement short-term and long-term memory within a Deep Agent, including filesystem-backed persistence and middleware patterns that allow agents to recall context across sessions.",
    category: "Deep Agents",
    tags: ["memory", "persistence", "middleware"],
    installCmd: "npx skills add deep-agents-memory",
    docsUrl: "https://github.com/langchain-ai/langchain-skills",
  },
  {
    id: "deep-agents-orchestration",
    name: "deep-agents-orchestration",
    displayName: "Deep Agents Orchestration",
    description: "Subagents, task planning, and human-in-the-loop coordination for complex workflows.",
    details:
      "Covers orchestrating multiple subagents, dynamic task planning, and integrating human-in-the-loop approval steps into a Deep Agents workflow. Ideal for multi-step, multi-agent pipelines.",
    category: "Deep Agents",
    tags: ["orchestration", "subagents", "human-in-the-loop"],
    installCmd: "npx skills add deep-agents-orchestration",
    docsUrl: "https://github.com/langchain-ai/langchain-skills",
  },
  // LangChain
  {
    id: "langchain-fundamentals",
    name: "langchain-fundamentals",
    displayName: "LangChain Fundamentals",
    description: "Agent creation, tool integration, structured outputs, and middleware basics with LangChain.",
    details:
      "Teaches you how to create agents using create_agent, integrate custom and built-in tools, format structured outputs, and wire up basic middleware. The foundational skill for LangChain development.",
    category: "LangChain",
    tags: ["agents", "tools", "structured-output"],
    installCmd: "npx skills add langchain-fundamentals",
    docsUrl: "https://github.com/langchain-ai/langchain-skills",
  },
  {
    id: "langchain-middleware",
    name: "langchain-middleware",
    displayName: "LangChain Middleware",
    description: "Human-in-the-loop approval, custom middleware, and Command resume patterns.",
    details:
      "Deep dive into advanced middleware patterns: implementing human-in-the-loop approval gates, writing custom middleware, and using Command resume patterns to pause and resume agent execution.",
    category: "LangChain",
    tags: ["middleware", "human-in-the-loop", "resume"],
    installCmd: "npx skills add langchain-middleware",
    docsUrl: "https://github.com/langchain-ai/langchain-skills",
  },
  {
    id: "langchain-rag",
    name: "langchain-rag",
    displayName: "LangChain RAG",
    description: "Retrieval-Augmented Generation with document loaders, embeddings, and vector stores.",
    details:
      "Implements a full RAG pipeline: loading documents, generating embeddings, storing them in a vector database, and retrieving relevant context to augment LLM responses. Supports multiple vector store backends.",
    category: "LangChain",
    tags: ["rag", "embeddings", "vector-store", "documents"],
    installCmd: "npx skills add langchain-rag",
    docsUrl: "https://github.com/langchain-ai/langchain-skills",
  },
  // LangGraph
  {
    id: "langgraph-fundamentals",
    name: "langgraph-fundamentals",
    displayName: "LangGraph Fundamentals",
    description: "StateGraph architecture, node/edge design, and state reducer patterns.",
    details:
      "Introduces the core LangGraph primitives: StateGraph, nodes, edges, and state reducers. Learn how to model complex agent workflows as directed graphs with explicit state transitions.",
    category: "LangGraph",
    tags: ["stategraph", "nodes", "edges", "reducers"],
    installCmd: "npx skills add langgraph-fundamentals",
    docsUrl: "https://github.com/langchain-ai/langchain-skills",
  },
  {
    id: "langgraph-persistence",
    name: "langgraph-persistence",
    displayName: "LangGraph Persistence",
    description: "Checkpointing, thread management, and cross-thread memory for stateful graphs.",
    details:
      "Covers LangGraph's persistence layer: how to checkpoint graph state, manage multiple execution threads, and share memory across threads. Essential for building production-grade stateful agents.",
    category: "LangGraph",
    tags: ["checkpointing", "threads", "persistence"],
    installCmd: "npx skills add langgraph-persistence",
    docsUrl: "https://github.com/langchain-ai/langchain-skills",
  },
  {
    id: "langgraph-human-in-the-loop",
    name: "langgraph-human-in-the-loop",
    displayName: "LangGraph Human-in-the-Loop",
    description: "Interrupts, human review steps, and approval workflows in LangGraph.",
    details:
      "Shows how to add interrupt points to a LangGraph, route execution to human reviewers, and resume the graph after approval. Enables safe, auditable agentic workflows that require human oversight.",
    category: "LangGraph",
    tags: ["interrupts", "human-review", "approval"],
    installCmd: "npx skills add langgraph-human-in-the-loop",
    docsUrl: "https://github.com/langchain-ai/langchain-skills",
  },
];

const CATEGORIES = ["All", "Getting Started", "Deep Agents", "LangChain", "LangGraph"] as const;

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "Getting Started": BookOpen,
  "Deep Agents": Cpu,
  LangChain: Layers,
  LangGraph: Network,
};

const CATEGORY_COLORS: Record<string, string> = {
  "Getting Started": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "Deep Agents": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  LangChain: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  LangGraph: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className="ml-2 p-1 rounded hover:bg-white/20 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-300" /> : <Copy className="h-3.5 w-3.5 text-slate-300" />}
    </button>
  );
}

function SkillCard({ skill, installed, onToggle }: { skill: Skill; installed: boolean; onToggle: () => void }) {
  const [open, setOpen] = useState(false);
  const Icon = CATEGORY_ICONS[skill.category] ?? BookOpen;

  return (
    <Card className="flex flex-col transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`p-1.5 rounded-md ${CATEGORY_COLORS[skill.category]}`}>
              <Icon className="h-4 w-4 flex-shrink-0" />
            </div>
            <CardTitle className="text-base leading-snug">{skill.displayName}</CardTitle>
          </div>
          <button
            onClick={onToggle}
            title={installed ? "Mark as not installed" : "Mark as installed"}
            className="flex-shrink-0 mt-0.5"
          >
            {installed ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600 hover:text-slate-400 transition-colors" />
            )}
          </button>
        </div>
        <Badge variant="outline" className={`w-fit text-xs mt-1 ${CATEGORY_COLORS[skill.category]} border-0`}>
          {skill.category}
        </Badge>
        <CardDescription className="text-sm mt-1">{skill.description}</CardDescription>
      </CardHeader>

      <CardContent className="pt-0 mt-auto space-y-3">
        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {skill.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Install command */}
        <div className="flex items-center justify-between rounded-md bg-slate-900 dark:bg-slate-950 px-3 py-2 text-xs font-mono text-slate-200">
          <span className="truncate">{skill.installCmd}</span>
          <CopyButton text={skill.installCmd} />
        </div>

        {/* Details collapsible */}
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between text-xs h-7 px-2">
              Learn more
              {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{skill.details}</p>
            <a
              href={skill.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2"
            >
              View on GitHub <ExternalLink className="h-3 w-3" />
            </a>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

export default function LangChainSkills() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [installed, setInstalled] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setInstalled((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const filtered = activeCategory === "All" ? SKILLS : SKILLS.filter((s) => s.category === activeCategory);

  const installedCount = installed.size;
  const totalCount = SKILLS.length;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-4 text-sm px-3 py-1">
            langchain-ai/langchain-skills
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight mb-3">LangChain Skills</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse and track agent skills for LangChain, LangGraph, and Deep Agents — no terminal required. Click the
            circle icon on any card to mark it as installed.
          </p>

          {/* Progress */}
          <div className="mt-6 inline-flex items-center gap-3 rounded-full border px-5 py-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>
              <span className="font-semibold">{installedCount}</span> of{" "}
              <span className="font-semibold">{totalCount}</span> skills tracked
            </span>
            <div className="w-24 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${(installedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Category tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-8">
          <TabsList className="flex-wrap h-auto gap-1 justify-center bg-muted/50">
            {CATEGORIES.map((cat) => {
              const Icon = cat !== "All" ? (CATEGORY_ICONS[cat] ?? BookOpen) : null;
              const count = cat === "All" ? SKILLS.length : SKILLS.filter((s) => s.category === cat).length;
              return (
                <TabsTrigger key={cat} value={cat} className="flex items-center gap-1.5 text-sm">
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  {cat}
                  <span className="text-xs text-muted-foreground ml-0.5">({count})</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {CATEGORIES.map((cat) => (
            <TabsContent key={cat} value={cat} className="mt-6">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {(cat === "All" ? SKILLS : SKILLS.filter((s) => s.category === cat)).map((skill) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    installed={installed.has(skill.id)}
                    onToggle={() => toggle(skill.id)}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Skills are installed via Claude Code's plugin system or{" "}
          <code className="bg-muted px-1 py-0.5 rounded">npx skills</code>. Copy the command from any card above and
          paste it into Claude Code's chat — no terminal needed.
        </p>
      </main>
    </div>
  );
}
