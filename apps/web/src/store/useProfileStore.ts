"use client";

import { create } from "zustand";
import { getProfile, updateProfile, type Profile } from "@/lib/api";

interface ProfileState extends Profile {
  loaded: boolean;
  load: () => Promise<Profile>;
  save: (patch: Partial<Profile>) => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  nickname: "",
  onboarded: false,
  companion_id: "preset_ling",
  loaded: false,

  load: async () => {
    const p = await getProfile();
    set({ ...p, loaded: true });
    return p;
  },

  save: async (patch) => {
    const p = await updateProfile(patch);
    set({ ...p });
  },
}));

/** 供其他 store 读取昵称的同步快照 */
export function getNickname(): string {
  return useProfileStore.getState().nickname || "你";
}
