import { supabase } from '@/integrations/supabase/client';
import { scenarios, filterVisibleScenarios } from '@/lib/scenarios';

export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatResponse {
  content: string;
  action?: { type: 'NAVIGATE'; payload: string };
}

// Build a lightweight scenario catalog for the edge function
const scenarioCatalog = scenarios
  .filter((s) => s.status === 'available')
  .map(({ id, title, description }) => ({ id, title, description }));

export async function getAIResponse(
  messages: ChatMessage[],
  currentPath: string
): Promise<ChatResponse> {
  const { data, error } = await supabase.functions.invoke('chat-copilot', {
    body: { messages, currentPath, scenarios: scenarioCatalog },
  });

  if (error) {
    console.error('chat-copilot error:', error);
    return {
      content: "I'm having trouble connecting right now. Please try again in a moment.",
    };
  }

  return {
    content: data.content || 'Empty response from server.',
    action: data.action,
  };
}
