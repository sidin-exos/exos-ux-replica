/**
 * Lightweight Sentry client for Deno Edge Functions.
 * Fire-and-forget error reporting — mirrors the LangSmithTracer pattern.
 */

interface SentryContext {
  userId?: string;
  email?: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}

interface ParsedDsn {
  publicKey: string;
  host: string;
  projectId: string;
}

export class SentryReporter {
  private dsn: string | undefined;
  private functionName: string;
  private enabled: boolean;
  private parsed: ParsedDsn | null;
  private environment: string;

  constructor(functionName: string) {
    this.dsn = Deno.env.get("SENTRY_DSN");
    this.functionName = functionName;
    this.environment = Deno.env.get("SENTRY_ENVIRONMENT") || "production";
    this.parsed = this.dsn ? this.parseDsn(this.dsn) : null;
    this.enabled = !!this.parsed;
  }

  captureException(error: unknown, context?: SentryContext): void {
    if (!this.enabled || !this.parsed) return;

    const err = error instanceof Error ? error : new Error(String(error));

    const payload = {
      event_id: crypto.randomUUID().replace(/-/g, ""),
      timestamp: Date.now() / 1000,
      platform: "javascript" as const,
      level: "error" as const,
      server_name: `edge-${this.functionName}`,
      environment: this.environment,
      tags: {
        function: this.functionName,
        runtime: "deno",
        ...(context?.tags || {}),
      },
      extra: context?.extra || {},
      ...(context?.userId
        ? { user: { id: context.userId, email: context.email } }
        : {}),
      exception: {
        values: [
          {
            type: err.name || "Error",
            value: err.message,
            ...(err.stack ? { stacktrace: this.parseStack(err.stack) } : {}),
          },
        ],
      },
    };

    this.sendEvent(payload).catch((e) => {
      console.error("[Sentry] Failed to send event:", e);
    });
  }

  // --- private helpers ---

  private async sendEvent(payload: Record<string, unknown>): Promise<void> {
    const { host, projectId, publicKey } = this.parsed!;
    const url = `https://${host}/api/${projectId}/store/`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${publicKey}, sentry_client=exos-edge/1.0`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("[Sentry] Store API error:", res.status, text);
      }
    } catch (err) {
      console.error("[Sentry] Network error:", err);
    }
  }

  private parseDsn(dsn: string): ParsedDsn | null {
    try {
      // DSN format: https://<key>@<host>/<project_id>
      const url = new URL(dsn);
      const publicKey = url.username;
      const host = url.host;
      const projectId = url.pathname.replace("/", "");
      if (!publicKey || !projectId) return null;
      return { publicKey, host, projectId };
    } catch {
      console.error("[Sentry] Invalid DSN:", dsn);
      return null;
    }
  }

  private parseStack(
    stack: string
  ): { frames: Array<{ filename: string; function: string; lineno?: number; colno?: number }> } {
    const lines = stack.split("\n").slice(1); // skip the Error message line
    const frames = lines
      .map((line) => {
        const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
        if (match) {
          return {
            function: match[1],
            filename: match[2],
            lineno: parseInt(match[3], 10),
            colno: parseInt(match[4], 10),
          };
        }
        const simpleMatch = line.match(/at\s+(.+?):(\d+):(\d+)/);
        if (simpleMatch) {
          return {
            function: "<anonymous>",
            filename: simpleMatch[1],
            lineno: parseInt(simpleMatch[2], 10),
            colno: parseInt(simpleMatch[3], 10),
          };
        }
        return null;
      })
      .filter(Boolean)
      .reverse() as Array<{ filename: string; function: string; lineno?: number; colno?: number }>;

    return { frames };
  }
}
