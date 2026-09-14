# AGENTS.md

给编码 Agent 的**可执行规则**。详细架构与背景见 `CLAUDE.md`；本文件优先约束行为，防止「另起炉灶、不顾全局、不顾业务」。

## 产品是什么

个人 **Nuxt 4** 站点：内容站（博客 / 备忘录 / 落地页）+ **AI Chat**（OAuth、Neon、流式回复、限流）。部署 **Vercel**，正式库变更须用户确认。

不要把本仓库当成空白模板或通用后台脚手架来「重新设计」。

## 动手前（必须）

1. **先读后写**：定位相关目录与现有实现（`rg` / 打开文件），弄清调用链再改。
2. **先复用再新增**：项目内 composable / 组件 / utils / 成熟库已有能力时必须复用；新建须说明「为何现有不可用」。
3. **先对齐业务**：说清目标、非目标、边界；信息不足先问，禁止臆造接口、表字段、环境变量、组件名。
4. **最小改动**：只改完成任务所需文件；禁止顺手大重构、无关「清理」、投机抽象。

## 永远这样

- 包管理：`pnpm`（不要用 npm / yarn）
- 前端请求：一律 `useAPI`（`app/composables/useApi.ts`）；禁止页面里直接 `$fetch` / `useFetch`（除非用户明确要求且说明原因）
- UI：`@nuxt/ui` 的 `U*` 组件；图标 `UIcon`；图片 `<NuxtImg>`
- 共享类型：`shared/types`、`shared/utils`（两端自动可用）；服务端用 `import type`
- Chat 流式：AI SDK `useChat` + `DefaultChatTransport`；服务端 `result.toUIMessageStream()`；**禁止** `smoothStream()`
- OAuth 跳转：`login()` 用 `window.location.href`，**不要**改成 `navigateTo()`
- 错误：服务端走 `raiseNotFound` / `raiseRateLimit` / 现有错误管道；前端 toast 走现有封装
- 改 `server/api/` 或 `server/utils/`：同步补/改 `__test__/`（正常 + 边界/错误）
- 提交信息：**中文**；提交前：`pnpm lint && pnpm test`
- 动画：优先现有 `motion-v`；不要随手引入另一套动画库

## 永远不要

- 平行实现第二套 API 客户端、错误处理、鉴权、限流、markdown 渲染
- 硬编码密钥 / 把 Preview 或 CI 密钥当生产方案
- 正式库擅自 `drizzle-kit push`；生产迁移须用户确认
- 编造不存在的模块、路由、表、MCP 工具结果
- 为「以后可能用到」加配置项、特性开关、兼容层（除非任务明确要求）
- 在无关 PR 里改 lockfile、大规模格式化、重命名全仓

## 目录地图（改哪里先看哪）

| 区域 | 路径 |
| --- | --- |
| 页面 / 布局 | `app/pages/`、`app/layouts/` |
| 组件 | `app/components/`（chat 在 `app/components/chat/`） |
| 组合式 | `app/composables/` |
| 内容 | `content/` + `content.config.ts` |
| API | `server/api/` |
| DB | `server/db/schema.ts`、`server/db/index.ts` |
| AI / 限流 / 错误 | `server/utils/models.ts`、`rateLimiter.ts`、`errors.ts` |
| 共享 | `shared/types/`、`shared/utils/` |
| 详细说明 | `CLAUDE.md` |
| AI 协作心智备忘 | `content/1.docs/1.getting-started/12.ai-coding-mindset.md` |

## 命令

```bash
pnpm install
pnpm dev
pnpm lint
pnpm lint:ci
pnpm typecheck
pnpm test
pnpm build
```

## 自检（改完对照）

- [ ] 是否复用了现有模式，而不是新建平行实现？
- [ ] 是否只改了任务相关文件？
- [ ] 边界 / 异常 / 鉴权是否与现有 Chat、API 行为一致？
- [ ] 若动了 `server/api` 或 `server/utils`，测试是否已补？
- [ ] 有不确定处是否已标明假设，而不是假装确定？

## 冲突时

以**本仓库已存在的代码与配置**为准；本文件与 `CLAUDE.md` 冲突时，以更具体、且与代码一致的那条为准，并在回复里点明冲突。
