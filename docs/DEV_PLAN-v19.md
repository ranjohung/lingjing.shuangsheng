# DEV_PLAN · 灵境 · 双生 V19.0 — 小说世界游戏全功能

> **版本**：V19.0 实施计划（2026-09-11 23:09）  
> **配套文档**：[PRD-v19.md](PRD-v19.md) + [S05-v19-novel-world-full-suite.txt](docs/sources/2026-09-11/S05-v19-novel-world-full-suite.txt)  
> **状态**：V19-A 立即启动；V19-B~F 按用户节奏

---

## 总览：V19.0 分 6 批交付

```
V19-A ─┬─ plot-detail.html（独立页）       ~700 行
       ├─ 实名认证弹窗（plot-runner modal） ~150 行
       ├─ Loading 加载页（plot-runner state）~150 行
       └─ 封面起始页（plot-runner state）    ~250 行

V19-B ─┬─ 沉浸主界面（全屏 CG 模式）        ~300 行
       └─ 角色创建页（6 维属性 + 5 天赋）    ~500 行

V19-C ─┬─ CG 剧情场景（IPO 倒计时）         ~200 行
       ├─ 新闻发布会场景                      ~150 行
       └─ 属性检定弹窗（掷骰子）             ~250 行

V19-D ─┬─ 多人对话立绘（3 角色）             ~250 行
       ├─ 选项交互（3 角色背景）              ~200 行
       └─ 3D 场景探索                         ~200 行

V19-E ─┬─ 预热破万活动弹窗                   ~250 行
       ├─ 系统菜单（6 项 + 5 图标）           ~300 行
       └─ 穿越醒场景                          ~150 行

V19-F ─┬─ 任务系统（主线/支线/日常/VIP）     ~400 行
       └─ 菜单主页（紫钻商城 + 6 标签 + 4 Tab）~500 行

合计：~4900 行 JS + HTML + CSS
```

---

## V19-A（本批 · 立即启动）

### 工作包 A1：plot-detail.html（作品详情页 · 独立页）

**文件**：`output/preview/plot-detail.html`（新建，约 700 行）

**结构**：
```html
<!DOCTYPE html>
<head>
  <title>作品详情 · 灵境 · 双生</title>
  <link href="css/shell-v64.css">  <!-- 5 Tab + topbar -->
  <style>/* 详情页专属样式 ≤ 30 行 */</style>
</head>
<body>
  <header><!-- topbar: 返回 + 标题 + ··· --></header>

  <nav class="pl-tabs"><!-- 详情/角色表白/榜单 3 Tab --></nav>

  <section class="pl-cast"><!-- 主演横滑 --></section>

  <section class="pl-banner"><!-- 限时活动 banner --></section>

  <section class="pl-interact"><!-- 互动区 --></section>

  <section class="pl-groups"><!-- 作品交流区 --></section>

  <footer class="pl-action-bar"><!-- 底部操作栏 --></footer>

  <div id="plot-stage-mount"></div><!-- 5 Tab 注入 -->

  <script src="js/tabbar.js"></script>
  <script src="js/plot-detail.js"></script>
</body>
```

**数据**：`output/preview/js/plot-detail-data.js`（约 150 行）

```js
window.PLOT_DETAIL_DATA = {
  novels: {
    changyecheng: {
      id: 'changyecheng', title: '长夜城', author: '墨白',
      cast: [
        { name: '裴桃', emoji: '🌸', alias: '特别参演：小桃神' },
        { name: '沈怡然', emoji: '👩', alias: '特别参演：小曜神' },
        { name: '龙婉儿', emoji: '👧', alias: '特别参演：反方' }
      ],
      ads: [{ title: '优惠限时享', sub: '累充返利', period: '2.8 - 3.15' }],
      interact: [
        { user: '茄孓萌萌哒', time: '08-07 22:19', content: '应大家要求...' }
      ],
      groups: [{ name: '520花VIP交流群', type: 'vip' }, { name: '36花礼包群', type: 'gift' }],
      stats: { likes: 707 }
    }
  }
}
```

**逻辑**：`output/preview/js/plot-detail.js`（约 350 行）

- `getQuery()` — 读 ?novel=xxx
- `renderCast()` — 主演横滑
- `renderTabs(tabId)` — 3 Tab 切换
- `renderInteract(type)` — 互动区
- `renderGroups()` — 交流区
- `bindStartReading()` — 跳转 plot-runner.html
- `bindGroupJoin(groupId)` — 弹窗提示

**回归测试**：`scripts/test_v19a_plot_detail.py`（约 10 项）

---

### 工作包 A2：实名认证弹窗（plot-runner modal）

**触发条件**：
- 首次进入 plot-runner
- localStorage `lingjing_v519_realname_done` 不存在
- `lingjing_v519_realname_tries` < 3

**文件改动**：`output/preview/plot-runner.html` + `js/plot-runner.js`

**HTML 新增**（约 80 行）：
```html
<div class="plot-realname" id="plot-realname">
  <div class="plot-realname-card">
    <h3>实名认证通知</h3>
    <p>根据国家相关规定，未实名账号无法使用部分功能，请先填写实名信息</p>
    <div class="form-row"><label>真实姓名</label><input id="rn-name" placeholder="请输入真实姓名"></div>
    <div class="form-row"><label>证件类型</label><select id="rn-type"><option>身份证</option><option>港澳台居住证</option><option>护照</option></select></div>
    <div class="form-row"><label>证件号码</label><input id="rn-id" placeholder="请输入证件号码"></div>
    <div class="notice">
      <p>1. 您提供的证件信息将受到严格保护...</p>
      <p>2. 如果您是港澳台或海外用户...</p>
      <p>3. 每日仅可提交 3 次身份认证...</p>
    </div>
    <div class="form-actions"><button id="rn-cancel">取消</button><button id="rn-submit">提交</button></div>
  </div>
</div>
```

**JS 新增**（约 70 行）：
```js
function maybeShowRealname() {
  if (localStorage.getItem('lingjing_v519_realname_done') === 'true') return;
  var tries = parseInt(localStorage.getItem('lingjing_v519_realname_tries') || '0');
  if (tries >= 3) {
    showToast('warn', '实名认证', '今日次数已用完，明天再来');
    return;
  }
  $('#plot-realname').classList.add('open');
}

function bindRealname() {
  $('#rn-cancel').addEventListener('click', function () { $('#plot-realname').classList.remove('open'); });
  $('#rn-submit').addEventListener('click', function () {
    var name = $('#rn-name').value.trim();
    var id = $('#rn-id').value.trim();
    if (name.length < 2 || name.length > 20) return showToast('warn', '姓名 2-20 字');
    if (!/^\d{17}[\dX]$/.test(id)) return showToast('warn', '身份证 18 位');
    localStorage.setItem('lingjing_v519_realname_done', 'true');
    var tries = parseInt(localStorage.getItem('lingjing_v519_realname_tries') || '0');
    localStorage.setItem('lingjing_v519_realname_tries', String(tries + 1));
    $('#plot-realname').classList.remove('open');
    showToast('ok', '实名成功', '正在进入剧情');
  });
}
```

---

### 工作包 A3：Loading 加载页（plot-runner state）

**位置**：plot-runner.html 主流程最前面

**HTML 新增**（约 50 行）：
```html
<div class="plot-loading" id="plot-loading">
  <div class="pl-loading-card">
    <div class="pl-loading-grid">
      <div class="pl-loading-feature"></div>
      <div class="pl-loading-smalls">
        <div class="pl-loading-small"></div>
        <div class="pl-loading-small"></div>
        <div class="pl-loading-small"></div>
      </div>
      <div class="pl-loading-banner">灵境整理宝藏作品</div>
    </div>
    <div class="pl-progress">
      <div class="pl-progress-bar" id="pl-progress-bar"></div>
    </div>
    <div class="pl-progress-text" id="pl-progress-text">0%</div>
    <p class="pl-loading-tip">排行榜都是灵境整理的宝藏作品呢~</p>
  </div>
</div>
```

**CSS 新增**（约 60 行）

**JS 新增**（约 40 行）：
```js
function startLoading() {
  $('#plot-loading').classList.add('open');
  var pct = 0;
  var bar = $('#pl-progress-bar');
  var txt = $('#pl-progress-text');
  var t = setInterval(function () {
    pct += 8 + Math.random() * 6;
    if (pct >= 100) { pct = 100; clearInterval(t); setTimeout(gotoCoverPage, 400); }
    bar.style.width = pct + '%';
    txt.textContent = Math.floor(pct) + '%';
  }, 200);
}
```

---

### 工作包 A4：封面起始页（plot-runner state）

**HTML 新增**（约 100 行）：
```html
<div class="plot-cover" id="plot-cover">
  <div class="plot-cover-bg"></div>
  <div class="plot-cover-branch"></div>
  <div class="plot-cover-window"></div>
  <div class="plot-cover-title">
    <div class="plot-cover-sub">女主出场</div>
    <div class="plot-cover-main">我在古代开乐坊</div>
    <div class="plot-cover-sub">黄金万两</div>
  </div>
  <!-- 左侧工具栏 -->
  <div class="plot-toolbar-l">
    <button class="plt-btn" data-act="collapse">↑收起</button>
    <button class="plt-btn" data-act="light">💡点亮</button>
  </div>
  <!-- 右侧工具栏 -->
  <div class="plot-toolbar-r">
    <button class="plt-btn" data-act="collapse">↑收起</button>
    <button class="plt-btn" data-act="menu">🎛菜单</button>
    <button class="plt-btn" data-act="gallery">🔮灵境追番</button>
    <button class="plt-btn" data-act="fav">⭐收藏</button>
    <button class="plt-btn" data-act="share">🔗分享</button>
    <button class="plt-btn" data-act="shot">📷截图</button>
  </div>
</div>
```

**CSS 新增**（约 100 行）：
- 全屏背景：青绿渐变
- 桃花枝：CSS pseudo-element + transform
- 花窗：CSS border-image + radial-gradient
- 标题字：竖排 text-orientation: vertical-rl

**JS 新增**（约 60 行）：
```js
function showCover() {
  $('#plot-cover').classList.add('open');
  $('#plot-cover').addEventListener('click', function (e) {
    // 工具栏按钮各自处理
    var act = e.target.closest('.plt-btn')?.getAttribute('data-act');
    if (act === 'menu') return openSystemMenu();
    if (act) return;
    $('#plot-cover').classList.remove('open');
    enterMainStage();
  });
}
```

---

## V19-B（待续 · 角色创建是核心）

详见下批次开发。优先顺序：
1. **角色创建页**（图 7）—— 最重要，6 维属性 + 5 天赋 + 100 点分配
2. 沉浸主界面增强（图 4）—— 在现有 plot-runner 6 层基础上加全屏 CG 模式

---

## 回归测试计划

V19-A 总计测试：
1. plot-detail.html 加载（10 项）
2. 主演横滑（4 项）
3. 3 Tab 切换（6 项）
4. 互动区切换（4 项）
5. 群入口 modal（4 项）
6. 底部操作栏点赞 +1（4 项）
7. plot-runner 实名认证（8 项）
8. plot-runner Loading（6 项）
9. plot-runner 封面页（6 项）

**V19-A 目标**：50/50 PASS

---

## 数据看板

V19-A 完成后预期：
- 工作包：9 → 10
- 总通过：124 → 174 PASS
- 覆盖：plot-detail + 实名 + Loading + 封面 4 类

---

## 风险与降级

| 风险 | 降级方案 |
|---|---|
| plot-detail.html 与 tabbar 路径冲突 | 用 resolveTabHref 函数（V17-A-Fix 已支持） |
| plot-runner 多 state 切换性能 | state 用 CSS class 切换，不重建 DOM |
| 角色创建 100 点 + 6 维 + 5 天赋 复杂度 | 拆为 create-state + review-state 两步 |
| 实名认证 localStorage 与未来后端冲突 | 预留 window.LJRealname.submit() 钩子 |

---

## 下一步

V19-A 立即启动：
1. plot-detail.html + plot-detail.js + plot-detail-data.js
2. plot-runner.html + plot-runner.js 加 3 个 state/modal
3. test_v19a_*.py × 9 个测试
4. 9 张实景截图
5. product-preview.html 同步 V19-A 模块
6. git commit V19-A
7. memory + MEMORY.md 更新

预计代码量：~1250 行
预计测试用例：~50 项
预计截图：9 张