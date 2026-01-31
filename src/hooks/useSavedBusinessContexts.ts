import { useState, useEffect, useCallback } from "react";

export interface SavedBusinessContext {
  id: string;
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "exos_saved_business_contexts";

function generateId(): string {
  return `ctx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function loadFromStorage(): SavedBusinessContext[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to load saved contexts:", error);
  }
  return [];
}

function saveToStorage(contexts: SavedBusinessContext[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contexts));
  } catch (error) {
    console.error("Failed to save contexts:", error);
  }
}

export function useSavedBusinessContexts() {
  const [contexts, setContexts] = useState<SavedBusinessContext[]>([]);

  // Load on mount
  useEffect(() => {
    setContexts(loadFromStorage());
  }, []);

  const saveContext = useCallback((name: string, content: string): SavedBusinessContext => {
    const now = new Date().toISOString();
    const newContext: SavedBusinessContext = {
      id: generateId(),
      name: name.trim() || `Context ${contexts.length + 1}`,
      content,
      createdAt: now,
      updatedAt: now,
    };

    const updated = [...contexts, newContext];
    setContexts(updated);
    saveToStorage(updated);
    return newContext;
  }, [contexts]);

  const updateContext = useCallback((id: string, updates: Partial<Pick<SavedBusinessContext, "name" | "content">>): void => {
    const updated = contexts.map((ctx) =>
      ctx.id === id
        ? { ...ctx, ...updates, updatedAt: new Date().toISOString() }
        : ctx
    );
    setContexts(updated);
    saveToStorage(updated);
  }, [contexts]);

  const deleteContext = useCallback((id: string): void => {
    const updated = contexts.filter((ctx) => ctx.id !== id);
    setContexts(updated);
    saveToStorage(updated);
  }, [contexts]);

  const getContext = useCallback((id: string): SavedBusinessContext | undefined => {
    return contexts.find((ctx) => ctx.id === id);
  }, [contexts]);

  return {
    contexts,
    saveContext,
    updateContext,
    deleteContext,
    getContext,
  };
}
