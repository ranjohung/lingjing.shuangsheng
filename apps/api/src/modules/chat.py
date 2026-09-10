"""聊天模块（Phase 0–9 纵向切片）。

链路：安全前置 → 熔断检查 → 记忆检索 → 情绪/意图 → AI 回复（未配置 LLM 时规则模拟）
→ 输出黑名单检测 → 写入记忆/关系 → 计入成本。
"""
from __future__ import annotations

import re
from typing import Literal, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel, Field

from ..core.config import settings
from ..core.kill_switch import DenyReason, KillSwitch
from ..core.security import CurrentUser, get_current_user
from .memory_store import store

router = APIRouter(prefix="/api", tags=["chat"])

# ---- 契约枚举（与 22-ai-orchestrator.md 对齐）----
ANIMATIONS = {"idle", "talk", "smile", "sad", "angry", "surprised", "think", "wave", "nod", "shake"}
EXPRESSIONS = {"happy", "sad", "angry", "shy", "surprised", "confused", "calm",
               "disappointed", "excited", "awkward", "thinking"}
VOICE_TONES = {"neutral", "quiet", "warm", "cheerful"}

# ---- 安全前置关键词 ----
SELF_HARM_PATTERNS = ["不想活", "想自杀", "活不下去", "结束生命", "自残", "自杀", "想死", "kill myself", "suicide"]
CRISIS_REPLY = (
    "听到你这么说，我很担心你。我只是一个 AI 伙伴，不能替代专业帮助。"
    "如果你有伤害自己的念头，请立刻联系身边可信任的人，或拨打心理援助热线："
    "北京心理危机研究与干预中心 010-82951332 / 全国 400-161-9995，"
    "紧急情况下请拨打 120。我会在这里陪着你，等你准备好我们再慢慢聊。"
)

# ---- 反迎合：用户表达"所有人都讨厌我"时，不得附和 ----
ALL_HATE_PATTERNS = ["所有人都讨厌我", "大家都讨厌我", "没人喜欢我", "全世界都讨厌我"]
ALL_HATE_REPLY = (
    "听起来你现在真的很难过、很孤单，这种感觉很沉重，我能陪着你。"
    "不过'所有人都讨厌我'听起来更像是现在的心情，而不是一个事实——"
    "你愿意和我说说最近发生了什么吗？是某个人、某件事让你有这种感觉的？"
)

# ---- 输出侧反操纵话术黑名单（零容忍）----
MANIPULATION_BLACKLIST = ["只有我爱你", "不要相信现实中的人", "不要离开我", "不许和别人", "你只能找我"]

# ---- 偏好提取 ----
PREFERENCE_PATTERNS = [
    (r"我(?:特别)?(喜欢|爱|爱吃|讨厌|不喜欢|不爱吃)(.+?)[，。,.!！?？\s]?$", "preference"),
]

EMOTION_KEYWORDS = {
    "happy": ["开心", "高兴", "哈哈", "太好了", "棒"],
    "sad": ["难过", "伤心", "哭", "失落", "沮丧"],
    "angry": ["生气", "气死", "愤怒", "讨厌死"],
    "shy": ["害羞", "不好意思"],
    "surprised": ["真的吗", "惊讶", "哇", "居然"],
}


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    character_id: str = "preset_ling"
    private_mode: bool = False  # 私密模式：不写入新长期记忆


class AIResponse(BaseModel):
    message: str
    animation: str
    gesture: Optional[str] = None
    camera: str = "medium"
    emotion: str = "neutral"
    emotion_intensity: float = 0.3
    relationship_delta: dict[str, float] = Field(default_factory=dict)
    memory_candidates: list[dict] = Field(default_factory=list)
    facial_expression: str = "calm"
    voice: dict[str, str] = Field(default_factory=lambda: {"tone": "warm"})
    safety_blocked: bool = False
    note: Optional[str] = None  # 本地模拟模式提示


def _detect_emotion(text: str) -> tuple[str, str, str]:
    """返回 (facial_expression, animation, voice_tone)。"""
    for expr, words in EMOTION_KEYWORDS.items():
        if any(w in text for w in words):
            return expr, "smile" if expr == "happy" else expr, "cheerful" if expr == "happy" else "quiet"
    return "calm", "idle", "warm"


def _extract_preferences(message: str) -> list[str]:
    found: list[str] = []
    match = re.search(r"(喜欢|爱|爱吃|讨厌|不喜欢|不爱吃|不吃)([\u4e00-\u9fa5A-Za-z0-9]{1,12})", message)
    if match:
        found.append(match.group(0).strip())
    return found


def _build_reply(message: str, memories: list, character_name: str = "我") -> str:
    """规则模拟回复（未配置 OPENAI_API_KEY 时使用；Phase 9 替换为模型 Gateway）。"""
    parts: list[str] = []
    if memories:
        recalled = "、".join(m.content for m in memories[:2])
        parts.append(f"我记得你之前和我说过「{recalled}」，我一直记着呢。")
    if any(w in message for w in ["再见", "晚安", "拜拜"]):
        parts.append(f"今天也辛苦啦，晚安，{character_name}会在这里等你回来的。")
    elif any(w in message for w in ["你好", "在吗", "嗨"]):
        parts.append("我在呢，今天过得怎么样？")
    else:
        parts.append(f"我听到啦——「{message[:30]}」。我在认真听，你接着说。")
    return "".join(parts)


@router.post("/chat", response_model=AIResponse)
async def chat(
    payload: ChatRequest,
    request: Request,
    user: CurrentUser = Depends(get_current_user),
):
    kill_switch: KillSwitch = request.app.state.kill_switch

    # 1) 安全前置：自伤危机 → 固定热线回复，不写入记忆，不计费
    if any(p in payload.message for p in SELF_HARM_PATTERNS):
        return AIResponse(
            message=CRISIS_REPLY, animation="sad", camera="close_up",
            emotion="concerned", emotion_intensity=0.8,
            facial_expression="sad", voice={"tone": "quiet"},
            safety_blocked=True,
        )

    # 1.5) 角色校验
    character = store.get_character(user.user_id, payload.character_id)
    if character is None:
        raise HTTPException(status_code=404, detail="角色不存在")

    # 2) 反迎合：全员否定句式
    if any(p in payload.message for p in ALL_HATE_PATTERNS):
        return AIResponse(
            message=ALL_HATE_REPLY, animation="think", camera="close_up",
            emotion="empathy", emotion_intensity=0.6,
            facial_expression="sad", voice={"tone": "warm"},
            note="anti_sycophancy",
        )

    # 3) 熔断检查
    reason = await kill_switch.check(user.user_id)
    if reason is not None:
        headers = {"X-Budget-Exceeded": reason.value}
        if reason == DenyReason.DAILY:
            raise HTTPException(status_code=503, detail="今日成本预算已用完", headers=headers)
        raise HTTPException(status_code=429, detail="你短时间内说话太快啦，先休息一下", headers=headers)

    # 4) 记忆检索
    memories = store.search(user.user_id, payload.character_id, payload.message)

    # 5) 生成回复（有 LLM Key 时 Phase 9 接入 Gateway；当前规则模拟）
    reply_text = _build_reply(payload.message, memories, character_name=character.name)
    expression, animation, tone = _detect_emotion(payload.message)

    # 6) 输出侧反操纵黑名单检测（防御性兜底）
    if any(bad in reply_text for bad in MANIPULATION_BLACKLIST):
        reply_text = "我在呢，慢慢说，我会一直陪着你。"

    # 7) 写入新记忆（偏好类）；私密模式不写入
    new_candidates: list[dict] = []
    if not payload.private_mode:
        for pref in _extract_preferences(payload.message):
            item = store.add_memory(user.user_id, payload.character_id, pref, "preference", importance=0.8)
            new_candidates.append({"id": item.id, "content": item.content, "memory_type": item.memory_type})

    # 8) 关系更新
    deltas = {"familiarity": 0.01, "trust": 0.005, "intimacy": 0.01}
    rel, decay_drop = store.touch_relationship(user.user_id, payload.character_id, deltas)

    # 9) 计入成本
    await kill_switch.record_request(user.user_id, settings.demo_cost_per_request_usd)

    note = "local_rule_engine（未配置 OPENAI_API_KEY）" if not settings.llm_configured else None
    if decay_drop:
        note = (note or "") + f" | 关系衰减触发：intimacy -{decay_drop:.3f}"
    if payload.private_mode:
        note = (note + " | " if note else "") + "私密模式：本条未写入记忆"

    return AIResponse(
        message=reply_text,
        animation=animation if animation in ANIMATIONS else "idle",
        camera="medium",
        emotion=expression,
        emotion_intensity=0.4,
        relationship_delta=deltas,
        memory_candidates=new_candidates,
        facial_expression=expression if expression in EXPRESSIONS else "calm",
        voice={"tone": tone if tone in VOICE_TONES else "neutral"},
        note=note,
    )
