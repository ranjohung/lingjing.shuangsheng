# DEV_PLAN-v23 · 创作功能区 V3.0（修正版）

> 对应 [PRD-v23-creator-v3.md](PRD-v23-creator-v3.md) 的实现计划。

## 1. 目标

- 修正 `creator-center.html` 中「小说辅助模拟器」与「编辑作品」的接线。
- 把 `work-editor.html` 升级为历史作品编辑入口：选择 → 续写/改写/图片/收费。
- 不触碰 V21 小说辅助模拟器相关资产。

## 2. 关键文件变更

| 文件 | 动作 | 说明 |
|---|---|---|
| `output/preview/creator-center.html` | 改 2 处链接 | 小说辅助模拟器 → `novel-ai-helper.html`；我的作品「编辑全部」→「编辑作品」 |
| `output/preview/work-editor.html` | 大幅改造 | 新增作品选择视图、真实图片上传、价格编辑、URL 直达 |
| `scripts/test_v23_work_editor.py` | 新增 | 27 项 Playwright 验收测试 |
| `docs/PRD-v23-creator-v3.md` | 重写 | 本 PRD 修正版 |
| `docs/DEV_PLAN-v23-creator-v3.md` | 重写 | 本 DEV_PLAN 修正版 |

## 3. 实现步骤（已执行）

1. **入口修正**
   - `creator-center.html` 中「小说辅助模拟器」卡片 `href` 改为 `novel-ai-helper.html` 并恢复实名门控。
   - `creator-center.html` 中「我的作品」右侧链接改为「编辑作品」。

2. **work-editor.html 结构改造**
   - 新增 CSS：`.wp-view` / `.wp-card` / `.wp-acts` / `.price-edit` / `.back-to-picker`。
   - 新增 `#wpView` 作品选择视图，无 `?w=` 时通过 `body.picking` 显示。
   - 新增隐藏文件输入 `#imgPick`，用于本地上传。
   - 新增「返回作品列表」入口。

3. **交互逻辑**
   - `renderPicker()`：渲染 4 部历史作品卡片。
   - `openWork(id, tab, rewrite)`：进入编辑态并切换标签页。
   - `changeImg()` + `wireAssetUploads()`：替换原「换图」Toast，实现真实上传与预览。
   - `editPrice()` / `savePrice()`：价格就地编辑并持久化。
   - `initWorkEditor()`：根据 URL `?w=` / `?tab=` 初始化。
   - `restoreState()`：从 localStorage 恢复图片和价格。

4. **测试**
   - 27 项 Playwright 验收，全部通过。

## 4. 测试清单

| 用例 | 结果 |
|---|---|
| 无参数进入显示历史作品选择视图 | PASS |
| 作品卡含 继续续写 / 改写 / 图片管理 / 收费设置 | PASS |
| 点击「继续续写」进入编辑态并带 `?w=` 参数 | PASS |
| 人物 / 道具 / 场景图片本地上传 + localStorage 持久化 | PASS |
| 刷新后图片与价格仍保留 | PASS |
| 收费章节 / 收费道具价格可编辑 | PASS |
| `?w=xxx&tab=pricing` 直达 | PASS |
| 返回作品列表可用 | PASS |
| 480px 无横向溢出 / 无关键 JS 错误 | PASS |

## 5. 已知限制

- 历史作品清单目前硬编码在页面内，后续需接入 `novel-sim-store.js` 或作者作品 API。
- 图片使用 base64 存 localStorage，单张大图可能超限；后续迁移到 IndexedDB 或后端存储。
- AI 续写 / 润色仍走 mock（`showToast`），符合项目铁律「不接真 LLM」。

## 6. 后续可选迭代

- 接入真实作品列表与章节数据。
- 把 `work-editor.html` 内联脚本拆出为 `js/work-editor.js`。
- 增加「发布管理」与「数据看板」的数据联动。
