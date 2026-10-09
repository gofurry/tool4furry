# Tool4Furry

为 Furry 创作者准备的开源浏览器工具站。当前为 **V0.3-C — Site Shell, Homepage & Tool Discovery**：静态品牌首页、诚实工具目录与双地区 SEO；保留既有 Creative Studio 控件与 Workbench，尚无正式发布的工具。

前端及未来浏览器本地工具使用现有 [BSD-3-Clause](LICENSE) 协议。当前没有后端；未来 SaaS 后端将放在独立仓库。

## 快速启动

推荐 Node.js **22 LTS（>=22.12）**，也支持 Node.js 24 LTS。pnpm 版本由 `packageManager` 固定为 **12.8.1**。若尚未安装 pnpm，可先执行 `npm install --global pnpm@12.8.1`。

```powershell
git clone --branch dev https://github.com/gofurry/tool4furry.git
cd tool4furry
pnpm install
pnpm dev
```

不需要 `.env`、云账号、数据库或密钥。默认 CN 简体中文，访问终端显示的地址（通常为 `http://localhost:4321`）。

| 路径 | 内容 |
| --- | --- |
| `/`、`/#tools` | 品牌首页与工具目录；无正式工具时显示准备中的空状态 |
| `/lab/canvas` | 完整视口画布、浮动 Dock、默认关闭的 Inspector、手机参数 Sheet |
| `/lab/form` | 输入、参数、校验、模拟输出 |
| `/lab/batch` | 增删示例任务、推进模拟状态、清空 |
| `/lab/ui` | 基础控件、受控值、校验、Tooltip、确认弹窗和四类 Toast |
| `/lab/files` | 本地文件选择/拖放、元信息、部分接受与拒绝原因、长页面滚动进度球 |
| `/404` | 404 页面预览 |

**Lab 只在 dev 可访问。** 页面明确标为 Demo；文件页仅持有本地文件引用并展示元信息，不读取内容、生成对象 URL、上传或持久存储。生产无 Lab 页面、入口或 demo 实现，首页保持零脚本、零 Astro Island。

## 检查与构建

先用 Ctrl+C 停止 dev（也可用 `pnpm exec astro dev stop`），再顺序执行：

```powershell
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build:cn
pnpm build:global
```

| 命令 | 结果 |
| --- | --- |
| `pnpm check` | Astro 与 TypeScript 检查 |
| `pnpm test` | Vitest：路由/地区契约、布局及交互状态 |
| `pnpm build:cn` | `dist/cn/`，中文，canonical 为 `https://tool4furry.cn` |
| `pnpm build:global` | `dist/global/`，英文，canonical 为 `https://tool4furry.com` |
| `pnpm build` | 等同 CN 构建 |
| `pnpm preview` | 预览 CN 静态产物 |
| `pnpm preview:global` | 预览 global 静态产物 |

两套产物互不覆盖，每次构建都会检查语言、title/description/文本 OG、canonical、SVG favicon、真实工具目录与路由对应关系、首页零脚本/Island/JS preload、自托管字体及授权、StyleX CSS 提取和 Lab 隔离。构建脚本用 cross-env，兼容 PowerShell。不要并发运行两次构建或与 dev 混跑，它们会使用 Vite 的同一依赖缓存。

每个输出目录都可独立作为普通 HTTP Server 的根目录，不需要 Astro 服务端。例如已安装 Python 时：

```powershell
python -m http.server 8080 --directory dist/cn
# 另一个终端：
python -m http.server 8081 --directory dist/global
```

静态服务应支持目录下的 `index.html`；未来部署时由主机设置 `404.html` 的错误页映射。不要使用 SPA 全路由回退来伪造 Lab 页面。

可选英文开发预览：`pnpm exec cross-env SITE_REGION=global astro dev`。无需保存 env 文件。

## 目录

```text
src/
  pages/          Astro 首页、404、lab/[mode]、tools/[slug]
  layouts/        SiteLayout：品牌、语言、SEO、页面外壳
  components/site/ 静态共用品牌组合
  site/           Catalog 文案、类别标签与发布元数据投影
  workbench/      可选插槽、响应式、面板开关
  ui/             受控 UI 原语、Island 内的 UiProvider
  lab/            开发 demo、独立状态与纯模拟逻辑
  tools/          元数据、发布过滤、懒加载表、固定 ToolRuntime
  config/         地区及构建文案选择
  i18n/           正式页面的最小中文/英文文案
  styles/         StyleX token、站点/控件样式与少量 reset
tests/            Vitest 逻辑与组件契约
scripts/          静态产物验收
docs/foundation.md 架构边界、Gate 与人工验收记录
docs/ui-primitives.md 控件 API、弹层规则和 V0.2-A 验收
docs/file-interactions.md 文件/滚动 API、边界和 V0.2-B 验收
docs/visual-foundation.md 自托管字体、视觉 Token、控件状态与 V0.3-A 验收
docs/workbench-appearance.md V0.3-B 完整合同、布局所有权、浏览器与构建验收
docs/site-homepage.md V0.3-C 完整合同、首页/目录/SEO 与验收记录
public/brand/     可替换单一 Mark、静态 Creative Fragments SVG
```

技术栈：Astro SSG、React、TypeScript、StyleX、Motion、Base UI、Phosphor Icons、pnpm、Vitest。没有 SSR Adapter、全局业务 Store、通用画布引擎、数据库、Docker、Monorepo、Storybook 或 Playwright 测试框架。`pnpm-workspace.yaml` 仅保存 pnpm 安装策略，不定义子项目。

GitHub Actions 对 dev/main 的 push 与 PR 执行安装、检查、测试及双地区构建。**仅 CI，无 CD、部署 Secret 或生产发布。** 未来静态部署目标为 Cloudflare Workers Static Assets 与 EdgeOne Makers，本批次未部署。

新增工具前请阅读 [架构说明](docs/foundation.md)、[UI 原语契约](docs/ui-primitives.md) 和 [文件交互契约](docs/file-interactions.md)。

视觉规范见 [Visual Foundation](docs/visual-foundation.md)：Flat Studio 用于常驻面板，Floating Studio 用于浮层；主操作使用深暖橙，品牌橙只作视觉强调。DM Sans / Noto Sans SC Variable 由 Fontsource 自托管，正常 `wght.css` 随静态构建交付，无字体 CDN；OFL 授权随产物保留在 `licenses/`。

在 `/lab/ui` 用 Tab 聚焦、方向键切换 Select/Slider、空格切换 Checkbox、Escape 关闭弹层。清空名称并验证可查看错误；取消确认框不增加计数，确认才增加。连续触发消息至多显示三条；悬停/聚焦会暂停计时。手机参数抽屉中的嵌套 Select 可在 `/lab/canvas` 检查。

在 `/lab/files` 选择或拖入 PNG/JPEG/WebP，每次最多 3 个、单文件最多 2 MiB。混入错误类型、超大或第 4 个文件，检查合法部分进入列表、拒绝原因留在选择区；重复选择同一文件应新增记录。Tab → Enter/Space 打开系统选择器；可禁用、移除或确认清空。宽度至少 900px 且精确指针下滚动长页，右下球显示进度，点击向上移动总可滚动距离的 25%；手机继续原生滚动。详细步骤及未完成的真机检查见文件交互文档。

工作台入口与响应式合同见 [Workbench Appearance](docs/workbench-appearance.md)。品牌链接返回首页，独立工具箱按钮只展示当前地区已发布工具（目前为空）；烧瓶按钮收纳五个 DEV ONLY 预览。Canvas 的选择/标记属于当前 Demo 的局部操作；点击未被浮层覆盖的画布同样生效。

人工重点复核 `/lab/canvas` 在 901/900px 切换、390px 竖屏及 812×375 横屏：打开参数前后画布不缩小，名称/大小/颜色/计数保留，Select → Sheet 两次 Escape 依次关闭且返回焦点。Form/Batch 手机依次阅读输入/执行/结果或队列/设置。内置 Chromium 验收属于视口模拟；真实 iOS/Android 的软键盘、触摸、安全区与辅助技术仍需人工检查。

首页合同与实际验收见 [Site Homepage](docs/site-homepage.md)。Header/Footer 的「工具箱」均返回 `/#tools`；导航无吸顶或汉堡菜单。首页不加载 React 或动画运行时，品牌 Mark 与 favicon 共用一个可替换 SVG，Hero 只用本地静态矢量。当前没有探索主 CTA、搜索框或假工具卡；未来 Registry 中当前地区的真实 `published` 工具会自动进入 Editorial Grid。未知类别安全省略标签，工具实现仍遵守既有加载与发布流程。SEO 仅提供文本 OG，本轮没有分享图。

人工审查首页时重点看中英标题换行、320px 导航、手机图形与目录距离、Tab 焦点及 Footer；从 404 的「工具箱」链接确认能返回目录。真实移动设备与屏幕阅读器验收仍待维护者完成。
