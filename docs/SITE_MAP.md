# 灵境 · 双生 · 站点目录（v6.1.2 立）

> **本书比喻**：灵境 · 双生 = 一本书。
> 5 个底部 Tab = 5 卷书。
> 每个 Tab 内有自己的"章节目录"。
> 主页 = 总章（封面 + 内容简介）。

---

## 总章·灵境概览（主页 `product-preview.html`）

| 节 | 内容 | 数据来源 |
|---|---|---|
| 一句定位 | "一个角色，两种人生" | ONBOARDING §一 |
| 我的世界 | 日签到 + 阿岁卡 + 最近 3 卡 | me.html / memory.html |
| 推荐横滑 | 5 个高热题材 | library.html |
| 5 大关键体验 | 代入感 / 掌控感 / 关系攻略 / 自由成长 / 收集共享 | ONBOARDING §三 |
| 双生核心叙事 | 心屿 ↔ 小说世界（4 类来源 / 3 重验证 / 记忆贯通） | DUAL_SOUL_SPEC §DUAL-05 |
| 6 大铁律 | 不出售 / 不推送 / 不诊断 / 不迎合 / 不涉未成年 / 不改写命运 | ONBOARDING §四 |

**主页不出现**：具体法律文书 / 设置详情 / 钱包详情 — 这些在各卷内部。

---

## 第一卷·灵界万象（小说世界 Tab → `library.html`）

```
章一 题材目录       library.html?genre=*
  └─ 22+ 主类 × N 子类
章二 最近游玩       plot-runner.html（直接续上次的剧情）
章三 我的收藏       catalog.html?type=favorites
章四 上传即生成     novel-upload.html（TXT/MD/DOCX → 自动分章）
章五 创作指南（用户侧）  catalog.html?type=tutorial
```

**关联模块**：World OS（WOS-01~15）/ Story Director / Narrative Generator

---

## 第二卷·心屿之约（陪伴 Tab → `heart-island.html`）

```
章一 主角色大卡     heart-island.html#protagonist（7 维关系仪表）
章二 双界穿梭入口   heart-island.html#dual（带 3 重条件可视化）
章三 我的角色列表   character-detail.html（每个角色详情页）
章四 创建新角色     character-create.html（7 层向导）
章五 共享记忆       memory.html（时间线 + 情绪曲线 + 记忆宫殿）
章六 1v1 陪聊       chat.html（文字/语音/朋友圈/日记/共同活动）
章七 个人主页       profile.html（头像 + 会员 + AI 偏好 + 订阅）
```

**关联模块**：Character DNA（CHAR-03 八层）/ Memory Engine / Relationship Engine / Emotion Engine / Voice Engine / Avatar 3D

---

## 第三卷·创世者手册（创作 Tab → `creator-center.html`）

```
章一 小说辅助模拟器   novel-ai-helper.html
  └─ 28 字段模板 + 12 类提问 + 6 维自动检测
章二 我的作品        creator-center.html#works
章三 上架与定价      commerce.html
  ├─ 版权分层 L1-L4
  ├─ 22 收费点
  ├─ 5 档收益分成
  └─ 3 级改编授权
章四 创作数据 & 收益  creator-center.html#stats
章五 ⭐ 创作者法律指南  creator-legal.html（新增）
  ├─ 著作权授权协议
  ├─ 改编授权协议
  ├─ AI 创作版权声明
  ├─ 收益分成协议
  ├─ 内容审核标准（创作者必读）
  ├─ 创作者实名认证规则
  ├─ 创作者税务与发票
  ├─ 投诉与申诉（创作者侧）
  └─ 第三方素材上传声明
章六 快速入门（4 步走） creator-center.html#onboard
```

**关联模块**：Quality Review / Story Director / Narrative Generator / Asset Pipeline

**⭐ v6.1.2 关键决定**：所有"创作者专属法律"（著作权 / 改编 / 收益分成 / 创作者实名 / 税务）从主页 footer 全部移到本卷第五章。用户不再在主页看到这些。

---

## 第四卷·寻幽探胜（发现 Tab → `discover.html`）

```
章一 创作广场     discover.html#works（公开作品）
章二 心屿广场     discover.html#characters（角色广场）
章三 记忆广场     discover.html#memories（公开 CG / 日记 / 命运卡）
章四 排行榜       discover.html#rank
  └─ 周目 / 收藏 / 评论 / 评分
章五 标签浏览     discover.html#tags
```

**关联模块**：Discover / Recommendation

---

## 我的 Tab（v6.4 · `me.html` 七区块 + 6 子页）

```
区块一 个人信息    me.html（头像/ID/签名/实名状态）
  └─ 编辑资料      profile-edit.html（9 项：头像/用户名/签名/性别/生日/所在地/手机/邮箱/实名）
区块二 资产总览    me.html（💎灵晶 / 🪙灵玉 / ⭐收藏 三卡）
  ├─ 钱包          wallet.html（8 Tab：余额/充值 6 档/订阅/消费记录 50 条/充值记录/灵玉获取/灵晶明细/提现）
  └─ 收藏          favorites.html（四 Tab：小说世界/角色/卡牌/动态 + 筛选 + 取消收藏）
区块三 我的内容    me.html（四入口）
  ├─ 我的作品      my-works.html（已发布/草稿箱/审核中/已下架 · 创作者可见）
  ├─ 我的角色      my-characters.html（[创]/[双]角标 + 亲密度）
  ├─ 我的世界      my-worlds.html（进度条 + 继续游玩）
  └─ 我的卡牌      my-cards.html（稀有度 5 档 + 来源筛选 + 分享/设为背景）
区块四 创作者中心  me.html（等级/收益总览/看板/提现 · lingjing_is_creator 门控）
  ├─ 收益明细/看板 commerce.html#earnings / #dashboard（三视图 + CSV 导出）
  └─ 提现          wallet.html#withdraw
区块五 订阅与消费  me.html（订阅卡 + 升级/取消/历史 + 消费记录）
区块六 设置        settings.html（10 Tab：账号/安全/通知/隐私/显示/声音/AI 偏好/数据管理/法律/关于）
区块七 法律与帮助  me.html（法律 5 + 帮助 4 + 关于 4）
底部              退出登录 + 注销账号（30 天后悔期）
```

## 附录·灵境法则（我的 Tab → `me.html` + `settings.html`）

```
章一 个人主页      me.html
  └─ 头像 / 会员 / 余额 / 5 入口
章二 背包 & 图鉴   me.html#inventory
  └─ 已解锁角色 / 已收集 CG / 已获命运卡
章三 钱包          wallet.html
  └─ 8 Tab：余额 / 充值(6 档) / 订阅 / 消费记录 / 充值记录 / 灵玉获取 / 灵晶明细 / 提现
章四 通知与隐私    settings.html#privacy
章五 ⭐ 法律中心（通用） settings.html#legal
  ├─ 用户协议
  ├─ 隐私政策
  ├─ 社区公约
  ├─ 退款规则
  ├─ 注销协议
  ├─ 实名与年龄验证（用户侧）
  ├─ 自伤援助与紧急资源
  └─ 举报中心
章六 关于         settings.html#about
```

**⭐ v6.1.2 关键决定**：通用法律（用户协议 / 隐私 / 退款 / 注销）从主页 footer 移到附录第五章。创作者法律不放在这里——它们只属于第三卷第五章。

---

## 法律文书拆分总表（v6.1.2）

| # | 法律文书 | 归属 | 卷次 |
|---|---|---|---|
| 1 | 用户协议（USER_AGREEMENT.md / TERMS_OF_SERVICE.md） | 通用 | 附录·第五章 |
| 2 | 隐私政策（PRIVACY_POLICY.md） | 通用 | 附录·第五章 |
| 3 | 社区公约 | 通用 | 附录·第五章 |
| 4 | 退款规则 | 通用 | 附录·第五章 |
| 5 | 注销协议 | 通用 | 附录·第五章 |
| 6 | 实名与年龄验证（用户侧，INFORMED_CONSENT.md / MINOR_BAN_NOTICE.md） | 通用 | 附录·第五章 |
| 7 | 自伤援助与紧急资源 | 通用 | 附录·第五章 |
| 8 | 举报中心（COPYRIGHT_COMPLAINT_PROCESS.md 用户侧入口） | 通用 | 附录·第五章 |
| 9 | AI 免责声明（AI_DISCLAIMER.md / NOVEL_AI_DISCLAIMER.md） | 通用 | 附录·第五章 |
| 10 | 进入世界风险告知（ENTER_WORLD_RISK_NOTICE.md） | 通用 | 附录·第五章 |
| 11 | ⭐ 著作权授权协议 | **创作者专属** | **第三卷·第五章** |
| 12 | ⭐ 改编授权协议 | **创作者专属** | **第三卷·第五章** |
| 13 | ⭐ AI 创作版权声明（AI_COPYRIGHT_NOTICE.md） | **创作者专属** | **第三卷·第五章** |
| 14 | ⭐ 收益分成协议 | **创作者专属** | **第三卷·第五章** |
| 15 | ⭐ 内容审核标准（创作者必读） | **创作者专属** | **第三卷·第五章** |
| 16 | ⭐ 创作者实名认证规则 | **创作者专属** | **第三卷·第五章** |
| 17 | ⭐ 创作者税务与发票 | **创作者专属** | **第三卷·第五章** |
| 18 | ⭐ 投诉与申诉（创作者侧） | **创作者专属** | **第三卷·第五章** |
| 19 | ⭐ 第三方素材上传声明（UPLOAD_THIRD_PARTY_NOTICE.md） | **创作者专属** | **第三卷·第五章** |
| 20 | 版权证书模板（COPYRIGHT_CERTIFICATE.md） | 创作者工具 | 第三卷·第五章 |
| 21 | 导出版权附页（EXPORT_COPYRIGHT_PAGE.md） | 创作者工具 | 第三卷·第五章 |
| 22 | 双生角色告知（DUAL_SOUL_CHARACTER_NOTICE.md） | 创作者工具 | 第三卷·第五章 |
| 23 | 用户指南（LINGJING_USER_GUIDE.md / EXPORT_USER_PROMPT.md） | 通用 | 附录·第六章 |

**统计**：
- 通用法律：10 份 → 附录·第五章
- 创作者专属 + 工具：13 份 → 第三卷·第五章

---

## 主页 footer 法律链接收敛（v6.1.2）

**修复前**（v6.1.1 footer）：
```
完整功能清单 · PRD · UI 设计指南 · 工程规范 · 法律中心 · 设置 · 关于
```
→ 全部是文档/规范链接 + 1 个"法律中心"（指代不明）。

**修复后**（v6.1.2 footer）：
```
📕 灵境 · 双生
├── 我的世界 → me.html
├── 创作 → creator-center.html
├── 心屿 → heart-island.html
├── 发现 → discover.html
├── 帮助 → docs/USER_GUIDE.md
└── 设置 → settings.html
```
法律入口彻底从 footer 拿掉。法律只在两个卷次的目录里出现：
- **附录·第五章**（通用法律）
- **第三卷·第五章**（创作者专属法律）

---

## 改动清单（v6.1.2）

| 文件 | 改动 |
|---|---|
| `docs/SITE_MAP.md` | 新建 · 本文件 |
| `docs/LEGAL_INTEGRATION_PLAN.md` | 更新（已存在，按本目录重写归属） |
| `product-preview.html` | 改 footer · 改"14 个核心模块"第 14 项措辞 |
| `output/preview/creator-center.html` | 新增"创作者法律指南"入口（章五） |
| `docs/ALL_FUNCTIONS.md` | 增 §14 法律拆分表 + §15 站点目录 |
| `.workbuddy/memory/MEMORY.md` | 增 §3.3 法律归属硬规则 |
| `.workbuddy/memory/2026-09-11.md` | 当日追加 v6.1.2 章节 |

---

## 站点目录补遗（2026-09-12 · V20-I 审查同步）

V17-V20 新增页面此前未入目录，现补记：

| 卷 | 页面 | 说明 |
|---|---|---|
| 第二卷 · 世界 | `public-domain.html` | 公版名著库（40 本真实语料 · V20-A/H） |
| 第二卷 · 世界（沉浸） | `sanguo-world.html` | 三国演义小说世界（120 回卷制 · V20-H） |
| 附录 · 法律 | `legal-view.html?doc=XXX` | 法律阅读页（16 份文书统一入口 · V20-G） |
| 第二卷 · 世界（沉浸） | `plot-detail.html` | 作品详情页（V19-A · ⚠️ O-4 孤儿页待接入） |
| 第三卷 · 创作 | `commerce.html` | 上架与定价（作者专属 · 从顶级功能区降级入创作卷） |

### 补遗二（2026-09-13 · V21.0 小说辅助模拟器）

| 卷 | 页面 | 说明 |
|---|---|---|
| 第三卷 · 创作 | `novel-ai-helper.html` | 小说辅助模拟器 · 引导模式（3 必答+5 选答问卷 → 创作简报）+ 专家模式（28 字段保留）· V21-B |
| 第三卷 · 创作 | `novel-outline.html` | 大纲编辑与章节规划（AI 候选 + 确认锁定 + 章节规划锁定）· V21-C |
| 第三卷 · 创作 | `novel-writer.html` | 三栏逐章创作台（20/55/25 + AI 辅助面板 + 质量检查）· V21-D |

创作链路：问卷简报 → 大纲锁定 → 章节规划 → 逐章创作（详 [PRD-v21-novel-sim.md](PRD-v21-novel-sim.md)）。

页面全量清单以 [ALL_FUNCTIONS.md](ALL_FUNCTIONS.md) §2 与 [AUDIT_2026-09-12.md](AUDIT_2026-09-12.md) §四（35 入口审计表）为准。
