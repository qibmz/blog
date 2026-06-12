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

const { data: chatsData } = await useAPI('/api/chats', {
  default: () => ({ chats: [], remainingToday: 0 }),
  ignoreResponseError: true
})

const groups = computed<CommandPaletteGroup[]>(() => {
  const chats = (chatsData.value?.chats ?? []) as ChatItem[]
  return groupChatsByDate(chats).map(group => ({
    id: group.label,
    label: group.label,
    items: group.items.map(c => ({
      id: c.id,
      label: c.title || '加载中...',
      to: `/chat/${c.id}`,
      icon: 'i-lucide-message-square',
      onSelect() { model.value = false }
    } satisfies CommandPaletteItem))
  }))
})
</script>

<template>
  <UModal v-model:open="model">
    <template #content>
      <UCommandPalette
        :groups="groups"
        placeholder="搜索对话..."
        :autofocus="true"
        :close="{ icon: 'i-lucide-x' }"
        :back="false"
        class="w-full max-w-xl"
        @update:open="model = $event"
      >
        <template #empty="{ searchTerm }">
          <span v-if="!chatsData?.chats?.length">暂无对话记录</span>
          <span v-else>未找到匹配 "{{ searchTerm }}" 的对话</span>
        </template>
      </UCommandPalette>
    </template>
  </UModal>
</template>
