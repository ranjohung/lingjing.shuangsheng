# 12 · 状态管理与 API 对接

> 上级文档：[../PRD.md](../PRD.md) ｜ 关联：[10-frontend-architecture.md](./10-frontend-architecture.md)、[../backend/22-ai-orchestrator.md](../backend/22-ai-orchestrator.md)

## 1. Zustand Store 切片

```text
apps/web/src/store/
  authStore.ts        # 用户、JWT、登录/登出
  characterStore.ts   # 当前角色（含 dna、avatar_config、voice_config）、关系数值
  sceneStore.ts       # 3D 场景状态：animation、gesture、camera、降级模式
```

### 1.1 authStore

```ts
interface AuthState {
  user: { id: string; email: string; role: 'user' | 'admin' } | null;
  token: string | null;
  bonusCredits: number;
  purchasedCredits: number;
  login(email: string, code: string): Promise<void>;
  logout(): void;
  refreshCredits(): Promise<void>;
}
```

### 1.2 characterStore

```ts
interface CharacterState {
  character: Character | null;          // 含 dna JSONB、avatar_config、voice_config
  relationship: Relationship | null;    // trust/intimacy/.../dependency_risk
  loadActiveCharacter(): Promise<void>;
}
```

### 1.3 sceneStore

```ts
type Animation = 'idle'|'talk'|'smile'|'sad'|'angry'|'surprise'|'think'|'wave'|'nod'|'shake';
type Gesture = null | 'hug' | 'point' | 'hand_on_chin';
type CameraShot = null | 'close_up' | 'medium' | 'wide';

interface SceneState {
  animation: Animation;
  gesture: Gesture;
  camera: CameraShot;
  degraded: boolean;          // 纸片人模式（由 ErrorBoundary 置 true）
  setPerformance(p: { animation?: Animation; gesture?: Gesture; camera?: CameraShot }): void;
}
```

## 2. 与后端的类型契约（TS 镜像 AIResponse）

```ts
// lib/types.ts —— 必须与后端 Pydantic AIResponse 逐字段对齐
interface AIResponse {
  message: string;                                    // ≤ 500 字
  emotion: { primary: string; intensity: number; valence?: number; arousal?: number };
  animation: Animation;
  gesture: Gesture;
  camera: CameraShot;
  memory_candidates: string[];
  relationship_delta: Partial<Record<
    'trust'|'intimacy'|'familiarity'|'respect'|'affection'|'conflict'|'dependency_risk',
    number
  >>;
  story_event: { type: string; description: string } | null;
  facial_expression?: FacialExpression | null;  // P1：11 种表情，非法回退 calm
  voice?: VoiceTone | null;                     // P1：neutral/quiet/warm/cheerful ...
}
type FacialExpression = 'happy'|'sad'|'angry'|'shy'|'surprised'|'confused'
                      |'calm'|'disappointed'|'excited'|'awkward'|'thinking';
type VoiceTone = 'neutral'|'quiet'|'warm'|'cheerful';  // 可扩展，非法回退 neutral
```

## 3. API SDK（lib/api.ts）

- 统一封装 fetch：baseURL 取 `NEXT_PUBLIC_API_BASE_URL`；自动附带 `Authorization: Bearer <token>`；
- 统一处理：
  - 401 → 清登录态、跳 `/login`；
  - 429/503 且响应头含 `X-Budget-Exceeded` → 抛出 `BudgetExceededError(scope)`，UI 展示友好额度提示；
  - 其他非 2xx → Sentry 上报 + 通用错误提示。
- 核心端点（与后端模块对应）：

| 端点 | 方法 | 说明 |
| --- | --- | --- |
| `/auth/request-code` | POST | 发送邮箱验证码（Resend） |
| `/auth/verify-code` | POST | 校验并返回 JWT |
| `/characters` | GET/POST | 角色列表 / 创建（DNA） |
| `/characters/{id}` | GET/PATCH/DELETE | 详情 / 更新 DNA 与配置 / 删除 |
| `/chat` | POST | 发送消息，返回 AIResponse |
| `/billing/subscription` | GET/POST | 订阅状态 / 创建 Stripe Checkout |
| `/billing/portal` | POST | Stripe Customer Portal |
| `/billing/webhook` | POST（服务端） | Stripe Webhook，前端不直接调用 |
| `/marketplace/items` | GET | 市场列表 |
| `/marketplace/purchase` | POST | 积分购买角色包 |
| `/marketplace/report` | POST | 侵权举报（takedown 流程入口） |
| `/memories` | GET/DELETE | 记忆列表/单条删除（P1） |
| `/memories/forget` | POST | 定向遗忘（按语义删除，P1） |
| `/memories/export` | POST | 导出记忆 JSON（P1，异步任务） |
| `/scenes` | GET | 可用场景列表（P1） |
| `/voice/tts` | POST | TTS 音频（P1，Plus） |
| `/admin/cost/today` | GET | 今日 $ 消耗（管理员） |
| `/admin/safety-events` | GET | 安全事件审计（管理员） |
| `/admin/kill-switch/reset` | POST | 熔断复位（管理员） |
| `/health` | GET | 健康检查 |

> 注意：**不存在** `/marketplace/payout` 的前端调用；后端该端点返回 403。

## 4. Hooks

- `useAuth()`：登录态、credits 轮询/订阅刷新。
- `useChat()`：消息列表、发送状态、把 AIResponse 分发到 sceneStore（animation/gesture/camera）与 characterStore（relationship_delta 即时插值更新）。
- `useCharacter()`：当前角色加载、DNA 更新（乐观更新 + 回滚）。
- `useCredits()`：积分余额；不足时引导 `/settings` 订阅/充值。

## 5. 对话主流程（前端侧时序）

```
用户发送消息
  → sceneStore 置 think（0.4s crossFade）
  → POST /chat
  → 成功：气泡渲染 message；sceneStore.setPerformance(animation, gesture, camera)
          characterStore 按 relationship_delta 本地预演数值
  → 429/503 + X-Budget-Exceeded：额度提示，不弹系统错误
  → 网络失败/3D 故障：纸片人模式，文字聊天继续可用
```

## 6. 安全注意

- JWT 存储采用 httpOnly cookie 优先（由后端 Set-Cookie）；若用 localStorage 仅存 token，XSS 面需通过 CSP 与输入转义控制。
- 前端不做任何权限判定的最终依据（admin 路由、价格、积分扣减均以后端为准）。
- 所有用户输入与 AI 文案在 React 中默认转义渲染；禁止 `dangerouslySetInnerHTML`。
