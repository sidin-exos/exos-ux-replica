import { useEffect, useCallback, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ── Types ────────────────────────────────────────────────────
export type DraftBlocks = Record<string, string>;

interface UseScenarioDraftOptions {
  scenarioId: string;
  userId: string | null;
  enabled?: boolean;
}

interface UseScenarioDraftReturn {
  saveDraft: (blocks: DraftBlocks) => void;
  clearDraft: () => Promise<void>;
  loadDraft: () => Promise<DraftBlocks | null>;
  isSaving: boolean;
  lastSaved: Date | null;
  hasDraft: boolean;
}

// ── localStorage helpers ─────────────────────────────────────
const getLocalKey = (scenarioId: string, userId: string | null) =>
  `exos_draft_${scenarioId}_${userId ?? 'anon'}`;

const saveToLocal = (key: string, blocks: DraftBlocks) => {
  try {
    localStorage.setItem(key, JSON.stringify({
      blocks,
      savedAt: new Date().toISOString(),
    }));
  } catch {
    console.warn('[EXOS Draft] localStorage write failed');
  }
};

const loadFromLocal = (key: string): DraftBlocks | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.blocks ?? null;
  } catch {
    return null;
  }
};

const clearFromLocal = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // fail silently
  }
};

// ── Hook ─────────────────────────────────────────────────────
export function useScenarioDraft({
  scenarioId,
  userId,
  enabled = true,
}: UseScenarioDraftOptions): UseScenarioDraftReturn {
  const localKey = getLocalKey(scenarioId, userId);
  const pendingBlocksRef = useRef<DraftBlocks | null>(null);
  const serverSaveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasDraft, setHasDraft] = useState(() =>
    enabled ? localStorage.getItem(localKey) !== null : false
  );

  // ── saveDraft ─────────────────────────────────────────────
  const saveDraft = useCallback((blocks: DraftBlocks) => {
    if (!enabled) return;

    // Layer 1 — immediate localStorage write
    saveToLocal(localKey, blocks);
    setHasDraft(true);

    // Stage for debounced server save
    pendingBlocksRef.current = blocks;

    // Layer 2 — debounced Supabase upsert
    if (!userId) return;

    clearTimeout(serverSaveTimeoutRef.current);
    serverSaveTimeoutRef.current = setTimeout(async () => {
      const staged = pendingBlocksRef.current;
      if (!staged) return;
      setIsSaving(true);

      try {
        const row = {
              user_id: userId,
              scenario_id: scenarioId,
              blocks: JSON.parse(JSON.stringify(staged)),
            };
        const { error } = await supabase
          .from('scenario_drafts')
          .upsert([row], { onConflict: 'user_id,scenario_id' });

        if (!error) {
          setLastSaved(new Date());
          pendingBlocksRef.current = null;
        } else {
          console.warn('[EXOS Draft] Supabase save failed:', error.message);
        }
      } catch (err) {
        console.warn('[EXOS Draft] Supabase save error:', err);
      } finally {
        setIsSaving(false);
      }
    }, 3000);
  }, [enabled, localKey, userId, scenarioId]);

  // ── loadDraft ─────────────────────────────────────────────
  const loadDraft = useCallback(async (): Promise<DraftBlocks | null> => {
    if (!enabled) return null;

    const local = loadFromLocal(localKey);
    if (local) {
      setHasDraft(true);
      return local;
    }

    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('scenario_drafts')
        .select('blocks')
        .eq('user_id', userId)
        .eq('scenario_id', scenarioId)
        .maybeSingle();

      if (error || !data) return null;
      setHasDraft(true);
      return data.blocks as unknown as DraftBlocks;
    } catch {
      return null;
    }
  }, [enabled, localKey, userId, scenarioId]);

  // ── clearDraft ────────────────────────────────────────────
  const clearDraft = useCallback(async () => {
    clearTimeout(serverSaveTimeoutRef.current);
    clearFromLocal(localKey);
    pendingBlocksRef.current = null;
    setHasDraft(false);
    setLastSaved(null);

    if (!userId) return;

    try {
      await supabase
        .from('scenario_drafts')
        .delete()
        .eq('user_id', userId)
        .eq('scenario_id', scenarioId);
    } catch {
      console.warn('[EXOS Draft] Draft delete failed');
    }
  }, [localKey, userId, scenarioId]);

  // ── Cleanup on unmount ────────────────────────────────────
  useEffect(() => {
    return () => {
      clearTimeout(serverSaveTimeoutRef.current);
    };
  }, []);

  return {
    saveDraft,
    clearDraft,
    loadDraft,
    isSaving,
    lastSaved,
    hasDraft,
  };
}
