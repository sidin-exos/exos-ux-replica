/**
 * Browser-compatible LangSmith REST Client
 * 
 * Uses native fetch() with exponential backoff retry logic.
 * Enterprise-grade resilience with strict TypeScript typing.
 * No external dependencies - avoids AsyncLocalStorage issues.
 */

// ============================================================================
// Configuration
// ============================================================================

// Client-side tracing is DISABLED for security.
// LangSmith API keys must only be used server-side (edge functions).
// Server-side tracing is handled in supabase/functions/_shared/langsmith.ts
const TRACING_ENABLED = false;
const API_KEY = "";
const PROJECT = "default";
const ENDPOINT = "";

// ============================================================================
// Type Definitions
// ============================================================================

/** LangSmith API run types */
type RunType = "chain" | "llm" | "tool" | "retriever" | "embedding" | "parser";

/** Payload for POST /runs */
interface CreateRunPayload {
  id: string;
  name: string;
  run_type: RunType;
  inputs: Record<string, unknown>;
  start_time: string;
  session_name: string;
  parent_run_id?: string;
  tags?: string[];
  extra?: {
    metadata?: Record<string, unknown>;
  };
}

/** Payload for PATCH /runs/{id} */
interface UpdateRunPayload {
  outputs?: Record<string, unknown>;
  error?: string;
  end_time: string;
}

/** Retry configuration */
interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  backoffFactor: number;
}

/** Public options for creating a run */
export interface CreateRunOptions {
  name: string;
  run_type: RunType;
  inputs: Record<string, unknown>;
  parent_run_id?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

/** Public options for patching a run */
export interface PatchRunOptions {
  outputs?: Record<string, unknown>;
  error?: string;
  end_time?: string;
}

// ============================================================================
// Retry Configuration & Utilities
// ============================================================================

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 100,
  backoffFactor: 2,
};

/**
 * Promise-based sleep using native setTimeout
 */
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Check if HTTP status code is retryable
 * Retries on 429 (rate limit) and 5xx (server errors)
 */
const isRetryableStatus = (status: number): boolean =>
  status === 429 || (status >= 500 && status < 600);

/**
 * Fetch with exponential backoff retry logic
 * 
 * @param url - Request URL
 * @param options - Fetch options
 * @param config - Retry configuration
 * @returns Response object
 * @throws Error if all retries exhausted
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.ok) {
        return response;
      }

      if (!isRetryableStatus(response.status)) {
        // Non-retryable client error (4xx except 429)
        return response;
      }

      // Retryable error - calculate delay and wait
      if (attempt < config.maxRetries - 1) {
        const delay = config.baseDelayMs * Math.pow(config.backoffFactor, attempt);
        // Retry after HTTP error
        await sleep(delay);
      }
    } catch (err) {
      // Network error
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt < config.maxRetries - 1) {
        const delay = config.baseDelayMs * Math.pow(config.backoffFactor, attempt);
        // Retry after network error
        await sleep(delay);
      }
    }
  }

  // All retries exhausted
  throw lastError ?? new Error("LangSmith: All retries exhausted");
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Check if LangSmith tracing is enabled
 */
export function isTracingEnabled(): boolean {
  return TRACING_ENABLED && !!API_KEY;
}

/**
 * Get the configured project name
 */
export function getProjectName(): string {
  return PROJECT;
}

/**
 * Log the current tracing configuration (for debugging)
 */
export function logTracingConfig(): void {
  // No-op in production — config visible via LangSmith dashboard
}

/**
 * Create a new run (span) in LangSmith
 * 
 * Fire-and-forget with retry logic - never blocks the pipeline.
 * 
 * @param options - Run configuration
 * @returns The generated run ID (returned immediately, before network call completes)
 */
export async function createRun(options: CreateRunOptions): Promise<string> {
  if (!isTracingEnabled()) {
    return "";
  }

  const runId = crypto.randomUUID();
  const startTime = new Date().toISOString();

  const payload: CreateRunPayload = {
    id: runId,
    name: options.name,
    run_type: options.run_type,
    inputs: options.inputs,
    start_time: startTime,
    session_name: PROJECT,
    parent_run_id: options.parent_run_id,
    tags: options.tags,
    extra: options.metadata ? { metadata: options.metadata } : undefined,
  };

  // Fire-and-forget with retry logic - never blocks pipeline
  fetchWithRetry(`${ENDPOINT}/runs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify(payload),
  }).catch(() => {
    // Silently ignore — tracing is non-critical
  });

  return runId;
}

/**
 * Complete a run with outputs or error
 * 
 * Fire-and-forget with retry logic - never blocks the pipeline.
 * 
 * @param runId - The run ID to patch
 * @param options - Outputs and/or error information
 */
export async function patchRun(runId: string, options: PatchRunOptions): Promise<void> {
  if (!isTracingEnabled() || !runId) {
    return;
  }

  const payload: UpdateRunPayload = {
    outputs: options.outputs,
    error: options.error,
    end_time: options.end_time || new Date().toISOString(),
  };

  // Fire-and-forget with retry logic - never blocks pipeline
  fetchWithRetry(`${ENDPOINT}/runs/${runId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify(payload),
  }).catch(() => {
    // Silently ignore — tracing is non-critical
  });
}
