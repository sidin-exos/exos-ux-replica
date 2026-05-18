import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface ModelConfig {
  model: string;
  lastTested: string | null;
}

interface ModelConfigContextType extends ModelConfig {
  setModel: (model: string) => void;
  markTested: () => void;
}

const STORAGE_KEY = "exos_model_config";
const MIGRATION_31PRO_KEY = "exos_model_31pro_migrated";
// Always normalise legacy gemini-2.5-pro selections back to the current default
// (gemini-3.1-pro-preview). Users can still pick 2.5-pro explicitly via the
// Settings UI by setting this opt-in flag — once set, no further rebasing.
const EXPLICIT_25PRO_OPT_IN_KEY = "exos_model_25pro_opt_in";

const VALID_MODELS = [
  "gemini-3.1-pro-preview",
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite-preview", "gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite",
];

const DEFAULT_CONFIG: ModelConfig = {
  model: "gemini-3.1-pro-preview",
  lastTested: null,
};

const ModelConfigContext = createContext<ModelConfigContextType | null>(null);

function has25ProOptIn(): boolean {
  try { return !!localStorage.getItem(EXPLICIT_25PRO_OPT_IN_KEY); } catch { return false; }
}

function loadConfig(): ModelConfig {
  let needs31ProMigration = false;
  try {
    needs31ProMigration = !localStorage.getItem(MIGRATION_31PRO_KEY);
  } catch (_) {
    // localStorage unavailable; skip migration logic
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      let model = parsed.model || DEFAULT_CONFIG.model;
      // Auto-migrate old prefixed model names (e.g. "google/gemini-3-flash-preview")
      model = model.replace(/^google\//, "");
      // Auto-migrate the deprecated 3.0-pro preview (shut down 2026-03-09)
      if (model === "gemini-3-pro-preview") {
        model = DEFAULT_CONFIG.model;
      }
      // Continuous guardrail: rebase 2.5-pro → 3.1-pro on every load unless the
      // user has explicitly opted in via Settings (sets EXPLICIT_25PRO_OPT_IN_KEY).
      if (model === "gemini-2.5-pro" && !has25ProOptIn()) {
        model = DEFAULT_CONFIG.model;
      }
      const isValid = VALID_MODELS.includes(model);
      const finalConfig = {
        model: isValid ? model : DEFAULT_CONFIG.model,
        lastTested: parsed.lastTested || null,
      };
      if (needs31ProMigration) {
        try { localStorage.setItem(MIGRATION_31PRO_KEY, "1"); } catch (_) { /* ignore */ }
      }
      return finalConfig;
    }
  } catch (e) {
    // silently fall back to defaults
  }
  if (needs31ProMigration) {
    try { localStorage.setItem(MIGRATION_31PRO_KEY, "1"); } catch (_) { /* ignore */ }
  }
  return DEFAULT_CONFIG;
}

function saveConfig(config: ModelConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    // silently ignore storage errors
  }
}

export function ModelConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ModelConfig>(loadConfig);

  // Persist to localStorage on every change
  useEffect(() => {
    saveConfig(config);
  }, [config]);

  const setModel = (model: string) => {
    // If the user explicitly opts in to 2.5-pro, record it so the load-time
    // guardrail stops rebasing them. Any other selection clears the opt-in.
    try {
      if (model === "gemini-2.5-pro") {
        localStorage.setItem(EXPLICIT_25PRO_OPT_IN_KEY, "1");
      } else {
        localStorage.removeItem(EXPLICIT_25PRO_OPT_IN_KEY);
      }
    } catch (_) { /* ignore */ }
    setConfig((prev) => ({ ...prev, model }));
  };

  const markTested = () => {
    setConfig((prev) => ({ ...prev, lastTested: new Date().toISOString() }));
  };

  return (
    <ModelConfigContext.Provider
      value={{
        ...config,
        setModel,
        markTested,
      }}
    >
      {children}
    </ModelConfigContext.Provider>
  );
}

export function useModelConfig(): ModelConfigContextType {
  const context = useContext(ModelConfigContext);
  if (!context) {
    throw new Error("useModelConfig must be used within a ModelConfigProvider");
  }
  return context;
}
