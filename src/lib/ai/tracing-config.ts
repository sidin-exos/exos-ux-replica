/**
 * LangSmith Tracing Configuration
 * 
 * Centralized module for managing LangSmith tracing settings.
 * Reads configuration from Vite environment variables.
 */

// Read config from Vite env vars
const TRACING_ENABLED = import.meta.env.VITE_LANGCHAIN_TRACING_V2 === "true";
const API_KEY = import.meta.env.VITE_LANGCHAIN_API_KEY || "";
const PROJECT = import.meta.env.VITE_LANGCHAIN_PROJECT || "default";
const ENDPOINT = import.meta.env.VITE_LANGCHAIN_ENDPOINT || "https://api.smith.langchain.com";

/**
 * Check if LangSmith tracing is enabled and configured
 */
export function isTracingEnabled(): boolean {
  return TRACING_ENABLED && !!API_KEY;
}

/**
 * Get the LangSmith project name for trace spans
 */
export function getProjectName(): string {
  return PROJECT;
}

/**
 * Get the LangSmith API endpoint
 */
export function getEndpoint(): string {
  return ENDPOINT;
}

/**
 * Log the current tracing configuration (for debugging)
 */
export function logTracingConfig(): void {
  console.log("🔍 LangSmith Tracing Config:", {
    enabled: TRACING_ENABLED,
    project: PROJECT,
    endpoint: ENDPOINT,
    hasApiKey: !!API_KEY,
  });
}

// Log on module load for debugging (only if tracing is enabled)
if (TRACING_ENABLED) {
  logTracingConfig();
}
