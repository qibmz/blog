# CLAUDE.md

给 Claude Code 的项目指引。

## 快速开始

- 包管理器：`pnpm`（lockfile `pnpm-lock.yaml`）
- 安装：`pnpm install`（postinstall 自动跑 `nuxt prepare`）
- 开发：`pnpm dev`（`nuxt dev --host`）
- 构建：`pnpm build` / 预览：`pnpm preview`
- Lint：`pnpm lint`（eslint --fix）/ 类型检查：`pnpm typecheck` / 测试：`pnpm test`
- 数据库迁移：`npx drizzle-kit generate` 然后 `npx drizzle-kit push`
- **提交前检查**：`pnpm typecheck && pnpm lint && pnpm test` 全部通过再提交
- **提交消息使用中文**

## 架构

Nuxt 4 应用，内容驱动页面 + AI Chat 功能，部署在 Vercel，数据库用 Neon PostgreSQL。

### 内容系统

内容在 `content/` 目录，是文档、博客、落地页的数据源：
- `0.index.yml` → `/` 首页
- `1.docs/**/*` → `/docs/**` 文档页（collection `docs`）
- `2.about-us.yml` → `/about-us` 关于我
- `3.blog.yml` → `/blog` 博客列表
- `3.blog/**/*` → `/blog/**` 文章（collection `posts`）

Schema 定义在 `content.config.ts`（Zod）。页面通过 `queryCollection()`、`queryCollectionNavigation()`、`queryCollectionSearchSections()` 查询内容 — 参见 `app/app.vue` 了解共享的搜索/导航数据管道。

UI 使用 `@nuxt/ui` 的 U 前缀组件（`UApp`、`UPage`、`UContentSearch` 等）。

### AI Chat（`/chat/**`）

Chat 路由当前启用 SSR（`routeRules` 中 `'/chat/**': { ssr: false }` 已注释掉）。认证后的聊天数据通过 `useFetch` 在服务端获取。

**认证流程：** GitHub OAuth，通过 `nuxt-auth-utils` 实现。路由：`server/routes/auth/github.get.ts` → 设置用户 session → 重定向到 `/chat`。Session 使用 `NUXT_SESSION_PASSWORD` 环境变量加密。用户类型扩展见 `server/types/auth.d.ts`。

**数据库：** Neon PostgreSQL（serverless）+ Drizzle ORM。
- Schema：`server/db/schema.ts` — `chats` 和 `messages` 两个表，一对多关系
- DB 单例：`server/db/index.ts` — 懒初始化 Proxy，通过 `nitro.imports.dirs: ['server/db']` 自动导入
- `db` 和 `schema` 在所有 `server/` 文件中自动可用，无需显式 import
- 配置：`drizzle.config.ts`（使用 `DATABASE_URL` 环境变量）

**API 接口**（除 `GET /api/chats` 使用 `getUserSession` 做未登录优雅降级外，均需通过 `requireUserSession(event)` 认证）：

| 接口 | 文件 | 用途 |
|----------|------|---------|
| `GET /api/chats` | `server/api/chats.get.ts` | 获取用户聊天列表 + 今日剩余次数 |
| `POST /api/chats` | `server/api/chats.post.ts` | 创建聊天并保存首条用户消息 |
| `GET /api/chats/:id` | `server/api/chats/[id].get.ts` | 获取单个聊天及其消息 |
| `POST /api/chats/:id` | `server/api/chats/[id].post.ts` | 发送消息、流式 AI 回复、写入 DB |
| `GET /api/models` | `server/api/models.get.ts` | 可用 AI 模型列表（缓存 5 分钟） |
| `GET /api/version` | `server/api/version.get.ts` | PostgreSQL 版本探针（用于连接诊断） |

**AI 提供商：** DeepSeek 和 MiMo（小米），配置在 `server/utils/models.ts`。使用 `@ai-sdk/deepseek` 和 `@ai-sdk/openai-compatible`。API 密钥：`DEEPSEEK_API_KEY`、`MIMO_API_KEY`。

**流式回复：** 使用 `createUIMessageStream` + `createUIMessageStreamResponse`（`ai` 包）构建 SSE 流。DeepSeek 模型通过 `providerOptions.deepseek.thinking` 启用推理过程，前端 `UChatReasoning` 组件展示思维链。**不要使用 `smoothStream()`**，它会缓冲导致延迟感。

**自动标题生成：** 首次对话时，服务端通过 `generateText` 异步生成标题（`event.waitUntil` 确保 serverless 环境完整执行），不阻塞流式响应。客户端 `onFinish` 中调用 `refreshNuxtData('sidebar-chats')` 刷新侧边栏。

**频率限制：** 每用户每天 5 次提问，在 `server/utils/rateLimiter.ts` 中控制。创建聊天和每条追问都会检查。**注意：** check-then-insert 不是事务性的 — 并发请求可能超出限制。

**错误处理：** `server/utils/errors.ts` 提供 `raiseNotFound()` / `raiseRateLimit()`。全局错误管道在 `server/plugins/error-handler.ts` 中，记录所有错误并清理 5xx 响应（将非 `createError` 抛出的内部错误替换为通用消息）。

**消息校验：** `server/utils/zod-schemas.ts` 定义 `UIMessageSchema`（Zod），用于 API 层校验 `UIMessage` 格式。

**客户端组件/组合式函数：**
- `app/layouts/chat.vue` — 侧边栏布局，聊天历史导航、剩余次数展示、GitHub 登录
- `app/pages/chat/index.vue` — 新建聊天页，提示输入 + 模型选择 + 快捷建议
- `app/pages/chat/[id].vue` — 聊天详情，`@ai-sdk/vue` `Chat` + `DefaultChatTransport` 流式通信
- `app/components/chat/ChatComark.ts` — 通过 `@comark/nuxt` `defineComarkComponent` + Shiki 渲染 AI 回复，注册了 python/sql/go/rust 额外语言
- `app/components/chat/ChatSearch.vue` — 命令面板模态框，搜索历史聊天
- `app/composables/useModels.ts` — 模型选择，`useCookie` 持久化，刷新页面不丢失
- `app/composables/useApi.ts` — 带 loading/error 状态的 `$fetch` 封装
- `app/composables/useChatList.ts` — 聊天列表分组（按日期归组）
- `app/plugins/api.ts` — 全局 `$fetch` 拦截器：统一 toast + 401 跳转登录
- `app/utils/error.ts` — `normalizeError()` 统一解析不同来源的错误消息
- `app/utils/chatAuth.ts` — 聊天相关认证辅助函数

### Playground 演示页（`/playground/**`）

- `app/pages/playground/index.vue` — Playground 首页
- `app/pages/playground/kline-chart-binance.vue` — Binance K 线图，实时 WebSocket 数据
- `app/pages/playground/number-scroll.vue` — 数字滚动动画演示
- 配套组件：`app/components/demo/kline/Chart.vue`、`PeriodBar.vue`、`TradesList.vue`、`app/components/demo/NumberScroll.vue`

### 页面规范

- 使用 `useSeoMeta()` 设置每页 SEO，`defineOgImageComponent('Saas')` 生成 OG 图片
- `useAsyncData()` 使用 `default: () => []` 模式，内容查询失败时安全回退
- Chat 页面使用 `definePageMeta({ layout: 'chat' })` 指定 chat 布局
- Docs 页面使用 `definePageMeta({ layout: 'docs' })` 指定 docs 布局
- 页面过渡动画使用 `pageTransition: { name: 'fade' }` + `layoutTransition: { name: 'slide' }`（默认 mode，不阻塞导航）
- CSS 过渡动画定义在 `app/app.vue` 的全局样式块

## 动画

- 动画库使用 `motion-v`（Motion for Vue），通过 `motion-v/nuxt` 模块集成
- `<Motion>` 组件自动注册，无需手动 import
- Props 使用 kebab-case：`:initial`、`:animate`、`:while-in-view`、`:while-hover`、`:viewport`、`:transition`
- 滚动触发动画使用 `:viewport="{ once: true, margin: '-80px' }"` 确保仅播放一次
- 不要在 `<style scoped>` 中手写 CSS keyframes 动画，全部用 motion-v 声明式处理

## Shiki / Comark 暗色模式

`app/assets/css/main.css` 已包含 Shiki 暗色模式适配 CSS，切换主题时代码高亮自动切换配色。

## 关键文件

| 文件 | 用途 |
|------|---------|
| `nuxt.config.ts` | 模块、runtimeConfig、routeRules、nitro 配置 |
| `content.config.ts` | 内容 collection schemas（Zod）— 改动这里会影响内容页面 |
| `server/db/schema.ts` | 数据库表 — 修改后需运行 `drizzle-kit generate` |
| `server/utils/models.ts` | AI 模型注册 — 在此添加新的提供商/模型 |
| `server/utils/rateLimiter.ts` | 每日频率限制逻辑 |
| `server/utils/errors.ts` | `raiseNotFound` / `raiseRateLimit` 错误工厂 |
| `server/utils/zod-schemas.ts` | API 层消息格式 Zod schema |
| `app/app.vue` | 根组件 — 全局导航数据、搜索、SEO 默认值 |
| `app/error.vue` | 错误页面（与 app.vue 共享导航数据管道） |
| `app/components/chat/ChatComark.ts` | AI 回复 Markdown 渲染（Comark + Shiki 高亮） |
| `app/composables/useModels.ts` | 模型选择 + Cookie 持久化 |
| `app/plugins/api.ts` | 全局 `$fetch` 错误拦截 |
