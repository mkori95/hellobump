"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SourceAttribution } from "@/components/SourceAttribution";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { cn } from "@/lib/utils";
import type { DBChatMessage } from "@/lib/supabase";
import type { SourceName } from "@/lib/content-sources";

function Bubble({ message }: { message: DBChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm sm:max-w-[70%]",
          isUser
            ? "bg-primary text-primary-foreground"
            : message.has_red_flag
              ? "border border-destructive bg-destructive/10 text-destructive"
              : "bg-accent text-accent-foreground"
        )}
      >
        {message.has_red_flag && <p className="mb-1 font-semibold">Please contact your doctor</p>}
        <p className="whitespace-pre-line">{message.content}</p>
        {!isUser && !message.has_red_flag && message.sources_used?.length > 0 && (
          <div className="mt-2">
            <SourceAttribution sources={message.sources_used as SourceName[]} />
          </div>
        )}
      </div>
    </div>
  );
}

export function CompanionManager({
  initialMessages,
  nickname,
}: {
  initialMessages: DBChatMessage[];
  nickname: string;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setError(null);
    setInput("");
    setLoading(true);

    // Optimistic user bubble — swapped for the real row once the response arrives.
    const optimisticId = `optimistic-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: optimisticId,
        user_id: "",
        role: "user",
        content: trimmed,
        has_red_flag: false,
        sources_used: [],
        created_at: new Date().toISOString(),
      },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        return;
      }

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticId),
        data.userMessage,
        data.assistantMessage,
      ]);
    } catch {
      setError("Something went wrong. Please try again.");
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="flex flex-col overflow-hidden">
      <CardContent className="flex h-[55vh] min-h-[360px] flex-col gap-3 overflow-y-auto p-4 sm:p-6">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            Good morning, {nickname}! Say hi, ask a question, or just tell me how you&apos;re feeling.
          </p>
        )}
        {messages.map((m) => (
          <Bubble key={m.id} message={m} />
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl bg-accent px-4 py-2.5">
              <LoadingSpinner size={24} />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </CardContent>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border p-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          disabled={loading}
        />
        <Button type="submit" size="icon" disabled={loading || !input.trim()} className="shrink-0 rounded-full">
          <Send className="h-4 w-4" />
        </Button>
      </form>
      {error && <p className="px-4 pb-3 text-sm text-destructive">{error}</p>}
    </Card>
  );
}
