"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Modal } from "@/components/ui/Modal";
import { useSceneStore } from "@/store/useSceneStore";
import { SCENE_VISUALS } from "./SceneBackground";
import { cn } from "@/lib/utils";

export function ScenePicker({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { scenes, selectedKey, load, select } = useSceneStore();
  const [paywallHint, setPaywallHint] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      load();
      setPaywallHint(null);
    }
  }, [open, load]);

  const handleSelect = async (key: string, free: boolean, name: string) => {
    if (key === selectedKey) return;
    if (!free) {
      setPaywallHint(`「${name}」是 MIRAI Pro 专属场景，升级后即可进入`);
      return;
    }
    try {
      await select(key);
      setPaywallHint(null);
      onClose();
    } catch {
      setPaywallHint("场景切换失败，请检查后端服务");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="选择世界场景" icon="fa-solid fa-map-location-dot">
      <div className="grid grid-cols-2 gap-3">
        {scenes.map((s) => {
          const visual = SCENE_VISUALS[s.key];
          const active = s.key === selectedKey;
          return (
            <motion.button
              key={s.key}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelect(s.key, s.free, s.name)}
              className={cn(
                "relative overflow-hidden rounded-2xl border p-3 text-left transition",
                active ? "border-aurora-violet/70 ring-1 ring-aurora-violet/40" : "border-white/8 hover:border-white/20",
              )}
            >
              <div className="absolute inset-0" style={{ background: visual?.bg }} />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <i
                    className={`fa-solid ${visual?.icon ?? "fa-circle"} text-lg`}
                    style={{ color: visual?.glow }}
                  />
                  {!s.free ? (
                    <span className="flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[9px] text-aurora-gold">
                      <i className="fa-solid fa-crown" /> Pro
                    </span>
                  ) : active ? (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-aurora-violet text-[9px]">
                      <i className="fa-solid fa-check" />
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm font-medium">{s.name}</p>
                <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-white/50">{s.desc}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
      {paywallHint && (
        <p className="mt-4 flex items-center gap-2 rounded-xl border border-aurora-gold/30 bg-aurora-gold/10 px-3 py-2 text-xs text-aurora-gold">
          <i className="fa-solid fa-lock" />
          {paywallHint}
        </p>
      )}
    </Modal>
  );
}
