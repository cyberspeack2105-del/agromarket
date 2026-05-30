"use client";

import { useEffect, useRef, useState } from "react";
import { getToken } from "@/lib/client-auth";

type Message = { sender: "user" | "ai"; text: string };

const WELCOME: Message = {
  sender: "ai",
  text: "Hello! I'm NexGro AI 🌱 Ask me about crop prices, soil health, weather, or farming advice.",
};

export default function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || thinking) return;

    const updated: Message[] = [...messages, { sender: "user", text }];
    setMessages(updated);
    setInput("");
    setThinking(true);

    try {
      const token = getToken();
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages: updated }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { sender: "ai", text: data.text ?? "Sorry, I couldn't process that." }]);
    } catch {
      setMessages((prev) => [...prev, { sender: "ai", text: "Connection error. Please try again." }]);
    } finally {
      setThinking(false);
    }
  }

  return (
    <div className="ai-chat-fab">
      {/* Chat panel — only shown when open */}
      {open && (
        <div
          className="mb-3 flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl slide-down"
          style={{ width: "min(360px, calc(100vw - 2rem))", height: "min(500px, calc(100vh - 8rem))" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 bg-green-700 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <span className="material-symbols-outlined text-sm text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                  smart_toy
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-white">NexGro AI</p>
                <p className="text-[10px] text-green-200">Agricultural Intelligence</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                {msg.sender === "ai" && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-700 mt-0.5">
                    <span className="material-symbols-outlined text-xs text-white" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-green-700 text-white rounded-tr-sm"
                    : "bg-white text-gray-800 rounded-tl-sm border border-gray-200 shadow-sm"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {thinking && (
              <div className="flex gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-700">
                  <span className="material-symbols-outlined text-xs text-white" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
                </div>
                <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-white px-3 py-2.5 border border-gray-200 shadow-sm">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="h-1.5 w-1.5 rounded-full bg-green-500"
                      style={{ animation: `pulseDot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          <div className="flex gap-1.5 overflow-x-auto bg-white px-4 py-2 border-t border-gray-100">
            {["Wheat prices", "Soil pH fix", "Best crops now"].map((q) => (
              <button key={q} onClick={() => setInput(q)}
                className="shrink-0 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[10px] font-medium text-green-700 hover:bg-green-100 transition-colors">
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="border-t border-gray-100 bg-white p-3">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about crops, soil, prices…"
                className="flex-1 bg-transparent text-xs text-gray-800 placeholder-gray-400 outline-none"
                disabled={thinking}
              />
              <button type="submit" disabled={!input.trim() || thinking}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-700 text-white transition hover:bg-green-800 disabled:opacity-40">
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close AI Assistant" : "Open AI Assistant"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-green-700 shadow-lg shadow-green-200 transition-all hover:scale-105 hover:bg-green-800 hover:shadow-xl active:scale-95"
      >
        <span className="material-symbols-outlined text-2xl text-white transition-transform duration-200"
          style={{ fontVariationSettings: "'FILL' 1", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
          {open ? "keyboard_arrow_down" : "smart_toy"}
        </span>
      </button>
    </div>
  );
}
