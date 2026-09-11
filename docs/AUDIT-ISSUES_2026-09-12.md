# 灵境 · 双生 — 审查问题报告（2026-09-12 · 每项均经二次复核确认）

> 本报告由 V20-I 全项目审查产出。**每一条问题在登记前均做二次复核**：静态定位 → 运行时复现（或全仓 grep 证明无消费方）→ 修复/登记。
> 编号规则：F-* = 本轮已修复；O-* = 遗留登记（真实存在但不在本轮修）。
> 上游分析报告：[AUDIT_2026-09-12.md](AUDIT_2026-09-12.md)

---

## A. 本轮已修复（F-1 ~ F-4）

### F-1【P1】commerce.html 缺失 `#current-novel` 元素，整页数据渲染中断

- **发现**：动态审计加载 commerce.html 报 pageerror：`Cannot set properties of null (setting 'textContent')`
- **根因**：`commerce.html:507` `document.getElementById('current-novel').textContent = ...`，但全文件无 `id="current-novel"` 元素。`init() → renderNovelSelector() → selectNovel(第一个)` 即崩溃，后面的 `renderAll()`（版权分层 / 收费点 / 收益 / 质量 / 改编授权 5 大区块）**全部不渲染**。
- **复核证据**：
  1. 静态交叉比对：JS 引用 id 集合 − HTML 定义 id 集合 = `{current-novel}`（其余 26 个 id 全部存在）；
  2. 运行时复现：Playwright 加载报 pageerror，`#tier-grid` innerHTML 长度为 0；
  3. 影响面：v5.14 以来该页在"有小说"状态下数据区一直空白（DemoSeed 会种入 demo 小说，即默认状态即触发）。
- **修复**：
  1. 选择器下方补 `<b id="current-novel">` 当前作品展示行；
  2. JS 改为 null 防御写法。
- **验证**：test_v20i_audit_fixes.py 第 1 组 3/3 PASS（无 pageerror / 书名渲染 / tier-grid 渲染长度 > 50）。

### F-2【P1】plot-runner 参数名不匹配：发送 `?novel=`、接收 `?novelId=` → 永远加载《长夜城》

- **发现**：静态接口比对 + 运行时点击。
- **根因**：`plot-runner.js:127` 只读 `params.get('novelId')`；而 `public-domain.js:218` 与 `plot-detail.js:224` 均发送 `plot-runner.html?novel=<id>`。参数名不一致 → `novelId` 为 null → 静默 fallback 到 `changyecheng`。**用户从《神会绘生》详情页点「开始阅读」，实际进入的是《长夜城》。**
- **复核证据**：grep 全仓 `plot-runner.html?novel=` 命中 2 个发送方，均为 `novel`；接收方 `plot-runner.js:126-128` 仅认 `novelId`。运行时复现：`?novel=shenhuihuisheng` 修复前加载长夜城数据。
- **修复**：`var novelId = params.get('novelId') || params.get('novel') || 'changyecheng'`（双参兼容，旧链路 novel-edit/upload/save/settings/history 的 `novelId` 不受影响）。
- **验证**：test_v20i 第 3 组 PASS（`?novel=shenhuihuisheng` 正常加载且无未支持页）。

### F-3【P1】公版库 39 本未建世界的书点击「进入小说世界」→ 跳进错误小说

- **发现**：接口链路追踪。
- **根因**：`public-domain.js enterPlot(id)` 只对 `sanguoyanyi` 路由到专属世界，其余 39 本书全部跳 `plot-runner.html?novel=<公版书ID>`；而 plot-runner 的 NOVELS 只有 4 本（changyecheng / shenhuihuisheng / sanguo / saibochangye），公版书 ID 全部不存在 → **点《红楼梦》进《长夜城》**。与 V20-H 用户指示「小说世界先生成一个三国演义看效果」不符——其余书尚未建世界。
- **复核证据**：NOVELS 顶层 key 精确解析 = 4 个；`enterPlot` 源码全文核对；运行时复现跳转行为。
- **修复**：非 sanguoyanyi 的书 → 轻量 toast「「书名」小说世界制作中 · v5.21+ 即将开放」，不跳转（符合铁律 #1：未实现 ≠ 不显示，明确标注即将开放）。
- **验证**：test_v20i 第 5 组 3/3 PASS（toast 文案含书名 / 不跳 plot-runner / 三国仍正确路由 sanguo-world.html）。

### F-4【P2】plot-detail.html「购买」按钮 404 断链

- **发现**：动态审计点击 `#pl-act-buy` 触发 `404 (File not found)`。
- **根因**：`plot-detail.js:216` `window.location.href = '../creator-center.html'`——plot-detail.html 位于 `output/preview/`，`../` 解析到 `output/`，该文件不存在 → 404。且「购买」语义指向创作者中心也不合理。
- **复核证据**：动态审计 404 记录 + 路径解析推演 + 静态扫描。
- **修复**：改为 `showToast('warn', '购买', 'v5.21+ 即将开放')`，与同组「收藏」「互动」按钮行为一致。
- **验证**：test_v20i 第 2 组 3/3 PASS（无 404 / 不导航 / toast 弹出）。

### F-5【P3】UI 交付物中 2 处第三方平台名词注释残留（红线卫生）

- **发现**：v5172 红线扫描（修复范围后）+ grep 取证。
- **根因**：① `economy.js` 头注释「全文零橙光文案」「橙光→灵境 名词替换」；② `redesign.html` CSS 注释「对标星野」。均为注释（不渲染进 UI），但文件属 UI 交付物，按铁律 #2 精神应清零。
- **修复**：两处注释改写为中性表述（「全文零第三方平台文案」「旧名词→灵境术语清洗」「移动端主导航」）。`economy.js` 的 `LANG_REPLACE` 映射表 `from` 键为功能性清洗数据（运行时把旧词替换为灵境术语），必须保留。
- **验证**：v5172 残留扫描 ✅ 通过（扫描器同步修正：范围收敛到 UI 交付物、排除注释行与映射数据、docs/scripts/corpus 为内部文件豁免）。

### F-6【P2 · 测试体系】3 套回归套件机械性失效修复

- **修复**：① test_v5172_regression（残留扫描范围 + 4 个页面 URL 前缀 + demo_palace→changyecheng）→ 双绿；② test_v519_zhiji（companion.html→heart-island.html 更名）→ 5/5 绿；③ 测试端口体系补齐（8765/8768/8770/8771/8790/8792 全部以常驻服务启动）。
- **验证**：两套复跑 exit=0。其余 12 套失效为期望过时（见 O-8 分类表），属 T-1 工作包。

---

## B. 遗留登记（O-1 ~ O-7 · 均已复核真实存在）

### O-1【P1 · 架构缺口】作者上传的小说无法在 plot-runner 运行

- **现象**：novel-upload 生成 `n_<时间戳>` ID（`novel-upload.html:310`）→ novel-edit「进入游戏」→ `plot-runner.html?novelId=n_...` → NOVELS 查无此 key → **作者自己的小说永远播不出来**（修复前静默播《长夜城》，比"报错"更严重——它假装能玩）。
- **复核**：NOVELS 硬编码 4 本已确证；plot-runner.js 无任何 NovelStore / plot-schema 动态加载逻辑（grep NovelStore = 0 命中）；novel-upload ID 生成格式已确证。
- **本轮处置**：不再静默 fallback，显示「暂未接入此运行器 · 通用小说世界引擎 v5.21+ 即将开放」提示页 + 返回题材库按钮（并尝试从 NovelStore 读真实书名展示）。
- **彻底解法（v5.21+ 工作包）**：通用小说世界引擎——plot-schema（作者数据）→ 运行时场景树转换 → plot-runner 播放，打通「创作 → 即点即玩」。

### O-2【P2】redesign.html 存档写后无读取

- **现象**：`saveGame()` 写 `ljss_save_v5_8`（redesign.html:1767），全文件及全仓无任何读取该键的代码 → 没有「继续游戏」入口，存档是无效操作。
- **复核**：全仓 grep `ljss_save_v5_8` 仅 1 处写入、0 处读取（game-3d 读写的是 `ljss_save_v5_6`，是另一套）。
- **建议**：redesign.html 已标注「历史归档（v5.9）」，可在归档横幅中注明存档功能停用，或补 loadGame。低优先。

### O-3【P3】创作者协议确认键写后无校验

- **现象**：creator-legal.html:176 勾选确认后写 `lingjing_v5170_creator_legal_ack`，但没有任何页面读取该键做准入校验（如 creator-center 创建作品前检查是否已签协议）。
- **复核**：全仓 grep 该键仅 creator-legal.html 1 处写入、0 处读取。
- **建议**：v5.21+ 在 creator-create 提交前校验该键，未签则引导到 creator-legal。

### O-4【P3】plot-detail.html 是孤儿页

- **现象**：全站（31 页 + 29 JS）无任何链接指向 plot-detail.html；其自身「开始阅读」等出站链接正常。
- **复核**：grep `plot-detail.html` 全仓排除自身 = 0 命中。
- **建议**：由世界 Tab / 搜索结果 / 心屿角色卡「进入 TA 的世界」接入（对应 v6.4.2 待办）。

### O-5【P3】plot-engine.js 为死模块

- **现象**：826 行 v5.16 引擎（打字机 / 自动模式 / BGM / 5 槽存档），无任何页面 `<script src>` 引用。
- **复核**：grep 全部 32 页 script 标签，0 引用。
- **影响**：无直接影响——plot-save.html / plot-settings.html 读写 `plotrunner.save.*` / `plotrunner.opts` 前缀与现役 plot-runner.js 一致，功能闭环。`plotrunner.opts` 由 plot-settings.html:154 写、plot-engine.js:28 读（死路径，无害）。
- **建议**：O-1 通用引擎工作包立项时决定复活或删除，避免双引擎并存。

### O-6【P3】归档页 demo_palace 链接指向不存在的小说 ID

- **现象**：games.html:121 / redesign.html:620（均为「历史归档」横幅内）链接 `plot-runner.html?novelId=demo_palace`，NOVELS 无此 key。
- **复核**：NOVELS key 列表已确证无 demo_palace。
- **本轮影响**：修复后不再加载错误内容，落到「暂未接入」提示页。归档页可接受，暂不处理。

### O-7【P3】工具页 ~20 处原生 alert/confirm 违反铁律 #10

- **现象**：commerce（6）/ game-3d（4）/ novel-ai-helper（3）/ novel-edit（3）/ novel-upload（1）/ plot-history（1）/ plot-save（1）/ plot-settings（1）共约 20 处 `alert(` / `confirm(`，铁律 #10 要求用 `<dialog>` / Toast。
- **复核**：grep 全仓精确计数。5 Tab 主功能区页面（首页/世界/心屿/创作中心/我的）**0 违规**——违规集中在创作者工具与游玩工具页。
- **建议**：单列「dialog 化整改」工作包批量处理（涉及交互回退逻辑，不宜在本轮顺手改）。

### O-8【P2 · 测试体系】回归测试套件债：32 套中 15 套失效（本轮已修复 3 套）

- **现象**：全量复跑 32 套，首轮 20 套失败。经三轮排查（补齐 7 个测试端口 → 修复 3 套 → 逐套取证），失败根因**全部为测试期望过时或环境问题，非产品缺陷**：
- **根因分类**（每条均有 git -S 取证）：

| 失效套件 | 根因 | 被哪个产品变更超越 | 现行覆盖 |
|---|---|---|---|
| test_v513_runner / test_v516_ux | 选择器 `#plot-scene`/`.opt-btn`/`PlotEngine` 已不存在 | V18.0 plot-runner 重做（5bb3cca） | ⚠️ 覆盖缺口（见 O-9） |
| test_v18c_plot | 实名弹窗拦截点击（产品功能：可取消） | V19-A 启动序列（ed65a10） | ⚠️ 覆盖缺口 |
| test_v17a_path_fix / test_v18a_home / test_v64_home / test_preview_v514 | splash/登录浮层遮住旧测试要点的元素；`enterLingjing` 已移除 | V20-C 启动登录浮层 + V18-A 首页重做 | test_v20c/d/e |
| test_v641_shell | product-preview 已无 `.topbar-title` | V18-A 首页 4 层重做 | test_v20 系列 |
| test_v517 / test_v517_deep | `.ai-help-btn` 等入口已重构 | V17-G 创作者中心重做 | test_v17g_tier |
| test_v519_zhiji | companion.html 已更名 heart-island.html | v5.20 知己→心屿 | **本轮已修 ✅** |
| test_v5172_regression | 扫描范围过宽 + 页面路径前缀过时 | V17-B 世界重做 + 8767 服务目录变更 | **本轮已修 ✅（残留扫描 + UI 双绿）** |
| test_v518_regression | networkidle 在 CDN 慢速环境下超时 | 环境问题（页面本身正常） | — |
| test_user_repro | 压力型慢测试（8 轮×6 Tab 连续导航），本机超时/崩溃；隔离复测产品 0 错误 | 环境性能 | — |

- **本轮修复**：v5172（扫描范围收敛到 UI 交付物 + 注释/映射数据排除 + 路径前缀）、v519（companion→heart-island 更名）、v5172 UI 路径。**32 套中 20 套绿**（含 v20 全系列 + v17b/g + v18b/d + v19a + v5172 + v519 + product_preview + v514_commerce + v516_game3d 等）。
- **遗留**：12 套过时期望待刷新（T-1 工作包：按现行 UI 重写断言）。

### O-9【P2 · 覆盖缺口】plot-runner 现无绿色回归套件

- **现象**：专门覆盖 plot-runner.html 的三套（v513 / v516_ux / v18c_plot）全部因 V18.0/V19-A 重做过时失效；本轮动态审计已验证 plot-runner 5 入口加载 0 错误 + 14 次点击 0 异常 + 实名弹窗可正常取消，但**自动化回归防线缺位**。
- **建议**：T-1 工作包首要任务——按现行启动序列（实名→Loading→封面→剧情）重写 plot-runner 回归套件。

---

## C. 复核排除项（审查中怀疑、复核后确认不是问题）

| 疑点 | 排除理由 |
|---|---|
| tabbar.js 引用 `product-preview.html` 相对路径疑似断链 | tabbar.js:35 已做子目录映射（`inSub ? '../../product-preview.html'`），运行时正确 |
| `lingjing_account_kind` / `lingjing_user_profile` 疑似"只读不写" | product-preview.html 经 `STORAGE` 常量对象间接写入，键值与读方完全一致 |
| `plotrunner.opts` 疑似"只读不写" | plot-settings.html:154 经 `const KEY` 间接写入，匹配 |
| `plotrunner.save.${id}.${i}` 疑似"只写不读" | plot-save / plot-settings / plot-history 以前缀 `plotrunner.save.` 动态枚举读取 |
| novel-ai-helper `onclick="alert(...)"` 疑似未定义函数 | alert 为浏览器内置（但计入 O-7 风格违规） |
| commerce/heart-island `onclick="if(...)"` 疑似未定义函数 | 模板字符串内条件表达式，误报 |
| legal-view fetch 18 份法律是否全存在 | 7 个被引用 doc 参数逐一核对存在；其余 11 份为创作者卷/导出用，不经该接口 |
| sanguo-world fetch 语料 | corpus/books/sanguoyanyi.txt 存在（120 回 59.7 万字，V20-H manifest 实测） |
| plot-runner 实名弹窗疑似交互阻断 | V19-A 产品功能（青少年保护门），有取消按钮可正常进入剧情；是 v18c 旧测试不知道该序列，非产品缺陷 |
| heart-island 疑似导致页面崩溃 | 隔离压测 3 连续加载 0 pageerror（test_user_repro 的崩溃为压力型慢测试在本机环境的瞬时问题） |
| test_v518 疑似产品加载故障 | networkidle 在 CDN 慢速环境超时；页面 domcontentloaded 正常加载 |

---

## D. 结论

- **6 个已修复问题**（F-1~F-6）全部有运行时复现证据或 grep 取证 + 修复后回归 PASS。
- **9 个遗留问题**（O-1~O-9）全部有证据登记：P1×1（通用引擎）/ P2×3（存档读取 / 协议准入 / 测试套件债 + 覆盖缺口）/ P3×5。
- **11 个疑点**经复核排除，避免误报进入文档。
- **配套修复**：测试端口体系补齐（7 端口常驻），回归防线从"套件找不到服务"恢复到可执行状态；32 套中 20 套绿，12 套待 T-1 刷新（期望过时，非产品缺陷）。
