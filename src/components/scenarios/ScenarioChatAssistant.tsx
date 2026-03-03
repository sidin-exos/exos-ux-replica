/**
 * ScenarioChatAssistant — Inline chat panel for scenario data entry
 */

import { useState, useRef, useEffect } from "react";
import { Bot, User, Send, CheckCircle2, Circle, X, ArrowDownToLine } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useScenarioChatAssistant } from "@/hooks/useScenarioChatAssistant";
import type { ScenarioFieldMeta } from "@/lib/scenario-chat-service";

interface ScenarioChatAssistantProps {
  scenarioId: string;
  requiredFields: ScenarioFieldMeta[];
  dataRequirements: string;
  onApply: (fields: Record<string, string>) => void;
  onClose: () => void;
}

export function ScenarioChatAssistant({
  scenarioId,
  requiredFields,
  dataRequirements,
  onApply,
  onClose,
}: ScenarioChatAssistantProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    extractedFields,
    isTyping,
    sendMessage,
    applyToForm,
  } = useScenarioChatAssistant({
    scenarioId,
    scenarioFields: requiredFields,
    dataRequirements,
  });

  const filledCount = Object.keys(extractedFields).length;
  const totalFields = requiredFields.length;

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;
    setInput("");
    sendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleApply = () => {
    onApply(applyToForm());
  };

  return (
    <Card className="border-primary/20 bg-card">
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Data Assistant</span>
          <Badge variant="secondary" className="text-xs">
            {filledCount}/{totalFields} fields
          </Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      {/* Field Progress */}
      <div className="px-4 py-2 border-b flex flex-wrap gap-1.5">
        {requiredFields.map((field) => {
          const isFilled = field.id in extractedFields;
          return (
            <Badge
              key={field.id}
              variant={isFilled ? "default" : "outline"}
              className="text-xs gap-1 font-normal"
            >
              {isFilled ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <Circle className="w-3 h-3 text-muted-foreground" />
              )}
              {field.label}
            </Badge>
          );
        })}
      </div>

      {/* Messages */}
      <CardContent className="p-0">
        <ScrollArea className="h-64">
          <div ref={scrollRef} className="p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Bot className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Tell me about your procurement scenario and I'll help fill in the required fields.
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <Bot className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                )}
                <div
                  className={`rounded-lg px-3 py-2 text-sm max-w-[80%] ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <User className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2 items-center">
                <Bot className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="bg-muted rounded-lg px-3 py-2">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Footer */}
      <CardFooter className="flex flex-col gap-2 p-3 border-t">
        <div className="flex w-full gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your procurement data..."
            disabled={isTyping}
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          disabled={filledCount === 0}
          onClick={handleApply}
        >
          <ArrowDownToLine className="w-4 h-4" />
          Apply {filledCount} field{filledCount !== 1 ? "s" : ""} to form
        </Button>
      </CardFooter>
    </Card>
  );
}
