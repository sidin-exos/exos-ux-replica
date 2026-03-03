/**
 * Scenario Chat Assistant — React Hook
 * 
 * Manages conversation state, extracted fields, and loading state.
 * Client-side session only — no DB persistence.
 */

import { useState, useCallback } from "react";
import {
  getScenarioChatResponse,
  type ScenarioChatMessage,
  type ScenarioFieldMeta,
} from "@/lib/scenario-chat-service";

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

  const sendMessage = useCallback(
    async (content: string) => {
      const userMessage: ScenarioChatMessage = { role: "user", content };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setIsTyping(true);

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

        if (response.extractedFields) {
          setExtractedFields((prev) => ({
            ...prev,
            ...response.extractedFields,
          }));
        }
      } catch (error) {
        const errorMessage: ScenarioChatMessage = {
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Something went wrong. Please try again.",
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
      }
    },
    [messages, scenarioId, scenarioFields, dataRequirements, extractedFields]
  );

  const applyToForm = useCallback(() => {
    return { ...extractedFields };
  }, [extractedFields]);

  const resetSession = useCallback(() => {
    setMessages([]);
    setExtractedFields({});
    setIsTyping(false);
  }, []);

  return {
    messages,
    extractedFields,
    isTyping,
    sendMessage,
    applyToForm,
    resetSession,
  };
}
