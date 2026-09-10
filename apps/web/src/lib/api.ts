export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export interface AIResponse {
  message: string;
  animation: string;
  gesture: string | null;
  camera: string;
  emotion: string;
  emotion_intensity: number;
  relationship_delta: Record<string, number>;
  memory_candidates: Array<{ id: string; content: string; memory_type: string }>;
  facial_expression: string;
  voice: { tone: string };
  safety_blocked: boolean;
  note: string | null;
}

export interface Character {
  id: string;
  name: string;
  persona: string;
  relationship_type: string;
  avatar: string;
  glow: string;
  is_preset: boolean;
}

export interface MemoryItem {
  id: string;
  character_id: string;
  content: string;
  memory_type: string;
  importance: number;
  created_at: number;
}

export interface RelationshipData {
  character_id: string;
  dimensions: Record<string, number>;
  labels: Record<string, string>;
}

export interface ApiError {
  status: number;
  detail: unknown;
  budgetExceeded: string | null;
  paywall: boolean;
}

function makeError(res: Response): ApiError {
  return {
    status: res.status,
    detail: null,
    budgetExceeded: res.headers.get("X-Budget-Exceeded"),
    paywall: res.status === 402,
  };
}

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => ({ detail: "网络错误" }));
    throw { ...makeError(res), detail: data.detail };
  }
  return res.json() as Promise<T>;
}

// ---- 聊天 ----
export async function sendMessage(
  message: string,
  characterId: string,
  privateMode: boolean,
): Promise<AIResponse> {
  const res = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, character_id: characterId, private_mode: privateMode }),
  });
  return jsonOrThrow<AIResponse>(res);
}

// ---- 角色 ----
export async function getCharacters(): Promise<Character[]> {
  const res = await fetch(`${API_BASE_URL}/api/characters`, { cache: "no-store" });
  return jsonOrThrow<Character[]>(res);
}

export async function createCharacter(payload: {
  name: string;
  persona: string;
  relationship_type: string;
  avatar: string;
  glow: string;
}): Promise<Character> {
  const res = await fetch(`${API_BASE_URL}/api/characters`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow<Character>(res);
}

// ---- 记忆 ----
export async function getMemories(characterId?: string): Promise<MemoryItem[]> {
  const qs = characterId ? `?character_id=${encodeURIComponent(characterId)}` : "";
  const res = await fetch(`${API_BASE_URL}/api/memories${qs}`, { cache: "no-store" });
  return jsonOrThrow<MemoryItem[]>(res);
}

export async function deleteMemory(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/memories/${id}`, { method: "DELETE" });
  await jsonOrThrow(res);
}

export async function forgetTopic(topic: string): Promise<{ forgotten_count: number }> {
  const res = await fetch(`${API_BASE_URL}/api/memories/forget`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic }),
  });
  return jsonOrThrow(res);
}

export async function exportMemories(): Promise<unknown> {
  const res = await fetch(`${API_BASE_URL}/api/memories/export`, { cache: "no-store" });
  return jsonOrThrow(res);
}

// ---- 关系 ----
export async function getRelationship(characterId: string): Promise<RelationshipData> {
  const res = await fetch(`${API_BASE_URL}/api/relationship?character_id=${encodeURIComponent(characterId)}`, {
    cache: "no-store",
  });
  return jsonOrThrow<RelationshipData>(res);
}

export async function fetchHealth(): Promise<unknown> {
  const res = await fetch(`${API_BASE_URL}/health`, { cache: "no-store" });
  return res.json();
}

// ---- 用户档案 / 引导 ----
export interface Profile {
  nickname: string;
  onboarded: boolean;
  companion_id: string;
}

export async function getProfile(): Promise<Profile> {
  const res = await fetch(`${API_BASE_URL}/api/profile`, { cache: "no-store" });
  return jsonOrThrow<Profile>(res);
}

export async function updateProfile(patch: Partial<Profile>): Promise<Profile> {
  const res = await fetch(`${API_BASE_URL}/api/profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return jsonOrThrow<Profile>(res);
}

// ---- 场景 ----
export interface Scene {
  key: string;
  name: string;
  desc: string;
  free: boolean;
  selected: boolean;
}

export async function getScenes(): Promise<Scene[]> {
  const res = await fetch(`${API_BASE_URL}/api/scenes`, { cache: "no-store" });
  return jsonOrThrow<Scene[]>(res);
}

export async function selectScene(sceneKey: string): Promise<Scene> {
  const res = await fetch(`${API_BASE_URL}/api/scenes/select`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scene_key: sceneKey }),
  });
  return jsonOrThrow<Scene>(res);
}
