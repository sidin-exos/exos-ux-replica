import { supabase } from '@/integrations/supabase/client';

export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatResponse {
  content: string;
  action?: { type: 'NAVIGATE'; payload: string };
}

export async function getAIResponse(
  messages: ChatMessage[],
  currentPath: string
): Promise<ChatResponse> {
  const { data, error } = await supabase.functions.invoke('chat-copilot', {
    body: { messages, currentPath },
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
