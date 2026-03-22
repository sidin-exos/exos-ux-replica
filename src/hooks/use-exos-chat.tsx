import { useState, useCallback, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getAIResponse, type ChatRole } from '@/lib/chat-service';
import { supabase } from '@/integrations/supabase/client';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function useExosChat() {
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Session tracking
  const sessionIdRef = useRef<string | null>(null);
  const sessionStartRef = useRef<Date | null>(null);
  const messageCountRef = useRef(0);
  const errorCountRef = useRef(0);

  // Create session on first message
  const ensureSession = useCallback(async () => {
    if (sessionIdRef.current) return sessionIdRef.current;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await (supabase.from as any)('chatbot_sessions').insert({
        user_id: user.id,
        bot_type: 'guide',
        message_count: 0,
        error_count: 0,
      }).select('id').single();
      if (error || !data) { console.error('Session create error:', error); return null; }
      sessionIdRef.current = data.id;
      sessionStartRef.current = new Date();
      return data.id;
    } catch { return null; }
  }, []);

  // Update session metrics
  const updateSession = useCallback(async (fields: Record<string, unknown>) => {
    const sid = sessionIdRef.current;
    if (!sid) return;
    try {
      await (supabase.from as any)('chatbot_sessions').update(fields).eq('id', sid);
    } catch { /* best-effort */ }
  }, []);

  // End session on close/unmount
  const endSession = useCallback(() => {
    if (!sessionIdRef.current || !sessionStartRef.current) return;
    const duration = Math.round((Date.now() - sessionStartRef.current.getTime()) / 1000);
    updateSession({ ended_at: new Date().toISOString(), duration_seconds: duration });
    sessionIdRef.current = null;
    sessionStartRef.current = null;
    messageCountRef.current = 0;
    errorCountRef.current = 0;
  }, [updateSession]);

  // End session on unmount
  useEffect(() => () => { endSession(); }, [endSession]);

  const sendMessage = useCallback(async (content: string) => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    await ensureSession();
    messageCountRef.current++;

    try {
      const payload = [...messages, userMsg]
        .slice(-10)
        .map(({ role, content }) => ({ role: role as ChatRole, content }));

      const response = await getAIResponse(payload, location.pathname);

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      messageCountRef.current++;

      const updateFields: Record<string, unknown> = { message_count: messageCountRef.current };

      if (response.action?.type === 'NAVIGATE') {
        const path = response.action.payload;
        updateFields.navigation_action = path;
        toast.info(`Go to ${path.replace('/', '').replace(/-/g, ' ')}?`, {
          action: { label: 'Go', onClick: () => navigate(path) },
          duration: 6000,
        });
      }

      updateSession(updateFields);
    } catch (err) {
      console.error('Chat send error:', err);
      toast.error('Failed to send message');
      errorCountRef.current++;
      updateSession({ message_count: messageCountRef.current, error_count: errorCountRef.current });
    } finally {
      setIsTyping(false);
    }
  }, [messages, location.pathname, navigate, ensureSession, updateSession]);

  const toggleChat = useCallback(() => setIsOpen((v) => !v), []);
  const closeChat = useCallback(() => {
    setIsOpen(false);
    endSession();
  }, [endSession]);

  return { messages, isOpen, isTyping, sendMessage, toggleChat, closeChat };
}
