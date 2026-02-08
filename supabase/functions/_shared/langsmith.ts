/**
 * Lightweight LangSmith REST client for Deno Edge Functions.
 * VERBOSE LOGGING enabled for debugging trace delivery.
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

    console.log("[LangSmith] Config:", {
      project: this.project,
      endpoint: this.endpoint,
      hasKey: !!this.apiKey,
      tracingEnabled,
      enabled: this.enabled,
      baseTags: this.baseTags,
    });
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
    if (!this.enabled) {
      console.log("[LangSmith] createRun SKIPPED (disabled), id:", id);
      return id;
    }

    console.log("[LangSmith] createRun:", { id, name, runType, parentRunId: opts?.parentRunId });

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
    if (!this.enabled) {
      console.log("[LangSmith] patchRun SKIPPED (disabled)");
      return;
    }

    console.log("[LangSmith] patchRun:", { runId, hasOutputs: !!outputs, hasError: !!error });

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
      if (res.ok) {
        console.log("[LangSmith] POST /runs SUCCESS:", res.status);
      } else {
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
      if (res.ok) {
        console.log(`[LangSmith] PATCH /runs/${runId} SUCCESS:`, res.status);
      } else {
        const text = await res.text();
        console.error(`[LangSmith] PATCH /runs/${runId} ERROR:`, res.status, text);
      }
    } catch (err) {
      console.error(`[LangSmith] PATCH /runs/${runId} NETWORK ERROR:`, err);
    }
  }
}
