# 10 · 前端架构（Next.js App Router）

> 上级文档：[../PRD.md](../PRD.md) ｜ 关联：[11-3d-interaction.md](./11-3d-interaction.md)、[12-state-and-api.md](./12-state-and-api.md)、[../backend/22-ai-orchestrator.md](../backend/22-ai-orchestrator.md)

## 1. 技术栈（锁定）

| 维度 | 选型 |
| --- | --- |
| 框架 | **Next.js（App Router，React 18+，TypeScript 严格模式）** |
| 样式 | Tailwind CSS |
| 图标 | Font Awesome |
| 状态 | Zustand（3D 场景、用户、角色三个 slice） |
| 3D | Three.js + @react-three/fiber + @react-three/drei |
| HTTP | 自研 fetch 封装（`lib/api.ts`），JWT 自动携带 |
| 监控 | Sentry（`@sentry/nextjs`） |

工程位置：pnpm workspace `apps/web`。

## 2. 目录结构（强制）

```text
apps/web/src/
  app/                      # App Router 页面
    page.tsx                          # 【P1】首页「我的世界」3D 空间（时间感知待机）
    onboarding/page.tsx               # 【P1】新手引导：建角→关系定位→选世界/场景→首次开口
    (auth)/login/page.tsx           # 邮箱验证码登录（含 18+ 年龄确认）
    (auth)/register/page.tsx
    chat/page.tsx                   # 主聊天页（3D 场景 + 对话 + 语音 P1）
    characters/
      new/page.tsx                  # 创建角色（DNA 编辑，P1 含依恋/特质/目标）
      [id]/page.tsx                 # 角色详情/设置（场景切换 P1）
    memories/page.tsx               # 【P1】记忆管理：列表/单条删除/定向遗忘/导出/私密模式
    marketplace/page.tsx            # 创作者市场（无提现按钮；含版权承诺/举报入口）
    settings/page.tsx               # 订阅、积分、账号、隐私
    admin/page.tsx                  # 成本看板 + 安全事件审计（管理员）
    layout.tsx
  components/               # 原子/业务组件
    three/
      CharacterCanvas.tsx           # <Canvas> 封装
      CanvasErrorBoundary.tsx       # 3D 降级边界
      PaperCharacter.tsx            # 2D 纸片人模式（含表情差分）
      SceneEnvironment.tsx          # 【P1】场景环境：光照/天气/时间/环境音
    chat/MessageBubble.tsx、ChatInput.tsx、VoiceInput.tsx  # VoiceInput 为 P1 语音
    character/DnaEditor.tsx         # 大五人格滑块 + P1 扩展特质
    memory/MemoryList.tsx、ForgetDialog.tsx
    billing/CreditsBadge.tsx
    common/（Button、Modal 等，Tailwind + Font Awesome）
  hooks/                    # useAuth、useChat、useCharacter、useCredits、useVoice(P1)、useScene(P1)、useMemories(P1)
  lib/                      # api.ts（SDK）、sentry.ts、constants.ts（枚举）
  store/                    # useAuthStore、useCharacterStore、useSceneStore
```

## 3. 路由与访问控制

| 路由 | 访问要求 | 说明 |
| --- | --- | --- |
| `/`（首页「我的世界」，P1） | 登录 + 有角色 | 3D 空间首页，时间感知待机行为；点击角色进入 `/chat` |
| `/onboarding`（P1） | 登录 | 建角 → 关系定位 → 选世界/场景 → 首次开口 |
| `/login`、`/register` | 公开 | 验证码流程 + 18+ 年龄确认，成功后写 JWT |
| `/chat` | 登录 + 已有激活角色 | 无角色跳转创建页 |
| `/characters/new`、`/characters/[id]` | 登录 | DNA 编辑（P1 含依恋/特质/目标/弧光）、形象/声音配置、场景切换 |
| `/memories`（P1） | 登录 | 记忆列表、单条删除、定向遗忘、导出 JSON、私密模式开关 |
| `/marketplace` | 登录 | 浏览购买；**不渲染任何提现入口**；含版权承诺与侵权举报 |
| `/settings` | 登录 | 订阅状态、bonus/purchased 积分、隐私（记忆/私密模式）、注销账号 |
| `/admin` | 管理员 | 今日 $ 消耗看板、熔断复位、安全事件审计 |

中间件（`middleware.ts`）负责登录态重定向；管理员判定由后端角色接口返回，前端仅做 UI 隐藏，**权限以后端为准**。

## 4. 环境变量（前端仅可消费 NEXT_PUBLIC_ 前缀）

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...      # 仅 anon key，禁止 service role
NEXT_PUBLIC_SENTRY_DSN=...
```

禁止把 `SUPABASE_SERVICE_ROLE_KEY`、`STRIPE_SECRET_KEY`、`OPENAI_API_KEY` 等任何服务端密钥引入前端。

## 5. 全局约定

1. **3D 区域必须被 `CanvasErrorBoundary` 包裹**（详见 [11-3d-interaction.md](./11-3d-interaction.md)），任何情况下不允许白屏。
2. 所有 AI 响应字段以后端 AIResponse 契约为准，TS 镜像类型定义在 `lib/types.ts`（见 [12-state-and-api.md](./12-state-and-api.md)）。
3. 动画/手势/镜头枚举集中在 `lib/constants.ts`，禁止页面内散落魔法字符串。
4. UI 文案约束：
   - 创作者收益处固定文案"收益可兑换为平台 AI 算力积分（Credits）"，无提现字样；
   - 依赖风险提醒不得出现心理诊断/治疗词汇（见 [../product/04-safety-and-compliance.md](../product/04-safety-and-compliance.md)）。
5. 样式统一 Tailwind 工具类 + Font Awesome 图标 class，不引入第二套 UI 体系。
6. Sentry 初始化在 DSN 缺失时静默降级，不得阻断渲染。

## 6. 错误与加载态

- 对话请求中：输入框禁用 + 角色进入 `think`/`idle` 占位。
- HTTP 401：清除登录态并跳 `/login`。
- HTTP 429/503 且带 `X-Budget-Exceeded`：展示"今日体验额度已用完/系统繁忙"友好提示（不暴露成本数字给普通用户）。
- 网络断开：3D 区域自动进入纸片人模式，聊天输入给出重连提示。
