# -*- coding: utf-8 -*-
"""V27：向 docs/PRD.md 与 docs/DEVELOPMENT_PLAN.md 追加增量登记章节（append-only，不动既有内容）。"""
import io, sys, os

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

PRD_ADD = '''

---

## V27.0 编辑我的作品 — 修复与增强（2026-09-19 · PRD 增量登记）

> 来源需求：《创作功能区「编辑我的作品」完整开发文档 V1.0》+《作品卡片操作按钮修复文档》（用户原文，针对 trae 反复未修复的问题由本轮一次性收口）。承接 V26 工作台（my-works 历史全集 + workshop 工作台），覆盖 my-works / work-editor / novel-canon-reader 三页。

### 需求清单（P1-P5 全部受理并交付）

| 优先级 | 需求 | 交付裁决 |
| --- | --- | --- |
| P1 Bug | 右上角返回按键点击没反应 | 根因：`history.back()` 在 iframe srcdoc 路由下无自身历史。修复：改 `LJBack()`（postMessage `{lj:'back'}` → shell 弹 LJ_BACK_STACK） |
| P2 Bug | 点击"添加收费道具"不能添加 | 根因：旧弹窗 innerHTML 引号嵌套截断导致按钮失效。重写六字段弹窗：类型 5 pill / 名称 / 描述 / 价格 / 图片三方式 / 触发条件；支持编辑与删除，按 wid 分组持久化 |
| P3 Bug | 续写功能不能续写 | 根因：候选只高亮无[使用]动作 + aiAssist 找错编辑器。对齐小说辅助模拟器：4 候选 + [使用]写入正文 + 🔄换一批 + ✍️我来说 + AI 润色/重写/场景描写/对话优化 + 字数状态栏实时更新 + 章节内容保存恢复 |
| P4 缺失 | 作者上传/修改背景图、人物立绘、道具图标 | 命名「图片管理」（素材 Tab 重写）：背景图/人物立绘/道具图标三区；三方式 = 上传本地（JPG/PNG ≤5MB）/ AI 生成（4 候选 + 换一批）/ 系统预设库；版本管理自动保留旧版，可一键回滚（含默认样式 V1） |
| P5 缺失 | 预览支持选择章节 + 真实小说世界效果 + 反馈闭环 | 预览弹层列全部章节（含"从第一章开始预览"）→ 跳真实小说世界 Runtime（八层舞台：背景/立绘/对话框/热点）→ 顶部预览悬浮条一键返回 → 反馈面板三组满意度（背景图/人物立绘/收费道具，默认不满意显示跳转按钮）→ 直跳对应修改区 |

### 红线遵守
- 界面布局保持现状，只补功能；全部按钮实际可点击（Playwright 39/39 断言），无"开发中"占位
- 不接真 LLM / 真支付（候选池轮换 mock + AIHelper 钩子）；货币只用灵晶；Toast/自绘弹窗替代 alert/confirm
- 删除作品走确认弹窗 + 隐藏名单持久化，收益记录保留

### 存储键（V27 新增）
- `lingjing_v527_hidden_works`：已删除作品名单（my-works 过滤）
- `lingjing_v527_monet_items`(+`_hidden`)：收费道具按作品 wid 分组
- sessionStorage `lingjing_v527_preview_pending`：预览上下文（10 分钟有效，返回后弹反馈面板）

### 关联修复（回归中发现并一并修复）
- work-editor 引导时序：`initWorkEditor()` 同步执行时 V27 后置脚本块函数未定义（`renderMonetItems is not defined`）→ 延迟至 DOMContentLoaded
- `applyAsset` 首次替换默认资产未记录版本 → 系统默认样式自动记为 V1，保证可回滚
'''

PLAN_ADD = '''

---

## 2026-09-19 新增计划：V27 编辑我的作品 — 修复与增强（已交付）

### 工作包列表

| ID | 工作包 | 交付物 | 状态 |
| --- | --- | --- | --- |
| V27-A | my-works：P1 返回修复 + 卡片 6 操作按钮 + 删除作品（确认弹窗/持久化/列表过滤） | scripts/v27_fix_my_works.py | ✅ |
| V27-B | work-editor 结构与样式：图片管理三区面板 + 弹窗/候选/反馈 CSS | scripts/v27_fix_work_editor_p1.py | ✅ |
| V27-C | work-editor JS：P2 收费弹窗（六字段+编辑删除）、P3 续写（候选使用/换一批/我来说/字数/章节保存）、P5 预览发起与反馈面板 | scripts/v27_fix_work_editor_p2.py | ✅ |
| V27-D | canon-reader：preview=1 接收端（预览悬浮条 + 章末"← 返回编辑器"） | scripts/v27_fix_canon_reader.py | ✅ |
| V27-E | 引导时序修复（DOMContentLoaded）+ 版本 V1 入账修复 + 反馈默认跳转修复 | scripts/v27_fix_we_bootstrap.py / v27_fix_we_version.py / v27_fix_we_feedback.py | ✅ |
| V27-F | 全链路回归 + 截图 + 文档登记 | scripts/test_v27_edit_works.py · screenshots/v27/（13 张） | ✅ 39/39 |

### 验收对照（需求文档 8 条）
1. ✅ 作品卡片六按钮：继续续写 / 收费 / 数据 / 预览 / 图片管理 / 删除（审核中/已下架卡按状态显示申诉、质检等）
2. ✅ 右上角返回可点击，返回上一级（弹栈实测：my-works → 创作中心）
3. ✅ 添加收费道具弹窗六字段可填写、图片三方式、保存后入列并持久化；支持编辑/删除
4. ✅ 续写与小说辅助模拟器一致：4 候选 [使用] 写入正文、换一批、我来说、润色/重写/场景/对话、字数实时
5. ✅ 图片管理：背景/人物/道具三区，上传/AI 生成 4 候选/预设库，版本管理可回滚
6. ✅ 预览：可选章节，真实小说世界 Runtime 呈现（花果山背景 + Canon Lock），悬浮条返回
7. ✅ 预览反馈面板：三组满意度，不满意直接跳转对应修改区（实测跳收费 Tab）
8. ✅ 布局保持现状、0 console error、0 未捕获异常（39/39 断言通过）

### 技术要点
- 单 HTML 架构：全部改动经由 LJ_PAGES JSON 解析/写回（锚点 assert 幂等），页面内 JS 保持 ES5 function 风格、不使用反引号模板
- 预览链路：work-editor `previewChapter` → `parent.LJ.go('novel-canon-reader','?book=<映射>&preview=1&chapter=<n>')` → 悬浮条/章末按钮 `postMessage {lj:'back'}` 弹栈回编辑器 → `checkPreviewPending` 弹反馈面板
- 作品→公版书映射 LJ_BOOK_MAP：changye/taohua→xiyouji、saibo→sanguoyanyi、shenhai/hlmrev/jiuri→hongloumeng
'''

for path, add in (('docs/PRD.md', PRD_ADD), ('docs/DEVELOPMENT_PLAN.md', PLAN_ADD)):
    full = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), path)
    with open(full, 'a', encoding='utf-8') as f:
        f.write(add)
    print('appended', path, os.path.getsize(full), 'bytes')
