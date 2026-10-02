# MIRAI / 灵境 · 双生 — 实施状态 v6.4

更新：2026-09-12。当前为 **纯前端 prototype** 已落地 v5.6 ~ v6.4.1 + V17/V18/V20 全部交付，真实后端/支付/LLM 仍待接通。

> **v6.4 时代新增交付**（v5.x 明细见下表）：
>
> | 任务 | 状态与证据 |
> | --- | --- |
> | **v6.0-v6.4.1** 设计系统 + 5 Tab 共享壳 | ✅ shell-v64.css + 4 主 Tab 接入 + 沉浸页返回按钮（20/20） |
> | **V17** 世界/心屿功能区重构 + 创作者分成 | ✅ V17-B 14/14 · V17-G 16/16 |
> | **V18** 首页 4 层 + 心屿 5 子标签 + plot-runner 重做 + 去橙光化 | ✅ 13+21+18+9 = 61/61 |
> | **V20-A~H** 公版库 40 本真实语料 + 三国演义世界 + 手机锁定 + 启动登录 | ✅ 43/43 等（累计 336 项） |
> | **V20-I** 全项目接口审查 | ✅ [AUDIT_2026-09-12.md](AUDIT_2026-09-12.md)：32 页 + 35 入口 230+ 点击，修复 4 项（F-1~F-4），登记 7 项（O-1~O-7），13/13 回归 |

---

## 历史批次（v5.6 ~ v5.15 · 纯前端 prototype · 不依赖 Next.js）

| 任务 | 状态与证据 | 剩余边界 |
| --- | --- | --- |
| **N-v5.6** 5 题材 3D 真机可测版 | ✅ [game-3d.html](../output/preview/game-3d.html) v5.6 + 11 结局 STORY_TO_ENDING 映射 | — |
| **N-v5.7** 移动端 + FPS + 设置 | ✅ [v5.7-TEST-REPORT.md](v5.7-TEST-REPORT.md) + FPS HUD 50/30 阈值 | 真机部署待后续 |
| **N-v5.8** 重设计（聊天视图）| ✅ [v5.8-TEST-REPORT.md](v5.8-TEST-REPORT.md) → 已归档为 `redesign.html` | 未来可能重启 |
| **N-v5.10** SD 立绘 + Blender .glb | ✅ [v5.10-TEST-REPORT.md](v5.10-TEST-REPORT.md) 9 角色 + 9 场景替换占位 | 手部材质/动作待补 |
| **N-v5.11** 9 题材 + GLTFLoader + AudioFX | ✅ [v5.11-TEST-REPORT.md](v5.11-TEST-REPORT.md) 完整 AudioFX 模块 | — |
| **N-v5.12** 30 题材库 + 上传即生成 + 5 demo | ✅ [v5.12-TEST-REPORT.md](v5.12-TEST-REPORT.md) 5/5 章节 + 12/12 角色 + 5/5 高光 | 剩余 25 题材 demo 待补 |
| **N-v5.13** 沉浸剧情 UI | ✅ [v5.14-TEST-REPORT.md §1](v5.14-TEST-REPORT.md) 40 张真机截图 | — |
| **N-v5.14** 商业化 4 大系统 | ✅ [v5.14-TEST-REPORT.md](v5.14-TEST-REPORT.md) 14 张真机截图 | 真支付/真 LLM 待接 |
| **N-v5.15** 代码审查 + 死链修复 | ✅ [AUDIT_2026-09-10.md](AUDIT_2026-09-10.md) 9 页面 + 12 模块 + 10 交互全通过 | — |

---

## 验证结果（v5.6~v5.15）

- **NovelParser 覆盖审计**（v5.12）：5 demo 小说上传后，5/5 章节 + 12/12 角色 + 5/5 高光全覆盖，0 ERR
- **plot-runner 跑通**（v5.13）：5 demo 题材从开场到结局模态完整可玩，背景/立绘/对话框/选项/数值全部正常，40 张真机截图 0 console error
- **commerce.html 跑通**（v5.14）：5 demo 上传后自动评估版权分层 + 创建 22 收费点 + 质量报告生成 + 改编授权申请，14 张真机截图 0 console error
- **全链路集成**（v5.15）：9 页面 + 10 关键交互 + 12 JS 模块 API 完整暴露，0 console error；library.html `?genre=xxx` URL 参数 + 5 部 demo plot-runner 全链路打通

---

## 本地运行

v5.15 入口：[output/preview/library.html](../output/preview/library.html) 即可进入 30 题材库；其它入口：
- [product-preview.html](../product-preview.html) — 总览
- [commerce.html](../output/preview/commerce.html) — 商业化 4 大系统
- [plot-runner.html?novelId=demo_palace](../output/preview/plot-runner.html) — 经典沉浸剧情对话

依赖：纯静态 HTML + 原生 JS（无 Node/npm），数据库走 `window.DB` + localStorage（`lingjing_v514_*` 前缀）。

---

## 下一批工作顺序

1. 25 部剩余题材 demo 补齐（B-V5.16-01）
2. 接真 LLM（Qwen Turbo/Plus/Max 候选）增强对话生成（B-V5.16-02，`window.AIHelper.generate` 钩子已留）
3. IndexedDB 替代 localStorage 5MB 限制（B-V5.16-03）
4. 22 子文档（backend/frontend/infrastructure/testing/legal）同步 v5.14（B-V5.16-04，AUDIT §八已列）
5. 海外合规（GDPR / COPPA / 日韩 / 韩国）（B-V5.16-05）
6. 创作者维权（抄袭检测 + 法律资源对接）（B-V5.16-06）

---

## 历史记录（v4.1 / 2026-09-09 之前）

下方内容为 v4.1 时代的实施记录，**已不在本期工作范围**；保留作为审计证据。

### 文档 v5.1（2026-09-09 之前）原状

- ✅ 吕布篇从开局到 HE 完整闭环（开发身份）
- ✅ PostgreSQL / Alembic 数据层接入
- ✅ 基础 AI 编排 / 故事引擎 / 文本阅读器
- ✅ Web 端导航 / 伙伴 / 故事列表 / 进度看板（开发服务器 `:3000`）

### 原 n01-n08 验证

- 后端：在apps/api运行`.venv/Scripts/python.exe -m unittest discover -s tests -p "test_story*.py" -v`，10项通过。涵盖全部六结局可达、每路线30点六章、无断链、全状态回溯、并发重复请求、关系结局条件、参数篡改、用户隔离、数据库恢复、迁移升降级和审计。
- 前端：`node apps/web/node_modules/typescript/bin/tsc --noEmit -p apps/web/tsconfig.json`通过。
- 构建：在apps/web运行`node node_modules/next/dist/bin/next build`成功，/stories已静态生成。
- 浏览器：真实自建身份开局→选择→魅力50到53及貂蝉关系54→回溯恢复→逐项30次选择→HE守土有方→生成并下载PNG；390像素宽度无横向溢出。
- 存档重启：停止并重启本轮8011后端后，GET会话列表仍返回30/30、completed、development_sqlite。

### 2026-09-09 本批文档整合（原 v5.2）

- 正式品牌记录为灵境 · 双生 / Lingjing · Dual Souls；运行代码中的展示名替换列入B0/B1，尚未执行。
- PRD/DEVELOPMENT_PLAN更新为v5.0-draft；专题规范覆盖World/Story/Novel、陪伴双界、创作者导出、经济、目录与资产；详细来源和待裁决项见UPDATE_2026-09-09.md。
- 6份源附件存档，S05/S06哈希相同；15法律原稿拆分保存，前端引用和法律核验尚未完成。
- 本轮没有执行代码开发、数据库迁移、支付接入、图像/模型生成或运行服务变更。

### 2026-09-09 资料收齐（原 v5.1）

用户已确认全部聊天记录提供完毕，本节替代上文"等待继续上传"的历史下一步。S07与S05/S06哈希相同；累计7份附件归档。PRD及开发计划升级v5.1，补齐工程契约、九表DDL参考、七项缺口映射、九Sprint正反例证据与实施依赖顺序。
本次仍为文档交付，未执行数据库迁移、应用代码开发或SD/Blender资产制作；商业争议和法律核验保留独立状态，不能视为功能已实现。





### 2026-10-02 前端 API 接入（世界运行时）

- [x] `output/preview/js/novel-world-runtime.js` 的统一 `saveGame` 入口已增加后端同步，调用 `/api/v1/world-saves/{novel_id}/{slot}`。
- [x] 后端同步为非阻塞；API 未配置或不可用时继续使用 localStorage，避免静态预览和离线游戏被阻断。
- [x] 保留用户可配置的 `window.LJ_API_BASE` / `localStorage.lingjing_api_base`，便于部署环境接入真实 API。
- [x] 浏览器上下文回归已验证：保存请求携带 `Authorization: Bearer`，远端读取成功后恢复状态；API 不可用时仍保留本地降级。
- [x] 首页发现模块读取 `window.LJ_API_BASE` 或 `localStorage.lingjing_api_base`，通知/推荐接口不再固定请求静态站点自身。
- [ ] 生产环境仍需配置正式 JWT 签发方和部署 API 地址。

### 2026-10-02 发现接口与连接资源修复

- [x] 通知接口已落 SQLite `notifications`，按 `user_id` 隔离并支持已读写回；推荐目录明确标记为非个性化 bundled catalog。
- [x] SQLite 连接在角色/记忆/关系、经济、存档和发现模块中显式关闭，避免回归测试产生未关闭连接警告。
- [x] `apps/api` 标准库 unittest 回归：13 项通过；前端 `LJ_PAGES` JSON 结构校验：72 个页面可解析。
- [x] 已恢复 `apps/api/requirements-dev.txt` 中的 pytest 运行环境；pytest 全量回归 20 项通过（保留 1 项 Starlette/httpx 弃用警告，不影响结果）。
- [x] 新增 Alembic `0003_runtime_sqlite_tables`，将运行时实际使用的角色、记忆、关系、经济、世界存档和通知表纳入迁移链；迁移升级/降级回归通过。
### 2026-10-01 持久化推进（世界存档）

- [x] `apps/api/src/modules/world_saves.py` 已将 API 存档写入 SQLite `api_world_saves`，按用户、小说、槽位唯一约束保存。
- [x] 支持列表、读取、覆盖、删除以及进程重启后的恢复；`SAVES.clear()` 仍保留为测试清理钩子。
- [x] 完成隔离用户烟测和跨进程恢复烟测；已补标准库持久化回归测试。
- [ ] 仍需完成前端 API 接入和完整生产身份提供商配置。
### 2026-10-01 持久化推进（经济账本）

- [x] `apps/api/src/modules/economy.py` 已将灵晶、灵玉、行动值、世界货币、物品和交易记录写入 SQLite `economy_ledgers`。
- [x] 账本以 `user_id` 为主键，余额、商城购买、兑换、世界消费和交易查询均保持用户隔离。
- [x] 兼容现有 `LEDGERS.pop(user_id, None)` 测试清理语义；已完成编译、10 项 unittest、跨进程钱包烟测及隔离烟测。
- [ ] pytest 尚未安装，pytest 风格经济测试仍需在开发依赖恢复后执行；世界存档和前端 API 接入仍待完成。
### 2026-10-01 持久化推进（角色 / 记忆 / 关系）

- [x] `apps/api/src/modules/memory_store.py` 已接入 `SQLiteStore`；开发默认库固定为 `apps/api/story-development.db`。
- [x] 角色、记忆、关系均按 `user_id` 隔离；角色创建、记忆搜索/失活、关系衰减与更新均写入 SQLite。
- [x] 已完成跨进程重载读取烟测及用户隔离烟测；原有 10 项 unittest 全部通过。
- [ ] 经济账本和世界存档仍待迁移到数据库；前端仍待接入真实 API。
## 2026-10-01 后端评估

- [x] 确认正式产品需要后端：认证、跨设备存档、用户隔离、持久化经济账本和内容版本。
- [x] 确认当前 `apps/api` 仍为开发降级：角色/记忆/关系/经济为进程内数据，认证为 dev fallback。
- [x] 修复 API 虚拟环境依赖并完成后端回归基线（10 项 unittest 通过）。
- [x] 启用 SQLite 故事会话持久化并加入 HS256 JWT 校验基线。
- [ ] 将角色、记忆、关系、经济和完整游戏存档迁移到数据库；生产接入正式身份提供商。
- [ ] 完成前端 API 接入后再评估支付和生成服务。
- 详见 [BACKEND_ASSESSMENT_2026-10-01.md](BACKEND_ASSESSMENT_2026-10-01.md)。






