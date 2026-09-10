from pathlib import Path
import json
p=Path('docs/progress-evidence.json');d=json.loads(p.read_text(encoding='utf-8'))
d['CHAR-01']['evidence']='基本建角与伙伴页；本地SD生成成年写实立绘并接入引导/伙伴页；Blender已导出基础GLB，尚非写实成品'
d['CHAR-01']['next']='完整DNA持久化；多人物一致性立绘；3D皮肤贴图、毛发、手部与全身绑定'
d['OPS-01']['evidence']='10项故事测试与最新Next构建通过；看板44项需求可筛选；390px布局和Radix弹窗焦点归还通过；Android模拟器Chrome已启动产品'
d['OPS-01']['next']='继续模拟器完整通关、PostgreSQL/Redis、CI及真机测试'
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
p=Path('docs/IMPLEMENTATION_STATUS.md');s=p.read_text(encoding='utf-8');s+='''

## 持续开发批次：专业界面、写实资产与 Android（2026-09-09）
- 进度入口：根目录 `development-progress.html` 可直接打开；服务入口 `/development-progress.html`。44项PRD逐项列出证据与下一步，支持搜索/状态过滤/展开；在线15秒轮询，离线60秒重载。`scripts/watch_progress.py`监听文档并生成静态文件。
- 已启用当前任务30分钟心跳，继续承接未完成项。目标仍未完成，不将看板“部分实现”冒充验收。
- 前端：新版桌面侧栏/移动底栏、低亮度配色、引导页、人物主舞台、统一按钮与Radix弹窗；尊重减少动画偏好。写实立绘加载、Escape退出/焦点归还及390px无横向溢出已浏览器验证。
- 看板测试：44需求、9故事需求、4外部待接筛选、展开和移动布局通过。脚本 `output/playwright/check-progress.js`、`check-world.js`；截图 progress-desktop/mobile、world-desktop/mobile。
- 本地SD：`scripts/generate_realistic_portrait.py`使用majicMIX realistic v7生成虚构成年人物“灵”，已接入产品；请求恢复桌面原模型。输出 `apps/web/public/assets/characters/ling-realistic-v1.png`及生成参数。
- Blender：采用已记录来源的MakeHuman CC0基础资产，背景脚本导出 `.blend`、GLB及预览，未改用户打开的场景。当前仅解剖比例基础模型；手部材质、发型、皮肤纹理、全身/面部绑定仍需完善，**未达到真人写实成品验收**。
- Android：实际启动既有API36 AVD，通过ADB端口反向连接3000/8011；Chrome中已显示书库。首轮发现入世表单位于长页面下方，已改为Radix弹窗，类型检查和构建通过，待复测。当前是Android模拟器网页，不是原生APK或真实手机验收。
- 生产阻断仍保留：真实身份、成年核验、正式AI/审核、另外两部完整故事、完整持久化等未完成。
''';p.write_text(s,encoding='utf-8')
p=Path('docs/frontend/13-design-system.md');s=p.read_text(encoding='utf-8');s+='\n## 人物资产要求（用户2026-09-09修订）\n人物形象和3D目标统一为虚构成年人的真人写实风格。动漫立绘不作为当前产品主视觉。二维写实图已落地；三维基础模型必须经过纹理、毛发、绑定和视觉检查后才能标记成品。\n';p.write_text(s,encoding='utf-8')
