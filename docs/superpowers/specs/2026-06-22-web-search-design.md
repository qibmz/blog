# 联网搜索功能设计方案

## 概述

为 AI Chat 新增"联网搜索"开关，与"深度思考"平行，仅 MiMo 模型支持。开启后由模型自主判断是否搜索，搜索结果以来源链接形式展示在回复下方。

## 数据流

```
用户点击 [联网搜索] 开关
  → useCookie('chat-web-search') 持久化
  → 发送消息时 body 携带 options.webSearch: boolean
  → 服务端 [id].post.ts 读取，若 webSearch && 模型支持
    → streamText({ tools: [web_search], toolChoice: 'auto', providerOptions.mimo: { ... } })
    → MiMo API 内部执行搜索，返回 message.annotations[url_citation]
  → onFinish 捕获 sources，追加 { type: 'sources', sources } 到 assistant 消息 parts
  → 前端 ChatSources 组件从 parts 中读取并渲染来源链接
```

## 数据库改动

### schema 新增列

`server/db/schema.ts` — `models` 表加列：

```ts
supportsWebSearch: boolean('supports_web_search').notNull().default(false),
```

### seed 数据

`server/db/seed-models.ts` — `supportsWebSearch: true` 的模型：

| 模型 | 支持联网搜索 |
|------|:---:|
| `mimo-v2.5-pro` | ✅ |
| `mimo-v2.5` | ✅ |
| `mimo-v2-pro` | ✅ |
| `mimo-v2-omni` | ✅ |
| `mimo-v2-flash` | ✅ |
| `deepseek-v4-pro` | ❌ |
| `deepseek-v4-flash` | ❌ |
| 其余 | ❌ |

### 迁移

`npx drizzle-kit generate` 生成 migration SQL，测试服 prebuild 自动 `push --force`，正式服 Neon SQL Editor 手动执行。

## 服务端改动

### 1. `server/utils/models.ts`

`ModelOption` 接口加字段：

```ts
supportsWebSearch?: boolean
```

### 2. `server/api/models.get.ts`

读取逻辑与 `supportsImages` 一致：优先 DB 值 → 降级 `provider.supportsWebSearch?.(id)` → `false`。结果合并进 `ModelOption` 返回。

### 3. `server/api/chats/[id].post.ts`

核心改动。在 `streamText` 调用前：

```ts
const webSearchEnabled = options?.webSearch === true

// 仅 MiMo 模型且用户开启时才注入 tools
const webSearchTools = webSearchEnabled ? [{
  type: 'web_search',
  force_search: false,        // 意图识别模式
  max_keyword: 3,
}] : undefined
```

`streamText` 调用加参数：

```ts
const result = streamText({
  model,
  system: '...',
  messages: await convertToModelMessages(messages),
  tools: webSearchTools,
  toolChoice: webSearchEnabled ? 'auto' : undefined,
  providerOptions: {
    deepseek: { thinking: { type: thinkingType } },
    mimo: {
      thinking: { type: thinkingType },
    },
  },
  onFinish: ({ response }) => {
    // 提取 url_citation annotations
    const sources = response.annotations
      ?.filter(a => a.type === 'url_citation')
      ?.map(a => ({
        url: a.url,
        title: a.title,
        summary: a.summary,
        siteName: a.site_name,
        publishTime: a.publish_time,
        logoUrl: a.logo_url,
      }))
    // 通过 event.waitUntil 异步写入消息 metadata
  },
})
```

> **注意：** `tools` 和 `toolChoice` 是 AI SDK `streamText()` 的顶层参数。如 `@ai-sdk/openai-compatible` 不直接支持，需改为通过 `providerOptions.mimo` 透传。实施时优先验证顶层参数方案。

### 4. `server/api/chats.post.ts`

`options` schema 加 `webSearch: z.boolean().optional()`，创建聊天时透传存储（如需持久化）。

## 客户端改动

### 1. `app/composables/useChatOptions.ts`

```ts
export function useChatOptions() {
  const thinkingMode = useCookie<boolean>('chat-thinking-mode', { default: () => true })
  const webSearch = useCookie<boolean>('chat-web-search', { default: () => false })

  return { thinkingMode, webSearch }
}
```

### 2. `app/pages/chat/index.vue` + `app/pages/chat/[id].vue`

两个页面相同改动：

**script:**
- 从 `useChatOptions()` 解构 `webSearch`
- `body` / `createChat` 的 `options` 中加 `webSearch: webSearch.value`
- 从 `useModels()` 获取 `currentModel`（需有 `supportsWebSearch` 字段）

**template footer 区域：**

桌面端（默认，一行）：
```
[输入框...] [联网搜索] [深度思考] [模型▼] [发送▶]
```

移动端（`sm:` 以下，两行）：
```
第一行（横向滑动）: [联网搜索] [深度思考] [模型▼]
第二行:              [📎] [输入框...] [发送▶]
```

开关按钮：
```vue
<UButton
  v-if="currentModel?.supportsWebSearch"
  :label="isMobile ? undefined : '联网搜索'"
  :icon="webSearch ? 'i-lucide-globe' : 'i-lucide-globe-off'"
  :variant="webSearch ? 'soft' : 'ghost'"
  :color="webSearch ? 'primary' : 'neutral'"
  size="sm"
  @click="webSearch = !webSearch"
/>
```

- 移动端只显示图标，不显示 label
- 图标在开启/关闭状态间切换（`globe` / `globe-off`）
- 两行布局用 Tailwind `flex-col sm:flex-row` 实现
- 第一行横向滑动用 `overflow-x-auto flex gap-1.5`

### 3. `app/components/chat/ChatSources.vue`（新建）

展示搜索来源链接：

```vue
<template>
  <div v-if="sources.length" class="mt-3 border-t border-neutral-200 pt-3 dark:border-neutral-700">
    <p class="text-xs text-neutral-500 mb-2">🔗 搜索来源</p>
    <div class="flex flex-wrap gap-2">
      <a v-for="s in sources" :key="s.url" :href="s.url"
         target="_blank" rel="noopener noreferrer"
         class="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-2.5 py-1.5
                text-xs hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800
                transition-colors">
        <img v-if="s.logoUrl" :src="s.logoUrl" class="size-4 rounded" alt="" />
        <span class="font-medium truncate max-w-32">{{ s.title }}</span>
        <span class="text-neutral-400 truncate max-w-24">{{ s.siteName }}</span>
      </a>
    </div>
  </div>
</template>
```

搜索来源数据通过消息 parts 传入，在渲染 AI 消息时挂载 `ChatSources`。

## 错误处理与边界情况

- **MiMo API 不支持 tools**：降级为普通请求（不带 tools），不阻塞聊天
- **模型选择后切换**：当前模型 `supportsWebSearch` 为 false 时隐藏开关，cookie 值保留但不生效
- **webSearch 开启但模型不搜索**：正常，意图识别模式下模型可能判断无需搜索
- **搜索超时/失败**：由 MiMo API 内部处理，不影响流式回复主流程

## 来源数据传递（具体方案）

MiMo 返回的 `url_citation` annotations 按以下路径传递到前端：

### 存储

在 assistant 消息的 `parts` 数组中追加一个新 part：

```ts
// UIMessagePart 已有 z.any() 兜底，无需改 schema
// 存储格式：
{ type: 'sources', sources: Source[] }
// Source: { url, title, summary, siteName, publishTime, logoUrl }
```

### 流程

```
streamText onFinish
  → 从 response.annotations 提取 url_citation
  → 追加 { type: 'sources', sources } 到 assistant 消息的 parts
  → db.update(messages).set({ parts: updatedParts }).where(eq(messages.id, msgId))
  → 通过 event.waitUntil() 异步执行，不阻塞 SSE 流
```

前端获取聊天数据（`GET /api/chats/:id`）时，assistant 消息的 parts 中自然包含 `sources` part。
`ChatSources` 组件通过筛选 `parts.find(p => p.type === 'sources')` 获取数据。

### 可选增强

在 `shared/types/chat.ts` 中显式声明 sources part 类型（可选，`z.any()` 已能通过，但显式声明提供更好的类型推导）。

## 检查清单

- [ ] DB schema 加 `supports_web_search` 列 + migration
- [ ] seed 更新，MiMo 模型标记 `supportsWebSearch: true`
- [ ] `ModelOption` 接口加 `supportsWebSearch`
- [ ] `models.get.ts` 读取合并逻辑
- [ ] `useChatOptions` 加 `webSearch` cookie
- [ ] `index.vue` + `[id].vue` 加开关按钮 + 移动端布局改造 + body 传参
- [ ] `[id].post.ts` 加 webSearch → tools 注入 + onFinish 捕获 sources
- [ ] `chats.post.ts` options schema 加 `webSearch`
- [ ] `ChatSources.vue` 组件新建
- [ ] 类型扩展（`shared/types/chat.ts` 如需）
- [ ] 测试用例（`useChatOptions`、`[id].post.ts` webSearch 逻辑）
- [ ] 移动端布局验证（375px、414px 宽度）
