"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCharacterStore } from "@/store/useCharacterStore";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

const AVATARS = ["🧚", "🌻", "🐱", "🦊", "🌙", "⭐", "🐰", "🦉"];
const GLOWS = ["#8b7cf6", "#f6a6d8", "#6ec6ff", "#ffd9a0", "#7cf6c0", "#ff9e7d"];
const RELATIONS = [
  { value: "friend", label: "朋友" },
  { value: "partner", label: "恋人" },
  { value: "family", label: "家人" },
  { value: "custom", label: "自定义" },
];
const FREE_LIMIT = 2;

export default function CharactersPage() {
  const router = useRouter();
  const { characters, selectedId, select, load, create } = useCharacterStore();
  const [open, setOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    persona: "",
    relationship_type: "friend",
    avatar: "🐱",
    glow: "#6ec6ff",
  });

  useEffect(() => {
    load();
  }, [load]);

  const customCount = characters.filter((c) => !c.is_preset).length;

  const openCreate = () => {
    if (customCount >= FREE_LIMIT) setPaywallOpen(true);
    else setOpen(true);
  };

  const submit = async () => {
    if (!form.name.trim() || !form.persona.trim()) {
      setError("名字和性格设定都要填哦");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await create(form);
      setOpen(false);
      setForm({ name: "", persona: "", relationship_type: "friend", avatar: "🐱", glow: "#6ec6ff" });
    } catch (e) {
      const err = e as { paywall?: boolean };
      if (err.paywall) setPaywallOpen(true);
      else setError("创建失败，请检查后端服务");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <p className="font-brand text-sm tracking-[0.3em] text-aurora-violet/80">COMPANIONS</p>
        <h1 className="font-display text-2xl font-bold md:text-3xl">
          我的<span className="text-gradient">伙伴</span>
        </h1>
        <p className="mt-1 text-xs text-white/40">
          免费档可拥有 {FREE_LIMIT} 位自定义伙伴 · 已创建 {customCount}/{FREE_LIMIT}
        </p>
      </motion.header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {characters.map((c, i) => {
          const active = c.id === selectedId;
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={cn(
                "glass group relative overflow-hidden rounded-3xl p-5 transition-all",
                active ? "ring-2 ring-aurora-violet/60" : "hover:bg-white/8",
              )}
            >
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-30 blur-2xl transition-opacity group-hover:opacity-60"
                style={{ background: c.glow }}
              />
              <div className="flex items-start justify-between">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-night-800/80 text-4xl"
                  style={{ boxShadow: `0 0 28px -6px ${c.glow}aa` }}
                >
                  {c.avatar}
                </div>
                {c.is_preset ? <Badge tone="violet">官方伙伴</Badge> : <Badge tone="gold">自定义</Badge>}
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{c.name}</h3>
              <p className="mt-1 line-clamp-3 min-h-[3.5rem] text-xs leading-relaxed text-white/50">{c.persona}</p>
              <div className="mt-4">
                {active ? (
                  <Button variant="glass" size="sm" className="w-full" disabled>
                    <i className="fa-solid fa-check" /> 当前伙伴
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      select(c.id);
                      router.push("/");
                    }}
                  >
                    <i className="fa-solid fa-comments" /> 和 TA 聊天
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* 创建卡片 */}
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: characters.length * 0.06 }}
          onClick={openCreate}
          className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-white/15 text-white/40 transition hover:border-aurora-violet/50 hover:text-aurora-violet"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-2xl">
            <i className="fa-solid fa-plus" />
          </span>
          <span className="text-sm">创建新伙伴</span>
        </motion.button>
      </div>

      {/* 创建弹窗 */}
      <Modal open={open} onClose={() => setOpen(false)} title="创建新伙伴" icon="fa-solid fa-wand-magic-sparkles">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs text-white/50">名字</label>
            <input
              value={form.name}
              maxLength={20}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="给 TA 起个名字…"
              className="h-11 w-full rounded-xl border border-white/10 bg-white/6 px-4 text-sm focus:border-aurora-violet/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-white/50">关系</label>
            <div className="flex gap-2">
              {RELATIONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setForm({ ...form, relationship_type: r.value })}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-xs transition",
                    form.relationship_type === r.value
                      ? "border-aurora-violet/60 bg-aurora-violet/20 text-white"
                      : "border-white/10 text-white/45 hover:bg-white/5",
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-white/50">性格设定（DNA · persona）</label>
            <textarea
              value={form.persona}
              maxLength={500}
              rows={3}
              onChange={(e) => setForm({ ...form, persona: e.target.value })}
              placeholder="例如：外表高冷、内心温柔的学姐，说话简短但会记住你说过的每一件小事…"
              className="w-full resize-none rounded-xl border border-white/10 bg-white/6 p-3 text-sm leading-relaxed focus:border-aurora-violet/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-white/50">形象</label>
            <div className="flex flex-wrap gap-2">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  onClick={() => setForm({ ...form, avatar: a })}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl border text-xl transition",
                    form.avatar === a ? "border-aurora-violet/60 bg-aurora-violet/20" : "border-white/10 hover:bg-white/5",
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-white/50">光环色</label>
            <div className="flex gap-2">
              {GLOWS.map((g) => (
                <button
                  key={g}
                  onClick={() => setForm({ ...form, glow: g })}
                  className={cn(
                    "h-8 w-8 rounded-full transition",
                    form.glow === g ? "ring-2 ring-white ring-offset-2 ring-offset-night-900" : "",
                  )}
                  style={{ background: g }}
                />
              ))}
            </div>
          </div>
          {error && <p className="text-xs text-red-300">{error}</p>}
          <Button className="w-full" onClick={submit} disabled={saving}>
            <i className={saving ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-wand-magic-sparkles"} />
            {saving ? "正在唤醒…" : "唤醒 TA"}
          </Button>
        </div>
      </Modal>

      {/* 付费墙弹窗 */}
      <Modal open={paywallOpen} onClose={() => setPaywallOpen(false)} title="免费槽位已满" icon="fa-solid fa-lock">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-aurora-gold/15 text-2xl text-aurora-gold">
            <i className="fa-solid fa-crown" />
          </div>
          <p className="text-sm leading-relaxed text-white/60">
            免费档最多拥有 {FREE_LIMIT} 位自定义伙伴。
            <br />
            升级 <span className="text-gradient font-medium">MIRAI Pro</span> 后可创建无限伙伴、解锁语音与全部场景。
          </p>
          <div className="rounded-2xl border border-white/8 bg-white/4 p-4 text-left text-xs text-white/50">
            <p className="mb-2 font-medium text-white/80">Pro 权益</p>
            <p>✦ 无限伙伴 · 无限对话时长</p>
            <p>✦ 语音对话与嘴型同步（Phase 17）</p>
            <p>✦ 全部 10 个沉浸式场景（Phase 19）</p>
            <p>✦ 记忆图谱加密与导出</p>
          </div>
          <Button variant="gold" className="w-full" disabled>
            <i className="fa-solid fa-crown" /> 升级 Pro（支付 Phase 13 接入）
          </Button>
        </div>
      </Modal>
    </div>
  );
}
