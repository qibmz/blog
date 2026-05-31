<script setup lang="ts">
import type { CommandPaletteGroup, CommandPaletteItem } from '@nuxt/ui'

const model = defineModel<boolean>({ required: true })

interface ChatItem {
  id: string
  title: string | null
  createdAt: string
  model: string | null
  userId: string | null
}

const { data: chatsData } = await useFetch<{ chats: ChatItem[], remainingToday: number }>('/api/chats', {
  default: () => ({ chats: [], remainingToday: 0 }),
  ignoreResponseError: true
})

function groupByDate(chats: ChatItem[]): CommandPaletteGroup[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const lastWeek = new Date(today)
  lastWeek.setDate(today.getDate() - 7)

  const buckets = [
    { label: '今天', filter: (d: Date) => d >= today },
    { label: '昨天', filter: (d: Date) => d >= yesterday && d < today },
    { label: '前 7 天', filter: (d: Date) => d >= lastWeek && d < yesterday },
    { label: '更早', filter: (d: Date) => d < lastWeek }
  ]

  return buckets
    .filter(({ filter }) => chats.some(c => filter(new Date(c.createdAt))))
    .map(({ label, filter }) => ({
      id: label,
      label,
      items: chats
        .filter(c => filter(new Date(c.createdAt)))
        .map(c => ({
          id: c.id,
          label: c.title || '加载中...',
          to: `/chat/${c.id}`,
          icon: 'i-lucide-message-square',
          onSelect() { model.value = false }
        } satisfies CommandPaletteItem))
    }))
}

const groups = computed<CommandPaletteGroup[]>(() => groupByDate((chatsData.value?.chats ?? []) as ChatItem[]))
</script>

<template>
  <UModal v-model:open="model">
    <UCommandPalette
      :groups="groups"
      placeholder="搜索对话..."
      :autofocus="true"
      :close="{ icon: 'i-lucide-x' }"
      :back="false"
      class="w-full max-w-xl"
    >
      <template #empty="{ searchTerm }">
        <span v-if="!chatsData?.chats?.length">暂无对话记录</span>
        <span v-else>未找到匹配 "{{ searchTerm }}" 的对话</span>
      </template>
    </UCommandPalette>
  </UModal>
</template>
