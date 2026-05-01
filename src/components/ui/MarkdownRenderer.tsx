import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Detect content that is actually a raw JSON envelope or fenced JSON block
// rather than human-readable markdown. This guards against AI fallback paths
// that occasionally leak structured payloads (including internal metadata
// such as shadow_log) into the user-facing output.
function looksLikeRawJsonPayload(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) return false;
  if (/```\s*json/i.test(trimmed)) return true;
  if (/"shadow_log"\s*:/i.test(trimmed)) return true;
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try { JSON.parse(trimmed); return true; } catch { return false; }
  }
  return false;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  if (looksLikeRawJsonPayload(content)) {
    return (
      <div className={cn('text-foreground', className)}>
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 text-sm">
          <p className="font-semibold text-warning mb-1">Analysis output unavailable</p>
          <p className="text-muted-foreground">
            The model returned a structured payload without a readable summary.
            Please retry the analysis to regenerate a complete report.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('text-foreground', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl md:text-3xl font-bold mt-8 mb-4 text-foreground font-display tracking-tight">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl md:text-3xl font-bold mt-10 mb-4 text-foreground font-display tracking-tight flex items-center gap-3 before:content-[''] before:w-1.5 before:h-7 before:bg-gradient-to-b before:from-primary before:to-accent before:rounded-full">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-2xl md:text-3xl font-bold mt-10 mb-4 text-foreground font-display tracking-tight flex items-center gap-3 before:content-[''] before:w-1.5 before:h-7 before:bg-gradient-to-b before:from-primary before:to-accent before:rounded-full">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="mb-4 leading-relaxed text-foreground/90">{children}</p>
          ),
          strong: ({ children }) => {
            const text = String(children).toLowerCase().trim();
            // Colorful direction indicators
            if (text === "deteriorating" || text === "declining" || text === "worsening") {
              return (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-destructive/10 text-destructive text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                  {children}
                </span>
              );
            }
            if (text === "improving" || text === "growing" || text === "positive") {
              return (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-success/10 text-success text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                  {children}
                </span>
              );
            }
            if (text === "stable" || text === "neutral" || text === "unchanged") {
              return (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-accent/15 text-accent text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  {children}
                </span>
              );
            }
            if (text === "critical" || text === "high risk" || text === "severe") {
              return (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-destructive/10 text-destructive text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                  {children}
                </span>
              );
            }
            if (text === "moderate" || text === "medium" || text === "watch") {
              return (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-warning/10 text-warning text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                  {children}
                </span>
              );
            }
            if (text === "low" || text === "minimal" || text === "low risk") {
              return (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-success/10 text-success text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                  {children}
                </span>
              );
            }
            return <strong className="font-semibold text-foreground">{children}</strong>;
          },
          ul: ({ children }) => (
            <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          table: ({ children }) => (
            <div className="my-6 overflow-x-auto rounded-lg border border-border/60 bg-card/40 border-l-2 border-l-primary/40">
              <table className="w-full border-collapse text-[13px]">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b border-border/80 bg-primary/[0.04]">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="[&>tr:nth-child(even)]:bg-muted/20">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="border-b border-border/40 last:border-0 transition-colors hover:bg-muted/30">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2.5 text-left font-semibold text-[11px] uppercase tracking-[0.08em] text-primary/80">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2.5 align-top text-foreground/90 leading-relaxed">{children}</td>
          ),
          hr: () => <hr className="my-8 border-border/50" />,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/30 pl-4 my-4 italic text-muted-foreground">
              {children}
            </blockquote>
          ),
          code: ({ children, className: codeClassName }) => {
            const isInline = !codeClassName;
            return isInline ? (
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
            ) : (
              <pre className="bg-muted rounded-lg p-4 overflow-x-auto my-4">
                <code className="text-sm font-mono">{children}</code>
              </pre>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
