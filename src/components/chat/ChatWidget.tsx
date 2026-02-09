import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, X, Minus, Send, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { useExosChat } from '@/hooks/use-exos-chat';
import { ChatMessage } from './ChatMessage';

const SUGGESTIONS = [
  { label: '🚀 Создать заявку', text: 'Создать заявку' },
  { label: '🔍 Найти поставщиков', text: 'Найти поставщиков' },
  { label: '❓ Как это работает?', text: 'Как это работает?' },
];

export function ChatWidget() {
  const { messages, isOpen, isTyping, sendMessage, toggleChat, closeChat } = useExosChat();
  const isMobile = useIsMobile();
  const [inputValue, setInputValue] = useState('');
  const [showTooltip, setShowTooltip] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-hide tooltip after 5s
  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => setShowTooltip(false), 5000);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages.length, isTyping, scrollToBottom]);

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isTyping) return;
    setInputValue('');
    sendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Closed state — FAB
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="bg-card text-card-foreground text-xs px-3 py-1.5 rounded-lg shadow-md border border-border/50 whitespace-nowrap"
            >
              Нужна помощь?
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          onHoverStart={() => setShowTooltip(true)}
        >
          <Button
            onClick={toggleChat}
            variant="hero"
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg"
          >
            <Sparkles className="h-6 w-6" />
          </Button>
        </motion.div>
      </div>
    );
  }

  // Open state
  const windowClasses = isMobile
    ? 'fixed inset-0 z-50 flex flex-col'
    : 'fixed bottom-6 right-6 z-50 w-[380px] h-[520px] flex flex-col rounded-2xl shadow-xl';

  return (
    <AnimatePresence>
      <motion.div
        key="chat-window"
        initial={{ opacity: 0, scale: 0.9, originX: 1, originY: 1 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className={`${windowClasses} backdrop-blur-md bg-background/80 border border-border/50 overflow-hidden`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <span className="font-display font-semibold text-sm">EXOS Assistant</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={closeChat}>
              <Minus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={closeChat}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <ScrollArea className="flex-1 px-4">
          <div className="py-4 space-y-4">
            {messages.length === 0 && !isTyping && (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-2xl rounded-bl-md px-3.5 py-2.5 text-sm leading-relaxed text-foreground">
                  Привет! 👋 Я помогу разобраться с закупками. Что будем делать?
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
                onTextReveal={scrollToBottom}
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
        </ScrollArea>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border/50" style={{ paddingBottom: `max(0.75rem, env(safe-area-inset-bottom))` }}>
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Напишите сообщение..."
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
