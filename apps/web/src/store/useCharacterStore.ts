"use client";

import { create } from "zustand";
import { createCharacter, getCharacters, type Character } from "@/lib/api";

const DEFAULT_ID = "preset_ling";

interface CharacterState {
  characters: Character[];
  selectedId: string;
  loading: boolean;
  load: () => Promise<void>;
  select: (id: string) => void;
  create: (payload: {
    name: string;
    persona: string;
    relationship_type: string;
    avatar: string;
    glow: string;
  }) => Promise<Character>;
  selected: () => Character | undefined;
}

export const useCharacterStore = create<CharacterState>((set, get) => ({
  characters: [],
  selectedId: DEFAULT_ID,
  loading: false,
  load: async () => {
    set({ loading: true });
    try {
      const list = await getCharacters();
      set({ characters: list });
    } finally {
      set({ loading: false });
    }
  },
  select: (id) => set({ selectedId: id }),
  create: async (payload) => {
    const created = await createCharacter(payload);
    set((s) => ({ characters: [...s.characters, created], selectedId: created.id }));
    return created;
  },
  selected: () => get().characters.find((c) => c.id === get().selectedId),
}));
