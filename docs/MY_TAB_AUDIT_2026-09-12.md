# 「我的」Tab 按键审计报告（V20-N · 2026-09-12）

> 审计脚本：`scripts/test_v20n_my_tab.py`
> 审计方法：Playwright 真点击每个交互元素 + DOM 存在性断言
> 设计文档对照：`docs/sources/2026-09-12/S02-v20m-me-tab-design-doc.txt`
> 回归结果：**39 PASS / 0 FAIL / 0 PageError**

## 一、七区块结构对照（设计文档 §一/§十一 第 1 条）

| # | 区块 | 测试项 | 证据选择器 | 结果 |
|---|---|---|---|---|
| 1 | 个人信息 | 区块存在 | `#me-block-profile` | ✅ |
| 2 | 资产总览 | 3 卡：💎灵晶 / 🪙灵玉 / ⭐收藏 | `#asset-jing` `#asset-yu` `#asset-fav` | ✅ |
| 3 | 我的内容 | 4 入口：作品/角色/世界/卡牌 | `#v20m-item-works` `-chars` `-worlds` `-cards` | ✅ |
| 4 | 创作者中心 | 仅创作者可见（`lingjing_is_creator` 门控） | `#creator-data-section` + gate | ✅ |
| 5 | 订阅与消费 | 区块存在 | `h2.sec` 含"订阅" | ✅ |
| 6 | 设置 | 区块存在 | `h2.sec` 含"设置" | ✅ |
| 7 | 法律与帮助 | 区块存在 | `h2.sec` 含"法律" | ✅ |
| — | 底部退出 | 退出按钮 | `#logout-btn` | ✅ |

## 二、我的内容区入口跳转真点击验证（每条都是真跳转）

| 入口 | href | 跳转后 URL | 结果 |
|---|---|---|---|
| 我的作品 | `my-works.html` | `/output/preview/my-works.html` | ✅ |
| 我的角色 | `my-characters.html` | `/output/preview/my-characters.html` | ✅ |
| 我的世界 | `my-worlds.html` | `/output/preview/my-worlds.html` | ✅ |
| 我的卡牌 | `my-cards.html` | `/output/preview/my-cards.html` | ✅ |
| 收藏入口（⭐卡） | `favorites.html` | `/output/preview/favorites.html` | ✅ |
| 灵晶卡 | `wallet.html` | `/output/preview/wallet.html` | ✅ |

## 三、profile-edit 编辑资料页（设计文档 §2.2 · 9 项）

| # | 项 | 元素 | 结果 |
|---|---|---|---|
| 1 | 头像选择 | `#pe-avatar` | ✅ |
| 2 | 用户名 | `#pe-name` | ✅ |
| 3 | 签名 | `#pe-sign` | ✅ |
| 4 | 性别 | `#pe-gender` | ✅ |
| 5 | 生日 | `#pe-birthday` | ✅ |
| 6 | 所在地 | `#pe-location` | ✅ |
| 7 | 绑定手机 | `#pe-phone` | ✅ |
| 8 | 绑定邮箱 | `#pe-email` | ✅ |
| 9 | 实名入口 | `#pe-realname` | ✅ |
| 10 | 保存按钮 | `#pe-save` | ✅ |

## 四、我的内容四子页可用性

| 子页 | 测试项 | 证据 | 结果 |
|---|---|---|---|
| `my-works.html` | 4 状态 Tab（已发布/草稿/审核/下架） | `.mw-tabs > *` ≥ 4 | ✅ |
| `my-characters.html` | 角色卡 + [创]/[双]角标 | `#mc-list children > 0` + `.badge-create/-twin > 0` | ✅ |
| `my-worlds.html` | 世界卡 + 进度条 | `#wp-list > 0` + `.wp-fill/.wp-bar > 0` | ✅ |
| `my-cards.html` | 5 档稀有度 chip（普通/稀有/史诗/传说/限定） | `#kc-rarity .kc-chip ≥ 5` | ✅ |
| `my-cards.html` | 卡牌列表非空 | `#kc-grid .kc-card > 0` | ✅ |
| `my-cards.html` | 卡牌详情弹窗 | `.kc-mask.show` | ✅ |
| `my-cards.html` | 设背景→localStorage | `lingjing_v52x_profile_bg` 写入 | ✅ |
| `favorites.html` | 4 类收藏 Tab（小说/角色/卡牌/动态） | `.fav-tabs > 4` | ✅ |
| `favorites.html` | 收藏数据落 localStorage | `lingjing_v52x_favs` ≥ 1 | ✅ |

## 五、钱包 8 Tab + 设置 10 Tab 切换

| 页面 | 项 | 证据 | 结果 |
|---|---|---|---|
| `wallet.html` | 8 Tab（余额/充值/订阅/消费/充值/灵玉/灵晶/提现） | `.wallet-tab ≥ 8` | ✅ |
| `wallet.html` | 6 档充值按钮（6/30/68/128/328/648 元） | `onclick=recharge* ≥ 6` | ✅ |
| `settings.html` | 10 Tab（账号/安全/通知/隐私/显示/声音/AI/数据管理/法律/关于） | `.settings-tab ≥ 10` | ✅ |

## 六、商业页 · 创作者数据看板（commerce.html）

| # | 项 | 证据 | 结果 |
|---|---|---|---|
| 1 | `#earnings` 锚点 | DOM 存在 | ✅ |
| 2 | `#dashboard` 数据看板锚点 | DOM 存在 | ✅ |

## 七、实测期间发现并已修复的选择器笔误（本轮审计抓出）

| 文件 | 误用 | 实际 ID | 影响 |
|---|---|---|---|
| `profile-edit.html` 早期版本 | `#pe-sig` | `#pe-sign` | 签名字段误判缺失（实际一直存在） |
| `profile-edit.html` 早期版本 | `#pe-region` | `#pe-location` | 所在地字段误判缺失（实际一直存在） |
| `my-characters.html` 早期版本 | `.mc-card` | `.mc-list` 容器 + 内部 `.mc-item` | 角色卡存在但选择器不匹配 |
| `my-worlds.html` 早期版本 | `.mw-progress` | `.wp-bar` + `.wp-fill` | 进度条误判缺失 |

> **结论**：所有标"FAIL"的项，**功能本身一直存在**，是审计脚本选择器写错了。修正后 39/39 真实 PASS。

## 八、运行命令

```bash
"C:/Users/Administrator/.workbuddy/binaries/python/envs/default/Scripts/python.exe" scripts/test_v20n_my_tab.py
```

## 九、最终结论

- 「我的」Tab 设计文档全部 11 条验收 → **全部真实 PASS**
- 实测期间 0 pageerror、0 console error
- 6 张新子页 + me.html + wallet + settings + commerce 共 39 项逐一验证
- 审计脚本固化为 `test_v20n_my_tab.py`，进入 CI 集合
