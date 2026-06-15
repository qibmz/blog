# 个人博客

[![Nuxt UI](https://img.shields.io/badge/Made%20with-Nuxt%20UI-00DC82?logo=nuxt&labelColor=020420)](https://ui.nuxt.com)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel&labelColor=000000)](https://qibmz-blog.vercel.app/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

🌐 **在线访问**: [qibmz-blog.vercel.app](https://qibmz-blog.vercel.app/)

基于 [Nuxt UI SaaS 模板](https://github.com/nuxt-ui-templates/saas) 改造的个人博客，使用 [Nuxt UI](https://ui.nuxt.com) 组件构建。

## ✨ 特性

- 🚀 基于 **Nuxt 4** 构建，享受最新的框架特性
- 🎨 使用 **Nuxt UI** 组件库，美观且易用
- 📝 **@nuxt/content** 驱动，支持 Markdown 写作
- 📊 集成 **Vercel Analytics** 和 **Speed Insights**
- 🔍 SEO 友好，内置 sitemap 支持
- 📱 响应式设计，适配多端设备

## 🛠️ 技术栈

| 技术 | 说明 |
|------|------|
| [Nuxt 4](https://nuxt.com/) | Vue.js 全栈框架 |
| [Nuxt UI](https://ui.nuxt.com/) | 组件库 |
| [Nuxt Content](https://content.nuxt.com/) | 内容管理 |
| [TypeScript](https://www.typescriptlang.org/) | 类型安全 |
| [Vercel](https://vercel.com/) | 部署平台 |

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

访问 `http://localhost:3000` 查看效果。

### 构建生产版本

```bash
pnpm build
```

### 本地预览

```bash
pnpm preview
```

## 🔑 环境变量

在项目根目录创建 `.env` 文件，内容如下：

```env
# ── 站点配置 ──────────────────────────────────────────────────────────
# vercel 线上域名
NUXT_PUBLIC_ORIGIN=
# 应用基础路径 (可选，默认 /)
# NUXT_APP_BASE_URL=

# ── 数据库 (Neon PostgreSQL / Vercel 自动生成) ────────────────────────
DATABASE_URL=
# 以下由 Vercel CLI 连接 Neon 后自动生成，手动部署时只需配 DATABASE_URL
# DATABASE_URL_UNPOOLED=
# NEON_AUTH_BASE_URL=
# NEON_PROJECT_ID=
# PGDATABASE=
# PGHOST=
# PGHOST_UNPOOLED=
# PGPASSWORD=
# PGUSER=
# POSTGRES_DATABASE=
# POSTGRES_HOST=
# POSTGRES_PASSWORD=
# POSTGRES_PRISMA_URL=
# POSTGRES_URL=
# POSTGRES_URL_NON_POOLING=
# POSTGRES_URL_NO_SSL=
# POSTGRES_USER=
# VITE_NEON_AUTH_URL=

# ── Session ───────────────────────────────────────────────────────────
# Session 加密密钥 (至少 32 位随机字符串)
NUXT_SESSION_PASSWORD=

# ── GitHub OAuth ──────────────────────────────────────────────────────
NUXT_OAUTH_GITHUB_CLIENT_ID=
NUXT_OAUTH_GITHUB_CLIENT_SECRET=

# ── Google OAuth ──────────────────────────────────────────────────────
NUXT_OAUTH_GOOGLE_CLIENT_ID=
NUXT_OAUTH_GOOGLE_CLIENT_SECRET=

# ── 币安行情 ───────────────────────────────────────────────────
# NUXT_PUBLIC_BINANCE_WS=
# NUXT_PUBLIC_BINANCE_API=

# ── AI 模型 API Keys ─────────────────────────────────────────────────
DEEPSEEK_API_KEY=
MIMO_API_KEY=
```

## 📋 可用脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 构建生产版本 |
| `pnpm preview` | 本地预览生产构建 |
| `pnpm lint` | 运行 ESLint 检查并自动修复 |
| `pnpm typecheck` | 运行 TypeScript 类型检查 |

## 📚 相关链接

- [Nuxt UI 文档](https://ui.nuxt.com/docs/getting-started/installation/nuxt)
- [Nuxt 部署文档](https://nuxt.com/docs/getting-started/deployment)
- [原模板演示](https://saas-template.nuxt.dev/)

## 📄 许可证

MIT License
