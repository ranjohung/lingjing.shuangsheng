> **2026-09-08 规范更新**：以 [MIRAI_SPEC v4.1](../MIRAI_SPEC.md)、当前 PRD 和 DEVELOPMENT_PLAN 为准。以下旧版内容保留参考；3D 首发、小说世界后置、Stripe 首发和旧 Phase 编号不再有效。MVP 为2D陪伴与完整互动小说；正式验收须区分开发模拟与已接通能力。

# 03 · 功能需求详述

> 上级文档：[../PRD.md](../PRD.md)（FR 编号与优先级以 PRD 为准）。本篇补充用户故事与业务规则细节。

## 1. 账号与认证（FR-AUTH）

- **用户故事**：作为新用户，我想用邮箱收到 6 位验证码即可注册登录，不需要记密码。
- **业务规则**：
  - 验证码由 Resend 发送（禁止 Supabase 自带邮件），6 位数字，10 分钟有效；
  - 同一邮箱 5 次验证错误锁定 15 分钟；60 秒内不可重复发送；
  - 后端所有受保护接口经 JWT/Supabase 校验（`core/security.py`）；
  - 注销账号触发 users → characters/memories/relationships 的级联删除。

## 2. 角色与 Character DNA（FR-CHAR）

- **用户故事**：作为用户，我想捏一个性格、语气、边界都由我定义的专属角色。
- **DNA 结构（契约，逐字对齐）**：

```json
{
  "personality": {
    "openness": 0.5, "conscientiousness": 0.5, "extraversion": 0.5,
    "agreeableness": 0.5, "neuroticism": 0.5, "warmth": 0.5, "humor": 0.5
  },
  "values": [],
  "likes": [],
  "dislikes": [],
  "speech_style": "neutral",
  "boundaries": { "allow_romance": false, "allow_conflict": true }
}
```

- 所有维度取值 0–1；`values/likes/dislikes` 为字符串数组；`speech_style` 枚举（如 neutral/gentle/playful/formal，MVP 至少支持 neutral）。
- `avatar_config = { model_url, texture_variant }`；`voice_config = { provider, voice_id }`。
- 创建角色时自动创建 relationships 行，默认值：trust 0.3 / intimacy 0.1 / familiarity 0.2 / respect 0.4 / affection 0.2 / conflict 0.0 / dependency_risk 0.0。

## 3. 对话（FR-CHAT）

- **用户故事**：我发一句话，角色用符合人设的文字 + 表情动作回应，并且记得我们之前聊过的事。
- **业务规则**：
  - 响应必须为结构化 AIResponse（见 [../backend/22-ai-orchestrator.md](../backend/22-ai-orchestrator.md)），`message ≤ 500` 字；
  - 模型输出非法 → Retry 最多 2 次 → 仍非法则 Fallback 静默友好回复（不暴露错误）；
  - 自伤内容 → 安全拦截：终止角色扮演、回复援助热线、**不写记忆、不写关系增量**；
  - 调用顺序：kill_switch 检查 → 记忆检索 → Prompt 组装 → LLM → 校验/重试 → 成本记账 → 记忆/关系/情绪落库。

## 4. 记忆系统（FR-MEM）

- **记忆类型**：`episodic`（事件）、`semantic`（事实）、`preference`（偏好，如"讨厌香菜"）、`promise`（承诺）、`secret`（秘密）。
- **生命周期**：
  1. 写入：AIResponse.memory_candidates → 生成 embedding(1536) → 入库，带 importance(0–1)、confidence(0–1)；
  2. 检索：pgvector 余弦 Top-K（ivfflat 索引）→ 按重要性/时近性/访问衰减重排；
  3. 使用：命中记忆 `access_count++`、`last_accessed_at = NOW()`；
  4. 遗忘：`decay_factor=0.01/天` 降低排序分；`expires_at`（默认 1 年）到期不检索并由定时任务清理；
  5. secret 类型仅在 intimacy 高于阈值时可被引用。
- **冲突识别**：新偏好与旧偏好矛盾时（如"喜欢香菜" vs 旧记忆"讨厌香菜"），角色必须在回复中自然指出矛盾（硬性测试 1）。

## 5. 情绪系统（FR-EMO）

- 情绪结构：`{ "primary": "joy", "intensity": 0.8 }`。
- primary 建议枚举：joy, sadness, anger, fear, surprise, disgust, neutral, affection（前端动画只消费 10 个 animation 枚举，情绪到动画有映射表）。
- 情绪每轮由 AIResponse.emotion 更新并持久化，下一轮注入 `[EMOTION]`；intensity 钳制 0–1。

## 6. 关系系统（FR-REL）

- 7 维：trust / intimacy / familiarity / respect / affection / conflict / dependency_risk，全部 0–1。
- 每轮 AIResponse.relationship_delta（如 `{"trust": 0.02}`）叠加并钳制；每次变更写 relationship_events：
  - event_type：`first_meeting, promise, betrayal, reconciliation, milestone, decay` 等；
  - delta：JSONB 记录具体变化，如 `{"trust": 0.05}`。
- **衰减规则（硬性测试 3）**：每日定时任务扫描，用户连续 7 天未与角色互动：
  - intimacy 下降 5%–10%（建议 `intimacy *= (1 - 0.08)`，并在 0.90–0.95 区间取确定性值）；
  - trust/familiarity 慢速衰减（建议 2%–5%）；conflict 随时间缓慢消解；
  - 衰减同样写入 relationship_events（event_type=decay）。
- dependency_risk：由使用频率、情感依赖措辞等信号计算；超阈值时前端展示温和提醒（不诊断、不说教）。

## 7. 剧情与场景（FR-STORY / FR-SCENE）

- AIResponse.story_event：`{ "type": "quest_start", "description": "..." }`，入库后可在后续检索中引用。
- camera：`close_up`（亲密/强烈情绪）、`medium`（常规对话）、`wide`（剧情/场景展示）。
- gesture：`hug / point / hand_on_chin`（null 表示无手势）。

## 8. 3D 前端体验（FR-3D）

- 正常：Three.js 渲染 glb，播放 idle/talk/smile/sad/angry/surprise/think/wave/nod/shake。
- 异常：glb 加载失败 / WebGL 上下文丢失 / 网络断开 → ErrorBoundary 捕获 → **2D 纸片人模式**（静态 PNG 头像 + 文字气泡），聊天功能不中断、不白屏。
- 动画切换必须 crossFade **0.4 秒**，禁止瞬间跳切。
- 详见 [../frontend/11-3d-interaction.md](../frontend/11-3d-interaction.md)。

## 9. 支付与积分（FR-BILL）

- Stripe 测试模式先行；Webhook 必须校验 `STRIPE_WEBHOOK_SECRET` 签名。
- 积分账户：
  - `bonus_credits`：订阅赠送，**每月 1 号 00:00 UTC 定时任务清零**；
  - `purchased_credits`：充值获得，不过期；扣减顺序建议先 bonus 后 purchased。
- 每次 AI 调用按模型估算成本扣减积分；积分不足 → 拒绝 AI 请求并引导充值（不触发熔断错误样式）。

## 10. 创作者市场（FR-MKT）

- 上架内容：角色 DNA 模板、3D 形象（glb + 贴图）。
- 购买：积分支付 → 购买方获得角色副本（拷贝 characters 行及资源引用）。
- 收益：`creator_balance` **只增不减**；Payout 端点 MVP 无条件 **403 Forbidden**；前端无提现按钮，文案："收益可兑换为平台 AI 算力积分（Credits）"。

## 11. 管理后台（FR-ADM）

- 今日 $ 消耗看板：数据源 Redis `cost:daily:{YYYY-MM-DD}`，与熔断器同源，保证看到的就是熔断依据。
- 用户/角色检索与停用；熔断手动复位（清除/重置当日 cost key）。
- 仅管理员角色可访问（service role 校验）。

## 12. 通知策略（反骚扰硬规则）

- MVP **不提供** AI 角色主动给用户发消息/推送的任何功能：
  - 后端不存在主动消息定时任务；
  - 管理后台无"开启主动推送"开关；
  - 仅保留事务性邮件（验证码、订阅凭证）。
- 首次见面的角色主动开口（onboarding）属于会话内行为，允许。
- P2 人生模拟产生的角色"离线生活"内容，**只在用户下次进入时呈现**，绝不推送。

## 13. P1 补充功能（详见 PRD §3.9–3.10 与 [../DEVELOPMENT_PLAN.md](../DEVELOPMENT_PLAN.md) Phase 17–19）

- **语音（Voice Engine）**：STT 语音输入 → 文字管线 → TTS 角色语音 → 嘴型同步；voice 语气风格（quiet/warm/cheerful）；语音为 Plus 权益；任一环节失败回退文字。
- **Emotion Engine v2**：不由 LLM 随口决定情绪，独立模块输出 valence/arousal/intensity；识别用户 need（倾诉/陪伴/鼓励/安慰/建议/转移注意力/幽默/安静陪伴）。
- **DNA 扩展**：依恋类型（secure/anxious/avoidant/disorganized，仅作角色行为模型）、扩展特质、信念、目标、角色弧光。
- **场景即状态**：10 个内置场景；时间/天气/光照/环境音注入 AI 上下文，深夜雨天不会欢快跳舞；场景可切换。
- **剧情状态机**：世界状态 → 用户行动 → 事件 → 叙事 → 关系/记忆/世界更新，跨会话不重置。
- **首页「我的世界」+ 新手引导**：3D 空间首页、时间感知待机行为；选角色→选关系定位→选世界→进房间→角色首次开口。
- **记忆控制权**：单条删除、定向遗忘（"忘掉关于 XX 的记忆"）、导出 JSON、私密模式（不写记忆）。
- **多模型 Gateway**：多厂商统一接口、按任务/档位路由、失败切换。

## 14. P2 远期（护城河，见 [05-roadmap-and-moat.md](./05-roadmap-and-moat.md)）

- 世界/同人引擎（World/Lore/Timeline/User Role、小说角色导入、同人私域模拟、官方授权 IP 通道）；
- 人生模拟（角色离线工作/日程/社交/目标）；
- 一句话创建世界（AI 生成场景+角色+灯光+音乐+天气+剧情）；
- AI Director 多代理、市场订阅分成与排行、记忆图谱、记忆静态加密。
