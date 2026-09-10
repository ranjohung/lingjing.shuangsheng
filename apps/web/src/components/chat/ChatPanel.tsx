"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatStore } from "@/store/useChatStore";
import { useCharacterStore } from "@/store/useCharacterStore";
import { Toggle } from "@/components/ui/Toggle";
import { cn } from "@/lib/utils";

export function ChatPanel() {
  const { messagesByCharacter, sending, send, privateMode, setPrivateMode, resetConversation } = useChatStore();
  const { characters, selectedId, select } = useCharacterStore();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = messagesByCharacter[selectedId] ?? [];

  useEffect(() => {
    if (selectedId) resetConversation(selectedId);
  }, [selectedId, characters.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, sending]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    void send(text);
  };

  return (
    <section className="glass flex h-full min-h-[420px] flex-col overflow-hidden rounded-3xl">
      {/* 头部：角色切换 + 私密模式 */}
      <header className="flex items-center justify-between gap-3 border-b border-white/6 px-4 py-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {characters.map((c) => {
            const active = c.id === selectedId;
            return (
              <button
                key={c.id}
                onClick={() => select(c.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-all",
                  active
                    ? "border-white/20 bg-white/12 text-white"
                    : "border-transparent bg-white/4 text-white/45 hover:bg-white/8",
                )}
                style={active ? { boxShadow: `0 0 16px -4px ${c.glow}` } : undefined}
              >
                <span className="text-sm">{c.avatar}</span>
                {c.name}
              </button>
            );
          })}
        </div>
        <Toggle checked={privateMode} onChange={setPrivateMode} icon="fa-solid fa-user-shield" label="私密" />
      </header>

      {/* 消息流 */}
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[86%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed",
                  m.role === "user"
                    ? "rounded-br-md bg-gradient-to-br from-aurora-violet to-[#6d5ce0] text-white shadow-glow"
                    : "rounded-bl-md border border-white/8 bg-night-700/70 text-white/90",
                  m.safetyBlocked && "ring-1 ring-aurora-gold/60",
                  m.budgetExceeded && "ring-1 ring-red-400/50",
                )}
              >
                {m.safetyBlocked && (
                  <div className="mb-1.5 flex items-center gap-1 text-[11px] font-medium text-aurora-gold">
                    <i className="fa-solid fa-heart-pulse" />
                    安全关怀
                  </div>
                )}
                {m.budgetExceeded && (
                  <div className="mb-1.5 flex items-center gap-1 text-[11px] font-medium text-red-300">
                    <i className="fa-solid fa-shield-halved" />
                    熔断保护 · {m.budgetExceeded}
                  </div>
                )}
                {m.text}
                {m.note && (
                  <div className="mt-2 flex items-center gap-1 border-t border-white/8 pt-1.5 text-[10px] text-white/35">
                    <i className="fa-solid fa-microchip" />
                    {m.note}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {sending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-white/8 bg-night-700/70 px-4 py-3">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-aurora-violet"
                  animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.18 }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* 输入区 */}
      <footer className="border-t border-white/6 p-3">
        <div className="flex items-center gap-2">
          <button
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/35"
            title="语音输入尚未开放"
            disabled
          >
            <i className="fa-solid fa-microphone text-sm" />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={privateMode ? "私密模式：这段对话不会被记住…" : "和 TA 说点什么…"}
            className="h-11 flex-1 rounded-full border border-white/8 bg-white/6 px-4 text-sm text-white placeholder:text-white/30 focus:border-aurora-violet/50 focus:outline-none focus:ring-2 focus:ring-aurora-violet/20"
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-aurora-violet to-[#6d5ce0] text-white shadow-glow transition disabled:opacity-35"
          >
            <i className="fa-solid fa-paper-plane" />
          </motion.button>
        </div>
        <p className="mt-2 text-center text-[10px] text-white/25">
          AI内容不代表真实人格或情感。你可以随时暂停对话。
        </p>
      </footer>
    </section>
  );
}
