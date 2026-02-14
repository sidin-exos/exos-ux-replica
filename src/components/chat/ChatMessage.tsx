import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bot, ThumbsUp, ThumbsDown, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Message } from '@/hooks/use-exos-chat';

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
});

interface ChatMessageProps {
  message: Message;
  isLatest: boolean;
  allMessages?: Message[];
  onTextReveal?: () => void;
}

/** Minimal markdown: **bold**, - lists, \n\n paragraphs */
function renderMarkdown(text: string) {
  const parts: React.ReactNode[] = [];
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // List item
    if (/^[-•]\s/.test(line)) {
      parts.push(
        <div key={i} className="flex gap-1.5 ml-1">
          <span className="text-muted-foreground">•</span>
          <span>{renderInline(line.replace(/^[-•]\s/, ''))}</span>
        </div>,
      );
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      parts.push(<hr key={i} className="my-2 border-border/40" />);
      continue;
    }

    // Empty line = spacing
    if (line.trim() === '') {
      parts.push(<div key={i} className="h-1.5" />);
      continue;
    }

    // Normal paragraph
    parts.push(
      <p key={i} className="leading-relaxed">
        {renderInline(line)}
      </p>,
    );
  }

  return parts;
}

function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    nodes.push(
      <strong key={match.index} className="font-semibold">
        {match[1]}
      </strong>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}

export function ChatMessage({ message, isLatest, allMessages, onTextReveal }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const shouldAnimate = !isUser && isLatest;
  const [displayedText, setDisplayedText] = useState(shouldAnimate ? '' : message.content);
  const [feedbackGiven, setFeedbackGiven] = useState<'helpful' | 'not_helpful' | null>(null);
  const [copied, setCopied] = useState(false);

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
    }, 12);

    return () => clearInterval(interval);
  }, [message.content, shouldAnimate, onTextReveal]);

  const rendered = useMemo(() => renderMarkdown(displayedText), [displayedText]);

  const handleFeedback = useCallback(async (rating: 'helpful' | 'not_helpful') => {
    setFeedbackGiven(rating);
    const context = (allMessages ?? []).slice(-6).map(({ role, content }) => ({ role, content }));
    const { error } = await supabase.from('chat_feedback' as any).insert({
      message_id: message.id,
      rating,
      conversation_messages: context,
    });
    if (error) {
      console.error('Feedback error:', error);
      toast.error('Failed to submit feedback');
      setFeedbackGiven(null);
    } else {
      toast.success('Thanks for your feedback!');
    }
  }, [message.id, allMessages]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

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
      <div className="max-w-[85%] space-y-1">
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-sm space-y-0.5 ${
            isUser
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-muted/50 text-foreground rounded-bl-md'
          }`}
        >
          {isUser ? displayedText : rendered}
        </div>
        <div className={`flex items-center gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <p className="text-[10px] text-muted-foreground">
            {timeFormatter.format(message.timestamp)}
          </p>
          {!isUser && (
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => handleFeedback('helpful')}
                disabled={feedbackGiven !== null}
                className={`p-1 rounded-md transition-colors ${
                  feedbackGiven === 'helpful'
                    ? 'text-primary'
                    : 'text-muted-foreground/50 hover:text-muted-foreground'
                } disabled:cursor-default`}
                title="Helpful"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleFeedback('not_helpful')}
                disabled={feedbackGiven !== null}
                className={`p-1 rounded-md transition-colors ${
                  feedbackGiven === 'not_helpful'
                    ? 'text-destructive'
                    : 'text-muted-foreground/50 hover:text-muted-foreground'
                } disabled:cursor-default`}
                title="Not helpful"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCopy}
                className="p-1 rounded-md text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                title="Copy"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
