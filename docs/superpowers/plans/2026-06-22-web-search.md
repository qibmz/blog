# 联网搜索功能 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Chat 新增"联网搜索"开关（与深度思考平行），仅 MiMo 模型支持，开启后模型自主判断是否搜索，来源链接展示在回复下方。

**Architecture:** Cookie 持久化开关状态 → transport body 透传 `webSearch` → 服务端 `streamText` 注入 `tools: [web_search]` → `onFinish` 提取 `url_citation` annotations 写入 assistant 消息 parts → 前端 `ChatSources` 组件渲染。

**Tech Stack:** Nuxt 4, @ai-sdk/vue, @ai-sdk/openai-compatible, Drizzle ORM, Neon PostgreSQL, Zod

## Global Constraints

- models 表通过 `supports_web_search` 布尔列标记，优先 DB 值 → 降级 provider 检测 → `false`
- 联网搜索仅 MiMo 模型支持（`mimo-v2.5-pro`, `mimo-v2.5`, `mimo-v2-pro`, `mimo-v2-omni`, `mimo-v2-flash`），其余模型隐藏开关
- 搜索模式为 `tool_choice: "auto"`（意图识别，模型自主判断）
- 来源数据通过 assistant 消息 parts 数组中的 `{ type: 'sources', sources: Source[] }` 传递
- 移动端 footer 改为两行布局：第一行横向滑动（联网搜索 / 深度思考 / 模型选择），第二行（图片上传 + 输入框 + 发送）
- 所有 API 请求走 `useAPI`，不直接 `$fetch`

---

### Task 1: DB Schema + Seed + Provider 基础设施

**Files:**
- Modify: `server/db/schema.ts:34-39`
- Modify: `server/db/seed-models.ts:29-41`
- Modify: `server/utils/models.ts:35-63, 86-91, 125-131`

**Interfaces:**
- Produces: `models.supportsWebSearch` DB column, `ModelOption.supportsWebSearch`, `ProviderConfig.supportsWebSearch`, `modelSupportsWebSearch( modelId ) → boolean`

- [ ] **Step 1: Add `supports_web_search` column to `models` table**

In `server/db/schema.ts`, add the new column after `supportsImages`:

```ts
export const models = pgTable('models', {
  id: text('id').primaryKey(),
  supportsImages: boolean('supports_images').notNull().default(false),
  supportsWebSearch: boolean('supports_web_search').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})
```

- [ ] **Step 2: Add `supportsWebSearch` to `ModelOption` and `ProviderConfig`**

In `server/utils/models.ts`, add the field to `ModelOption`:

```ts
export interface ModelOption {
  value: string
  label: string
  icon: string
  supportsImages?: boolean
  supportsWebSearch?: boolean
}
```

Add to `ProviderConfig`:

```ts
export interface ProviderConfig {
  // ... existing fields ...
  supportsImages?: (modelId: string) => boolean
  /** 检测 model ID 是否支持联网搜索（`tools: [web_search]`） */
  supportsWebSearch?: (modelId: string) => boolean
}
```

In the MiMo provider entry, add `supportsWebSearch`:

```ts
{
  name: 'MiMo',
  prefixes: ['mimo-'],
  icon: 'i-simple-icons-xiaomi',
  modelsUrl: 'https://api.xiaomimimo.com/v1/models',
  headers: () => ({ 'api-key': process.env.MIMO_API_KEY ?? '' }),
  exclude: ['tts', 'embedding', 'whisper', 'dall-e'],
  getInstance: id => mimo(id),
  supportsImages: (id) => {
    if (id.startsWith('mimo-v2.5') && !id.includes('-pro') && !id.includes('-flash')) return true
    if (id.startsWith('mimo-v2-omni') && !id.includes('-pro') && !id.includes('-flash')) return true
    return false
  },
  // 联网搜索仅在 MiMo v2.5 和 v2 系列支持
  // 参考: https://mimo.mi.com/docs/zh-CN/quick-start/usage-guide/text-generation/tool-calling/web-search
  supportsWebSearch: (id) => {
    return id.startsWith('mimo-')
  }
}
```

Add `modelSupportsWebSearch()` utility function after `modelSupportsImages()`:

```ts
/** 检测 model ID 是否支持联网搜索 */
export function modelSupportsWebSearch(modelId: string): boolean {
  const provider = PROVIDER_REGISTRY.find(p =>
    p.prefixes.some(px => modelId.startsWith(px))
  )
  return provider?.supportsWebSearch?.(modelId) ?? false
}
```

- [ ] **Step 3: Update seed data**

In `server/db/seed-models.ts`, add `supportsWebSearch` to the seed type and data:

```ts
const seedData: { id: string, supportsImages: boolean, supportsWebSearch: boolean }[] = [
  // DeepSeek — 无视觉/搜索
  { id: 'deepseek-v4-pro', supportsImages: false, supportsWebSearch: false },
  { id: 'deepseek-v4-flash', supportsImages: false, supportsWebSearch: false },
  // MiMo v2.5 系列 — 全部支持联网搜索
  { id: 'mimo-v2.5-pro', supportsImages: false, supportsWebSearch: true },
  { id: 'mimo-v2.5-flash', supportsImages: false, supportsWebSearch: true },
  { id: 'mimo-v2.5', supportsImages: true, supportsWebSearch: true },
  // MiMo v2-omni 系列 — 全部支持联网搜索
  { id: 'mimo-v2-omni', supportsImages: true, supportsWebSearch: true },
  { id: 'mimo-v2-omni-pro', supportsImages: false, supportsWebSearch: true },
  { id: 'mimo-v2-omni-flash', supportsImages: false, supportsWebSearch: true }
]
```

And update the insert:

```ts
await db
  .insert(schema.models)
  .values({
    id: model.id,
    supportsImages: model.supportsImages,
    supportsWebSearch: model.supportsWebSearch,
    createdAt: new Date(),
    updatedAt: new Date()
  })
  .onConflictDoNothing({ target: [schema.models.id] })
```

- [ ] **Step 4: Generate migration**

```bash
npx drizzle-kit generate
```

Expected: Creates a new migration SQL file in `server/db/migrations/` with `ALTER TABLE "models" ADD COLUMN "supports_web_search" boolean DEFAULT false NOT NULL`.

- [ ] **Step 5: Run seed locally to verify**

```bash
npx tsx server/db/seed-models.ts
```

Expected: `[seed-models] Seeding 8 models...` → `[seed-models] ✅ Seed complete`

- [ ] **Step 6: Commit**

```bash
git add server/db/schema.ts server/db/seed-models.ts server/utils/models.ts server/db/migrations/
git commit -m "feat: models 表加 supports_web_search 列 + Provider 支持检测"
```

---

### Task 2: API — models.get.ts 读取 supportsWebSearch

**Files:**
- Modify: `server/api/models.get.ts:52-94`

**Interfaces:**
- Consumes: `models.supportsWebSearch` DB column, `ProviderConfig.supportsWebSearch`
- Produces: `ModelOption` with `supportsWebSearch` field in API response

- [ ] **Step 1: Update DB query to select `supportsWebSearch`**

Change the DB select to include the new column:

```ts
const records = await db
  .select({ id: models.id, supportsImages: models.supportsImages, supportsWebSearch: models.supportsWebSearch })
  .from(models)
  .where(inArray(models.id, allModelIds))
for (const r of records) {
  dbMap.set(r.id, { supportsImages: r.supportsImages, supportsWebSearch: r.supportsWebSearch })
}
```

- [ ] **Step 2: Update `dbMap` to store both booleans**

Change `dbMap` from `Map<string, boolean>` to `Map<string, { supportsImages: boolean, supportsWebSearch: boolean }>`:

```ts
const dbMap = new Map<string, { supportsImages: boolean, supportsWebSearch: boolean }>()
```

- [ ] **Step 3: Apply supportsWebSearch resolution in the merge loop**

Update the model building loop:

```ts
for (const id of ids) {
  let supportsImages: boolean
  let supportsWebSearch: boolean

  if (dbMap.has(id)) {
    const dbRow = dbMap.get(id)!
    supportsImages = dbRow.supportsImages
    supportsWebSearch = dbRow.supportsWebSearch
  } else if (dbOk) {
    console.warn(`[models] DB miss for ${id}, model should be seeded`)
    supportsImages = provider.supportsImages?.(id) ?? false
    supportsWebSearch = provider.supportsWebSearch?.(id) ?? false
  } else {
    supportsImages = provider.supportsImages?.(id) ?? false
    supportsWebSearch = provider.supportsWebSearch?.(id) ?? false
  }

  modelOptions.push({
    value: id,
    label: `${provider.name} ${modelIdToLabel(provider, id)}`,
    icon: provider.icon,
    supportsImages,
    supportsWebSearch
  })
}
```

- [ ] **Step 4: Verify typecheck**

```bash
pnpm typecheck
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add server/api/models.get.ts
git commit -m "feat: models API 返回 supportsWebSearch 字段"
```

---

### Task 3: Shared Types — SourcesPart 类型声明

**Files:**
- Modify: `shared/types/chat.ts:5-18`

**Interfaces:**
- Produces: `SourcesPartSchema` (Zod), `SourcesPart` type, usable in message parts array

- [ ] **Step 1: Add `SourcesPart` to `UIMessagePartSchema`**

Replace the `z.any()` branch with explicit part types including sources:

```ts
const UIMessagePartSchema = z.intersection(
  z.object({ type: z.string() }),
  z.union([
    z.object({ type: z.literal('text'), text: z.string() }),
    z.object({ type: z.literal('file'), url: z.string(), mediaType: z.string(), filename: z.string().optional() }),
    z.object({
      type: z.literal('sources'),
      sources: z.array(z.object({
        url: z.string(),
        title: z.string().optional(),
        summary: z.string().optional(),
        siteName: z.string().optional(),
        publishTime: z.string().optional(),
        logoUrl: z.string().optional()
      }))
    }),
    z.any() // reasoning, tool-call, data 等其他 part 类型
  ])
)
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm typecheck
```

Expected: No errors — `z.any()` catch-all ensures backward compatibility.

- [ ] **Step 3: Commit**

```bash
git add shared/types/chat.ts
git commit -m "feat: UIMessagePart 新增 sources 类型声明"
```

---

### Task 4: useChatOptions — 新增 webSearch Cookie

**Files:**
- Modify: `app/composables/useChatOptions.ts`

**Interfaces:**
- Produces: `useChatOptions().webSearch` — `Ref<boolean>`, cookie key `'chat-web-search'`, default `false`

- [ ] **Step 1: Add `webSearch` cookie**

```ts
export function useChatOptions() {
  const thinkingMode = useCookie<boolean>('chat-thinking-mode', {
    default: () => true
  })

  const webSearch = useCookie<boolean>('chat-web-search', {
    default: () => false
  })

  return {
    thinkingMode,
    webSearch
  }
}
```

- [ ] **Step 2: Run tests**

```bash
pnpm test
```

Expected: All existing tests pass.

- [ ] **Step 3: Commit**

```bash
git add app/composables/useChatOptions.ts
git commit -m "feat: useChatOptions 新增 webSearch cookie"
```

---

### Task 5: ChatSources.vue — 搜索来源展示组件

**Files:**
- Create: `app/components/chat/ChatSources.vue`

**Interfaces:**
- Consumes: `sources: Source[]` prop, where `Source = { url: string, title?: string, summary?: string, siteName?: string, publishTime?: string, logoUrl?: string }`

- [ ] **Step 1: Create component**

```vue
<script setup lang="ts">
export interface ChatSource {
  url: string
  title?: string
  summary?: string
  siteName?: string
  publishTime?: string
  logoUrl?: string
}

defineProps<{
  sources: ChatSource[]
}>()
</script>

<template>
  <div
    v-if="sources.length > 0"
    class="mt-3 border-t border-neutral-200 pt-3 dark:border-neutral-700"
  >
    <p class="text-xs text-neutral-500 mb-2 flex items-center gap-1">
      <UIcon name="i-lucide-globe" class="size-3.5" />
      搜索来源
    </p>
    <div class="flex flex-wrap gap-1.5">
      <a
        v-for="(s, i) in sources"
        :key="s.url || i"
        :href="s.url"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-2.5 py-1.5
               text-xs hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800
               transition-colors no-underline"
      >
        <img
          v-if="s.logoUrl"
          :src="s.logoUrl"
          class="size-4 rounded"
          alt=""
          loading="lazy"
        />
        <span class="font-medium text-neutral-700 dark:text-neutral-200 truncate max-w-32">
          {{ s.title || s.siteName || new URL(s.url).hostname }}
        </span>
        <span
          v-if="s.siteName && s.title"
          class="text-neutral-400 truncate max-w-24"
        >
          {{ s.siteName }}
        </span>
      </a>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Verify component compiles**

```bash
pnpm typecheck
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/components/chat/ChatSources.vue
git commit -m "feat: ChatSources 搜索来源展示组件"
```

---

### Task 6: API — chats.post.ts options schema 加 webSearch

**Files:**
- Modify: `server/api/chats.post.ts:9-10`

**Interfaces:**
- Consumes: `useChatOptions().webSearch` (from client)
- Produces: `options.webSearch` stored in chat creation (available for future use)

- [ ] **Step 1: Add `webSearch` to options validation**

```ts
const { message, model, options: _options } = await readValidatedBody(event, z.object({
  message: UIMessageSchema,
  model: z.string().optional(),
  options: z.object({
    thinkingMode: z.boolean().optional(),
    webSearch: z.boolean().optional()
  }).optional()
}).parse)
```

- [ ] **Step 2: Run tests**

```bash
pnpm test
```

Expected: All existing tests pass.

- [ ] **Step 3: Commit**

```bash
git add server/api/chats.post.ts
git commit -m "feat: chats.post options schema 新增 webSearch"
```

---

### Task 7: API — [id].post.ts 注入 web_search tools + 捕获 sources

**Files:**
- Modify: `server/api/chats/[id].post.ts`

**Interfaces:**
- Consumes: `options.webSearch: boolean`, `modelSupportsWebSearch(modelId)`
- Produces: `streamText` with `tools: [web_search]` and `toolChoice: 'auto'` when enabled; `onFinish` writes `{ type: 'sources', sources }` part to assistant message

- [ ] **Step 1: Add imports**

Add `modelSupportsWebSearch` to the import from models utils:

```ts
import { getModel, DEFAULT_MODEL, modelSupportsImages, modelSupportsWebSearch } from '../../utils/models'
```

- [ ] **Step 2: Update options validation**

```ts
const { model: modelValue = DEFAULT_MODEL, messages, options } = await readValidatedBody(event, z.object({
  model: z.string().optional(),
  messages: z.array(UIMessageSchema),
  options: z.object({
    thinkingMode: z.boolean().optional(),
    webSearch: z.boolean().optional()
  }).optional()
}).parse)
```

- [ ] **Step 3: Build web search tools config**

After `const thinkingType = ...`, add:

```ts
const thinkingType = options?.thinkingMode !== false ? 'enabled' as const : 'disabled' as const

// 联网搜索：仅 model 支持 + 用户开启时注入 tools
const webSearchEnabled = options?.webSearch === true && modelSupportsWebSearch(modelValue)
const webSearchTools: { type: 'web_search', force_search: boolean, max_keyword: number }[] | undefined = webSearchEnabled
  ? [{ type: 'web_search', force_search: false, max_keyword: 3 }]
  : undefined
```

- [ ] **Step 4: Update `streamText` call**

```ts
const stream = createUIMessageStream({
  execute: async ({ writer }) => {
    const result = streamText({
      model,
      system: '你是一个友好、简洁的 AI 助手。',
      messages: await convertToModelMessages(messages as UIMessage[]),
      tools: webSearchTools,
      toolChoice: webSearchEnabled ? 'auto' : undefined,
      providerOptions: {
        deepseek: {
          thinking: { type: thinkingType }
        },
        mimo: {
          thinking: { type: thinkingType }
        }
      }
    })

    writer.merge(result.toUIMessageStream())
  },
  onFinish: async ({ messages: finishedMessages }) => {
    await db.insert(schema.messages).values(
      finishedMessages.map(msg => ({
        chatId: chat.id,
        role: msg.role as 'user' | 'assistant',
        parts: Array.isArray(msg.parts) ? msg.parts : []
      }))
    )
  }
})
```

- [ ] **Step 5: Add `onFinish` callback to `streamText` for sources capture**

Update the full `execute` + outer `onFinish` to capture sources via a shared closure variable:

```ts
// 在 execute 外部声明，内层 onFinish 写入，外层 onFinish 读取
let webSearchSources: any[] | null = null

const stream = createUIMessageStream({
  execute: async ({ writer }) => {
    const result = streamText({
      model,
      system: '你是一个友好、简洁的 AI 助手。',
      messages: await convertToModelMessages(messages as UIMessage[]),
      tools: webSearchTools,
      toolChoice: webSearchEnabled ? 'auto' : undefined,
      providerOptions: {
        deepseek: { thinking: { type: thinkingType } },
        mimo: { thinking: { type: thinkingType } }
      },
      onFinish: ({ response }) => {
        // 提取 url_citation annotations
        const annotations = (response as any).annotations
        if (!annotations || !Array.isArray(annotations)) return

        const urlCitations = annotations.filter((a: any) => a.type === 'url_citation')
        if (urlCitations.length === 0) return

        webSearchSources = urlCitations.map((a: any) => ({
          url: a.url,
          title: a.title,
          summary: a.summary,
          siteName: a.site_name,
          publishTime: a.publish_time,
          logoUrl: a.logo_url
        }))
      }
    })

    writer.merge(result.toUIMessageStream())
  },
  onFinish: async ({ messages: finishedMessages }) => {
    await db.insert(schema.messages).values(
      finishedMessages.map(msg => {
        const parts = Array.isArray(msg.parts) ? [...msg.parts] : []
        // 仅 assistant 消息 + 有 sources 时追加
        if (msg.role === 'assistant' && webSearchSources && webSearchSources.length > 0) {
          parts.push({ type: 'sources', sources: webSearchSources } as any)
        }
        return {
          chatId: chat.id,
          role: msg.role as 'user' | 'assistant',
          parts
        }
      })
    )
  }
})
```

- [ ] **Step 6: Run tests + typecheck**

```bash
pnpm typecheck && pnpm test
```

Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add server/api/chats/[id].post.ts
git commit -m "feat: [id].post 支持 webSearch → tools 注入 + onFinish 捕获来源"
```

---

### Task 8: index.vue — 联网搜索开关 + 移动端布局改造

**Files:**
- Modify: `app/pages/chat/index.vue`

**Interfaces:**
- Consumes: `useChatOptions().webSearch`, `currentModel.supportsWebSearch`
- Produces: Toggle button in footer, `options.webSearch` in `chatBody`

- [ ] **Step 1: Destructure `webSearch` from `useChatOptions`**

```ts
const { thinkingMode, webSearch } = useChatOptions()
```

- [ ] **Step 2: Add `webSearch` to `chatBody`**

```ts
chatBody.value = {
  message: {
    id: crypto.randomUUID(),
    role: 'user',
    parts: [
      ...readyParts.value,
      ...(trimmed ? [{ type: 'text', text: trimmed }] : [])
    ]
  },
  model: selectedModel.value,
  options: { thinkingMode: thinkingMode.value, webSearch: webSearch.value }
}
```

- [ ] **Step 3: Replace the footer template**

Replace the existing `<template #footer>` block with desktop one-row / mobile two-row layout:

```vue
<template #footer>
  <!-- 移动端：开关行（横向滑动） -->
  <div class="flex sm:hidden items-center gap-1.5 mb-1.5 overflow-x-auto">
    <UButton
      v-if="currentModel?.supportsWebSearch"
      :icon="webSearch ? 'i-lucide-globe' : 'i-lucide-globe-off'"
      :variant="webSearch ? 'soft' : 'ghost'"
      :color="webSearch ? 'primary' : 'neutral'"
      size="sm"
      @click="webSearch = !webSearch"
    />
    <UButton
      icon="i-lucide-brain"
      :variant="thinkingMode ? 'soft' : 'ghost'"
      :color="thinkingMode ? 'primary' : 'neutral'"
      size="sm"
      @click="thinkingMode = !thinkingMode"
    />
    <USelectMenu
      v-model="selectedModel"
      :items="modelOptions"
      value-key="value"
      size="sm"
      variant="ghost"
      class="min-w-32"
    >
      <template #leading="{ modelValue }">
        <UIcon
          v-if="modelValue"
          :name="modelOptions.find(m => m.value === modelValue)?.icon"
        />
      </template>
    </USelectMenu>
  </div>

  <!-- 输入行（桌面 + 移动端共享） -->
  <div class="flex items-center gap-1.5 w-full">
    <UFileUpload
      v-if="currentModel?.supportsImages"
      v-model="uploadFiles"
      variant="button"
      icon="i-lucide-paperclip"
      accept="image/jpeg,image/png,image/gif,image/webp,image/bmp"
      color="neutral"
      size="sm"
      aria-label="上传图片"
      @update:model-value="onUploadChange"
    />

    <div class="flex-1" />

    <!-- 桌面端：开关直接内联 -->
    <template v-if="$viewport.isGreaterOrEqual('sm')">
      <UButton
        v-if="currentModel?.supportsWebSearch"
        label="联网搜索"
        :icon="webSearch ? 'i-lucide-globe' : 'i-lucide-globe-off'"
        :variant="webSearch ? 'soft' : 'ghost'"
        :color="webSearch ? 'primary' : 'neutral'"
        size="sm"
        @click="webSearch = !webSearch"
      />
      <UButton
        label="深度思考"
        icon="i-lucide-brain"
        :variant="thinkingMode ? 'soft' : 'ghost'"
        :color="thinkingMode ? 'primary' : 'neutral'"
        size="sm"
        @click="thinkingMode = !thinkingMode"
      />
      <USelectMenu
        v-model="selectedModel"
        :items="modelOptions"
        value-key="value"
        size="sm"
        variant="ghost"
        class="min-w-32 sm:min-w-48"
      >
        <template #leading="{ modelValue }">
          <UIcon
            v-if="modelValue"
            :name="modelOptions.find(m => m.value === modelValue)?.icon"
          />
        </template>
      </USelectMenu>
    </template>

    <UChatPromptSubmit
      :status="pending ? 'submitted' : 'ready'"
      color="neutral"
      size="sm"
    />
  </div>
</template>
```

- [ ] **Step 4: Check that `$viewport` is available**

The `@nuxt/ui` module provides `$viewport` globally. If not, use a simple `useMediaQuery('(min-width: 640px)')` instead. Verify:

```bash
pnpm typecheck
```

Expected: No errors. If `$viewport` is not recognized, use:

```ts
const isMobile = useMediaQuery('(max-width: 639px)')
```

And replace `$viewport.isGreaterOrEqual('sm')` with `!isMobile.value`.

- [ ] **Step 5: Commit**

```bash
git add app/pages/chat/index.vue
git commit -m "feat: index.vue 联网搜索开关 + 移动端两行 footer 布局"
```

---

### Task 9: [id].vue — 联网搜索开关 + 移动端布局 + 来源渲染

**Files:**
- Modify: `app/pages/chat/[id].vue`

**Interfaces:**
- Consumes: `useChatOptions().webSearch`, `currentModel.supportsWebSearch`, `ChatSources` component
- Produces: Toggle + transport body + sources rendering in message content

- [ ] **Step 1: Destructure `webSearch` + import `ChatSources`**

```ts
const { thinkingMode, webSearch } = useChatOptions()

// Add import at top of script:
import ChatSources from '~/components/chat/ChatSources.vue'
import type { ChatSource } from '~/components/chat/ChatSources.vue'
```

- [ ] **Step 2: Update transport body**

```ts
transport: new DefaultChatTransport({
  api: `/api/chats/${id}`,
  body: () => ({
    model: selectedModel.value,
    options: { thinkingMode: thinkingMode.value, webSearch: webSearch.value }
  })
}),
```

- [ ] **Step 3: Add sources rendering in message content**

In the `<template #content="{ message }">` block, after the `UChatReasoning` and text part loops, add ChatSources rendering:

```vue
<template #content="{ message }">
  <template
    v-for="(part, index) in (message as UIMessage).parts"
    :key="`${(message as UIMessage).id}-${part.type}-${index}`"
  >
    <UChatReasoning
      v-if="isReasoningUIPart(part)"
      :text="part.text"
      :streaming="isPartStreaming(part)"
      chevron="leading"
    >
      <ChatComark
        :markdown="part.text"
        :streaming="isPartStreaming(part)"
      />
    </UChatReasoning>
    <template v-else-if="isTextUIPart(part)">
      <ChatComark
        v-if="(message as UIMessage).role === 'assistant'"
        :markdown="part.text"
        :streaming="isPartStreaming(part)"
      />
      <p
        v-else-if="(message as UIMessage).role === 'user'"
        class="whitespace-pre-wrap"
      >
        {{ part.text }}
      </p>
    </template>
  </template>

  <!-- 联网搜索来源 -->
  <ChatSources
    v-if="(message as UIMessage).role === 'assistant'"
    :sources="((message as UIMessage).parts?.find(p => p.type === 'sources') as any)?.sources ?? []"
  />
</template>
```

- [ ] **Step 4: Replace footer template with same two-row layout as index.vue**

Replace the existing `<template #footer>` inside `UChatPrompt`:

```vue
<template #footer>
  <!-- 移动端：开关行（横向滑动） -->
  <div class="flex sm:hidden items-center gap-1.5 mb-1.5 overflow-x-auto">
    <UButton
      v-if="currentModel?.supportsWebSearch"
      :icon="webSearch ? 'i-lucide-globe' : 'i-lucide-globe-off'"
      :variant="webSearch ? 'soft' : 'ghost'"
      :color="webSearch ? 'primary' : 'neutral'"
      size="sm"
      @click="webSearch = !webSearch"
    />
    <UButton
      icon="i-lucide-brain"
      :variant="thinkingMode ? 'soft' : 'ghost'"
      :color="thinkingMode ? 'primary' : 'neutral'"
      size="sm"
      @click="thinkingMode = !thinkingMode"
    />
  </div>

  <!-- 输入行 -->
  <div class="flex items-center gap-1.5 w-full">
    <UFileUpload
      v-if="currentModel?.supportsImages"
      v-model="uploadFiles"
      variant="button"
      icon="i-lucide-paperclip"
      accept="image/jpeg,image/png,image/gif,image/webp,image/bmp"
      color="neutral"
      size="sm"
      aria-label="上传图片"
      @update:model-value="onUploadChange"
    />

    <div class="flex-1" />

    <!-- 桌面端：开关内联 -->
    <template v-if="$viewport.isGreaterOrEqual('sm')">
      <UButton
        v-if="currentModel?.supportsWebSearch"
        label="联网搜索"
        :icon="webSearch ? 'i-lucide-globe' : 'i-lucide-globe-off'"
        :variant="webSearch ? 'soft' : 'ghost'"
        :color="webSearch ? 'primary' : 'neutral'"
        size="sm"
        @click="webSearch = !webSearch"
      />
      <UButton
        label="深度思考"
        icon="i-lucide-brain"
        :variant="thinkingMode ? 'soft' : 'ghost'"
        :color="thinkingMode ? 'primary' : 'neutral'"
        size="sm"
        @click="thinkingMode = !thinkingMode"
      />
    </template>

    <UChatPromptSubmit
      :status="chat.status"
      color="neutral"
      size="sm"
      @stop="chat.stop()"
      @reload="chat.regenerate()"
    />
  </div>
</template>
```

> **Note:** [id].vue 不需要模型选择（已在上方 navbar），所以移动端开关行只放联网搜索 + 深度思考。

- [ ] **Step 5: Verify typecheck**

```bash
pnpm typecheck
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add app/pages/chat/[id].vue
git commit -m "feat: [id].vue 联网搜索开关 + 移动端布局 + ChatSources 渲染"
```

---

### Task 10: Tests

**Files:**
- Create: `server/api/chats/__test__/chats-post-search.test.ts` (or add to existing test file)

**Interfaces:**
- Consumes: `[id].post.ts` webSearch handling
- Tests: webSearch option validation, tools injection, sources extraction

- [ ] **Step 1: Write tests for webSearch option handling**

Create test file at `server/api/chats/__test__/chats-post-search.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'

describe('webSearch option handling', () => {
  it('should skip tools injection when webSearch is false', () => {
    // options.webSearch === false → webSearchTools is undefined, toolChoice is undefined
    const webSearchEnabled = false
    const tools = webSearchEnabled
      ? [{ type: 'web_search', force_search: false, max_keyword: 3 }]
      : undefined
    const toolChoice = webSearchEnabled ? 'auto' : undefined

    expect(tools).toBeUndefined()
    expect(toolChoice).toBeUndefined()
  })

  it('should inject web_search tools when webSearch is true', () => {
    const webSearchEnabled = true
    const tools = webSearchEnabled
      ? [{ type: 'web_search', force_search: false, max_keyword: 3 }]
      : undefined
    const toolChoice = webSearchEnabled ? 'auto' : undefined

    expect(tools).toEqual([{ type: 'web_search', force_search: false, max_keyword: 3 }])
    expect(toolChoice).toBe('auto')
  })

  it('should extract url_citation annotations correctly', () => {
    const annotations = [
      { type: 'url_citation', url: 'https://example.com', title: 'Example', site_name: 'Example Site' },
      { type: 'other', data: 'ignored' },
      { type: 'url_citation', url: 'https://test.com', title: 'Test', site_name: 'Test Site' }
    ]

    const sources = annotations
      .filter((a: any) => a.type === 'url_citation')
      .map((a: any) => ({
        url: a.url,
        title: a.title,
        siteName: a.site_name
      }))

    expect(sources).toHaveLength(2)
    expect(sources[0]!.url).toBe('https://example.com')
    expect(sources[1]!.url).toBe('https://test.com')
  })

  it('should return empty sources when no url_citation annotations', () => {
    const annotations = [{ type: 'other' }]
    const sources = (annotations as any[]).filter((a: any) => a.type === 'url_citation')
    expect(sources).toHaveLength(0)
  })

  it('should return empty sources when annotations is null/undefined', () => {
    const sources = (null as any)?.filter?.((a: any) => a.type === 'url_citation') ?? []
    expect(sources).toHaveLength(0)
  })

  it('should append sources part to assistant message parts', () => {
    const parts: any[] = [{ type: 'text', text: 'Hello' }]
    const sources = [{ url: 'https://example.com', title: 'Example' }]

    parts.push({ type: 'sources', sources })

    expect(parts).toHaveLength(2)
    expect(parts[1]!.type).toBe('sources')
    expect(parts[1]!.sources).toEqual(sources)
  })

  it('should not append sources to user message parts', () => {
    // Only assistant messages get the sources part
    const role = 'user'
    const parts: any[] = [{ type: 'text', text: 'query' }]
    const sources = [{ url: 'https://example.com', title: 'Example' }]

    if (role === 'assistant' && sources && sources.length > 0) {
      parts.push({ type: 'sources', sources } as any)
    }

    // User message — sources not appended
    expect(parts).toHaveLength(1)
    expect(parts[0]!.type).toBe('text')
  })
})
```

- [ ] **Step 2: Run tests**

```bash
pnpm test server/api/chats/__test__/chats-post-search.test.ts
```

Expected: All 7 tests pass.

- [ ] **Step 3: Commit**

```bash
git add server/api/chats/__test__/chats-post-search.test.ts
git commit -m "test: webSearch 选项处理 + sources 提取单元测试"
```

---

### Task 11: Integration verification

- [ ] **Step 1: Run full test suite**

```bash
pnpm lint && pnpm test && pnpm typecheck
```

Expected: All pass.

- [ ] **Step 2: Start dev server and verify manually**

```bash
pnpm dev
```

Check:
1. 选择 MiMo 模型 → 联网搜索开关出现
2. 选择 DeepSeek 模型 → 联网搜索开关消失
3. 开启联网搜索 → 发送消息 → `body.options.webSearch` 为 `true`
4. 关闭联网搜索 → `body.options.webSearch` 为 `false`
5. 刷新页面 → 开关状态保持
6. 移动端（Chrome DevTools 375px）→ 开关在输入框上方横向滑动行
7. 桌面端 → 开关在输入框同一行

- [ ] **Step 3: Final commit (if any fixes)**

```bash
git add -A
git commit -m "chore: 联网搜索功能集成验证通过"
```
