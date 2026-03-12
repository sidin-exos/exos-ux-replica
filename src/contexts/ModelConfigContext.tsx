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

const VALID_MODELS = [
  "gemini-3.1-pro-preview", "gemini-3-flash-preview", "gemini-3-pro-preview",
  "gemini-3.1-flash-lite-preview", "gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite",
];

const DEFAULT_CONFIG: ModelConfig = {
  model: "gemini-3.1-pro-preview",
  lastTested: null,
};

const ModelConfigContext = createContext<ModelConfigContextType | null>(null);

function loadConfig(): ModelConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      let model = parsed.model || DEFAULT_CONFIG.model;
      // Auto-migrate old prefixed model names (e.g. "google/gemini-3-flash-preview")
      model = model.replace(/^google\//, "");
      // Auto-migrate old default: flash → 3.1 pro
      if (model === "gemini-3-flash-preview") {
        model = DEFAULT_CONFIG.model;
      }
      const isValid = VALID_MODELS.includes(model);
      return {
        model: isValid ? model : DEFAULT_CONFIG.model,
        lastTested: parsed.lastTested || null,
      };
    }
  } catch (e) {
    console.warn("[ModelConfig] Failed to load from localStorage:", e);
  }
  return DEFAULT_CONFIG;
}

function saveConfig(config: ModelConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn("[ModelConfig] Failed to save to localStorage:", e);
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
