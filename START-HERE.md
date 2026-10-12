# Marrow 网站交接说明（先读这里）

导出日期：2026-10-12（北京时间）。源码对应线上第 8 版。

这是供同事修改、细化的源码包。请解压整个文件夹，保留隐藏的 `.openai/hosting.json`；Vite 配置直接引用该文件，不能漏掉。

## 1. 怎么打开首页

1. 安装 Node.js（至少 22.13.0）和 pnpm 11.16.0。
2. 在终端进入解压后的项目目录，确保目录里能看到 `package.json`。
3. 首次运行 `pnpm install` 安装依赖，需要联网。
4. 运行 `pnpm dev`，保持终端运行。
5. 浏览器打开 http://localhost:3000/ 。如终端显示了其他端口，使用终端地址。

```sh
pnpm install
pnpm dev
```

项目没有可双击打开的 `index.html`。修改页面和样式后，开发页面通常会自动刷新。

## 2. 修改位置速查

| 修改内容 | 文件或目录 |
| --- | --- |
| 字体大小、字距、位置、颜色、响应式样式 | `app/globals.css` |
| 顶部导航、Wedding Dresses 悬停菜单 | `app/components/SiteHeader.tsx` |
| 首页结构和轮播 | `app/page.tsx`、`app/components/HomeCarousel.tsx` |
| 首页三组图框和文案 | `app/components/HomeEditorial.tsx` |
| 爱心、白花旋转及蝴蝶结拖拽 | `app/components/HomeEffects.tsx` |
| RUNWAY / LOOKBOOK 鼠标文字 | `app/components/EditorialCursor.tsx` |
| 页脚 | `app/components/SiteFooter.tsx` |
| About / Boutique / Retailers | `app/about/`、`app/boutique/`、`app/retailers/` |
| 后台页面、素材配置与存储 | `app/admin/`、`app/media-config.ts`、`app/media-store.ts`、`app/api/` |
| 图片、字体和设计素材 | `public/`、`public/fonts/`、`public/design/` |
| 构建与运行配置 | `vite.config.ts`、`build/`、`worker/`、`.openai/hosting.json` |

桌面排版主要按 1920px 设计坐标缩放；`--unit` 位于 `app/globals.css`。细化字体和间距时，请保留已有字体文件，优先修改对应样式规则。

## 3. 当前功能状态

- 首页保留原来的两张轮播图，新增第三张轮播。
- 导航可切换 Home、About、Our Boutique、Retailers。
- Wedding Dresses 为悬停菜单，三列为 Puella Aeterna.、Futur.、Psyche and Eros.；标题已加粗，列与列从左到右出现，每列标题比选项早 180ms 出现。
- 菜单选项为 Runway、LookBook、Accessories；目前只有展示，没有链接，等待后续独立页面设计。
- 已包含爱心与白花旋转、固定基准位置的蝴蝶结拖拽，以及图框的 RUNWAY / LOOKBOOK 鼠标文字效果。
- 爱心 3D 旋转参考视频未包含在本包中，后续收到视频后再细化。

## 4. 后台和素材

本地开发可打开 http://localhost:3000/admin 。只在 development 模式、localhost 或 127.0.0.1 上免站主登录开放；线上后台仍限制原站主身份，分享源码不等于授予线上后台权限。

后台有七个替换位置：三张首页轮播图；第一组最左、第二组左侧、第二组中间、第三组左侧，共四个循环视频位置。支持上传或填写 HTTPS 素材地址，单个上传最大 90MB。未设置视频时显示默认图片。

线上上传文件和替换配置存储在 Sites 的 R2 中，不属于源码。本包包含 `public/` 中的全部本地素材，不包含云端上传文件和媒体配置快照；本次未能通过线上页面核实是否存在素材替换。同事首次本地运行时使用默认素材，不会自动继承线上上传状态。

本地上传使用 Cloudflare 开发环境模拟 R2，数据写入本机 `.wrangler/`，与线上互相独立。本包不含本机上传状态。

## 5. 检查和部署

```sh
pnpm build
node --test tests/rendered-html.test.mjs
```

部署到原 Sites 网站需要网站编辑权限。本包不包含密码、令牌或部署凭据。正常本地修改页面无需额外业务环境变量。

如换到其他平台，需要重新配置 Worker 运行环境、R2 存储和后台身份验证；不能只按纯静态 HTML 托管。

## 6. 包含与未包含的文件

包含完整源码、构建配置、依赖锁文件、图片、字体、后台代码、已有测试和工具脚本。

不包含 `node_modules/`、`dist/`、`.git/`、`.wrangler/`、`.env*`、旧压缩包、日志和工作缓存。依赖按锁文件重新安装，构建产物重新生成。

原始设计 PDF 不在包中，网页用到的提取图片和字体已保留。`scripts/extract-design.py` 为 PDF 素材提取工具，日常修改网页不需要运行。

本次仅导出文件，未修改或重新发布线上网站。
