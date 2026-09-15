# 静态产品预览发布候选

product-preview.html及output/latest为独立静态包，包含世界演出、新小说逐問引导、题材库、作品编辑及收费草稿。复制已实现UI后使用静态适配器，浏览器本地存储命名空间lingjing-static-works-v1；不与本机API或云端账号同步。AI及支付均明确未连接。原有书库/心屿保留旧静态入口。

真实浏览器通过问卷→简报→大纲锁定→正文保存→刷新恢复，390px无横向溢出，未请求localhost/8010/3000。scripts/check-static-preview.js为测试。构建esbuild0.25.9，输出约270KB JS及9KB CSS，使用本地已授权SD资产并保留生成记录。

本地index.html仍为本机服务入口，不在此次线上提交范围，避免把localhost iframe发布给远程用户。八表独立迁移、真实AI及账户/账本不属于静态预览完成项。
