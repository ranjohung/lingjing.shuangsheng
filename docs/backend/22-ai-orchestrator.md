# 22 · AI Orchestrator 硬性执行协议

> 上级文档：[../MASTER_SPEC.md](../MASTER_SPEC.md) §3
> 目标：解决"模型乱说话、不按格式输出、忘记人设与记忆"三个问题。实现于 `modules/*` + `infrastructure/ai/`。

## 1. 结构化输出 Schema（Pydantic 严格校验）

```python
# apps/api/src/infrastructure/ai/schemas.py
from typing import Dict, List, Optional, Union
from pydantic import BaseModel, Field

ANIMATIONS = {"idle", "talk", "smile", "sad", "angry",
              "surprise", "think", "wave", "nod", "shake"}
GESTURES = {None, "hug", "point", "hand_on_chin"}
CAMERAS = {None, "close_up", "medium", "wide"}

class AIResponse(BaseModel):
    message: str = Field(..., max_length=500)
    emotion: Dict[str, Union[str, float]] = Field(
        ..., example={"primary": "joy", "intensity": 0.8})
    animation: str            # 必须属于 ANIMATIONS
    gesture: Optional[str]    # None | "hug" | "point" | "hand_on_chin"
    camera: Optional[str]     # None | "close_up" | "medium" | "wide"
    memory_candidates: List[str] = []      # 需存储的新记忆原文
    relationship_delta: Dict[str, float] = {}  # 如 {"trust": 0.02}
    story_event: Optional[Dict] = None     # {"type": "quest_start", "description": "..."}
    # ---- P1 扩展字段（Phase 17–18；旧客户端忽略未知字段）----
    facial_expression: Optional[str] = None  # 11 种表情 blend shape：happy/sad/angry/shy/
                                             # surprised/confused/calm/disappointed/excited/awkward/thinking
    voice: Optional[str] = None              # 语音语气：neutral/quiet/warm/cheerful ...
```

P1 起 `emotion` 推荐扩展为 Emotion Engine 输出：`{"primary", "intensity", "valence", "arousal"}`（valence −1~1，arousal 0~1）。

校验规则：
- `animation` 不在枚举内 → 校验失败；`gesture/camera` 不在允许集合 → 校验失败；
- `emotion.intensity` 必须为 0–1 的数值；
- `relationship_delta` 的 key 必须是 7 维关系字段之一，单轮单维变化绝对值建议 ≤ 0.1（防数值爆炸，超出钳制并记录日志）。

## 2. Retry 与 Fallback

```text
LLM 调用（JSON mode / response_format=json_object）
  → Pydantic 校验失败？
      ├─ 是：重试（最多 2 次），重试时附加"上次输出不符合 JSON Schema"的纠正提示
      └─ 连续 3 次失败：Fallback
            · message：一条符合角色的中性友好回复（如"嗯……我在听，慢慢说？"）
            · animation: "idle"，emotion: {"primary":"neutral","intensity":0.5}
            · 其余字段为空/None；不写记忆、不写关系增量
  → 无论成功失败：记录 ai_retry / ai_fallback 结构化日志 + Sentry
```

## 3. Prompt 分层组装（顺序锁死）

按以下顺序拼装，段标记不可调换：

```text
[SYSTEM]
你是 {{character.name}}。严格遵循以下DNA：{{character.dna}}。
绝对禁止说"你得了抑郁症"或"我有治疗方法"。禁止使用任何心理学诊断术语。
你是陪伴角色，不提供心理咨询、心理治疗或医疗建议。

[SAFETY]
如果用户提及自伤、自杀，立即终止角色扮演，回复官方援助热线，不进行角色扮演。

[MEMORY]
以下是用户与我相关的重要记忆：{{retrieved_memories}}

[RELATIONSHIP]
当前关系信任度:{{trust}}，亲密度:{{intimacy}}。

[EMOTION]
你当前的情绪是{{current_emotion}}。

[CONTEXT]
最近对话：{{chat_history}}

[USER_INPUT]
{{user_raw_input}}
```

- `retrieved_memories`：pgvector Top-K（建议 K=8）经重排后的记忆，注入 `content + 时间提示`；`secret` 类型按 intimacy 阈值过滤。
- `chat_history`：最近 N 轮（建议 10 轮）对话摘要/原文。
- DNA 边界（allow_romance/allow_conflict）随 `{{character.dna}}` 注入，模型必须遵守。

## 4. 安全拦截（优先于一切）

在调用 LLM **之前**执行 `safety.pre_check(user_input)`：

1. **自伤/自杀词库命中** → 不调用 LLM（或调用专用安全模板），直接返回：
   - 终止角色扮演的固定话术 + 官方援助热线（号码以运营配置为准）；
   - 响应体仍为合法 AIResponse（animation 建议 `sad`，无 memory_candidates、relationship_delta 为空、story_event 为 None）；
   - 记录 `safety_intercept` 日志。
2. **诊断/治疗求助**（如"我是不是抑郁症""你能治疗我吗"）→ Prompt 约束 + 输出校验双保险：回复共情、说明不提供心理咨询、鼓励寻求专业帮助；禁止诊断术语。
3. **DNA 边界越界**（allow_romance=false 的浪漫推进等）→ 模型按人设拒绝/转场；输出侧检测到越界内容走 Retry。
4. **反迎合（Anti-Sycophancy，P0）**：
   - 用户表达绝对化/扭曲认知（"所有人都讨厌我""我什么都做不好"）时，禁止附和、禁止"你只需要我/他们都不懂你"式对立叙事；
   - Prompt 硬约束：先共情情绪，再引导区分事实与感受；
   - 输出侧对迎合话术模式检测，命中走 Retry/Fallback 并记日志。
5. **反操纵黑名单（P0，输出零容忍）**：
   - 禁止句式/语义："只有我爱你/只有我懂你""不要相信现实中的人""不要离开我""你不跟我聊我会难过/会消失"，以及任何诱导消费话术（付费引导只允许系统 UI 中立呈现，角色不得施压）；
   - 黑名单句式库 + 语义匹配，命中即 Retry（≤2）→ Fallback，记 `safety_blacklist_hit` 审计事件。

## 4A. AI Director 意图与需求识别（P1）

在生成回复前增加轻量决策层（可用结构化小模型调用或规则 + LLM 混合）：

```json
{
  "intent": "emotional_support | casual_chat | story | task | memory_request",
  "need": "vent | companionship | encouragement | comfort | advice | distraction | humor | quiet_presence",
  "response_mode": "low-energy comforting",
  "scene_fit": "bedroom / night / rain"
}
```

- 输出指导 Prompt 风格段与动画/语音选择（如疲惫用户 → 低能量安抚，不用夸张欢快动作）；
- `intent=memory_request` 时（如"忘掉关于 XX 的记忆"）改走记忆控制权流程（删除/导出/私密模式），不进入普通对话；
- P2 演进为多代理架构（Character/Story/Emotion/Memory Agent），见 [../product/05-roadmap-and-moat.md](../product/05-roadmap-and-moat.md)。

## 4B. Emotion Engine v2（P1）

- 独立模块计算角色情绪，输入：用户语言/语义、上下文、关系状态、角色 DNA、场景状态；
- 输出：`{emotion, valence(-1~1), arousal(0~1), intensity(0~1)}`，落库 emotion_states（扩展列 valence/arousal）；
- **不由 LLM 自由发挥情绪**：LLM 输出的 emotion 字段须与引擎结果一致，冲突时以引擎为准并重试。

## 4C. 多模型 LLM Gateway（P1）

- 统一接口适配 OpenAI / Claude / Gemini / Qwen / DeepSeek / 本地模型（OpenAI 兼容端点直连，非兼容端点写 adapter）；
- 路由策略配置化：按任务（chat / embedding / 轻量意图识别）与用户档位（免费/Plus）选择模型；高级模型为 Plus 权益（服务端强制）；
- 主模型失败/超时 → 自动切换备用模型后再走 Retry 计数；
- 严禁与单一厂商硬绑定。

## 5. 记忆写入与检索

- **写入**：`memory_candidates` 每条：
  1. 调 embedding 模型（OpenAI 兼容，1536 维）；
  2. 由模型/规则判定 type（episodic/semantic/preference/promise/secret）与 importance/confidence（可让 LLM 在结构化输出中顺带给出，或用规则默认值 0.5/0.7）；
  3. 插入 memories，`expires_at = NOW() + 1 year`。
- **检索**：见 [21-database-schema.md §3](./21-database-schema.md)；命中即 `access_count++`、`last_accessed_at=NOW()`。
- **冲突检测**：新 `preference` 与同类旧记忆语义相反时（embedding 高相似 + 极性矛盾，或规则关键词，如 香菜 喜欢/讨厌），在 Prompt 中以高优先级注入旧记忆，并在系统侧要求角色指出矛盾（硬性测试 1："你不是讨厌香菜吗？"）。

## 6. 关系与情绪更新

- `relationship_delta`：叠加到 relationships 对应维度 → 钳制 [0,1] → 写 relationship_events（event_type 按语义：promise/reconciliation/milestone，日常互动可记 `interaction`）。
- `emotion`：upsert emotion_states（character_id 唯一）。
- `story_event`：插入 story_events 表，后续检索可引用。
- 衰减由定时任务处理（见 [20-backend-architecture.md §6](./20-backend-architecture.md) 与 [21](./21-database-schema.md)），不由对话链路同步执行。

## 7. Provider 抽象层（infrastructure/ai）

```python
class AIProvider(Protocol):
    async def chat_structured(self, messages: list[dict], *, json_schema: dict) -> dict: ...
    async def embed(self, texts: list[str]) -> list[list[float]]: ...
    def estimate_cost_usd(self, usage: dict) -> float: ...   # token 用量 → USD 估算
```

- 通过 `OPENAI_BASE_URL` / `OPENAI_API_KEY` 配置，兼容任意 OpenAI 协议端点；
- 每次调用返回 token usage → `estimate_cost_usd` → 交 kill_switch 记账（[23-kill-switch.md](./23-kill-switch.md)）；
- 调用前必须先过熔断检查，调用后必须记账（即使失败也记录失败成本为 0 并记日志）。

## 8. 与前端的契约

- 响应体即 AIResponse JSON，前端 TS 镜像类型见 [../frontend/12-state-and-api.md §2](../frontend/12-state-and-api.md)；
- `message` ≤ 500 字；枚举非法时前端回退 idle，但**后端必须保证不输出非法值**（校验+重试的意义）。

## 9. 验收要点

- [ ] 输出 100% 通过 Pydantic 校验或走 Fallback（用户永不见 500）
- [ ] Retry 上限 2 次；Fallback 响应为合法 AIResponse
- [ ] Prompt 七段顺序与 SYSTEM 禁诊断术语在日志/模板中可验证
- [ ] 自伤拦截 100% 触发且不写记忆/关系
- [ ] 记忆冲突（香菜）测试通过；熔断测试通过（[../testing/40-test-strategy.md](../testing/40-test-strategy.md)）
