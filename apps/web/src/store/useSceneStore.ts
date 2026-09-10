"use client";

import { create } from "zustand";
import { getScenes, selectScene, type Scene } from "@/lib/api";

interface SceneState {
  scenes: Scene[];
  selectedKey: string;
  load: () => Promise<void>;
  select: (key: string) => Promise<void>;
}

export const useSceneStore = create<SceneState>((set, get) => ({
  scenes: [],
  selectedKey: "bedroom",
  load: async () => {
    try {
      const list = await getScenes();
      set({ scenes: list, selectedKey: list.find((s) => s.selected)?.key ?? "bedroom" });
    } catch {
      /* 后端未就绪时使用默认场景 */
    }
  },
  select: async (key) => {
    // 乐观更新失败回滚
    const prev = get().selectedKey;
    set({ selectedKey: key });
    try {
      await selectScene(key);
      set((s) => ({
        scenes: s.scenes.map((sc) => ({ ...sc, selected: sc.key === key })),
      }));
    } catch (e) {
      set({ selectedKey: prev });
      throw e;
    }
  },
}));
