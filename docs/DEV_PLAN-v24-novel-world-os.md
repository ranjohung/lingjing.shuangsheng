# DEV PLAN V24 — 小说世界OS V2.0

> 日期：2026-09-15 · PRD：[PRD-v24-novel-world-os.md](PRD-v24-novel-world-os.md) · 需求原文：[S05](sources/2026-09-15/S05-novel-world-os-v2.txt)
> 工作包序列：V24-A → V24-E；完成一包跑一次 `scripts/test_v24_novel_os.py`
> 资源：本机 SD WebUI (127.0.0.1:7860, dreamshaper_8) 生成二次元摄影风场景背景；Blender 备用（后续 3D 场景）

## 前置盘点（2026-09-15）

| 资产 | 现状 | V24 处置 |
|---|---|---|
| `js/novel-world-store.js` / `novel-world-parser.js`（V22-A~C，87/87） | 提取式引擎，键 v522 | **只读复用思想、不引文件**（工作区有并行未提交改动）；V24 自建 store |
| `js/world-data.js`（PUBLIC_DOMAIN 6 本） | 已提交无改动 | ✅ 运行时只读引入公版书源 |
| `output/preview/scenes/*.png`（5 张 dreamshaper 场景） | 已提交 | ✅ 可复用；另新增 3 张 V24 专属（雨夜街/书房雨夜/酒楼）存 `img/novel-os/` |
| `css/mobile-lock.css` / `design-system.css` | 稳定 | 沿用 |
| localStorage | v522/v521/v520… | 新增 `lingjing_v524_novel_os_v1` + 存档 `_save_{bookId}`，互不干扰 |
| 沉浸页豁免清单 | plot-runner/game-3d/catalog/novel-game | novel-os-world 加入豁免（返回+世界浮钮） |

## V24-A 文档（本包）

- `docs/sources/2026-09-15/S05-novel-world-os-v2.txt`（归档，永不改）
- `PRD-v24-novel-world-os.md`（含 §2 我的独立修正意见 7 条）
- 本文件

## V24-B 数据层 `js/novel-os-store.js`

- `window.NovelOSStore`：七层全量状态 + load/save/reset/setX 纪律
- L0：`setSource(text, title)` → SHA-256（crypto.subtle；非安全上下文降级 FNV-1a×2 并标注 `hash_algo`）
- L1：`compileCanon()` → 按空行分段→锚点（id/type[叙述|对白|旁白|转折]/chapter 推断/原文逐字/逐锚点哈希/immutable:true）
- L2：`compilePresentation()` → 每锚点 镜头(2-3)/人物(对话行提取)/动作/环境/BGM 建议 + 风格 token `anime_cel+photo_dof+film_grain`
- L3/L4：`compileInteractions()` 从名词表（家具/物品/角色）+ 锚点上下文生成热点与 SIMULATION 条目
- Quality Gate：`runQualityGate()` 返回三层报告（确定性检测+五维分+⚠列表）；`authorConfirm(list)`
- Compiler：`runCompiler()` 五步（World Bible/Character Bible/Location Bible/Canon Graph/Canon QA）→ `canonIntegrityCheck()`（源哈希 vs 当前 + 锚点逐字比对）
- 收费点：`recommendPayPoints()`（转折/高潮锚点给星级+理由+建议灵玉价）；`resolvePayPoint(id, action)`
- 玩家：`setMode(A|B)` / `saveGame()` / `loadGame()`

## V24-C `novel-os-upload.html`

选书（公版 6 本）/上传 txt → 质检三层逐层展示 → 报告卡（总分环+五维条+⚠列表）→ 作者五项确认 → Compiler 五步动画 → Canon Integrity Passed → 跳转 novel-os-world.html?book=。二次元摄影头图（雨夜街）。

## V24-D `world-os.html`（沉浸豁免）

身份选择卡（A 阅读者✅ / B 世界游客✅ / C 同人⏳即将开放）→ Scene OS：
- 背景（SD 二次元摄影图 + 暗角/景深/颗粒 CSS 层）
- 原文渲染区（金色【原著剧情】徽标，一字不差）+ L2 演出标注（镜头/动作/BGM）
- 热点（角色/物品可点 →【世界探索】青标内容；L4 家具 → SIMULATION 灰标）
- 状态栏：章节/锚点进度/模式/回主线按钮；推进=下一锚点（场景变化时切背景）
- 收费点推荐卡（仅上传页作者侧展示裁决；世界页主线零付费墙）
- L5/L6/L7 入口占位（"即将开放"，铁律 #1）

## V24-E 测试与交付

`test_v24_novel_os.py`：≥30 断言（Gate 三层/哈希一致/锚点原文 byte-equal/四标记存在/身份/0 破链/0 第三方名/0 平台外货币名 UI/mobile-lock/豁免浮钮）+ audit 40+2 页复扫 + ALL_FUNCTIONS §18 + SITE_MAP 补遗四 + 日志 + MEMORY + 精确 add commit + present_files

## 边界红线

1. 不改 V22/V23/并行线任何文件；novel-os-* 全新命名
2. 主线渲染函数无 LLM 路径（只读 canon_anchor.source_text）
3. 世界功能区 0 聊天气泡
4. UI 货币只用灵晶/灵玉；铜钱银两只进世界观文本
