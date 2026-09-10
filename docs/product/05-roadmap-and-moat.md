> **2026-09-08 规范更新**：以 [MIRAI_SPEC v4.1](../MIRAI_SPEC.md)、当前 PRD 和 DEVELOPMENT_PLAN 为准。以下旧版内容保留参考；3D 首发、小说世界后置、Stripe 首发和旧 Phase 编号不再有效。MVP 为2D陪伴与完整互动小说；正式验收须区分开发模拟与已接通能力。

# 05 · 路线图与护城河（愿景母本对齐）

> 上级文档：[../PRD.md](../PRD.md) ｜ 来源：最初产品设想（"AI 3D 数字人 × 心理学陪伴 × 长期记忆 × 小说/同人世界模拟 × 沉浸式剧情引擎"）
> 本篇记录 MVP 之外的差异化能力，防止"做完聊天机器人就停"。

## 1. 产品最终形态

不是"一个会和你聊天的 3D AI"，而是：

> **一个会记得你、理解你、与你建立关系，并与你共同生活在一个可持续发展的 AI 世界里的数字生命平台。**

## 2. 护城河结构（Character Graph）

模型会越来越便宜，不是护城河。真正的长期数据资产是：

```
User
 ├── Character A
 │     ├── Memory（四层记忆）
 │     ├── Story（剧情状态机）
 │     └── Relationship（7 维 + 事件溯源）
 ├── Character B
 └── World C
       ├── Characters / Factions
       ├── Locations / Lore
       └── Events / Timeline
```

角色 + 记忆 + 关系 + 世界 + 剧情 + 3D 资产 + UGC，构成越用越难迁移的数据资产网络。

## 3. P2 能力详述

### 3.1 世界/同人引擎（Character Universe Engine，FR-WORLD-01）

- 用户可创建世界：世界名称、时代（架空古代/科幻/现代…）、规则（武侠/魔法/赛博…）、主要势力（如皇城/魔教/江湖联盟）。
- 小说角色导入：用户输入想与某作品角色共处 → 系统建立 Character + World + Lore + Timeline + Relationships + **User Role（用户在世界中的身份）**，生成开局 Scenario。
- 版权路径：
  - **用户私域模拟**：用户自行配置的同人内容默认仅个人体验、不可上架；
  - **官方授权 IP**：IP Owner → Official Character → Official World → Licensed AI Experience，未来与小说/漫画/游戏/动画/网文平台合作（B2B）。
- 法律边界见 [../legal/TERMS_OF_SERVICE.md](../legal/TERMS_OF_SERVICE.md) §创作者与内容。

### 3.2 剧情状态机（Story Simulation Engine，FR-STORY-02，P1 末/P2 完善）

整个故事是持续状态机：

```
World State → Character State → User Action → Event Engine
    → LLM Narrative → Relationship Update → Memory Update → World State Update
```

示例：用户"我决定离开" → 事件：用户离开 / 角色情绪 sadness +0.42 / intimacy −0.08 / 生成任务"寻找用户" / 世界推进到夜晚 / 下一事件"角色追到车站"。
核心体验承诺：**"下一次回来，故事不会重置。"**

### 3.3 人生模拟（Life Simulation，FR-WORLD-02）

- AI 角色拥有自己的工作、日程、兴趣、社交、情绪、目标、记忆；
- 离线期间后台任务生成角色"生活进展"（如"我昨天后来想了一晚上"），写入记忆/剧情；
- **严格约束**：只在用户下次进入时呈现，绝不主动推送（反骚扰硬规则不变）。

### 3.4 一句话创建世界（FR-WORLD-03）

输入"给我一个下雨的东京咖啡馆，我和一个嘴硬但其实很关心我的女孩在里面聊天"→ AI 生成：场景 + 角色 + 灯光 + 音乐 + 天气 + 剧情开局，结果可编辑可进入。

### 3.5 AI Director 多代理架构（FR-CHAT-08 演进）

```
AI Director（意图/需求/风格最终决策）
   ├── Character Agent（人设一致的对话）
   ├── Story Agent（剧情/事件推进）
   ├── Emotion Agent（valence/arousal/need）
   └── Memory Agent（抽取/检索/冲突检测）
```

Director 输入"今天很累"→ 判定 intent=emotional_support、need=companionship、scene=bedroom、response_mode=low-energy comforting，再交角色 Agent 生成。

### 3.6 创作者经济升级（FR-MKT-04）

- 角色/世界模板的使用、订阅、购买；平台抽成；热门排行；
- 创作者收益 P2 之前**始终虚拟化**（积分，不可提现）；
- 官方授权 IP 商店作为 B2B 合作通道。

### 3.7 记忆图谱与加密

- Memory Graph：记忆条目间建立关联（人物/事件/地点图谱），提升长程一致性；
- Memory Encryption：敏感记忆静态加密（P2 安全增强）。

## 4. KPI 哲学（健康优先）

避免"黏得越久越好"的指标陷阱。研究表明 AI 陪伴存在依赖、现实关系替代、操纵与弱势用户风险，因此：

- **不把** 单纯 DAU/时长 作为北极星；
- 关注：用户满意度、关系质量、情绪改善、**用户自主性**、健康使用、现实社交平衡；
- Well-being Score 是内部运营指标，用于触发温和保护，而非刺激活跃。

## 5. 代际能力对照

| 能力 | 第一代 AI 陪伴 | 星野类 | MIRAI 灵境目标 |
| --- | --- | --- | --- |
| AI 聊天/角色/创建 | ✅/部分 | ✅ | ✅ |
| 长期记忆 | 部分 | ✅ | 四层深度记忆 + 用户控制 |
| 3D 数字人 / 实时语音 | 少/部分 | 部分 | 核心（P0 3D / P1 语音） |
| 情绪/关系模型 | 基础 | 基础/有 | 心理引擎 + 关系 OS |
| 小说同人 / 世界模拟 | 少 | 部分 | P2 核心护城河 |
| 心理安全 | 基础 | 基础 | 底层系统（反迎合/反操纵/Well-being） |
| AI 自主行为 | 少 | 部分 | 人生模拟（仅呈现不推送） |
