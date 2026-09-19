# 灵境 · 双生 — Novel World 数据规格书 V1.0

> **用途**：写后端 / 数据层时看。定义数据表结构和 Script 数据格式。
>
> 来源：ChatGPT《Novel World Game Runtime V3.0》意见与实施文档（2026-09-17）。

---

## 第一部分：Script 数据格式（前端运行时消费）

Script 是一个有序的动作序列，Runtime 逐条执行。

```json
{
  "script_id": "ch01_s01",
  "novel_id": "taohuayuan",
  "chapter": 1,
  "nodes": [
    {
      "node_id": "n01",
      "node_type": "CANON",
      "source_paragraph_start": 0,
      "source_paragraph_end": 0,
      "actions": [
        { "type": "SHOW_BACKGROUND", "params": { "bg_id": "pavilion_night", "transition": "fade" } },
        { "type": "SHOW_CHARACTER", "params": { "char_id": "gu_yan", "position": "center-right", "pose": "default", "expression": "calm" } },
        { "type": "PLAY_BGM", "params": { "bgm_id": "bgm_01", "loop": true } },
        { "type": "SHOW_DIALOGUE", "params": { "speaker_id": "gu_yan", "text": "你来了。" } },
        { "type": "WAIT_CLICK" },
        { "type": "SHOW_NARRATION", "params": { "text": "月光洒在亭中，远处传来隐约的笛声。" } },
        { "type": "WAIT_CLICK" },
        { "type": "CHANGE_EXPRESSION", "params": { "char_id": "gu_yan", "expression": "smile" } },
        { "type": "SHOW_DIALOGUE", "params": { "speaker_id": "gu_yan", "text": "等了你很久。" } },
        { "type": "WAIT_CLICK" },
        { "type": "SHOW_CHOICE", "params": { "choice_id": "c01", "options": [
          { "label": "抱歉，来迟了。", "next_node": "n02" },
          { "label": "（沉默不语）", "next_node": "n03" }
        ]}}
      ],
      "next_node": "n02"
    }
  ]
}
```

### 动作参数约定

| 动作 | params 字段 | 类型 | 必填 |
| --- | --- | --- | --- |
| SHOW_BACKGROUND | bg_id, transition | string | 是 |
| CHANGE_BACKGROUND | bg_id, transition | string | 是 |
| SHOW_CG | cg_id | string | 是 |
| SHOW_CHARACTER | char_id, position, pose, expression | string | 是 |
| HIDE_CHARACTER | char_id, transition | string | 是 |
| MOVE_CHARACTER | char_id, target_position, duration | string,int | 是 |
| CHANGE_EXPRESSION | char_id, expression | string | 是 |
| CHANGE_POSE | char_id, pose | string | 是 |
| CHARACTER_FOCUS | char_id | string | 是 |
| CHARACTER_DIM | char_id | string | 是 |
| SHOW_NARRATION | text | string | 是 |
| SHOW_DIALOGUE | speaker_id, text | string | 是 |
| SHOW_THOUGHT | char_id, text | string | 是 |
| PLAY_BGM | bgm_id, loop | string,bool | 是 |
| STOP_BGM | fade_out | int(ms) | 否 |
| PLAY_SOUND | sound_id | string | 是 |
| SHOW_EFFECT | effect_id, duration | string,int | 是 |
| HIDE_EFFECT | effect_id | string | 是 |
| CAMERA_ZOOM | scale, duration | float,int | 是 |
| CAMERA_SHAKE | intensity, duration | float,int | 是 |
| WAIT | duration | int(ms) | 是 |
| WAIT_CLICK | — | — | — |
| SHOW_CHOICE | choice_id, options | string,array | 是 |
| SET_FLAG | flag_name, value | string,any | 是 |
| OPEN_MENU | menu_type | string | 是 |
| ENTER_SCENE | scene_id | string | 是 |
| EXIT_SCENE | — | — | — |
| SAVE_GAME | — | — | — |

### position 取值

`left` / `center-left` / `center` / `center-right` / `right`

### transition 取值

`fade` / `slide-left` / `slide-right` / `cut` / `dissolve`

---

## 第二部分：Scene / Hotspot 数据格式

```json
{
  "scene_id": "study_republic",
  "background": "study_republic.png",
  "hotspots": [
    {
      "hotspot_id": "hs_desk",
      "name": "书桌",
      "shape": "rectangle",
      "shape_data": { "x": 35, "y": 55, "w": 30, "h": 25 },
      "object_type": "furniture",
      "interactions": [
        { "interaction_id": "i_look", "name": "查看", "result_text": "桌上摆着笔墨纸砚，一封未写完的信。" },
        { "interaction_id": "i_take", "name": "拿起信件", "result_text": "你将信件收入怀中。", "state_change": { "flags": { "has_letter": true } } }
      ]
    },
    {
      "hotspot_id": "hs_npc",
      "name": "顾言",
      "shape": "rectangle",
      "shape_data": { "x": 60, "y": 25, "w": 20, "h": 50 },
      "object_type": "character",
      "interactions": [
        { "interaction_id": "i_talk", "name": "交谈", "result_text": "顾言微微一笑，似有话说。" }
      ]
    },
    {
      "hotspot_id": "hs_door",
      "name": "门",
      "shape": "rectangle",
      "shape_data": { "x": 80, "y": 30, "w": 12, "h": 45 },
      "object_type": "environment",
      "interactions": [
        { "interaction_id": "i_enter", "name": "进入", "action": { "type": "ENTER_SCENE", "params": { "scene_id": "pavilion_night" } } }
      ]
    }
  ]
}
```

### shape 取值

`rectangle` / `circle` / `polygon` / `ellipse` / `point`

### object_type 取值

`character` / `furniture` / `prop` / `environment`

---

## 第三部分：数据库表（后端参考，前端用 localStorage / JSON 替代）

### 3.1 剧本表

```sql
CREATE TABLE story_scripts (
    id UUID PRIMARY KEY,
    novel_id UUID NOT NULL,
    volume_number INT,
    chapter_number INT,
    script_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE story_script_nodes (
    id UUID PRIMARY KEY,
    script_id UUID NOT NULL,
    node_index INT NOT NULL,
    node_type VARCHAR(20),  -- CANON / SIDE_STORY / IF
    source_paragraph_start INT,
    source_paragraph_end INT,
    next_node_id UUID,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE story_script_actions (
    id UUID PRIMARY KEY,
    node_id UUID NOT NULL,
    action_index INT NOT NULL,
    action_type VARCHAR(30) NOT NULL,
    action_params JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE story_script_choices (
    id UUID PRIMARY KEY,
    node_id UUID NOT NULL,
    choice_type VARCHAR(30),  -- CANON_CHOICE / PLAYER_CHOICE / EXPLORATION_CHOICE / SIDE_STORY_CHOICE / IF_CHOICE
    options JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 3.2 场景表

```sql
CREATE TABLE scene_layers (
    id UUID PRIMARY KEY,
    scene_id UUID NOT NULL,
    layer_type VARCHAR(20),  -- background / character / object / effect
    content JSONB NOT NULL,
    z_index INT
);

CREATE TABLE scene_hotspots (
    id UUID PRIMARY KEY,
    scene_id UUID NOT NULL,
    hotspot_name VARCHAR(100),
    shape VARCHAR(20),
    shape_data JSONB NOT NULL,
    object_type VARCHAR(30),
    interaction_ids UUID[],
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE interaction_registry (
    id UUID PRIMARY KEY,
    hotspot_id UUID NOT NULL,
    interaction_name VARCHAR(50),
    condition JSONB,
    result JSONB,
    state_change JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 3.3 角色表

```sql
CREATE TABLE character_poses (
    id UUID PRIMARY KEY,
    character_id UUID NOT NULL,
    pose_name VARCHAR(50),
    asset_url TEXT
);

CREATE TABLE character_expressions (
    id UUID PRIMARY KEY,
    character_id UUID NOT NULL,
    expression_name VARCHAR(50),
    asset_url TEXT
);

CREATE TABLE character_costumes (
    id UUID PRIMARY KEY,
    character_id UUID NOT NULL,
    costume_name VARCHAR(50),
    asset_url TEXT
);
```

### 3.4 游戏状态表

```sql
CREATE TABLE game_runtime_states (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    novel_id UUID NOT NULL,
    current_script_node_id UUID,
    current_scene_id UUID,
    current_anchor_id UUID,
    player_location VARCHAR(100),
    player_identity VARCHAR(50),
    inventory JSONB,
    flags JSONB,
    relationships JSONB,
    quests JSONB,
    route VARCHAR(20),  -- CANON / SIDE_STORY / IF
    if_state JSONB,
    exploration_state JSONB,
    world_time VARCHAR(50),
    saved_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE dialogue_backlog (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    novel_id UUID NOT NULL,
    source_type VARCHAR(30),  -- AUTHOR_ORIGINAL / AI_EXPLORATION / AI_SIDE_STORY / AI_IF
    speaker VARCHAR(100),
    text TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE replay_records (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    novel_id UUID NOT NULL,
    chapter_id UUID,
    script_node_id UUID,
    saved_at TIMESTAMP DEFAULT NOW()
);
```

---

## 第四部分：Canon Lock（不可变校验）

Canon 原文是不可变事实。

- SOURCE → CANON → HASH → ANCHOR → IMMUTABLE
- SHA-256 哈希校验
- 原文不可修改、删除、重排序、摘要替代
- AI 只能在允许的 Content Layer 中工作

必须测试：
- test_source_hash
- test_canon_hash
- test_no_canon_rewrite
- test_no_canon_delete
- test_no_canon_reorder
- test_canon_immutable
