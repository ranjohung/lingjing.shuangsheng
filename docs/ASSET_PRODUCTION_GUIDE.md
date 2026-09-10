# 灵境 · 双生 — 资产生产指南 v5.2

基线：[PRD](../PRD.md) §ASSET-01 / [product/06 §ASSET-01 / §CONTENT-02](../product/06-world-directory-and-ui.md) / [DUAL_SOUL_SPEC](../DUAL_SOUL_SPEC.md) §CHAR-03 / [ECONOMY_SYSTEM](../ECONOMY_SYSTEM.md)。本指南负责让 SD 立绘与 Blender 模型两条线**产出可直接接入应用**的资产。

## 总体原则

1. **同一角色跨视图一致**：立绘 / 3D 模型 / 头像 / CG 在用户眼里是同一个人，因此面部结构、肤色、瞳色、发色、体型必须保持一致。**单角色的立绘 SD 模型与 3D 模型不在脸部轮廓上允许偏差超过 ±5%。**
2. **可执行优先于好看**：宁可完成度 70%、可用、可接入；不要 100%、半年后还没进产品。
3. **可追溯**：所有资产留 metadata（提示词 / seed / 模型 ID / 角色 DNA 链路），不能"凭感觉"。
4. **风格分层**：现实风 / 二次元 / 半写实 / 3D 动漫 / 古风 / 科幻 / Q 版 / 游戏风 — 同一作品内风格统一，跨题材可以分层。
5. **未成年人安全**：所有角色立绘 / 模型必须 ≥ 18 岁（产品法律约束）；未成年人外形禁止使用。

## ASSET-02 命名与目录结构

```
apps/web/public/assets/
├── characters/                # 角色立绘（SD 输出 PNG/WebP）
│   ├── <character-slug>/
│   │   ├── main/              # 主立绘（用于阅读器、陪伴页）
│   │   │   ├── portrait.png            # 主立绘
│   │   │   ├── portrait_mobile.png     # 移动裁剪版（人物居中、上下留 6%）
│   │   │   ├── portrait.json          # 元数据
│   │   │   └── thumbnails/             # 缩略图
│   │   ├── expressions/        # 表情差分
│   │   │   ├── happy.png
│   │   │   ├── sad.png
│   │   │   ├── angry.png
│   │   │   ├── shy.png
│   │   │   ├── surprise.png
│   │   │   ├── calm.png
│   │   │   ├── thoughtful.png
│   │   │   ├── flirty.png
│   │   │   ├── embarrassed.png
│   │   │   ├── excited.png
│   │   │   └── (后续扩展)
│   │   ├── costumes/           # 服装变体
│   │   │   ├── default/       # 默认
│   │   │   ├── modern/        # 现代
│   │   │   ├── fantasy/       # 奇幻
│   │   │   ├── cyberpunk/     # 赛博
│   │   │   ├── ancient_cn/    # 古风
│   │   │   └── school/        # 校园
│   │   ├── cgs/                # 单人 CG（剧情节点用）
│   │   │   └── cg_<scene-id>.png
│   │   └── manifest.json       # 角色 DNA 摘要
├── worlds/                    # 世界封面 / 场景背景
│   ├── <world-slug>/
│   │   ├── cover.png           # 主页封面（3:4）
│   │   ├── cover_mobile.png    # 移动裁剪
│   │   ├── scenes/             # 场景背景图（16:9）
│   │   │   ├── scene_<node-id>.png
│   │   │   └── ...
│   │   └── manifest.json
├── cards/                      # 命运卡 / 抉择卡模板
│   ├── destiny/<rarity>_<character>.png
│   └── choice/<rarity>.png
├── ui/                         # UI 装饰
│   ├── icons/                  # 拓展 icon
│   ├── ornaments/              # 边框、花纹
│   └── ...
└── models/                     # Blender 3D 输出
    ├── characters/<character-slug>/
    │   ├── source/<character>.blend
    │   ├── export/<character>.glb
    │   ├── textures/<...>.png
    │   ├── metadata.json
    │   └── manifest.json
    └── scenes/<world-slug>/...
```

> ⚠ 任何素材必须上传到 `assets/source/` 后再被脚本处理到 `apps/web/public/assets/`，避免直接污染交付目录。脚本参考 `scripts/generate_realistic_portrait.py` 已存在。

## ASSET-03 SD 立绘规范

### 风格选择

| 题材 | 推荐 LoRA / 模型 |
| --- | --- |
| 现实风 | majicMIX realistic v7 / ChilloutMix |
| 二次元 | Anything V5 / Counterfeit |
| 半写实 | majicMIX（含 lora） / DreamShaper |
| 3D 动漫 | majicMIX + 3D-style lora |
| 游戏风 | RPG 类 lora 套件 |
| 古风 | guofeng (国风) / hanfu-river |
| 科幻 | cyberpunk 类 lora |
| Q 版 | anything + chibi lora |

⚠ 模型文件须放指定目录（`models/Stable-diffusion/`），不在仓库中；只用同一份基模 + LoRA 切换即可，避免风格漂移。

### 1. 主立绘规格

| 项 | 规格 |
| --- | --- |
| 分辨率 | 主立绘 1024×1536（3:4，2K 直出后再放大 2x） |
| 格式 | PNG（透明背景） + WebP 回退 |
| 主体比例 | 头部至腰线占图 2/3，留出头顶空间 6%、左右留 8% |
| 构图 | 角色正面 3/4 视角，眼神看向画面中央略偏下 |
| 背景 | 透明（PNG alpha） |
| 文件大小 | ≤ 2 MB（裁切后） |

### 2. 表情差分

- 11 种核心表情（见上目录 `expressions/`）
- 同一角色所有表情必须保持：眉形 / 鼻形 / 瞳色 / 脸型 / 发型 / 体型完全一致
- 推荐使用 SD `img2img` + `ControlNet OpenPose` 加 seed 锁定
- 接受度测试：跨表情对比图，相邻表情相似度 ≥ 90%（CLIP 检查）

### 3. 服装变体

- 同角色服装变体必须保持：面部完全不变，只换装
- 推荐使用 inpainting / outfit lora
- 至少 1 个默认 + 2 个变体；按 [CHAR-03 §服装](../DUAL_SOUL_SPEC.md) 候选枚举

### 4. CG（场景 CG / 关键节点 CG）

- 单人 / 双人 / 群像
- 分辨率 1280×1920（2:3）
- 必须保留 PSD/工作文件，含分层（角色 / 背景 / 后期）

### 5. 场景背景

- 16:9（1920×1080 起步，可上 2K）
- 不带角色层（前景人物由立绘层单独渲染）
- 必须能匹配至少一种光照风格：日 / 黄昏 / 夜 / 雨 / 雪 / 阴 / 室内 / 户外

### 6. SD 提示词模板

保存为 `apps/web/public/assets/characters/<slug>/prompt.md`，每张图都附：

```yaml
character: <character-slug>
expression: <one of 11>
costume: <outfit-id>
seed: <int>
sampler: DPM++ 2M
steps: 30
cfg_scale: 7
denoising: 0.45
lora:
  - name: <lora-name>
    weight: 0.7
base_model: majicMIX-realistic-v7
negative_prompt: |
  child, loli, underage, low quality, blurry, ...
controlnet:
  - openpose: true
  - lineart: 0.6
notes: |
  表情主基调：温柔但克制；
  服饰：现代都市；
  ...
```

### 7. 验收清单（每张图）

- [ ] 透明背景干净，无白色光晕残留
- [ ] 五官比例符合参考资料
- [ ] 表情与同角色其他表情相似度 ≥ 90%
- [ ] 多分辨率缩略图（24/48/96/192）正确
- [ ] PNG 文件大小 ≤ 2MB
- [ ] metadata JSON 含 seed、模型、提示词、版权来源
- [ ] 上传后 IPC 走 `POST /api/v1/assets/upload` 或 `apps/web/public/assets/characters/...`

### 8. 与应用集成

- 角色立绘通过角色 DNA 的 `portrait_url` 字段
- 表情差分通过 `portrait_url[emotion]` 枚举；前端根据 Emotion Engine 实时切
- 服装变体通过 `costume_id` 索引；解锁状态由 entitlement 服务校验
- CG 通过 `chapters[i].cg_url` 触发，按节点解锁

## ASSET-04 Blender 角色 / 场景规范

### 1. 角色模型规格

| 项 | 规格 |
| --- | --- |
| 拓扑 | 四边形为主；边循环密度：嘴 / 眼 / 鼻周围密集均匀 |
| 多边形 | 中端 ≤ 30k faces；高模可选（仅近镜） |
| 骨骼 | Mixamo-rig 兼容（HumanIK），推荐 65 骨骼 |
| 蒙皮权重 | 四肢与肩膀正确，指尖可独立控制 |
| 表情 | ARKit 52 表情 Blendshape |
| 服装 | 独立网格可换装；与身体模型脱开 |
| 材质 | PBR：base color / metallic / roughness / normal / AO，≤ 4K |
| 缩放 | 1 单位 = 1 米；身高 1.70 米为基线（写实向） |
| 文件 | `.blend` + `.glb`（GLB ≤ 30 MB） |

### 2. 场景模型规格

| 项 | 规格 |
| --- | --- |
| 拓扑 | LOD3 ≥ 30k / LOD2 ≥ 8k / LOD1 ≤ 2k |
| 贴图 | PBR 4K（远景可用 2K） |
| 光照 | 烘焙到主光 + 动态灯光若干 |
| 性能 | 桌面 60 FPS / 移动 ≥ 30 FPS（高性能机器） |
| 文件 | `.blend` + `.glb` + `.fbx` |

### 3. 命名与元数据

每模型：`metadata.json`

```json
{
  "character": "lu-bu-3d-v1",
  "source_lora": "majicMIX-realistic-v7",
  "rig": "mixamo-humanoid-65",
  "blendshapes": ["ARKit_52", "expressive_tongue"],
  "polygons": 28500,
  "textures": ["basecolor", "metallic_roughness", "normal", "ao"],
  "export": ["blend", "glb"],
  "created_at": "2026-09-09",
  "author": "ta-name",
  "license": "internal",
  "reviewer": "lead-3d"
}
```

### 4. LOD 策略

- LOD1 ≤ 2k：远程 / 30m+ / 多 NPC 同屏
- LOD2 ≤ 8k：中程 / 15–30m / 单 NPC
- LOD3 全部：近镜 / 15m 内 / 主交互角色

必须用 gltf-transform / Blender 自动 LOD，不要手摆。

### 5. 动效与表情

- ARKit 52 blendshape：eyeBlinkLeft / Right / mouthSmileLeft / Right / browInnerUp / ...
- 表情映射：JSON 文件 `character.expressions.json`，前端 `<Avatar expression="happy" duration=0.4>` 调用
- 平滑过渡：crossFadeTo 0.4 秒（[PRD §4.2](../PRD.md)）

### 6. 性能与降级

- 移动端：默认 LOD2，30 FPS 目标
- WebGL 上下文丢失 / GLB 加载失败 → 降级到 SD 立绘 PNG（[PRD §4.1](../PRD.md)）
- 内存监控：超出 1.2 GB 强制 LOD1

### 7. 验收清单（每模型）

- [ ] `.blend` 源文件已纳入 git-lfs 或物件存储
- [ ] `.glb` 文件 ≤ 30 MB
- [ ] 多边形 ≤ 30k（中端）
- [ ] 骨骼绑定通过 Mixamo 兼容性测试
- [ ] 表情 blendshape 至少 ARKit 52
- [ ] 跨 LOD 平滑切换无突变
- [ ] 在 Chrome、Edge、Safari 最新版 FPS ≥ 30
- [ ] 移动端 Safari iOS 16+ / Chrome Android 12+ 兼容
- [ ] 在 WebGL 上下文丢失后能自动恢复
- [ ] 与同角色 SD 立绘面部一致性通过（CLIP 相似度 ≥ 0.85）

### 8. 与应用集成

- 角色通过 `character.avatar_config.model_url` 指向 GLB
- 表情 / 动作由 Web 端通过 `<Avatar>` React 组件驱动 `useGLTF` + `useAnimations`
- World OS 通过 `scene_update` 事件推送至前端

## ASSET-05 资产版本与来源合规

### 版本控制

| 字段 | 说明 |
| --- | --- |
| `version` | 语义版本，主.次.补丁 |
| `created_at` | 创建时间 |
| `author` / TA | 谁做的 |
| `reviewer` / PM | 验收人 |
| `notes` | 修改说明 |
| `replaces` | 替代的旧版本 ID |

### 来源合规

- **官方模板**：平台自制；版权归平台，使用者按平台授权协议。
- **公版作品**：必须明确（Gutenberg / ctext / 文硕阁）；商用前法务核验。
- **创作者上传**：必须上传者提供授权范围，平台不自动确权。
- **AI 生成**：必须标注"AI 辅助生成"，不可声称为真人作品。
- **同人角色**：仅授权用户私域使用，禁止公开发布。

⚠ 所有 SD 输出在写入交付目录前，运行 `scripts/asset_safety_check.py` 检查禁止词（loli / underage / real person name / political 等）。

## ASSET-06 资产生产流水线（建议）

```
创意 / 角色 DNA
   │
   ▼
SD 立绘生成（多候选）
   │
   ▼
人工筛选 → 调整 → 表情差分 → 服装变体
   │
   ▼
导出 PNG + WebP + 缩略图 + JSON
   │
   ▼
Blender 角色建模 → 拓扑 / UV / 蒙皮 / 骨骼
   │
   ▼
上传 GLB + 材质 + blendshape
   │
   ▼
Web 端 <Avatar> 组件测试
   │
   ▼
跨视图一致性测试（CLIP）
   │
   ▼
入仓 / 入库 / 上线
```

工程脚本（已存在 / 待补）：
- ✅ `scripts/generate_realistic_portrait.py`（已用）
- ⏳ `scripts/character_anatomy_base.py`（基础比例模型导出，待补）
- ⏳ `scripts/asset_safety_check.py`（违规检查，待补）
- ⏳ `scripts/clip_consistency_check.py`（角色一致性验证，待补）

---

v5.2 补强文档；任何内容冲突以 v5.1 各规范为准。
