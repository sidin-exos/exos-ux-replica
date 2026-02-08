/**
 * Production-ready LangSmith REST client for Deno Edge Functions.
 * Fire-and-forget tracing — only errors are logged.
 */

interface CreateRunOptions {
  parentRunId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export class LangSmithTracer {
  private apiKey: string | undefined;
  private project: string;
  private endpoint: string;
  private baseTags: string[];
  private baseMetadata: Record<string, unknown>;
  private enabled: boolean;

  constructor(opts?: { env?: string; feature?: string }) {
    this.apiKey = Deno.env.get("VITE_LANGCHAIN_API_KEY");
    this.project = Deno.env.get("VITE_LANGCHAIN_PROJECT") || "EXOS";
    this.endpoint = Deno.env.get("VITE_LANGCHAIN_ENDPOINT") || "https://api.smith.langchain.com";
    const tracingEnabled = Deno.env.get("VITE_LANGCHAIN_TRACING_V2");

    this.enabled = !!(this.apiKey && tracingEnabled === "true");

    const env = opts?.env || "production";
    const feature = opts?.feature || "unknown";
    this.baseTags = [`env:${env}`, `feature:${feature}`];
    this.baseMetadata = { env, feature };
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  createRun(
    name: string,
    runType: "chain" | "llm" | "tool",
    inputs: Record<string, unknown>,
    opts?: CreateRunOptions
  ): string {
    const id = crypto.randomUUID();
    if (!this.enabled) return id;

    const body = {
      id,
      name,
      run_type: runType,
      inputs,
      start_time: new Date().toISOString(),
      session_name: this.project,
      tags: [...this.baseTags, ...(opts?.tags || [])],
      extra: {
        metadata: { ...this.baseMetadata, ...(opts?.metadata || {}) },
      },
      ...(opts?.parentRunId ? { parent_run_id: opts.parentRunId } : {}),
    };

    this.postRun(body).catch(() => {/* already logged inside */});

    return id;
  }

  patchRun(
    runId: string,
    outputs?: Record<string, unknown>,
    error?: string
  ): void {
    if (!this.enabled) return;

    const body: Record<string, unknown> = {
      end_time: new Date().toISOString(),
    };
    if (outputs) body.outputs = outputs;
    if (error) body.error = error;

    this.patchRunRequest(runId, body).catch(() => {/* already logged inside */});
  }

  // --- private helpers ---

  private async postRun(body: Record<string, unknown>): Promise<void> {
    try {
      const res = await fetch(`${this.endpoint}/runs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey!,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error("[LangSmith] POST /runs ERROR:", res.status, text);
      }
    } catch (err) {
      console.error("[LangSmith] POST /runs NETWORK ERROR:", err);
    }
  }

  private async patchRunRequest(
    runId: string,
    body: Record<string, unknown>
  ): Promise<void> {
    try {
      const res = await fetch(`${this.endpoint}/runs/${runId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey!,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error(`[LangSmith] PATCH /runs/${runId} ERROR:`, res.status, text);
      }
    } catch (err) {
      console.error(`[LangSmith] PATCH /runs/${runId} NETWORK ERROR:`, err);
    }
  }
}
