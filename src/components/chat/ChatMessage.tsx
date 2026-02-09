import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';
import type { Message } from '@/hooks/use-exos-chat';

const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
});

interface ChatMessageProps {
  message: Message;
  isLatest: boolean;
  onTextReveal?: () => void;
}

export function ChatMessage({ message, isLatest, onTextReveal }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const shouldAnimate = !isUser && isLatest;
  const [displayedText, setDisplayedText] = useState(shouldAnimate ? '' : message.content);

  useEffect(() => {
    if (!shouldAnimate) {
      setDisplayedText(message.content);
      return;
    }

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayedText(message.content.slice(0, i));
      onTextReveal?.();
      if (i >= message.content.length) clearInterval(interval);
    }, 20);

    return () => clearInterval(interval);
  }, [message.content, shouldAnimate, onTextReveal]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-1">
          <Bot className="w-3.5 h-3.5 text-primary" />
        </div>
      )}
      <div className={`max-w-[80%] space-y-1`}>
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-muted/50 text-foreground rounded-bl-md'
          }`}
        >
          {displayedText}
        </div>
        <p className={`text-[10px] text-muted-foreground ${isUser ? 'text-right' : 'text-left'}`}>
          {timeFormatter.format(message.timestamp)}
        </p>
      </div>
    </motion.div>
  );
}
