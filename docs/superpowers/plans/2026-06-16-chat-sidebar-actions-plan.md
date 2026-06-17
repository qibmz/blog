# 侧边栏聊天操作菜单（重命名 / 置顶 / 删除）实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 侧边栏每条聊天新增下拉菜单，支持重命名、置顶/取消置顶、删除三个操作。

**Architecture:** 数据库新增 `pinned` 字段 → `PATCH /api/chats/[id]` 统一处理三种 action → 前端 `UDropdownMenu` + 弹窗交互。置顶聊天在排序中优先显示。

**Tech Stack:** Nuxt 4, Drizzle ORM, Nuxt UI (`UDropdownMenu`, `UModal`, `UInput`), Zod validation

---

### Task 1: Schema — chats 表新增 pinned 字段

**Files:**
- Modify: `server/db/schema.ts`

- [ ] **Step 1: 添加 pinned 字段和索引**

在 `server/db/schema.ts` 的 `chats` 表中，`createdAt` 之前添加 `pinned` 字段，并在 index 数组中添加复合索引：

```ts
import { pgTable, text, jsonb, timestamp, index, boolean } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const chats = pgTable('chats', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id'),
  title: text('title'),
  model: text('model'),
  pinned: boolean('pinned').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow()
}, table => [
  index('chats_user_id_idx').on(table.userId),
  index('chats_user_id_pinned_idx').on(table.userId, table.pinned, table.createdAt)
])
```

- [ ] **Step 2: 运行数据库迁移**

```bash
npx drizzle-kit generate
npx drizzle-kit push
```

- [ ] **Step 3: 更新测试 setup 中的 mock schema**

在 `server/utils/__test__/setup.ts` 中给 `mockSchema.chats` 添加 `pinned: 'pinned'`：

```ts
export const mockSchema = {
  chats: {
    id: 'id',
    userId: 'user_id',
    title: 'title',
    model: 'model',
    pinned: 'pinned',
    createdAt: 'created_at'
  },
  messages: { ... }
}
```

- [ ] **Step 4: 提交**

```bash
git add server/db/schema.ts server/utils/__test__/setup.ts
# migration files
git add drizzle/
git commit -m "feat: chats 表新增 pinned 字段支持置顶"
```

---

### Task 2: API — 新增 PATCH /api/chats/[id]

**Files:**
- Create: `server/api/chats/[id].patch.ts`

- [ ] **Step 1: 创建 API 文件**

```ts
import { defineEventHandler, getValidatedRouterParams, readValidatedBody } from 'h3'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

const PatchBodySchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('rename'), title: z.string().min(1).max(100) }),
  z.object({ action: z.literal('pin'), pinned: z.boolean() }),
  z.object({ action: z.literal('delete') })
])

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.string()
  }).parse)

  const body = await readValidatedBody(event, PatchBodySchema.parse)

  // 验证所有权
  const chat = await db.query.chats.findFirst({
    where: and(eq(schema.chats.id, id), eq(schema.chats.userId, user.id))
  })

  if (!chat) {
    throw raiseNotFound('Chat not found')
  }

  switch (body.action) {
    case 'rename': {
      await db.update(schema.chats)
        .set({ title: body.title })
        .where(eq(schema.chats.id, id))
      return { ...chat, title: body.title }
    }
    case 'pin': {
      await db.update(schema.chats)
        .set({ pinned: body.pinned })
        .where(eq(schema.chats.id, id))
      return { ...chat, pinned: body.pinned }
    }
    case 'delete': {
      // messages 设置了 onDelete: cascade，自动级联删除
      await db.delete(schema.chats).where(eq(schema.chats.id, id))
      return { deleted: true }
    }
  }
})
```

- [ ] **Step 2: 提交**

```bash
git add server/api/chats/\[id\].patch.ts
git commit -m "feat: 新增 PATCH /api/chats/[id] 支持重命名/置顶/删除"
```

---

### Task 3: API — 更新排序 + 返回 pinned 字段

**Files:**
- Modify: `server/api/chats.get.ts`

- [ ] **Step 1: 更新排序逻辑**

将 `orderBy` 改为先按 `pinned DESC`，再按 `createdAt DESC`：

```ts
import { defineEventHandler } from 'h3'
import { eq, desc } from 'drizzle-orm'
import { getTodayCount, DAILY_LIMIT } from '../utils/rateLimiter'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    return { chats: [], remainingToday: DAILY_LIMIT }
  }

  const [chats, todayCount] = await Promise.all([
    db.query.chats.findMany({
      where: eq(schema.chats.userId, session.user.id),
      orderBy: () => [desc(schema.chats.pinned), desc(schema.chats.createdAt)]
    }),
    getTodayCount(session.user.id)
  ])

  return {
    chats,
    remainingToday: Math.max(0, DAILY_LIMIT - todayCount)
  }
})
```

- [ ] **Step 2: 提交**

```bash
git add server/api/chats.get.ts
git commit -m "feat: 聊天列表置顶优先排序"
```

---

### Task 4: UI — 侧边栏 DropdownMenu + 弹窗

**Files:**
- Modify: `app/layouts/chat.vue`

- [ ] **Step 1: 在 script 部分添加状态和方法**

在 `chat.vue` 的 `<script setup>` 中，在现有代码之后（`provide('refreshSidebar', refreshSidebar)` 之后）添加：

```ts
import type { DropdownMenuItem } from '@nuxt/ui'

type Chat = NonNullable<typeof chatsData.value>['chats'][number]

// ─── 右键菜单 ──────────────────────────────────────────────
const renameOpen = ref(false)
const renameChat = ref<Chat | null>(null)
const renameInput = ref('')

const deleteOpen = ref(false)
const deleteTarget = ref<Chat | null>(null)

function getChatMenuItems(chat: Chat): DropdownMenuItem[][] {
  const isPinned = !!(chat as { pinned?: boolean }).pinned
  return [
    [
      {
        label: '重命名',
        icon: 'i-lucide-pencil',
        onSelect() {
          renameChat.value = chat
          renameInput.value = chat.title ?? ''
          renameOpen.value = true
        }
      },
      isPinned
        ? {
            label: '取消置顶',
            icon: 'i-lucide-pin-off',
            onSelect() {
              $fetch(`/api/chats/${chat.id}`, { method: 'PATCH', body: { action: 'pin', pinned: false } })
                .then(() => refreshNuxtData('sidebar-chats'))
            }
          }
        : {
            label: '置顶',
            icon: 'i-lucide-pin',
            onSelect() {
              $fetch(`/api/chats/${chat.id}`, { method: 'PATCH', body: { action: 'pin', pinned: true } })
                .then(() => refreshNuxtData('sidebar-chats'))
            }
          }
    ],
    [
      {
        label: '删除',
        icon: 'i-lucide-trash-2',
        color: 'error',
        onSelect() {
          deleteTarget.value = chat
          deleteOpen.value = true
        }
      }
    ]
  ]
}

async function handleRename() {
  if (!renameChat.value || !renameInput.value.trim()) return
  await $fetch(`/api/chats/${renameChat.value.id}`, {
    method: 'PATCH',
    body: { action: 'rename', title: renameInput.value.trim() }
  })
  renameOpen.value = false
  refreshNuxtData('sidebar-chats')
}

async function handleDelete() {
  if (!deleteTarget.value) return
  const id = deleteTarget.value.id
  await $fetch(`/api/chats/${id}`, { method: 'PATCH', body: { action: 'delete' } })
  deleteOpen.value = false
  refreshNuxtData('sidebar-chats')
  // 如果当前正在被删除的聊天页面，跳转到 /chat
  const route = useRoute()
  if (route.params.id === id) {
    await navigateTo('/chat')
  }
}
```

- [ ] **Step 2: 更新 chatItems 显示置顶图标**

在 `chatItems` computed 中给 item 添加 icon：

```ts
const chatItems = computed(() => {
  const chats = (chatsData.value?.chats ?? []) as Chat[]
  return groupChatsByDate(chats).flatMap(group => [
    { label: group.label, type: 'label' as const },
    ...group.items.map(item => ({
      id: item.id,
      label: item.title || '加载中...',
      to: `/chat/${item.id}`,
      slot: 'chat' as const,
      icon: (item as { pinned?: boolean }).pinned ? 'i-lucide-pin' : undefined
    }))
  ])
})
```

- [ ] **Step 3: 替换 #chat-trailing 插槽**

把当前 `#chat-trailing` 的内容：

```vue
<template #chat-trailing>
  <UButton
    as="div"
    icon="i-lucide-ellipsis"
    color="neutral"
    variant="ghost"
    size="sm"
    class="rounded-[5px] hover:bg-accented/50 focus-visible:bg-accented/50"
    aria-label="更多操作"
    @click.stop.prevent
  />
</template>
```

替换为：

```vue
<template #chat-trailing="{ item }">
  <UDropdownMenu
    :items="getChatMenuItems(item as Chat)"
    :content="{ align: 'end' }"
    :ui="{ content: 'w-40' }"
  >
    <UButton
      as="div"
      icon="i-lucide-ellipsis"
      color="neutral"
      variant="ghost"
      size="sm"
      class="rounded-[5px] hover:bg-accented/50 focus-visible:bg-accented/50"
      aria-label="更多操作"
      @click.stop.prevent
    />
  </UDropdownMenu>
</template>
```

- [ ] **Step 4: 在 template 末尾（`</UDashboardGroup>` 之前）添加重命名弹窗和删除确认弹窗**

```vue
<!-- 重命名弹窗 -->
<UModal v-model:open="renameOpen" title="重命名对话">
  <template #body>
    <UInput
      v-model="renameInput"
      placeholder="输入新标题"
      autofocus
      @keyup.enter="handleRename"
    />
  </template>
  <template #footer>
    <div class="flex justify-end gap-2">
      <UButton label="取消" color="neutral" variant="ghost" @click="renameOpen = false" />
      <UButton label="确认" color="primary" @click="handleRename" />
    </div>
  </template>
</UModal>

<!-- 删除确认弹窗 -->
<UModal v-model:open="deleteOpen" title="删除对话">
  <template #body>
    <p>确定删除「<strong>{{ deleteTarget?.title || '新对话' }}</strong>」？此操作不可撤销。</p>
  </template>
  <template #footer>
    <div class="flex justify-end gap-2">
      <UButton label="取消" color="neutral" variant="ghost" @click="deleteOpen = false" />
      <UButton label="删除" color="error" @click="handleDelete" />
    </div>
  </template>
</UModal>
```

- [ ] **Step 5: 验证 lint**

```bash
npx eslint app/layouts/chat.vue --fix
```

- [ ] **Step 6: 提交**

```bash
git add app/layouts/chat.vue
git commit -m "feat: 侧边栏聊天操作菜单 — 重命名/置顶/删除"
```

---

### Task 5: 测试

**Files:**
- Create: `server/api/__test__/chats.[id].patch.test.ts`

- [ ] **Step 1: 创建测试文件**

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockDbFindFirst, mockUser, mockReadValidatedBody } from '../../utils/__test__/setup'

beforeEach(() => {
  vi.clearAllMocks()
})

function patchBody(body: { action: string; title?: string; pinned?: boolean }) {
  mockReadValidatedBody.mockImplementationOnce(
    async (_event: unknown, validateFn?: (b: unknown) => unknown) => {
      return typeof validateFn === 'function' ? validateFn(body) : body
    }
  )
}

const mockChat = {
  id: 'test-chat-id',
  userId: mockUser.id,
  title: 'Test Chat',
  model: 'deepseek-v4-pro',
  pinned: false
}

describe('PATCH /api/chats/[id]', () => {
  it('should rename a chat', async () => {
    mockDbFindFirst.mockResolvedValue(mockChat)
    patchBody({ action: 'rename', title: 'New Title' })

    const { default: handler } = await import('../chats/[id].patch')
    const event = { context: {}, path: '/api/chats/test-chat-id' } as any
    const result = await handler(event)

    expect(result).toHaveProperty('title', 'New Title')
  })

  it('should pin a chat', async () => {
    mockDbFindFirst.mockResolvedValue(mockChat)
    patchBody({ action: 'pin', pinned: true })

    const { default: handler } = await import('../chats/[id].patch')
    const event = { context: {}, path: '/api/chats/test-chat-id' } as any
    const result = await handler(event)

    expect(result).toHaveProperty('pinned', true)
  })

  it('should unpin a chat', async () => {
    mockDbFindFirst.mockResolvedValue({ ...mockChat, pinned: true })
    patchBody({ action: 'pin', pinned: false })

    const { default: handler } = await import('../chats/[id].patch')
    const event = { context: {}, path: '/api/chats/test-chat-id' } as any
    const result = await handler(event)

    expect(result).toHaveProperty('pinned', false)
  })

  it('should delete a chat', async () => {
    mockDbFindFirst.mockResolvedValue(mockChat)
    patchBody({ action: 'delete' })

    const { default: handler } = await import('../chats/[id].patch')
    const event = { context: {}, path: '/api/chats/test-chat-id' } as any
    const result = await handler(event)

    expect(result).toEqual({ deleted: true })
  })

  it('should return 404 when chat not found', async () => {
    mockDbFindFirst.mockResolvedValue(null)
    patchBody({ action: 'rename', title: 'X' })

    const { default: handler } = await import('../chats/[id].patch')
    const event = { context: {}, path: '/api/chats/nonexistent' } as any
    await expect(handler(event)).rejects.toMatchObject({ statusCode: 404 })
  })
})
```

- [ ] **Step 2: 运行测试确认通过**

```bash
npx vitest run server/api/__test__/chats.\[id\].patch.test.ts
```

- [ ] **Step 3: 提交**

```bash
git add server/api/__test__/chats.\[id\].patch.test.ts
git commit -m "test: 新增 PATCH /api/chats/[id] 测试"
```

---

### Task 6: 最终检查

- [ ] **Step 1: 运行全部测试**

```bash
npx vitest run
```

- [ ] **Step 2: Lint**

```bash
npx eslint . --fix
```

- [ ] **Step 3: Typecheck**

```bash
npx nuxi typecheck
```

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "chore: 最终检查通过"
```
