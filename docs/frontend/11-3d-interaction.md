> **2026-09-08 规范更新**：以 [MIRAI_SPEC v4.1](../MIRAI_SPEC.md)、当前 PRD 和 DEVELOPMENT_PLAN 为准。以下旧版内容保留参考；3D 首发、小说世界后置、Stripe 首发和旧 Phase 编号不再有效。MVP 为2D陪伴与完整互动小说；正式验收须区分开发模拟与已接通能力。

# 11 · 3D 交互规范与防崩溃机制

> 上级文档：[../PRD.md](../PRD.md) ｜ 关联：[10-frontend-architecture.md](./10-frontend-architecture.md)
> 本篇是工程健壮性规范（不是视觉设计稿），两条硬要求：**失败不白屏、切换不跳变**。

## 1. 组件结构

```tsx
// components/three/CharacterCanvas.tsx 结构示意
<CanvasErrorBoundary fallback={<PaperCharacter avatarUrl={pngUrl} />}>
  <Canvas
    onCreated={({ gl }) => {
      gl.domElement.addEventListener('webglcontextlost', onContextLost);
    }}
  >
    <Suspense fallback={<CanvasLoading />}>
      <CharacterModel
        modelUrl={character.avatar_config.model_url}
        animation={currentAnimation}   // 来自 AIResponse.animation
        gesture={currentGesture}       // AIResponse.gesture
        cameraShot={currentCamera}     // AIResponse.camera
      />
    </Suspense>
  </Canvas>
</CanvasErrorBoundary>
```

## 2. 防崩溃机制（硬性要求）

### 2.1 ErrorBoundary 降级"2D 纸片人模式"

- `<Canvas>` 外层**必须**包裹 React Error Boundary（`CanvasErrorBoundary`），捕获：
  - glb/资源加载失败（Suspense 抛出、useGLTF 错误）；
  - WebGL 上下文创建失败 / `webglcontextlost` 事件；
  - 渲染期运行时异常。
- 降级 UI（`PaperCharacter`）：静态 PNG 头像（`avatar_config` 对应的 2D 贴图或默认占位图）+ 文字气泡继续展示对话。
- **验收**：断网刷新 / 传入错误 model_url / 模拟 contextlost，页面不白屏，聊天功能完全可用（硬性核验项之一）。

### 2.2 加载态

- 模型加载中显示骨架/占位（CanvasLoading），不阻塞聊天面板渲染。
- 资源超时（建议 15s）按加载失败处理 → 进入纸片人模式。

## 3. 动画系统

### 3.1 动画枚举（与后端契约逐字对齐）

| animation | 含义 |
| --- | --- |
| `idle` | 待机（默认/兜底） |
| `talk` | 说话 |
| `smile` | 开心微笑 |
| `sad` | 难过 |
| `angry` | 生气 |
| `surprise` | 惊讶 |
| `think` | 思考 |
| `wave` | 挥手 |
| `nod` | 点头 |
| `shake` | 摇头/否认 |

- 后端返回非法值 → 前端回退 `idle`，并上报 Sentry（说明模型输出/校验漏网）。

### 3.2 平滑过渡协议（0.4 秒 crossFade）

- **禁止瞬间切换动作**。收到新 `animation` 时，使用 Three.js AnimationMixer：

```ts
// 示意：0.4 秒交叉淡入淡出
const nextAction = mixer.clipAction(clips[animation]);
nextAction.reset().fadeIn(0.4).play();
currentAction?.fadeOut(0.4);
// 或使用 crossFadeTo：
// currentAction.crossFadeTo(nextAction, 0.4, true);
```

- 过渡时长固定 **0.4 秒**（恐怖谷防护），时长常量放 `lib/constants.ts`。
- `talk` 与口型/气泡出现同步；消息结束后回归 `idle` 同样 0.4s 过渡。

### 3.3 手势 gesture

- 取值：`null` | `"hug"` | `"point"` | `"hand_on_chin"`；null 不触发。
- 手势为一次性叠加动画，播放完回到当前主动画，切换同样走 0.4s 淡入淡出。

### 3.4 镜头 camera

- `"close_up"`：亲密/强烈情绪（sad、smile、affection 类）；
- `"medium"`：常规对话（默认）；
- `"wide"`：剧情/场景展示。
- 机位移动用 lerp/damp 平滑过渡（建议 0.6–0.8s），禁止瞬切。

## 4. 状态对接

- 当前动画/手势/镜头由 Zustand `useSceneStore` 维护：
  - `chat` 接口返回 AIResponse → 更新 store → CharacterModel useEffect 响应；
  - 请求中状态可临时置 `think`；
  - Fallback 静默回复时播放 `idle`/`talk`，不展示错误态。
- 详见 [12-state-and-api.md](./12-state-and-api.md)。

## 5. 性能与兼容

- glb 资源走 CDN， draco 压缩（如模型管线支持）；移动端降渲染像素比（`dpr={[1, 1.75]}`）。
- Canvas 卸载时释放几何体/材质并移除 contextlost 监听，防内存泄漏。
- 不支持 WebGL 的环境：ErrorBoundary 在 Canvas 创建前即可判定，直接渲染纸片人模式。

## 6. 表情系统（P1，Facial Expression）

- AIResponse 新增 `facial_expression`，11 种基础表情 blend shape：

| 值 | 表情 |
| --- | --- |
| happy | 开心 |
| sad | 悲伤 |
| angry | 生气 |
| shy | 害羞 |
| surprised | 惊讶 |
| confused | 疑惑 |
| calm | 平静 |
| disappointed | 失落 |
| excited | 兴奋 |
| awkward | 尴尬 |
| thinking | 思考 |

- 表情与动画**独立控制**：身体播 talk/idle 动画时，面部可单独切换；非法值回退 calm。
- 表情切换同样平滑（blend shape 权重 lerp，0.3–0.4s），禁止瞬间变脸。
- 纸片人模式：用静态 PNG 表情差分图兜底（同一头像多套表情贴图）。

## 7. 语音与嘴型同步（P1，Voice + Lip Sync）

- STT：`VoiceInput` 组件录音 → 服务端转写（或浏览器 ASR）→ 等价文字进入 `/chat`；失败回退文字输入。
- TTS：回复文本生成角色音色音频（`voice` 字段控制 quiet/warm/cheerful 语气）；
- **Lip Sync**：按音频振幅/音素驱动口型 blend shape，与表情、动作同步；无音频时回退 talk 循环动画；
- TTS/STT 任一失败不得阻断文字聊天；语音入口在无权限/非 Plus 时隐藏或置灰。

## 8. 场景环境状态（P1，SceneEnvironment）

- 场景不是装饰，是 AI 状态的一部分：Time / Weather / Lighting / Location / Objects / Ambient Sound 由 `character_scene_states` + `scenes.scene_config` 驱动；
- 前端按场景配置渲染光照/天气/环境音，并将场景状态随对话上下文回传后端；
- 行为一致性由后端保障（深夜雨天不会欢快跳舞），前端负责氛围呈现；
- 待机生活感（首页「我的世界」）：角色在场景中有时间感知的 idle 行为（如清晨窗边喝咖啡），点击角色转头问候。

## 9. 验收检查

- [ ] 断网/错误 URL/contextlost 三种故障均进入纸片人模式，无白屏
- [ ] 10 种核心动画 + 11 种表情全覆盖，非法值分别回退 idle/calm
- [ ] 任意动画/表情切换均为 0.4s 左右平滑过渡（录屏逐帧检查无跳变）
- [ ] 语音链路失败时文字聊天完全可用；有语音时口型与音频对齐
- [ ] 切换场景后光照/环境音同步变化
- [ ] 切走路由再回来无 WebGL 报错、无重复 mixer
