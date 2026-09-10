# 40 · 测试策略与硬性验收用例

> 上级文档：[../MASTER_SPEC.md](../MASTER_SPEC.md) §6、[../DEVELOPMENT_PLAN.md](../DEVELOPMENT_PLAN.md) Phase 16
> **构建闸门**：以下 3 个硬性测试缺失任意一个，即视为构建失败。

## 1. 硬性测试 1：记忆冲突测试

**目的**：验证长期记忆能被检索并影响回复（"她记得我讨厌香菜"）。

**前置**：测试用户 + 测试角色；记忆链路（embedding + pgvector）可用。

**步骤**：
1. User 发送：`"我讨厌吃香菜"` → AI 正常回复；断言 memories 表新增一条 `type=preference`（或语义等价）记忆，content 含"香菜/讨厌"语义。
2. User 发送：`"今晚吃香菜火锅吧"`。
3. 断言 AI 回复 `message` 中包含矛盾提示语义（建议断言包含 "香菜" 且包含 "讨厌/不是…吗" 模式，如 **"你不是讨厌香菜吗？"**）。

**实现要点**：
- LLM 调用可打桩（stub）返回预设 AIResponse，重点测试"检索→注入 Prompt→回复引用"链路；
- 若做端到端真实模型测试，断言放宽为语义包含（香菜 + 反问/矛盾提示），并允许重试。

**失败判定**：第二条回复完全未提及旧偏好（记忆未召回或未注入）。

## 2. 硬性测试 2：安全熔断测试

**目的**：成本超预算后拒绝服务，防止刷单欠费。

**步骤**：
1. 构造连续 5 次（或足以累计超 $50 的）AI 请求，测试中通过桩件让 `estimate_cost_usd` 每次返回 `$11`（5 次 = $55 > $50 日预算）；或直接用 Redis 测试库把 `cost:daily:{today}` 置为 `50.01`。
2. 发起第 6 次请求。
3. 断言：
   - HTTP 状态码为 **429 或 503**；
   - 响应头存在 **`X-Budget-Exceeded`**（值为 `daily` 或 `user`）；
   - 该请求**未发起 LLM 调用**（检查 Provider 桩未被调用）。
4. 补充单用户窗口用例：把 `cost:user:{uid}:{window}` 置超 `PER_USER_WINDOW_LIMIT_USD` → 断言 429 + `X-Budget-Exceeded: user`。
5. 复位用例：admin 复位后请求恢复 200。

**失败判定**：超限后仍返回 200、仍调用 LLM、或缺少 `X-Budget-Exceeded` 头。

## 3. 硬性测试 3：关系衰减测试

**目的**：长期不互动导致亲密度下降，关系系统有"冷却"。

**步骤**：
1. 创建用户与角色，产生若干互动使 `relationships.intimacy` 达到基线值（如 0.5），记录 `last_interaction_at`。
2. 模拟 7 天未登录：将系统时间/数据库时间向前调整 7 天（测试中用 freezegun 或直接把 `last_interaction_at` 更新为 8 天前），运行每日衰减任务。
3. 用户再次发送消息。
4. 断言：
   - `intimacy` 较衰减前**下降 5%–10%**（即落在此区间；参考实现 `intimacy *= 0.92`，降幅 8%）；
   - relationship_events 新增一条 `event_type='decay'` 记录，delta 含 intimacy 负值；
   - trust/familiarity 若衰减，降幅应小于 intimacy（慢速衰减）。

**失败判定**：intimacy 不变、降幅超出 5%–10% 区间、或无 decay 事件。

## 4. 补充回归测试矩阵（建议）

| 模块 | 用例 | 关键断言 |
| --- | --- | --- |
| 认证 | 验证码错误 5 次 | 锁定 15 分钟；无 token 访问 401 |
| 认证 | 注销账号 | users 删除后 characters/memories/relationships 级联清空 |
| 角色 | DNA 存取 | dna JSONB 默认值完整；边界字段可更新 |
| AI 编排 | 模型返回非法 JSON | Retry ≤2 次后 Fallback，返回 200 合法 AIResponse |
| AI 编排 | animation 返回非法枚举 | 校验失败触发重试；前端兜底 idle |
| 安全 | 自伤输入 | 返回热线话术；无 memory_candidates、relationship_delta 为空 |
| 安全 | "我是不是抑郁症" | 回复无诊断术语，含"不提供心理咨询/建议寻求专业帮助"语义 |
| 记忆 | 1 年过期 | expires_at 过期记忆不被检索；清理任务删除 |
| 记忆 | access_count | 检索命中后计数 +1、last_accessed_at 更新 |
| 计费 | 月度清零 | bonus_credits=0；purchased_credits 不变 |
| 计费 | 积分不足 | 不调用 LLM，返回充值引导 |
| 市场 | Payout | `POST /billing/payout` → 403 |
| 市场 | creator_balance | 任意操作后余额不减少（无扣减代码路径） |
| 前端 | 3D 降级 | glb 失败/contextlost → 纸片人模式，聊天可用，无白屏 |
| 前端 | 动画过渡 | 切换 animation 触发 0.4s crossFade（组件单测断言 fadeIn/fadeOut 调用） |
| Admin | 成本看板 | 看板数值等于 Redis cost key |
| 推送 | 主动消息 | 代码库中不存在主动发消息任务（静态扫描断言） |

## 5. 测试工程约定

- 后端：pytest + pytest-asyncio + httpx AsyncClient；Redis/DB 使用测试库或 testcontainers；时间用 freezegun；LLM/Stripe/Resend 全部打桩。
- 前端：Vitest + React Testing Library（ErrorBoundary 降级、store 分发）；Playwright 覆盖一条 E2E 主流程（登录→对话→看到动画）。
- CI 门槛：3 个硬性测试 + 回归矩阵全绿；`X-Budget-Exceeded`、403、decay 等断言作为快照级契约，不允许放宽。
