"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { Send, Bot, User } from "lucide-react";
import { clsx } from "clsx";
import { Spinner } from "@/components/ui/Spinner";

interface Message {
  id?: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt?: string;
}

interface ChatWindowProps {
  sessionId?: string;
  context?: "QUEUE" | "GENERAL";
  onSummaryReady?: (summary: string) => void;
  initialMessages?: Message[];
  placeholder?: string;
}

export function ChatWindow({
  sessionId: initialSessionId,
  context = "GENERAL",
  onSummaryReady,
  initialMessages = [],
  placeholder = "اكتب رسالتك...",
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [sessionId, setSessionId] = useState(initialSessionId);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "USER", content: text }]);
    setLoading(true);

    try {
      const r = await fetch("/api/chatbot/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId, context }),
      });
      const data = await r.json();
      if (r.ok) {
        setSessionId(data.data.sessionId);
        setMessages((prev) => [...prev, { role: "ASSISTANT", content: data.data.reply }]);
        if (data.data.summary && onSummaryReady) {
          onSummaryReady(data.data.summary);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "ASSISTANT", content: "حدث خطأ. يرجى المحاولة مرة أخرى." },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ASSISTANT", content: "تعذّر الاتصال. يرجى التحقق من الاتصال بالإنترنت." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <Bot className="h-12 w-12 mb-3 text-teal-400" />
            <p className="font-medium text-navy-800">مساعد سند الذكي</p>
            <p className="text-sm mt-1">كيف يمكنني مساعدتك اليوم؟</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={clsx("flex gap-2 items-start", msg.role === "USER" && "flex-row-reverse")}
          >
            <div
              className={clsx(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                msg.role === "USER" ? "bg-navy-700" : "bg-teal-100"
              )}
            >
              {msg.role === "USER" ? (
                <User className="h-4 w-4 text-white" />
              ) : (
                <Bot className="h-4 w-4 text-teal-600" />
              )}
            </div>
            <div
              className={clsx(
                "max-w-xs lg:max-w-md xl:max-w-lg rounded-2xl px-4 py-2.5 text-sm",
                msg.role === "USER"
                  ? "bg-navy-700 text-white rounded-tr-sm"
                  : "bg-gray-100 text-gray-800 rounded-tl-sm"
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 items-start">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100">
              <Bot className="h-4 w-4 text-teal-600" />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
              <Spinner size="sm" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={send} className="flex gap-2 p-3 border-t border-gray-200">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={loading}
          className="flex-1 rounded-xl border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex items-center justify-center h-10 w-10 rounded-xl bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 shrink-0"
        >
          <Send className="h-4 w-4 rotate-180" />
        </button>
      </form>
    </div>
  );
}
