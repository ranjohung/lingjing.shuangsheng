# -*- coding: utf-8 -*-
"""V28 文档登记：PRD.md + DEVELOPMENT_PLAN.md 追加 V28 章节（append-only）"""
import io, os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PRD_APPEND = """

---

## V28.0 桌面 letterbox + 小说详细介绍页（2026-09-19）

### 背景（用户反馈）
- 截图 A：小说世界游戏页在电脑端 1108px 宽横屏下全屏拉伸、空旷难看——本产品是手机 App 形态，桌面必须锁定手机竖屏比例
- 截图 B：从游戏返回进入的是「灵境·小说世界」书目选择页（world-hub），不符合预期——应进入类似橙光的小说详细介绍页，且软件货币是灵晶（禁止出现第三方产品名）

### 交付范围（V28-A / V28-B / V28-C 全部完成）

#### V28-A 桌面横屏 letterbox（壳层）
- 壳层 `#stage` 新增 `@media (min-width:481px)` 媒体查询：舞台固定 480px 宽水平居中（left:0;right:0;margin:auto），加 1px 描边 + 大范围暗色投影；`body.stage-on` 背景加深为 #06060f 并叠加红紫径向光晕装饰（::before，pointer-events:none）
- 手机端（≤480px）不受影响；全部 65 页统一生效

#### V28-B 新增 novel-detail 小说详细介绍页（橙光式，货币=灵晶）
- **页面结构**：顶栏（返回 + 标题 + 作品ID）→ 封面 hero（渐变封面 + 徽章 + 书名/作者/章节信息）→ 数据行（评分 / 人气值 / **灵晶值**）→ 标签行 → 三 Tab：
  - 详情：作品简介 / 更新日志时间线 / 付费信息卡（前 X 章免费 · 后续 X 灵晶/章，收益归创作者）/ 特别参演（角色胶囊）
  - 角色：主要角色卡列表（头像 + 名 + 一句话人设）
  - 互动：点赞/收藏大按钮 + 读者评论列表 + 评论输入框（发布置顶、Enter 提交）
- **底部操作栏**（fixed）：♡点赞 / ☆收藏 / 世界游客 / ▶ 开始阅读
- **书目数据 BOOKS**：6 本，与世界页 WORLDS、剧情页 BOOK_META 对齐——西游记/红楼梦/三国演义/水浒传（生成中徽章）/聊斋志异/桃花源记（短篇体验、隐藏世界游客按钮、开始阅读走 demo=1）
- **持久化**：`lingjing_v528_detail`（按 bookId 分组：liked/collected/mine 评论），刷新保持
- **路由改造**：
  - world-hub `enterWorld()`：`LJ.go('world-view',…)` → `LJ.go('novel-detail','book=…')`（fallback 同步）
  - novel-game 顶部「↩」与入口遮罩「‹ 返回」：带 `?book=` 进入时 → `LJBack()` 退出游戏回详情页；自由模式保持原逻辑（铁律 #7：游戏内返回=退出游戏）

#### V28-B 关联修复（探查中发现的产品级断链，一并修复）
1. **壳层 novel-game→world-view 旧映射删除（2 处）**：`LJ.go` 内 `if (id==='novel-game'){id='world-view'}` 与 LJEnter 三元式——该映射导致单 HTML 架构下 V20-V 游戏引擎彻底不可达（plot-detail ▶ 游玩也被劫持），用户看到的"游戏页"实为 world-view
2. **novel-game 参数获取修复**：srcdoc 下 `location.search` 恒空 → 新增 `ngQS()`（优先 `__LJ_PARAMS__`/LJSearch 并规范化 `?` 前缀），init 的 `?demo=1`/`?book=` 分支与两处返回检测全部改用
3. **壳层 back 栈死循环修复**：`LJBack` 弹栈后调 `LJ.go(prev)` 会把当前页压回栈，导致 详情↔游戏 返回链死循环 → `LJ.go` 增加第 4 参 `__noPush`，message back 弹栈路径传 `true`（back 触发的路由不再压栈）
4. **novel-game `?book=` 走内嵌公版**：新增 `loadEmbedded(bookId)`，bootstrap 的 book 分支改调——完整 corpus txt 与 parseOriginalNovel 体例不匹配（title 解析为「第1」、1104 碎章）且原路径在 srcdoc 下 404，内嵌文本才是 V20-X 实际验收路径；消除 404 console error，书名正确显示
5. **world-view `showToast` 函数头补回**：并行提交（R18 ESC 面板）吞掉函数声明行导致 `showToast is not defined`，scene/chapter toast 全部失效
6. **world-hub tabbar-embed.css 路径修复**：页面内硬编码 `output/preview/css/...` 在 base href 下重复拼接 404 → 改相对路径 `css/tabbar-embed.css`

### 红线自查
- 货币一律灵晶，页面无「丸子」等第三方名（grep 校验）✅
- 5 Tab 不动、novel-detail 为功能页不带全局 tabbar、有返回箭头（铁律 #4/#7）✅
- 未砍任何功能：world-view 保留（详情页「世界游客」入口 + 直链）✅
- 纯前端 mock 数据（评分/人气/灵晶值为演示数据，页面已标注）✅

### 存储
- localStorage `lingjing_v528_detail`：`{ [bookId]: { liked, collected, mine: [{t}] } }`

### 验收（scripts/test_v28_desktop.py，32/32 通过）
- S0 桌面 letterbox：1150×800 下 stage 宽=480、x=335 居中
- S1 详情内容 9 项（书名/作者/作品ID/评分/人气值/灵晶值/标签/开始阅读/付费含灵晶）
- S2 交互 11 项（角色 4 卡、评论 2→3、点赞 8643、收藏态、刷新持久化 ×3）
- S3 全链路 5 项：world-hub 书卡 → novel-detail → novel-game（书名含西游）→ 遮罩返回 → 详情 → 返回 → world-hub
- S4 pageerror=0 + console.error=0（404 已清零）
- S5 手机对照：390×844 下 stage 全宽、红楼梦详情正常
- 截图 9 张 → screenshots/v28/s00~s08
"""

DEV_APPEND = """

---

## V28 工作包（2026-09-19，全部 ✅）

| 任务 | 内容 | 状态 |
| --- | --- | --- |
| V28-A | 壳层 #stage 桌面 letterbox（>480px 视口锁 480px 居中 + 暗边光晕），全页统一 | ✅ |
| V28-B | 新增 novel-detail 橙光式小说详情页（三 Tab/评分/人气值/灵晶值/付费信息/角色/互动/底部操作栏）+ 路由（书卡→详情→游戏→返回链） | ✅ |
| V28-B-fix | 壳层 novel-game 映射删除 ×2 / ngQS 参数规范化 / back 栈 __noPush 防死循环 / loadEmbedded 内嵌公版 / world-view showToast 补头 / world-hub tabbar-embed 路径 | ✅ |
| V28-C | Playwright 回归 32/32 + 截图 9 张 + PRD/DEV_PLAN 登记 | ✅ |

### 验收对照
1. 桌面 1108px 横屏：舞台 480px 居中、两侧暗色留边 ✅（S0a/S0b）
2. 世界页书卡 → 小说详细介绍页 ✅（S3a）
3. 详情页含：作品ID/作者/评分/人气值/灵晶值/标签/简介/更新日志/付费信息/特别参演/角色/互动/底部操作栏 ✅（S1a~i）
4. 货币=灵晶，无第三方名 ✅（grep 校验）
5. 开始阅读 → 游戏页（书名正确）✅（S3b/S3c）
6. 游戏页返回 → 详情页 ✅（S3d）
7. 详情页返回 → 世界页 ✅（S3e）
8. 点赞/收藏/评论持久化 ✅（S2i~k）；pageerror/console 全零 ✅（S4）

### 技术要点
- 壳层 letterbox 用纯 CSS 媒体查询（min-width:481px），iframe fixed + margin:auto 居中，无 JS 参与
- LJ_PAGES 65 页：novel-detail 经 json 解析/写回注入（锚点 assert 幂等），页面 JS 保持 ES5 function 风格
- back 栈语义修正：LJ.go(id,qs,hash,__noPush)，postMessage back 弹栈路由不再压栈（影响全局返回链，回归通过）
- novel-game 在 srcdoc 下取参必须走 __LJ_PARAMS__（location.search 恒空）——ngQS() 统一规范化
"""

for rel, append in [("docs/PRD.md", PRD_APPEND), ("docs/DEVELOPMENT_PLAN.md", DEV_APPEND)]:
    p = os.path.join(BASE, rel)
    with io.open(p, "a", encoding="utf-8", newline="") as f:
        f.write(append)
    print("appended:", rel, os.path.getsize(p), "chars")
