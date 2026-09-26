# 项目入口约定

用户指定唯一查看入口为本目录 index.html。不要新建其他供用户打开的 HTML 预览，也不要把用户引向旧 MIRAI灵境 目录或 localhost:3016/world。

index.html 内 LJ_PAGES 保存所有功能页；保留现有页面键和数据。新增页面以内置路由实现，导航使用 LJNav，不跳转到已不存在的独立 HTML。删除文件前验证依赖并备份。保留 output/preview 素材、corpus 原始小说、源码及依赖包。

世界玩家从小说封面进入预先准备的世界。上传、公版来源、解析、生成、质检、素材工具及收费配置属于创作流程，不放在玩家游戏界面。尚未实现的服务不得标记为已完成。

## 底部导航防回归约束

世界主页及小说详情页返回后的 `#world-bottom-nav button` 必须显式使用透明背景、无边框、无阴影，并保留深色壳层背景；禁止依赖浏览器默认 button 样式。修改导航时必须同步检查 `index.html`、`product-preview.html` 和 `output/preview/css/shell-v64.css`。
