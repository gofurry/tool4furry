# Tool4Furry

为兽圈创作与日常需求准备的开源浏览器工具站。当前为 **Foundation V0.1**：极简静态首页与三种开发工作台原型，尚无正式发布的工具。

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
| `/` | 静态首页；无正式工具时显示准备中的空状态 |
| `/lab/canvas` | 模式切换、属性设置、模拟标记、手机参数抽屉 |
| `/lab/form` | 输入、参数、校验、模拟输出 |
| `/lab/batch` | 增删示例任务、推进模拟状态、清空 |
| `/404` | 404 页面预览 |

**Lab 只在 dev 可访问。** 页面明确标为 Demo，不读取或处理真实文件；生产无 Lab 页面、入口或 demo 实现。首页不加载 React 工作台。

## 检查与构建

先用 Ctrl+C 停止 dev（也可用 `pnpm exec astro dev stop`），再顺序执行：

```powershell
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

两套产物互不覆盖，每次构建都会检查语言、canonical、CSS 提取和 Lab 隔离。构建脚本用 cross-env，兼容 PowerShell。不要并发运行两次构建或与 dev 混跑，它们会使用 Vite 的同一依赖缓存。

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
  workbench/      可选插槽、响应式、面板开关
  lab/            开发 demo、独立状态与纯模拟逻辑
  tools/          元数据、发布过滤、懒加载表、固定 ToolRuntime
  config/         地区及构建文案选择
  i18n/           正式页面的最小中文/英文文案
  styles/         StyleX token、站点/控件样式与少量 reset
tests/            Vitest 逻辑与组件契约
scripts/          静态产物验收
docs/foundation.md 架构边界、Gate 与人工验收记录
```

技术栈：Astro SSG、React、TypeScript、StyleX、Motion、Base UI、Phosphor Icons、pnpm、Vitest。没有 SSR Adapter、全局业务 Store、通用画布引擎、数据库、Docker、Monorepo、Storybook 或 Playwright 测试框架。`pnpm-workspace.yaml` 仅保存 pnpm 安装策略，不定义子项目。

GitHub Actions 对 dev/main 的 push 与 PR 执行安装、检查、测试及双地区构建。**仅 CI，无 CD、部署 Secret 或生产发布。** 未来静态部署目标为 Cloudflare Workers Static Assets 与 EdgeOne Makers，本批次未部署。

新增工具前请阅读 [架构说明](docs/foundation.md)。
