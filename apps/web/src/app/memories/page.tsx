"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { getMemories, deleteMemory, forgetTopic, exportMemories, type MemoryItem } from "@/lib/api";
import { useCharacterStore } from "@/store/useCharacterStore";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatTime } from "@/lib/utils";

const TYPE_LABEL: Record<string, { label: string; tone: "violet" | "blue" | "pink" | "gold" }> = {
  preference: { label: "偏好", tone: "violet" },
  fact: { label: "事实", tone: "blue" },
  event: { label: "事件", tone: "pink" },
  emotion: { label: "情绪", tone: "gold" },
};

export default function MemoriesPage() {
  const { characters, load: loadCharacters } = useCharacterStore();
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setMemories(await getMemories());
    } catch {
      setMemories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCharacters();
    reload();
  }, [loadCharacters, reload]);

  const charName = (id: string) => characters.find((c) => c.id === id)?.name ?? "伙伴";
  const charAvatar = (id: string) => characters.find((c) => c.id === id)?.avatar ?? "✨";

  const handleForget = async () => {
    if (!topic.trim()) return;
    const res = await forgetTopic(topic.trim());
    setNotice(`已定向遗忘 ${res.forgotten_count} 条与「${topic.trim()}」相关的记忆`);
    setTopic("");
    reload();
  };

  const handleDelete = async (id: string) => {
    await deleteMemory(id);
    reload();
  };

  const handleExport = async () => {
    const data = await exportMemories();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mirai-memories-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <p className="font-brand text-sm tracking-[0.3em] text-aurora-violet/80">MEMORY</p>
        <h1 className="font-display text-2xl font-bold md:text-3xl">
          <span className="text-gradient">记忆</span>之海
        </h1>
        <p className="mt-1 text-xs text-white/40">
          你的记忆完全由你掌控：可以单条删除、定向遗忘，或导出全部数据
        </p>
      </motion.header>

      {/* 控制权操作 */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass mb-5 space-y-3 rounded-3xl p-5"
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleForget()}
            placeholder="定向遗忘：如「香菜」「工作」「前任」…"
            className="h-11 flex-1 rounded-xl border border-white/10 bg-white/6 px-4 text-sm focus:border-red-400/50 focus:outline-none"
          />
          <Button variant="danger" onClick={handleForget} disabled={!topic.trim()}>
            <i className="fa-solid fa-wand-sparkles" /> 让 TA 忘掉
          </Button>
        </div>
        {notice && <p className="text-xs text-aurora-mint">{notice}</p>}
        <div className="flex items-center justify-between border-t border-white/6 pt-3">
          <p className="flex items-center gap-1.5 text-[11px] text-white/35">
            <i className="fa-solid fa-user-shield text-aurora-violet" />
            聊天页开启「私密模式」后，对话不会写入记忆
          </p>
          <Button variant="glass" size="sm" onClick={handleExport}>
            <i className="fa-solid fa-download" /> 导出我的数据
          </Button>
        </div>
      </motion.div>

      {/* 记忆列表 */}
      {loading ? (
        <p className="py-12 text-center text-sm text-white/30">
          <i className="fa-solid fa-spinner fa-spin mr-1" /> 正在翻阅记忆…
        </p>
      ) : memories.length === 0 ? (
        <div className="glass flex flex-col items-center gap-3 rounded-3xl py-16 text-center">
          <span className="text-4xl opacity-40">🫧</span>
          <p className="text-sm text-white/40">这里还一片空白</p>
          <p className="text-xs text-white/25">去和伙伴聊聊「我喜欢什么 / 我讨厌什么」，TA 就会记住</p>
        </div>
      ) : (
        <div className="space-y-3">
          {memories.map((m, i) => {
            const type = TYPE_LABEL[m.memory_type] ?? { label: m.memory_type, tone: "blue" as const };
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                className="glass group flex items-start gap-3 rounded-2xl p-4"
              >
                <span className="mt-0.5 text-xl">{charAvatar(m.character_id)}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-relaxed text-white/85">{m.content}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-white/35">
                    <Badge tone={type.tone}>{type.label}</Badge>
                    <span>{charName(m.character_id)} 记住的</span>
                    <span>· {formatTime(m.created_at)}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(m.id)}
                  className="shrink-0 rounded-lg px-2 py-1 text-white/25 opacity-0 transition hover:bg-red-500/15 hover:text-red-300 group-hover:opacity-100"
                  title="删除这条记忆"
                >
                  <i className="fa-solid fa-trash-can text-sm" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
