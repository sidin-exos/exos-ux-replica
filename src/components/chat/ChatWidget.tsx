import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Send, Bot, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useIsMobile } from '@/hooks/use-mobile';
import { useExosChat } from '@/hooks/use-exos-chat';
import { ChatMessage } from './ChatMessage';

const SUGGESTIONS = [
  { label: '🧭 How to use EXOS?', text: 'How to use EXOS?' },
  { label: '💰 Reduce costs', text: 'How can I reduce procurement costs?' },
  { label: '🔍 Evaluate suppliers', text: 'I need to evaluate my suppliers' },
  { label: '📋 Review a contract', text: 'I need help reviewing a contract' },
];

export function ChatWidget() {
  const { messages, isOpen, isTyping, sendMessage, toggleChat, closeChat } = useExosChat();
  const isMobile = useIsMobile();
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isNearBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);

  const scrollToBottom = useCallback(() => {
    if (isNearBottom()) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isNearBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, isTyping, scrollToBottom]);

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isTyping) return;
    setInputValue('');
    if (!isOpen) toggleChat();
    sendMessage(trimmed);
  };

  const handleSuggestion = (text: string) => {
    if (!isOpen) toggleChat();
    setTimeout(() => sendMessage(text), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Inline trigger bar — always-visible input
  if (!isOpen) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="mb-8 glass-effect rounded-xl border border-border/50 p-4"
      >
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTIONS.map((s) => (
            <Button
              key={s.text}
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => handleSuggestion(s.text)}
            >
              {s.label}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 flex-1 relative">
            <Sparkles className="w-4 h-4 text-primary absolute left-3 pointer-events-none" />
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your procurement challenge..."
              className="flex-1 h-10 text-sm pl-9"
            />
          </div>
          <Button
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={handleSend}
            disabled={!inputValue.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    );
  }

  // Open chat panel
  const windowClasses = isMobile
    ? 'fixed inset-0 z-50 flex flex-col'
    : 'mb-8 w-full h-[420px] flex flex-col rounded-2xl';

  return (
    <AnimatePresence>
      <motion.div
        key="chat-window"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: isMobile ? '100dvh' : 420 }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.25 }}
        className={`${windowClasses} glass-effect border border-border/50 overflow-hidden`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <span className="font-display font-semibold text-sm">EXOS Guide</span>
            <span className="text-xs text-muted-foreground">— helps you choose the right scenario</span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={closeChat}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4">
          <div className="py-4 space-y-4">
            {messages.length === 0 && !isTyping && (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-2xl rounded-bl-md px-3.5 py-2.5 text-sm leading-relaxed text-foreground">
                  Hi! 👋 Tell me about your procurement challenge and I'll recommend the best scenario for you.
                </div>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <Button
                      key={s.text}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => sendMessage(s.text)}
                    >
                      {s.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isLatest={i === messages.length - 1}
                allMessages={messages}
              />
            ))}

            {isTyping && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex gap-1 px-3.5 py-2.5 bg-muted/50 rounded-2xl rounded-bl-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-pulse [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-pulse [animation-delay:300ms]" />
                </div>
              </div>
            )}

            <div ref={scrollRef} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border/50" style={{ paddingBottom: isMobile ? `max(0.75rem, env(safe-area-inset-bottom))` : undefined }}>
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your procurement challenge..."
              className="flex-1 h-9 text-sm"
              disabled={isTyping}
            />
            <Button
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={handleSend}
              disabled={isTyping || !inputValue.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
