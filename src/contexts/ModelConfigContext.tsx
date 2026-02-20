import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface ModelConfig {
  provider: "lovable" | "google_ai_studio";
  model: string;
  lastTested: string | null;
}

interface ModelConfigContextType extends ModelConfig {
  setProvider: (provider: ModelConfig["provider"]) => void;
  setModel: (model: string) => void;
  markTested: () => void;
}

const STORAGE_KEY = "exos_model_config";

const DEFAULT_CONFIG: ModelConfig = {
  provider: "lovable",
  model: "google/gemini-3-flash-preview",
  lastTested: null,
};

const ModelConfigContext = createContext<ModelConfigContextType | null>(null);

function loadConfig(): ModelConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        provider: parsed.provider || DEFAULT_CONFIG.provider,
        model: parsed.model || DEFAULT_CONFIG.model,
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

  const setProvider = (provider: ModelConfig["provider"]) => {
    setConfig((prev) => ({ ...prev, provider }));
  };

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
        setProvider,
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
