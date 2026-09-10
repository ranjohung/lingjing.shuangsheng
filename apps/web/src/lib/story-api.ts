import { API_BASE_URL } from "./api";
export interface Story { id: string; title: string; description: string; playable: boolean; content_status: string; path_choices: number; ending_count: number; chapter_count: number }
export interface Ending { id: string; type: string; title: string; description: string; hidden: boolean }
export interface StorySession {
  id: string; story_title: string; revision: number; status: string;
  identity: { name: string; background: string; mode: string };
  state: { attributes: Record<string, number>; relationships: Record<string, number>; route: string | null };
  node: { id: string; title: string; text: string; npc: string; chapter: number; chapter_title: string; location: string; options: { id: string; text: string }[] } | null;
  history: { choice_id: string; option_id: string; title: string; text: string }[];
  ending: Ending | null; completed_choices: number; total_choices: number; storage_mode: string;
}
export interface Destiny { story_title: string; character_name: string; route: string; ending: Ending; key_choices: string[]; watermark: string; visibility: string }
export async function storyRequest<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/api/${path}`, { cache: "no-store", ...(body === undefined ? {} : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }) });
  const data = await response.json();
  if (!response.ok) throw new Error(typeof data.detail === "string" ? data.detail : "请求未完成，请刷新进度后重试");
  return data as T;
}
