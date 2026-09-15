# PRD-v23 · 创作功能区 V3.0（修正版）

> 目的：修正扣子 v3 中对「小说辅助模拟器」与「我的作品 → 编辑作品」的错误改写。
> 前置：V21 小说辅助模拟器（保留原设计不改）· V20-L 创作中心骨架。
> 关联：[DEV_PLAN-v23-creator-v3.md](DEV_PLAN-v23-creator-v3.md)

---

## 0. 一句话定位

创作 Tab 由两部分组成：
- **小说辅助模拟器**：写新小说的引导式入口，保持 V21 原设计不变。
- **我的作品 → 编辑作品**：历史作品的继续续写 / 改写 / 图片更换 / 收费重设入口。

## 1. 范围与非目标

**做**：
- `creator-center.html` 创作主页接线修正。
- `work-editor.html` 新增「历史作品选择」入口，补全人物 / 道具 / 场景图片上传、收费章节与收费道具价格编辑。
- 保留扣子创建的多媒体 / 智能体 / 工坊等其它 V23 功能（只要它们不侵入上述两个核心入口）。

**不做**：
- 小说辅助模拟器的一切改动（V21 原设计）。
- 接真 LLM / 真支付（mock + `window.AIHelper` 钩子）。
- 跨设备作品云同步。

## 2. 功能清单

| ID | 功能 | 页面 | 核心规则 |
|---|---|---|---|
| CV-23-01 | 小说辅助模拟器入口修正 | `creator-center.html` | 卡片链接指向 `novel-ai-helper.html`；带实名门控 `LJRealname.gate()` |
| CV-23-02 | 我的作品 → 编辑作品入口 | `creator-center.html` | 板块标题右侧链接文案改为「编辑作品」，指向 `work-editor.html` |
| CV-23-03 | 历史作品选择视图 | `work-editor.html` | 无 `?w=` 参数时显示；列出 ≥2 部历史作品，含状态 / 字数 / 进度 / 最近编辑 |
| CV-23-04 | 继续续写 / 改写 | `work-editor.html` | 选择作品后进入编辑面板，保留 AI 润色 / 续写 / 重写 / 场景 / 对话工具 |
| CV-23-05 | 人物图片更换 | `work-editor.html` 人物面板 | 点击人物立绘或「换图」→ 本地选择图片 → FileReader 预览 → localStorage 持久化 |
| CV-23-06 | 道具 / 场景图片更换 | `work-editor.html` 素材面板 | 与人物图片同理，每个素材独立 key |
| CV-23-07 | 收费章节设置 | `work-editor.html` 收费面板 | 显示章节列表 + 免费/收费 toggle + 价格就地编辑（contenteditable） |
| CV-23-08 | 收费道具设置 | `work-editor.html` 收费面板 | 显示道具列表 + 启用 toggle + 价格就地编辑 |
| CV-23-09 | ?w=&tab= URL 直达 | `work-editor.html` | 支持从外部链直接进入某作品的指定标签页 |

## 3. 全局约束（继承项目铁律）

- 术语只用灵晶 / 灵玉 / 心屿 / 双生，0 第三方平台名；货币 UI 只有灵晶 + 灵玉。
- 所有 AI 生成恒 3-5 候选 + [换一批] + [我来说]；mock + `window.AIHelper` 钩子，不接真 LLM。
- 实名门控：创作类入口 `LJRealname.gate()`；商业化只对作者可见。
- 全手机版 `mobile-lock.css`；子页返回路径；0 破链。
- 小说辅助模拟器 0 改动。

## 4. 数据与持久化

- localStorage key：`lingjing_v23_work_editor`
- 存储结构：
  ```json
  {
    "images": { "assetKey": "data:image/png;base64,..." },
    "prices": { "price0": "5 灵晶", "price1": "10 灵晶" }
  }
  ```
- 历史作品清单硬编码在页面内（演示期），后续由 `novel-sim-store.js` / 后端作品接口替代。

## 5. 验收标准

1. 创作 Tab 主页「小说辅助模拟器」点击进入 `novel-ai-helper.html`（V21 三栏创作台）。
2. 创作 Tab 主页「我的作品」右侧显示「编辑作品」按钮。
3. `work-editor.html` 无参数时显示历史作品选择视图；点击作品后进入编辑态。
4. 每个历史作品卡有「继续续写」「改写」「图片管理」「收费设置」四个操作。
5. 人物 / 道具 / 场景图片可本地上传并持久化，刷新后仍显示上传图。
6. 收费章节与收费道具价格可点击编辑，刷新后保留。
7. 支持 `work-editor.html?w=xxx&tab=pricing` 直达。
8. 无关键 JS 错误，480px 无横向溢出。
