# Code Review: `develop` → `main`

> 审查时间：2026-06-04
> 审查范围：33 个变更文件（~1,800 行应用代码，不含 lockfile）
> 审查方式：4 个独立审查角度 + 交叉验证

---

## 审查结果摘要

| # | 严重程度 | 文件 | 问题简述 |
|---|----------|------|----------|
| 1 | **严重** | `server/api/chats.post.ts:11` 等 | `z.custom<UIMessage>()` 零运行时校验 — 接受 null/垃圾数据 |
| 2 | **高** | `server/db/schema.ts:6` | `chats` 表缺少 `user_id` 索引 — 全表扫描 |
| 3 | **高** | `server/api/chats/[id].post.ts:42` | 空 `messages[0]` → 标题 prompt 出现 "undefined" |
| 4 | **高** | `server/api/chats.post.ts:25` 等 | `as Record[]` 类型断言 — 非 array 的 parts 直接存入 DB |
| 5 | **中** | `server/utils/rateLimiter.ts:25` | 速率限制竞态条件 — 无事务保护 |
| 6 | **中** | `chat.vue:24` + `ChatSearch.vue:19` | `groupByDate` 逻辑重复 |
| 7 | **中** | `chat.vue:11` + `ChatSearch.vue:14` | 重复 fetch `/api/chats` |
| 8 | **低** | `chat.vue:6` + `chat/index.vue:26` | `loginWithGithub` 重复 |
| 9 | **低** | `app/pages/chat/[id].vue:30` | 标题额外 HTTP 往返（应用流事件代替） |
| 10 | **低** | `app/pages/chat/index.vue:8-13` | `greeting` computed 包裹不可变 `const hour` |

---

## 发现 1（严重）：`z.custom<UIMessage>()` 零运行时校验

**文件：**
- [server/api/chats.post.ts:11](server/api/chats.post.ts#L11)
- [server/api/chats/[id].post.ts:24](server/api/chats/[id].post.ts#L24)

```ts
// 当前代码
const { message, model } = await readValidatedBody(event, z.object({
  message: z.custom<UIMessage>(),  // ← 无校验函数
  model: z.string().optional()
}).parse)
```

**问题：** Zod v4.2.1 中 `z.custom<T>()` 不传第二个校验函数时，默认使用 `() => true` — 即**不做任何运行时检查**。客户端发送 `{"message": null}` 或 `{"message": {}}` 都能通过校验，随后访问 `message.parts` 时抛出 `TypeError: Cannot read properties of null` 导致服务器 500。

**失败场景：**
- `POST /api/chats` body `{"message": null}` → Zod 通过 → `message.parts` → `TypeError` 崩溃
- `POST /api/chats` body `{"message": {}}` → Zod 通过 → `message.parts` → `undefined` 存入 DB
- `POST /api/chats/:id` body `{"messages": [null, 123, "garbage"]}` → Zod 通过 → `convertToModelMessages` 崩溃

**修复建议：**
```ts
// 方案 A：使用 z.object 正确定义 UIMessage schema
const UIMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  parts: z.array(z.object({
    type: z.string(),
    text: z.string().optional()
  }).passthrough())
})

// 方案 B：至少传入校验函数
z.custom<UIMessage>(
  (data) => data != null && typeof data === 'object' && Array.isArray((data as any).parts)
)
```

---

## 发现 2（高）：`chats` 表缺少 `user_id` 索引

**文件：** [server/db/schema.ts:6](server/db/schema.ts#L6)

```ts
// 当前 schema — 只有 messages 表有索引
export const messages = pgTable('messages', {
  // ...
}, table => [
  index('messages_chat_id_idx').on(table.chatId)  // 只有这个索引
])
```

**问题：** 所有 4 个 chat API 端点都通过 `eq(schema.chats.userId, user.id)` 过滤，但 `chats` 表没有任何索引。数据量增长后，每次查询都是全表扫描。

**涉及到的查询：**
- `chats.get.ts:10` — `where: eq(schema.chats.userId, user.id)`
- `chats/[id].get.ts:13` — `where: and(eq(...id...), eq(...userId...))`
- `chats/[id].post.ts:28` — 同上
- `rateLimiter.ts:16` — `where: and(eq(...userId...), ...)`

**修复建议：**
```ts
export const chats = pgTable('chats', {
  // ...
}, table => [
  index('chats_user_id_idx').on(table.userId)
])
```

---

## 发现 3（高）：空 `messages` 数组 → 标题 prompt 出现 "undefined"

**文件：** [server/api/chats/[id].post.ts:42](server/api/chats/[id].post.ts#L42)

```ts
prompt: JSON.stringify(messages[0])  // messages 可能为空数组
```

**问题：** 如果客户端发送 `"messages": []`（能通过 `z.array(z.custom<UIMessage>())` 的校验），则 `messages[0]` 为 `undefined`。`JSON.stringify(undefined)` 返回 `undefined`（JS 值而非字符串），在 `generateText` 调用中拼到 prompt 里变成字符串 `"undefined"`。标题生成 prompt 变成类似"根据用户的第一条消息生成一个简短标题...undefined"，产生无意义的标题。

**失败场景：**
- 客户端发送 `messages: []` → `messages[0]` = `undefined`
- `JSON.stringify(undefined)` → `undefined`（非字符串）
- `generateText({ prompt: ... + undefined })` → prompt 以 "undefined" 结尾
- 生成标题如 `"undefined 相关对话"` 或无意义标题

**修复建议：**
```ts
if (!messages.length) {
  throw createError({ statusCode: 400, statusMessage: 'messages 不能为空' })
}
// 或回退到默认标题
prompt: JSON.stringify(messages[0] ?? { text: '新对话' })
```

---

## 发现 4（高）：`as Record<string, unknown>[]` 绕过运行时校验

**文件：**
- [server/api/chats.post.ts:25](server/api/chats.post.ts#L25)
- [server/api/chats/[id].post.ts:60,86-87](server/api/chats/[id].post.ts#L60)

```ts
await db.insert(schema.messages).values({
  chatId: chat!.id,
  role: 'user',
  parts: message.parts as Record<string, unknown>[]  // 仅编译时断言
})
```

**问题：** `as Record<string, unknown>[]` 是编译时类型断言，运行时不做任何检查。PostgreSQL 的 jsonb 列会逐字接受任何值。如果客户端的 `parts` 不是数组（比如是字符串 `"not-an-array"`），它会被原样存入 DB。后续读取时遍历 `parts`（`.filter(p => p.type === 'text')`）会崩溃。

**失败场景：**
- 客户端发送 `parts: "not-an-array-string"` → 存入 DB 为字符串
- 下次 GET 读取后渲染时 `parts.filter(...)` → `TypeError: parts.filter is not a function`

**修复建议：**
```ts
parts: Array.isArray(message.parts) ? message.parts : []
```

---

## 发现 5（中）：速率限制竞态条件

**文件：** [server/utils/rateLimiter.ts:25-28](server/utils/rateLimiter.ts#L25)

```ts
export async function checkDailyLimit(userId: string): Promise<void> {
  const count = await getTodayCount(userId)  // SELECT COUNT(*)
  if (count >= DAILY_LIMIT) {
    throw raiseRateLimit(...)
  }
  // ← 无事务，无行锁，调用方在这里插入
}
```

**问题：** `checkDailyLimit` 执行 `SELECT count(*)`，然后调用者插入消息。这两个操作没有包裹在事务或行锁中。短时间内发送的两个并发请求可能同时看到 `count == 4`，同时通过检查，同时插入——导致今日 6 条消息超出 5 条的每日限制。

**失败场景：**
- 用户在第 4 条消息后快速连发两条
- 两次 `checkDailyLimit` 都返回 `count == 4`
- 两次都通过检查，两次都插入
- 最终 DB 中有 6 条用户消息，超出限制

**修复建议：**
```ts
// 使用数据库事务
await db.transaction(async (tx) => {
  const count = await getTodayCount(userId, tx)
  if (count >= DAILY_LIMIT) throw raiseRateLimit(...)
  // 在同一个事务中插入...
})
```

---

## 发现 6（中）：`groupByDate` 逻辑重复

**文件：**
- [app/layouts/chat.vue:24-44](app/layouts/chat.vue#L24)
- [app/components/chat/ChatSearch.vue:19-49](app/components/chat/ChatSearch.vue#L19)

**问题：** 相同的日期分桶算法（今天/昨天/前 7 天/更早）在两个文件中完整实现，仅返回值类型不同（`ChatGroup[]` vs `CommandPaletteGroup[]`）。任何 bug 修复或时区调整都必须同步修改。

**修复建议：** 提取为共享工具函数：
```ts
// utils/groupChatsByDate.ts
export function groupChatsByDate<T extends { createdAt: string }>(
  chats: T[]
): { label: string, items: T[] }[] {
  // 统一的日期分桶逻辑
}
```

---

## 发现 7（中）：重复 fetch `/api/chats`

**文件：**
- [app/layouts/chat.vue:11](app/layouts/chat.vue#L11)
- [app/components/chat/ChatSearch.vue:14](app/components/chat/ChatSearch.vue#L14)

**问题：** 布局和 ChatSearch 模态框各自调用 `useFetch('/api/chats')`，每次挂载发起两个并行的重复请求。ChatSearch 可以通过 `useState()` 或 prop 复用布局已有的缓存数据。

**修复建议：** 将聊天列表提升为共享 state：
```ts
// composables/useChatList.ts
export function useChatList() {
  return useFetch('/api/chats', { ... })
}
```

---

## 发现 8（低）：`loginWithGithub` 重复

**文件：**
- [app/layouts/chat.vue:6-8](app/layouts/chat.vue#L6)
- [app/pages/chat/index.vue:26-28](app/pages/chat/index.vue#L26)

**问题：** 完全相同的 3 行函数在两个文件中定义：
```ts
function loginWithGithub() {
  window.location.href = '/auth/github'
}
```

**修复建议：** 提取为共享 composable：`composables/useChatAuth.ts`。

---

## 发现 9（低）：标题获取额外的 HTTP 往返

**文件：**
- [app/pages/chat/[id].vue:29-34](app/pages/chat/[id].vue#L29)
- [server/api/chats/[id].post.ts:72-78](server/api/chats/[id].post.ts#L72)

**问题：** 客户端 `onFinish` 发起单独的 `$fetch('/api/chats/:id')` 获取 AI 生成的标题。服务端流已为此发送了 `data-chat-title` 自定义事件，但目前正文写死了 `'Title generated'` 而非实际标题文本。通过流事件发送真实标题可消除多余的 HTTP 往返。

**修复建议：** 在 `chats/[id].post.ts` 中：
```ts
// 改为在 titlePromise resolve 后通过 writer 发送实际标题
const titlePromise = generateText({...}).then(async ({ text: title }) => {
  await db.update(schema.chats).set({ title, ... }).where(...)
  writer.write({
    type: 'data-chat-title',
    data: { title },  // 发送实际标题
    transient: true
  })
})
```
客户端从流中读取 `data-chat-title` 事件更新标题，不再需要额外请求。

---

## 发现 10（低）：`greeting` computed 包裹不可变值

**文件：** [app/pages/chat/index.vue:8-13](app/pages/chat/index.vue#L8)

```ts
const hour = new Date().getHours()  // 组件创建时捕获一次，永不更新
const greeting = computed(() => {   // computed 无意义，hour 不会变
  if (hour < 12) return '早上好'
  if (hour < 18) return '下午好'
  return '晚上好'
})
```

**问题：** `hour` 是 `const number`，永远不会改变。`computed` 是死抽象 — 每次都返回相同结果。如果用户在中午前打开页面且不刷新，问候语不会更新。

**修复建议：**
```ts
// 方案 A：直接计算（承认非响应式）
const greeting = hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好'

// 方案 B：真正的响应式
const hour = ref(new Date().getHours())
const greeting = computed(() => hour.value < 12 ? '早上好' : ...)
```

---

## 已排除的项

以下项目在审查中经过分析，确认不是问题：

| 项目 | 结论 |
|------|------|
| `event.waitUntil` 可用性 | nitro 运行时已提供（`app.mjs:65`），所有 Nuxt 4 部署目标均可使用 |
| `chat.sendMessage()` 无参数 | AI SDK v6 视为 `trigger: "submit-message"` 自动续接，是正确的模式 |
| 页面过渡动画移除 | 由 `experimental.viewTransition: true` 替代，属于有意的设计变更 |
| 模块级别的模型缓存 | serverless 环境下按实例缓存属正常行为，冷启动缓存未命中属预期 |
| `.env` 文件删除 | `runtimeConfig` 中保留了默认值，敏感信息不应进入版本控制 |
| `--dotenv` flag 移除 | 改为 Nuxt 默认的 `.env` 加载机制，为标准实践 |

---

## 总体评价

该 PR 新增了一个功能齐全的 AI 聊天功能，架构合理：认证 API → 流式响应 → 速率限制。错误处理在各端点间保持了一致。

**必须在合并前修复：** 将 `z.custom<UIMessage>()` 替换为具有实际运行时校验的 Zod schema — 这是最严重的发现，可能导致生产环境崩溃。

**强烈建议：** 在 `chats` 表上添加 `user_id` 索引，避免查询性能线性下降。

**建议：** 将重复逻辑（`groupByDate`、`loginWithGithub`、双重 fetch）提取为共享模块，提升可维护性。
