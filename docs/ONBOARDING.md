# 灵境 · 双生 — 5 分钟产品速读（v5.15 当前进度）

> 把你扔进任何一场对外介绍 / 面试 / 团队同步，都带得走的最小可传播版本。
>
> **当前最新版本**：v5.15（代码审查 + 完整说明书）/ v5.14（商业化 4 大系统）/ v5.13（沉浸剧情 UI）/ v5.12（30 题材库 + 上传即生成）
>
> **完整使用说明书**：[READING_GUIDE.md](READING_GUIDE.md) | **代码审查报告**：[AUDIT_2026-09-10.md](AUDIT_2026-09-10.md)

## 一、一句话

灵境·双生是一个 **30 题材 AI 辅助沉浸剧情式小说平台** + **商业化 4 大系统**（AI 辅助填表 + 版权分层 + 22 收费点 + 5 维质量审核）+ **3 级改编授权**。同一角色在小说世界里经历命运、在现实里陪你过日子。

## 二、为什么是"双生"而不是"AI 聊天"或"互动小说"

| 类型 | 在做什么 | 卡点 |
| --- | --- | --- |
| AI 聊天 | 文字对话 | 用久了角色人设漂移、记忆断线、关系停滞 |
| 互动小说（剧情对话） | 章节选项 | 玩一次通关就走，世界不再变 |
| 模拟人生 / RPG | 长期自由世界 | 没有故事张力，没有情感陪伴 |
| 虚拟陪伴（星野 / Character.AI） | 长期 AI 角色 | "它"住在对话框里，没有"世界"、没有"命运" |

→ 灵境·双生同时把这四块的爽点拼起来，并且做到**同一角色跨形态**。

## 三、五大关键体验

1. **代入感** —— 选一个已有小说世界或自己创造一个，一句话进入。
2. **掌控感** —— 章节选项 + 多结局 + 多周目存档，不喜欢就回溯。
3. **关系攻略** —— 六维关系 + 跨形态，NPC 好感会涨也会跌。
4. **自由成长** —— 现实模式人格成长、记忆沉淀、技能解锁。
5. **收集 / 共享** —— 命运卡、CG、Cosplay 服装、官方推荐位。

## 四、用户旅程（一张图）

```
成年验证 + 知情同意
   │
选故事 ─→ 选角 ─→ 进入世界 ─→ 章节 / 选项 ─→ 共通线 ─→ 分歧点
   │                                              │
   │                                          选择路线
   │                                              │
   │                                       个人线 + 养成
   │                                              │
   └────→ 结局 ─→ 命运卡 ─→ 存档 / 周目 共享 / 周目新开
                                │
                            攻略成功
                                │
                         带 TA 走出小说
                                │
                          日常陪伴 + 留言 + 周年纪念
                                │
                         "回到" 小说继续主线
```

## 五、不做什么（铁律）

- ❌ **不出售"必定被爱 / 必定成功 / 直接满级"**。付费只买"更好开局、更快成长、更多剧情、更美外观"。
- ❌ **不主动推送骚扰消息**。关怀走"用户授权 + 时区 + 静默时段"控制。
- ❌ **不做心理健康诊断**。心理模型只用来提升理解，不做诊断结论。
- ❌ **不做"只有我爱你"**。避免迎合 / 操纵 / 替代现实关系的引导。
- ❌ **不做违反公序良俗 / 涉未成年人 / 涉政治敏感**的内容。
- ❌ **不把 AI 输出"重新改写"成没失败过的命运**。事件、概率、后果忠实呈现。

## 六、商业模式三条腿

1. **会员订阅** —— 月卡 18 元 / 星卡 58 元 / 年付，月卡含 300 灵晶 / 星卡 800 灵晶。**会员折扣与永久权益按 v5.1 §ECON-02。**
2. **增值商品** —— 身份包（贵族 / 天才 / 隐藏身份）、属性丹 / 加速符、剧情包（角色个人线 / 隐藏剧情 / 真结局）、外观（C G / 服装 / 语音 / 称号 / 表白卡 / 卡牌皮肤）。
3. **创作者市场** —— 世界 / 角色 / 剧情 / CG / 语音均可由创作者制作并按 30%-70% 分润销售。

**核心原则：生存免费、体验付费；活下去不花钱、活得好才花钱。**

⚠️ 所有价格为 v5.1 候选，最终价格以工程接入时配置为准；价格冲突仍在 [UPDATE_2026-09-09.md §待裁决 C01-C20](../UPDATE_2026-09-09.md) 跟踪。

## 七、四大系统架构（了解即可）

```
        ┌──────────────── 灵境 · 双生 ─────────────────┐
        │                                              │
   ┌────▼─────┐   ┌──────────────┐   ┌──────────────┐   │
   │ 小说世界 │   │   数字人陪伴  │   │   创作者市场  │   │
   │  World OS │   │  Companion  │   │   Creator   │   │
   │  Story OS │   │  Character  │   │   IP        │   │
   │  Novel OS │   │  Emotion    │   │   Export    │   │
   └────┬─────┘   └──────┬───────┘   └──────┬───────┘   │
        └─────────┬──────┴───────┬──────────┘           │
                  ▼              ▼                       │
           Relationship OS    Memory OS                 │
                  │              │                       │
                  └──────┬───────┘                       │
                         ▼                               │
                   User Experience                       │
```

→ 详细规范全部在 v5.1，不在本速读展开。

## 八、合规与风险红线

| 风险 | 处理 |
| --- | --- |
| 未成年人 | 实名 + 年龄硬拦截，pending / active / frozen 三态，未成年冻结 |
| 自伤 / 他伤 | LLM 立刻断戏，给出援助热线（不模拟心理咨询师） |
| 隐私 | 用户对记忆有完整查看 / 删除 / 导出 / 注销权 |
| 内容违规 | 阿里云绿网 + 关键词 + 人工审核 + 举报申诉 + 累计 3 次封禁 |
| 操纵 / 迎合 | 反迎合 prompt、报告/审计 |
| 主动推送 | 默认关，用户主动开 + 时区 + 静默时段控制 |

15 份法律草稿全部收录在 [docs/legal](../legal/)，未做法律核验，不作为合规承诺。详见 [LEGAL_INTEGRATION_PLAN.md](../legal/LEGAL_INTEGRATION_PLAN.md)。

## 九、当前进度（v5.15 状态 · 透明）

**当前最新版本：v5.15**。代码 prototype 已完整落地 v5.6~v5.14 全部 9 个版本的工作；v5.15 是代码审查与说明书补全。

### 9.1 已交付（v5.6 ~ v5.15 · 2026-09-09 晚 ~ 2026-09-10 晚）

- ✅ **30 题材库** — [library.html](output/preview/library.html) 全分类（玄幻/仙侠/都市/校园/历史/军事/游戏/体育/科幻/灵异/悬疑/二次元/古言/现言/浪漫青春 等 30 大类），空仓显示 + 一键上传
- ✅ **上传即生成** — [novel-upload.html](output/preview/novel-upload.html) 4 步向导：[novel-parser.js](output/preview/js/novel-parser.js) 规则引擎自动分章/抽角色/识场景/标高光
- ✅ **覆盖审计** — `runAudit()` 自动核查 chaptersCovered / charsCovered / highlightsCovered，缺则并入首章主节点（5/5 章节 + 12/12 角色 + 5/5 高光 = 全覆盖，0 ERR）
- ✅ **剧情编辑器** — [novel-edit.html](output/preview/novel-edit.html) 节点/角色/选项/实时预览
- ✅ **沉浸剧情对话 UI** — [plot-runner.html](output/preview/plot-runner.html) 全屏场景 + 角色立绘 + 底部对话框 + 打字机 + 悬浮选项 + 数值跳动 + 结局模态
- ✅ **9 题材 3D 真实资源** — [game-3d.html](output/preview/game-3d.html) 集成 SD 场景图 + Blender .glb 模型 + GLTFLoader，FPS 监控
- ✅ **音频模块** — [audiofx.js](output/preview/js/audiofx.js) 5 音阶 BGM + SFX + Ambient
- ✅ **商业化 4 大系统** — [commerce.html](output/preview/commerce.html) 一站式管理
  - AI 辅助填表（[ai-helper.js](output/preview/js/ai-helper.js) 22 字段模板 + 2-5 候选动态生成）
  - 版权分层（[copyright-tier.js](output/preview/js/copyright-tier.js) L1-L4 自动判定 + 4 种证书）
  - 收费点 22 种 5 类（[monetization.js](output/preview/js/monetization.js) 剧情锁/道具/卡牌/外观/功能）
  - 质量审核（[quality-review.js](output/preview/js/quality-review.js) 5 维度 S/A/B/C/D 等级 + 3 级审核）
- ✅ **改编授权** — A 全版权 60% / B 单品类 70% / C 自主 90%，5 类（影视/动漫/游戏/有声/海外）
- ✅ **11 张数据表** — [db.js](output/preview/js/db.js) localStorage 抽象层 + `lingjing_v514_*` 前缀
- ✅ **完整代码审查** — [AUDIT_2026-09-10.md](AUDIT_2026-09-10.md) 9 页面 + 12 模块 + 10 交互 + 22 文档全部审查通过
- ✅ **完整使用说明书** — [READING_GUIDE.md](READING_GUIDE.md) 500+ 行

### 9.2 未实现、阻塞真后端/真支付的硬门槛

- ❌ 真实实名服务、真实年龄硬拦截（仍为开发沙箱）
- ❌ 真实支付接通（微信 / 支付宝）+ 退款对账（**MVP 不开放**，仅灵晶单位）
- ❌ 真实 AI 审核 + 4 级安全管线（规则引擎 mock，保留 `window.LLMJudge` 钩子）
- ❌ 真 LLM 接入（**当前不接**，规则引擎 + 模板库 mock，保留 `window.AIHelper.generate` 钩子）
- ❌ 真后端持久化（**当前 localStorage**，保留 `window.DB` 抽象层供切真后端）
- ❌ 25 部 demo 题材待补（当前 5/30：古言/悬疑/奇幻/科幻/校园）
- ❌ 真机部署（当前 Chromium swiftshader 真机模拟）

### 9.3 完成事件清单（按时序）

| 时间 | 版本 | 事件 |
| --- | --- | --- |
| 09-09 晚 | v5.6 | 5 题材 3D 真机可测版 + 11 结局 |
| 09-09 晚 | v5.7 | 移动端适配 + FPS 监控 + 设置面板 |
| 09-09 晚 | v5.8 | 重设计（聊天视图）— 历史归档 |
| 09-09 末 | v5.10 | SD 真实立绘 + Blender .glb 模型 |
| 09-10 凌晨 | v5.11 | 9 题材 + GLTFLoader + AudioFX 重建 |
| 09-10 上午 | v5.12 | 30 题材库 + 上传即生成 + 5 demo |
| 09-10 下午 | v5.13 | 沉浸剧情对话 UI 完成（修复 fade-in bug） |
| 09-10 晚 | v5.14 | 商业化 4 大系统 |
| 09-10 晚 | v5.15 | 全项目代码审查 + 死链修复 + 完整说明书 |

正式发布必须每一项都有证据，不接受"模拟通过"。

## 十、给不同角色的一句话

| 你是谁 | 5 分钟内先看 |
| --- | --- |
| 产品 / 战略 | 这一页 + [PRD](../PRD.md) + [WORLD_OS_SPEC](../WORLD_OS_SPEC.md) |
| UI / 设计 | [UI_DESIGN_GUIDE](UI_DESIGN_GUIDE.md) + [product/06](../product/06-world-directory-and-ui.md) |
| 前端 / Next.js | [NEXTJS_DEV_GUIDE](NEXTJS_DEV_GUIDE.md) + [DEVELOPMENT_PLAN](../DEVELOPMENT_PLAN.md) |
| 后端 / Python | [NEXTJS_DEV_GUIDE](NEXTJS_DEV_GUIDE.md) §后端 + [backend/26](../backend/26-world-os-engineering-contract.md) |
| AI / Prompt / 数据 | [DUAL_SOUL_SPEC](../DUAL_SOUL_SPEC.md) + [backend/26 §八步AI链](../backend/26-world-os-engineering-contract.md) |
| 美术 / SD | [ASSET_PRODUCTION_GUIDE §SD 立绘](ASSET_PRODUCTION_GUIDE.md) + [product/06 §CONTENT-02](../product/06-world-directory-and-ui.md) |
| 3D / Blender | [ASSET_PRODUCTION_GUIDE §Blender 模型](ASSET_PRODUCTION_GUIDE.md) + [product/06 §ASSET-01](../product/06-world-directory-and-ui.md) |
| 法务 / 隐私 | [legal](../legal/) + [LEGAL_INTEGRATION_PLAN](../legal/LEGAL_INTEGRATION_PLAN.md) |
| 商务 / BD | 这一页 §六、七、九 |

---
v5.2 仅作结构补强；任何内容冲突以 v5.1 各规范为准。
