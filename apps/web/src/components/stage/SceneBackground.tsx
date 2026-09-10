"use client";

import { AnimatePresence, motion } from "framer-motion";

/** 场景氛围配置：背景层叠渐变 + 装饰图标（Phase 19 替换为 3D 环境） */
export const SCENE_VISUALS: Record<string, { bg: string; icon: string; glow: string }> = {
  bedroom: {
    bg: "radial-gradient(420px 300px at 20% 15%, rgba(255,190,120,0.22), transparent 65%), radial-gradient(500px 400px at 80% 90%, rgba(120,80,160,0.25), transparent 60%), linear-gradient(180deg, #1a1230 0%, #0d0a1e 100%)",
    icon: "fa-bed",
    glow: "#ffd9a0",
  },
  living_room: {
    bg: "radial-gradient(460px 320px at 75% 10%, rgba(255,210,150,0.25), transparent 65%), radial-gradient(480px 420px at 15% 95%, rgba(246,166,216,0.18), transparent 60%), linear-gradient(180deg, #221834 0%, #120e24 100%)",
    icon: "fa-couch",
    glow: "#ffcf9e",
  },
  cafe: {
    bg: "radial-gradient(400px 300px at 82% 12%, rgba(180,220,255,0.18), transparent 65%), radial-gradient(520px 420px at 18% 88%, rgba(200,150,90,0.22), transparent 60%), linear-gradient(180deg, #101a2e 0%, #0a0f1e 100%)",
    icon: "fa-mug-hot",
    glow: "#c8965a",
  },
  school: {
    bg: "radial-gradient(500px 340px at 50% -5%, rgba(255,170,90,0.3), transparent 65%), linear-gradient(180deg, #2a1a28 0%, #120e22 100%)",
    icon: "fa-school",
    glow: "#ffaa5a",
  },
  library: {
    bg: "radial-gradient(420px 320px at 12% 12%, rgba(120,220,190,0.16), transparent 65%), radial-gradient(500px 440px at 88% 92%, rgba(90,120,200,0.22), transparent 60%), linear-gradient(180deg, #0d1f24 0%, #08101a 100%)",
    icon: "fa-book-open-reader",
    glow: "#7cdcc0",
  },
  street: {
    bg: "radial-gradient(460px 320px at 80% 85%, rgba(110,200,190,0.2), transparent 65%), radial-gradient(400px 300px at 15% 10%, rgba(160,140,255,0.18), transparent 60%), linear-gradient(180deg, #0c1a26 0%, #080d18 100%)",
    icon: "fa-store",
    glow: "#6ec8be",
  },
  starry_sky: {
    bg: "radial-gradient(600px 420px at 50% 20%, rgba(139,124,246,0.28), transparent 65%), radial-gradient(300px 200px at 78% 30%, rgba(110,198,255,0.2), transparent 65%), linear-gradient(180deg, #0a0a28 0%, #050514 100%)",
    icon: "fa-meteor",
    glow: "#8b7cf6",
  },
  ancient_palace: {
    bg: "radial-gradient(440px 320px at 78% 12%, rgba(255,200,110,0.2), transparent 65%), radial-gradient(500px 420px at 18% 92%, rgba(180,50,60,0.22), transparent 60%), linear-gradient(180deg, #241018 0%, #120810 100%)",
    icon: "fa-landmark",
    glow: "#e0a050",
  },
  sci_fi: {
    bg: "radial-gradient(460px 320px at 16% 16%, rgba(80,220,255,0.2), transparent 65%), radial-gradient(520px 440px at 85% 90%, rgba(120,140,255,0.2), transparent 60%), linear-gradient(180deg, #071826 0%, #040c16 100%)",
    icon: "fa-rocket",
    glow: "#5fdcff",
  },
  chibi_room: {
    bg: "radial-gradient(460px 340px at 20% 12%, rgba(246,166,216,0.28), transparent 65%), radial-gradient(500px 440px at 85% 90%, rgba(124,246,192,0.2), transparent 60%), linear-gradient(180deg, #261830 0%, #140e22 100%)",
    icon: "fa-cookie-bite",
    glow: "#f6a6d8",
  },
};

/** 时段：影响光照叠加（FR-SCENE-02 场景即状态） */
export function timeOfDay(): { label: string; icon: string; dim: string } {
  const h = new Date().getHours();
  if (h >= 0 && h < 6) return { label: "深夜", icon: "fa-moon", dim: "rgba(4,4,20,0.45)" };
  if (h < 11) return { label: "清晨", icon: "fa-cloud-sun", dim: "rgba(255,220,180,0.06)" };
  if (h < 17) return { label: "午后", icon: "fa-sun", dim: "rgba(255,240,200,0.04)" };
  if (h < 20) return { label: "黄昏", icon: "fa-cloud-sun-rain", dim: "rgba(255,150,80,0.1)" };
  return { label: "夜晚", icon: "fa-moon", dim: "rgba(8,8,30,0.32)" };
}

export function SceneBackground({ sceneKey }: { sceneKey: string }) {
  const visual = SCENE_VISUALS[sceneKey] ?? SCENE_VISUALS.bedroom;
  const tod = timeOfDay();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
      <AnimatePresence mode="sync">
        <motion.div
          key={sceneKey}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9 }}
          className="absolute inset-0"
          style={{ background: visual.bg }}
        />
      </AnimatePresence>
      {/* 时段光照叠加 */}
      <div className="absolute inset-0" style={{ background: tod.dim }} />
      {/* 场景装饰图标 */}
      <motion.i
        key={`icon-${sceneKey}`}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 0.16, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className={`fa-solid ${visual.icon} absolute bottom-6 right-6 text-7xl`}
        style={{ color: visual.glow }}
      />
    </div>
  );
}
