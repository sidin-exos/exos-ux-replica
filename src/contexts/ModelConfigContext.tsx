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
// One-shot migration flag: when gemini-3.1-pro-preview was promoted to default
// (Nebius fallback now absorbs the Ghost 429 risk that originally caused the ban),
// we sweep every existing user off gemini-2.5-pro onto the new default exactly once.
// After this flag is set, users can freely re-pick gemini-2.5-pro in Settings without
// it being migrated back on every load.
const MIGRATION_31PRO_KEY = "exos_model_migration_31pro";

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
      // One-shot 3.1-pro promotion: flip any stored 2.5-pro to the new default.
      if (needs31ProMigration && model === "gemini-2.5-pro") {
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
