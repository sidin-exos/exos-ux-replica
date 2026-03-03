/**
 * Scenario Chat Assistant — Frontend Service
 * 
 * Invokes the scenario-chat-assistant edge function.
 * JWT is passed automatically by the Supabase client.
 */

import { supabase } from "@/integrations/supabase/client";

export interface ScenarioChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ScenarioFieldMeta {
  id: string;
  label: string;
  description: string;
  required: boolean;
  type: string;
  placeholder?: string;
}

export interface ScenarioChatResponse {
  content: string;
  extractedFields?: Record<string, string>;
}

export async function getScenarioChatResponse(
  messages: ScenarioChatMessage[],
  scenarioId: string,
  scenarioFields: ScenarioFieldMeta[],
  dataRequirements: string,
  extractedSoFar: Record<string, string>
): Promise<ScenarioChatResponse> {
  const { data, error } = await supabase.functions.invoke(
    "scenario-chat-assistant",
    {
      body: {
        messages,
        scenarioId,
        scenarioFields: scenarioFields.map((f) => ({
          id: f.id,
          label: f.label,
          description: f.description,
          required: f.required,
          type: f.type,
          placeholder: f.placeholder,
        })),
        dataRequirements,
        extractedSoFar,
      },
    }
  );

  if (error) {
    throw new Error(error.message || "Failed to get chat response");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return {
    content: data.content ?? "I'm sorry, I couldn't generate a response. Please try again.",
    extractedFields: data.extractedFields,
  };
}
