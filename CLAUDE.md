# CLAUDE.md

给 Claude Code 的项目指引。

## 快速开始

- 包管理器：`pnpm`（lockfile `pnpm-lock.yaml`）
- 安装：`pnpm install`（postinstall 自动跑 `nuxt prepare`）
- 开发：`pnpm dev`（`nuxt dev --host`）
- 构建：`pnpm build` / 预览：`pnpm preview`
- Lint：`pnpm lint`（eslint --fix）/ 类型检查：`pnpm typecheck` / 测试：`pnpm test`
- 数据库迁移：`npx drizzle-kit generate` 生成迁移文件
  - **测试服（Vercel Preview）：** `scripts/prebuild-migrate.js` 在部署时自动执行 `drizzle-kit push --force` + seed，无需手动干预
  - **正式服（Production）：** 使用 Neon SQL Editor（Web 控制台）粘贴 migration SQL 执行，或 `npx neonctl sql --sql "$(cat server/db/migrations/xxx.sql)"` 执行
- **提交前检查**：`pnpm lint && pnpm test` 全部通过再提交
- **提交消息使用中文**
- **改 API/utils 必须补测试**：修改 `server/api/` 或 `server/utils/` 的逻辑时，必须在对应的 `__test__/` 目录下补充或更新测试用例。新增功能至少覆盖核心路径（正常 + 边界/错误）

## 编码规范

- **避免重复函数**：遇到同一模式的 N 个变体时写成单个参数化函数，不要复制粘贴 N 份。例如 OAuth 登录写成 `login(provider: OAuthProvider)` 而非 `loginWithGithub()` / `loginWithGoogle()`。
- **优先使用框架/库提供的类型**：如 `#auth-utils` 导出的 `OAuthProvider`，不要退化到手写 `string` 类型。
- **考虑扩展性**：写一个功能时先问"再加一个会怎样"，避免硬编码单一值。
- **所有 API 请求走 `useAPI`**：`app/composables/useApi.ts` 内置了全局错误拦截（401 → 跳转登录，其他错误 → toast 提示）。不要在页面/组件中直接使用 `$fetch` 或 `useFetch`。
  - **GET 查询**：`const { data, pending, error, refresh } = useAPI('/api/xxx')` — 响应式数据获取
  - **命令式调用（POST/PATCH/DELETE）**：`const { execute } = useAPI(url, { method: 'POST', body: ref, immediate: false, watch: false })` → `await execute()`
  - 未登录优雅降级：传 `skipAuthRedirect: true` 跳过 401 跳转
- **服务端路径使用 `import type`**：从 `#shared/types/chat` 引入共享类型（Zod schema + 衍生 TS 类型）。`shared/types/` 和 `shared/utils/` 由 Nuxt 自动导入，一般无需手动 import。

## 架构

Nuxt 4 应用，内容驱动页面 + AI Chat 功能，部署在 Vercel，数据库用 Neon PostgreSQL。

### 共享类型（`shared/`）

`shared/types/` 和 `shared/utils/` 目录的导出在 server 和 app 两端自动可用：

- `shared/types/chat.ts` — `UIMessageSchema`（消息格式校验）、`PatchChatBodySchema`（PATCH 请求体校验）、`PatchChatBody`（衍生 TS 类型）
- 纯 Zod/TS 代码，不依赖 Vue 或 Nitro API

### 内容系统

内容在 `content/` 目录，是文档、博客、落地页的数据源：
- `0.index.yml` → `/` 首页
- `1.docs/**/*` → `/docs/**` 文档页（collection `docs`）
- `2.about-us.yml` → `/about-us` 关于我
- `3.blog.yml` → `/blog` 博客列表
- `3.blog/**/*` → `/blog/**` 文章（collection `posts`）

Schema 定义在 `content.config.ts`（Zod）。页面通过 `queryCollection()`、`queryCollectionNavigation()`、`queryCollectionSearchSections()` 查询内容 — 参见 `app/app.vue` 了解共享的搜索/导航数据管道。

UI 使用 `@nuxt/ui` 的 U 前缀组件（`UApp`、`UPage`、`UContentSearch` 等）。图标使用 `UIcon` + Iconify 类名（如 `i-lucide-home`），本地图片用 `<NuxtImg>`（`@nuxt/image`）。

### AI Chat（`/chat/**`）

Chat 路由 SSR 当前被禁用（`routeRules` 中 `'/chat/**': { ssr: false }` 已注释掉），实际以客户端渲染为主。认证后的聊天数据通过 `useAPI` 获取。

**认证流程：** GitHub + Google OAuth，通过 `nuxt-auth-utils` 实现。路由：`server/routes/auth/github.get.ts` / `server/routes/auth/google.get.ts` → 设置用户 session → 重定向到 `/chat`。OAuth 登录统一调用 `login(provider: OAuthProvider)`。Session 使用 `NUXT_SESSION_PASSWORD` 环境变量加密。用户类型扩展见 `server/types/auth.d.ts`。**注意：** `login()` 内部使用 `window.location.href` 跳转到外部 OAuth 授权页面，这是正确做法，不要改成 `navigateTo()`。

**数据库：** Neon PostgreSQL（serverless）+ Drizzle ORM。
- Schema：`server/db/schema.ts` — `chats`、`messages` 和 `models` 三个表
- DB 单例：`server/db/index.ts` — 懒初始化 Proxy，通过 `nitro.imports.dirs: ['server/db']` 自动导入
- `db` 和 `schema` 在所有 `server/` 文件中自动可用，无需显式 import
- 配置：`drizzle.config.ts`（使用 `DATABASE_URL` 环境变量）
- **迁移流程：** 测试服 prebuild 自动 `drizzle-kit push --force` + seed；正式服用 Neon SQL Editor 或 `npx neonctl sql` 执行 migration SQL
- **Seed 脚本：** `server/db/seed-models.ts` — 幂等，prebuild 中自动执行，正式服手动跑一次

**API 接口**（除 `GET /api/chats` 使用 `getUserSession` 做未登录优雅降级外，均需通过 `requireUserSession(event)` 认证）：

| 接口 | 文件 | 用途 |
|----------|------|---------|
| `GET /api/chats` | `server/api/chats.get.ts` | 获取用户聊天列表 + 今日剩余次数 |
| `POST /api/chats` | `server/api/chats.post.ts` | 创建聊天并保存首条用户消息 |
| `GET /api/chats/:id` | `server/api/chats/[id].get.ts` | 获取单个聊天及其消息 |
| `POST /api/chats/:id` | `server/api/chats/[id].post.ts` | 发送消息、流式 AI 回复、写入 DB |
| `PATCH /api/chats/:id` | `server/api/chats/[id].patch.ts` | 重命名/置顶/删除聊天（`action` 区分操作） |
| `GET /api/models` | `server/api/models.get.ts` | 可用 AI 模型列表（缓存 5 分钟） |
| `GET /api/version` | `server/api/version.get.ts` | PostgreSQL 版本探针（用于连接诊断） |

**AI 提供商：** DeepSeek 和 MiMo（小米），配置在 `server/utils/models.ts`。使用 `@ai-sdk/deepseek` 和 `@ai-sdk/openai-compatible`。API 密钥：`DEEPSEEK_API_KEY`、`MIMO_API_KEY`。

**流式回复：** 使用 `createUIMessageStream` + `createUIMessageStreamResponse`（`ai` 包）构建 SSE 流。DeepSeek 模型通过 `providerOptions.deepseek.thinking` 启用推理过程，前端 `UChatReasoning` 组件展示思维链。**不要使用 `smoothStream()`**，它会缓冲导致延迟感。

**自动标题生成：** 首次对话时，服务端通过 `generateText` 异步生成标题（`event.waitUntil` 确保 serverless 环境完整执行），不阻塞流式响应。客户端 `onFinish` 中调用 `refreshNuxtData('sidebar-chats')` 刷新侧边栏。

**频率限制：** 每用户每天 5 次提问，在 `server/utils/rateLimiter.ts` 中控制。创建聊天和每条追问都会检查。**注意：** check-then-insert 不是事务性的 — 并发请求可能超出限制。

**错误处理：** `server/utils/errors.ts` 提供 `raiseNotFound()` / `raiseRateLimit()`。全局错误管道在 `server/plugins/error-handler.ts` 中，记录所有错误并清理 5xx 响应（将非 `createError` 抛出的内部错误替换为通用消息）。

**客户端组件/组合式函数：**
- `app/layouts/chat.vue` — 侧边栏布局，聊天历史导航、重命名/置顶/删除操作、剩余次数展示、用户信息
- `app/pages/chat/index.vue` — 新建聊天页，提示输入 + 模型选择 + 快捷建议
- `app/pages/chat/[id].vue` — 聊天详情，`@ai-sdk/vue` `Chat` + `DefaultChatTransport` 流式通信
- `app/components/chat/ChatComark.ts` — 通过 `@comark/nuxt` `defineComarkComponent` + Shiki 渲染 AI 回复，注册了 python/sql/go/rust 额外语言
- `app/components/chat/ChatSearch.vue` — 命令面板模态框，搜索历史聊天
- `app/composables/useApi.ts` — 全局 API 封装（`useAPI` composable），内置 401 跳转 + toast 错误提示
- `app/composables/useModels.ts` — 模型选择，`useCookie` 持久化，刷新页面不丢失
- `app/composables/useChatOptions.ts` — 思考模式开关，`useCookie` 持久化
- `app/composables/useChatList.ts` — 聊天列表分组（按日期归组）
- `app/utils/error.ts` — `normalizeError()` 统一解析不同来源的错误消息

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
- 图标优先使用 `UIcon`（Iconify），本地图片用 `<NuxtImg>`（不要用 `<img>`）

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
| `server/db/seed-models.ts` | 模型能力元数据初始化 — 幂等 seed，按需更新 |
| `shared/types/chat.ts` | API 共享类型 — UIMessageSchema、PatchChatBodySchema、衍生 TS 类型 |
| `server/utils/models.ts` | AI 模型注册 + 能力 fallback — `models` 表优先 |
| `server/utils/rateLimiter.ts` | 每日频率限制逻辑 |
| `server/utils/errors.ts` | `raiseNotFound` / `raiseRateLimit` 错误工厂 |
| `app/app.vue` | 根组件 — 全局导航数据、搜索、SEO 默认值 |
| `app/error.vue` | 错误页面（与 app.vue 共享导航数据管道） |
| `app/composables/useApi.ts` | 全局 API 封装 + 错误拦截 |
| `app/composables/useModels.ts` | 模型选择 + Cookie 持久化 |
| `app/components/chat/ChatComark.ts` | AI 回复 Markdown 渲染（Comark + Shiki 高亮） |
| `scripts/prebuild-migrate.js` | Vercel Preview 环境自动 DB schema 同步 + seed |
