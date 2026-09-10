"use client";

import { create } from "zustand";
import { sendMessage, type AIResponse } from "@/lib/api";
import { useCharacterStore } from "./useCharacterStore";
import { getNickname } from "./useProfileStore";

export interface ChatMessage {
  id: number;
  role: "user" | "character";
  text: string;
  safetyBlocked?: boolean;
  note?: string | null;
  animation?: string;
  expression?: string;
  budgetExceeded?: string | null;
}

interface ChatState {
  messagesByCharacter: Record<string, ChatMessage[]>;
  sending: boolean;
  privateMode: boolean;
  setPrivateMode: (v: boolean) => void;
  resetConversation: (characterId: string) => void;
  send: (text: string) => Promise<void>;
}

let seq = 1;

function welcome(characterName: string): ChatMessage {
  const nick = getNickname();
  return {
    id: 0,
    role: "character",
    text: `${nick === "你" ? "嗨" : `${nick}，嗨`}，我是${characterName}。今天也来到我的世界啦？想聊什么都可以，我在听。`,
    expression: "happy",
    note: "开发体验：当前回复、记忆与情绪使用本地规则模拟。",
  };
}

export const useChatStore = create<ChatState>((set, get) => ({
  messagesByCharacter: {},
  sending: false,
  privateMode: false,

  setPrivateMode: (v) => set({ privateMode: v }),

  resetConversation: (characterId) =>
    set((s) => {
      if (s.messagesByCharacter[characterId]) return s;
      const name = useCharacterStore.getState().characters.find((c) => c.id === characterId)?.name ?? "灵";
      return { messagesByCharacter: { ...s.messagesByCharacter, [characterId]: [welcome(name)] } };
    }),

  send: async (text) => {
    const { selectedId } = useCharacterStore.getState();
    const characterId = selectedId || "preset_ling";
    const privateMode = get().privateMode;
    const history = get().messagesByCharacter[characterId] ?? [
      welcome(useCharacterStore.getState().characters.find((c) => c.id === characterId)?.name ?? "灵"),
    ];

    const userMsg: ChatMessage = { id: seq++, role: "user", text };
    set((s) => ({
      messagesByCharacter: { ...s.messagesByCharacter, [characterId]: [...history, userMsg] },
      sending: true,
    }));

    try {
      const res: AIResponse = await sendMessage(text, characterId, privateMode);
      set((s) => ({
        messagesByCharacter: {
          ...s.messagesByCharacter,
          [characterId]: [
            ...(s.messagesByCharacter[characterId] ?? history),
            {
              id: seq++,
              role: "character",
              text: res.message,
              safetyBlocked: res.safety_blocked,
              note: res.note,
              animation: res.animation,
              expression: res.facial_expression,
            },
          ],
        },
        sending: false,
      }));
    } catch (e) {
      const err = e as { status?: number; detail?: unknown; budgetExceeded?: string | null; paywall?: boolean };
      let text: string;
      if (err.budgetExceeded === "daily") {
        text = "今天的能量预算用完了，明天再来找我吧。（熔断 503 · X-Budget-Exceeded: daily）";
      } else if (err.budgetExceeded === "user") {
        text = "你说得太快啦，先喘口气，喝口水再继续。（熔断 429 · X-Budget-Exceeded: user）";
      } else {
        text = "连接不到我的世界……请确认后端服务已启动（:8010）。";
      }
      set((s) => ({
        messagesByCharacter: {
          ...s.messagesByCharacter,
          [characterId]: [
            ...(s.messagesByCharacter[characterId] ?? history),
            { id: seq++, role: "character", text, budgetExceeded: err.budgetExceeded ?? null },
          ],
        },
        sending: false,
      }));
    }
  },
}));
