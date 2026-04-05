import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn('text-foreground', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mt-6 mb-4 text-foreground font-display">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold mt-6 mb-4 text-foreground font-display">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-bold mt-5 mb-3 text-foreground font-display">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="mb-4 leading-relaxed">{children}</p>
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
            <div className="overflow-x-auto my-6">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead>{children}</thead>,
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => <tr className="border-b border-border">{children}</tr>,
          th: ({ children }) => (
            <th className="bg-muted/50 border border-border p-3 text-left font-semibold text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border p-3">{children}</td>
          ),
          hr: () => <hr className="my-6 border-border" />,
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
