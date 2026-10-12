# Marrow Bridal — 网站源码交接包

请先阅读同目录的 `START-HERE.md`（中文启动与修改说明）。

本包于 2026-10-12 导出，对应当前线上第 8 版。

- 线上地址：https://marrow-bridal.gonglie313863848.chatgpt.site/
- 源码快照：`d4ed22d99608139dd2c42c4dd9f9d2f86b958f5f`
- 技术结构：Vinext / React / TypeScript / Cloudflare Workers。
- 包含页面与交互代码、全部本地图片和字体、后台代码、构建配置、依赖锁文件。
- 不包含依赖安装目录、Git 历史、缓存、密钥，以及云端 R2 的后台上传素材。

## 本地启动

安装 Node.js（至少 22.13.0）和 pnpm 11.16.0，在解压后的本目录运行：

```sh
pnpm install
pnpm dev
```

默认首页：http://localhost:3000/ 。如端口调整，以终端显示的地址为准。

这是源码项目，不能双击 HTML 文件直接打开完整网页。

## 当前页面

- `/`：首页，三张轮播图和三组系列展示。
- `/about`、`/boutique`、`/retailers`：独立页面。
- `/admin`：轮播图片和四个视频位置的替换后台。

Wedding Dresses 现在为导航悬停菜单，不再有 `/wedding-dresses` 页面，菜单内容暂不链接。

## 构建

```sh
pnpm build
```

构建产物生成在 `dist/`，需要支持 Cloudflare Worker 的运行环境。部署说明与后台素材说明见中文交接文档。

本次仅导出源码，不修改线上网站。
