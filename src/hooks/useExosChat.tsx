import { useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getAIResponse, type ChatRole } from '@/lib/chat-service';

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

  const sendMessage = useCallback(async (content: string) => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      // Sanitize & Slice: strip id/timestamp, keep only { role, content }, last 10
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

      if (response.action?.type === 'NAVIGATE') {
        const path = response.action.payload;
        toast.info(`Go to ${path.replace('/', '').replace(/-/g, ' ')}?`, {
          action: { label: 'Go', onClick: () => navigate(path) },
          duration: 6000,
        });
      }
    } catch (err) {
      console.error('Chat send error:', err);
      toast.error('Failed to send message');
    } finally {
      setIsTyping(false);
    }
  }, [messages, location.pathname, navigate]);

  const toggleChat = useCallback(() => setIsOpen((v) => !v), []);
  const closeChat = useCallback(() => setIsOpen(false), []);

  return { messages, isOpen, isTyping, sendMessage, toggleChat, closeChat };
}
