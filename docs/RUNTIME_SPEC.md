# 灵境 · 双生 — Novel World Runtime 施工规格书 V1.0

> **用途**：这是给开发直接执行的施工规格书。所有规格已确定，不得自行设计，不得删减功能，不得用"开发中"冒充完成。
>
> 来源：ChatGPT《Novel World Game Runtime V3.0》意见与实施文档（2026-09-17）。

---

## 第一部分：产品形态（唯一正确的形态）

### 1.1 灵境小说世界是什么

2D 沉浸式互动小说游戏 Runtime。

用户进入后看到的不是网页、不是聊天界面、不是普通阅读器，而是一个全屏游戏舞台：背景 + 人物立绘 + 剧情对话框 + 可点击的互动热点。

### 1.2 三层结构

```
┌──────────────────────────────────────────┐
│                                          │
│           GameStage（游戏舞台）           │
│                                          │
│       背景 + 人物 + CG + 特效             │
│                                          │
├──────────────────────────────────────────┤
│           DialogueBox（对话框）           │
│  ┌────────────────────────────────────┐  │
│  │ 顾言                                │  │
│  │ "你来了。"                          │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

### 1.3 绝对不允许的实现形态

| 禁止 | 说明 |
| --- | --- |
| ❌ 普通网页 | 顶部导航 + 文章 + 按钮 |
| ❌ 聊天界面 | 左侧头像 + 右侧气泡 |
| ❌ 普通阅读器 | 长网页滚动 + 下一章 |
| ❌ 纯模拟人生 | 自由生活模拟没有原著剧情 |
| ❌ AI 自由续写 | AI 自己写一个"像原著"的故事 |
| ❌ Unity 3D | 第一阶段不做 3D |

---

## 第二部分：GameStage 分层架构

### 2.1 八层结构（从下到上）

| 层级 | 名称 | 职责 |
| --- | --- | --- |
| 1 | BackgroundLayer | 场景背景、CG、天气、光照 |
| 2 | CharacterLayer | 角色立绘、表情、动作、位置 |
| 3 | ObjectLayer | 家具、道具、可交互对象 |
| 4 | EffectLayer | 粒子特效（雨/雪/花瓣/光尘） |
| 5 | UILayer | 顶部状态栏、菜单按钮、快捷图标 |
| 6 | DialogueLayer | 对话框、角色名、打字机文字 |
| 7 | ChoiceLayer | 选项按钮 |
| 8 | SystemLayer | 系统弹窗、存档面板、菜单面板 |

**层级顺序绝对不能改。** 后面的层永远覆盖在前面的层上面。

### 2.2 组件规格

| 组件 | 位置 | 规格 |
| --- | --- | --- |
| GameStage | 全屏 | 基准 1280×720（16:9），响应式缩放 |
| BackgroundLayer | 铺满 | 100%×100%，无留白 |
| CharacterLayer | 居中偏右/偏左 | 角色高度占屏幕 60%-75% |
| DialogueLayer | 底部 | 宽 100%，高 25%，半透明米色底 |
| ChoiceLayer | 中央偏下 | 按钮宽 60%，高 50px |
| UILayer | 顶部 | 高度 60px，收起/菜单/收藏/分享/截图 |
| SystemLayer | 全屏覆盖 | 弹窗时出现 |

### 2.3 画面基准

```
设计基准：1280 × 720
实际屏幕：1920×1080 / 2560×1440 / 手机 / 平板
统一响应式缩放，不重新设计布局
```

---

## 第三部分：Script Action Registry（剧本动作注册表）

这是整个 Runtime 的核心。**AI 只能生成这些标准动作，不能自由发明动作。**

### 3.1 背景类动作

| 动作 | 参数 | 说明 |
| --- | --- | --- |
| SHOW_BACKGROUND | bg_id, transition | 显示背景 |
| CHANGE_BACKGROUND | bg_id, transition | 切换背景 |
| SHOW_CG | cg_id | 显示 CG |

### 3.2 角色类动作

| 动作 | 参数 | 说明 |
| --- | --- | --- |
| SHOW_CHARACTER | char_id, position, pose, expression | 显示角色 |
| HIDE_CHARACTER | char_id, transition | 隐藏角色 |
| MOVE_CHARACTER | char_id, target_position, duration | 移动角色 |
| CHANGE_EXPRESSION | char_id, expression | 切换表情 |
| CHANGE_POSE | char_id, pose | 切换动作 |
| CHARACTER_FOCUS | char_id | 镜头聚焦角色 |
| CHARACTER_DIM | char_id | 角色变暗（非说话者） |

### 3.3 对白类动作

| 动作 | 参数 | 说明 |
| --- | --- | --- |
| SHOW_NARRATION | text | 显示旁白（原著原文） |
| SHOW_DIALOGUE | speaker_id, text | 显示对白（原著原文） |
| SHOW_THOUGHT | char_id, text | 显示内心独白 |

### 3.4 音频类动作

| 动作 | 参数 | 说明 |
| --- | --- | --- |
| PLAY_BGM | bgm_id, loop | 播放背景音乐 |
| STOP_BGM | fade_out | 停止背景音乐 |
| PLAY_SOUND | sound_id | 播放音效 |

### 3.5 特效类动作

| 动作 | 参数 | 说明 |
| --- | --- | --- |
| SHOW_EFFECT | effect_id, duration | 显示特效 |
| HIDE_EFFECT | effect_id | 隐藏特效 |
| CAMERA_ZOOM | scale, duration | 镜头缩放 |
| CAMERA_SHAKE | intensity, duration | 镜头抖动 |

### 3.6 流程类动作

| 动作 | 参数 | 说明 |
| --- | --- | --- |
| WAIT | duration | 等待 |
| WAIT_CLICK | - | 等待玩家点击 |
| SHOW_CHOICE | choice_id, options | 显示选项 |
| SET_FLAG | flag_name, value | 设置标记 |
| OPEN_MENU | menu_type | 打开菜单 |
| ENTER_SCENE | scene_id | 进入场景 |
| EXIT_SCENE | - | 退出场景 |
| SAVE_GAME | - | 存档 |

**AI 不能发明新的动作。** 如果现有动作不够用，先向作者报告，由作者决定是否扩展 Registry。

---

## 第四部分：前端组件结构

Runtime 模块文件（output/preview/js/）：

```
novel-world-runtime.js   # Script Action Runtime 核心：动作注册表 + 执行引擎
novel-world-stage.js     # GameStage 八层渲染器
novel-world-hotspot.js   # 互动热点系统（Scene/Hotspot/Interaction）
```

LJ_PAGES 页面键：`novel-runtime`（游戏舞台入口）

---

## 第五部分：视觉验收标准

说"功能完成"不算完成。必须提供实际运行截图。

必须提供的截图：

| 编号 | 截图内容 |
| --- | --- |
| 01 | 小说首页 |
| 02 | 章节开始 |
| 03 | 完整剧情演出 |
| 04 | 人物 + 背景 |
| 05 | 点击书桌 |
| 06 | 点击角色 |
| 07 | 探索模式 |
| 08 | 菜单 |
| 09 | 存档 |
| 10 | IF 世界 |

截图必须是：游戏舞台 + 背景 + 人物 + 剧情层 + 游戏 UI + 互动。

打开页面第一眼，应该感觉"这是一个互动小说游戏"，而不是"这是一个 AI 网站"。
