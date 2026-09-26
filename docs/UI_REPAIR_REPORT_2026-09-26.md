# UI 修复报告：小说详情页返回主页底部功能区发白

- 日期：2026-09-26
- 范围：`index.html`、`product-preview.html`、`output/preview/css/shell-v64.css`
- 问题：从小说详细介绍页返回世界主页后，底部五项主功能区的 button 出现浏览器默认白色背景，遮挡深色导航壳层。
- 根因：`#world-bottom-nav button` 仅定义布局和文字颜色，未显式覆盖 `background`、`border`、`appearance` 等浏览器默认按钮样式。
- 修复：统一增加 `background: transparent !important`、`border: 0 !important`、`appearance: none`、`box-shadow: none`、`outline: 0` 和继承字体规则。
- 防回归：已将约束写入项目 `AGENTS.md`；后续修改必须同步检查入口文件、在线预览源文件和共享壳层 CSS。
- 状态：✅ 源码修复完成；✅ 三处样式源已同步；✅ 入口文件 LJ_PAGES/HTML 结构待发布校验。

## 验收标准

1. 世界主页正常进入时底部五项导航保持深色透明按钮。
2. 从小说详情页返回世界主页后，导航样式不变，不出现白色块。
3. 点击五项导航仍保持原有路由行为。
4. 任意后续页面不得通过浏览器默认 button 样式覆盖导航。
