/**
 * Scenario Chat Assistant — React Hook
 * 
 * Manages conversation state, extracted fields, loading state, and session logging.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  getScenarioChatResponse,
  type ScenarioChatMessage,
  type ScenarioFieldMeta,
} from "@/lib/scenario-chat-service";
import { supabase } from "@/integrations/supabase/client";

interface UseScenarioChatAssistantOptions {
  scenarioId: string;
  scenarioFields: ScenarioFieldMeta[];
  dataRequirements: string;
}

export function useScenarioChatAssistant({
  scenarioId,
  scenarioFields,
  dataRequirements,
}: UseScenarioChatAssistantOptions) {
  const [messages, setMessages] = useState<ScenarioChatMessage[]>([]);
  const [extractedFields, setExtractedFields] = useState<Record<string, string>>({});
  const [isTyping, setIsTyping] = useState(false);

  // Session tracking
  const sessionIdRef = useRef<string | null>(null);
  const sessionStartRef = useRef<Date | null>(null);
  const messageCountRef = useRef(0);
  const fieldsExtractedRef = useRef(0);
  const errorCountRef = useRef(0);

  const ensureSession = useCallback(async () => {
    if (sessionIdRef.current) return sessionIdRef.current;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await (supabase.from as any)('chatbot_sessions').insert({
        user_id: user.id,
        bot_type: 'scenario_assistant',
        scenario_id: scenarioId,
        message_count: 0,
        fields_extracted: 0,
        error_count: 0,
      }).select('id').single();
      if (error || !data) { console.error('Session create error:', error); return null; }
      sessionIdRef.current = data.id;
      sessionStartRef.current = new Date();
      return data.id;
    } catch { return null; }
  }, [scenarioId]);

  const updateSession = useCallback(async (fields: Record<string, unknown>) => {
    const sid = sessionIdRef.current;
    if (!sid) return;
    try {
      await (supabase.from as any)('chatbot_sessions').update(fields).eq('id', sid);
    } catch { /* best-effort */ }
  }, []);

  const endSession = useCallback(() => {
    if (!sessionIdRef.current || !sessionStartRef.current) return;
    const duration = Math.round((Date.now() - sessionStartRef.current.getTime()) / 1000);
    updateSession({ ended_at: new Date().toISOString(), duration_seconds: duration });
    sessionIdRef.current = null;
    sessionStartRef.current = null;
    messageCountRef.current = 0;
    fieldsExtractedRef.current = 0;
    errorCountRef.current = 0;
  }, [updateSession]);

  useEffect(() => () => { endSession(); }, [endSession]);

  const sendMessage = useCallback(
    async (content: string) => {
      const userMessage: ScenarioChatMessage = { role: "user", content };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setIsTyping(true);

      await ensureSession();
      messageCountRef.current++;

      try {
        const response = await getScenarioChatResponse(
          updatedMessages,
          scenarioId,
          scenarioFields,
          dataRequirements,
          extractedFields
        );

        const assistantMessage: ScenarioChatMessage = {
          role: "assistant",
          content: response.content,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        messageCountRef.current++;

        if (response.extractedFields) {
          const newFieldCount = Object.keys(response.extractedFields).length;
          setExtractedFields((prev) => {
            const merged = { ...prev, ...response.extractedFields };
            fieldsExtractedRef.current = Object.keys(merged).length;
            return merged;
          });
        }

        updateSession({
          message_count: messageCountRef.current,
          fields_extracted: fieldsExtractedRef.current,
        });
      } catch (error) {
        const errorMessage: ScenarioChatMessage = {
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Something went wrong. Please try again.",
        };
        setMessages((prev) => [...prev, errorMessage]);
        errorCountRef.current++;
        updateSession({
          message_count: messageCountRef.current,
          error_count: errorCountRef.current,
        });
      } finally {
        setIsTyping(false);
      }
    },
    [messages, scenarioId, scenarioFields, dataRequirements, extractedFields, ensureSession, updateSession]
  );

  const applyToForm = useCallback(() => {
    updateSession({ fields_applied: true });
    return { ...extractedFields };
  }, [extractedFields, updateSession]);

  const resetSession = useCallback(() => {
    endSession();
    setMessages([]);
    setExtractedFields({});
    setIsTyping(false);
  }, [endSession]);

  return {
    messages,
    extractedFields,
    isTyping,
    sendMessage,
    applyToForm,
    resetSession,
  };
}
