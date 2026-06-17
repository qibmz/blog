<script setup lang="ts">
import type { CommandPaletteGroup, CommandPaletteItem } from '@nuxt/ui'

const model = defineModel<boolean>({ required: true })

// 与布局共用 key='sidebar-chats'，Nuxt 自动去重，不会重复请求
const { data: chatsData } = useAPI('/api/chats', {
  key: 'sidebar-chats',
  lazy: true,
  skipAuthRedirect: true,
  default: () => ({ chats: [], remainingToday: 0 }),
  ignoreResponseError: true
})
const groups = computed<CommandPaletteGroup[]>(() => {
  const chats = (chatsData.value?.chats ?? [])
  const pinned = chats.filter(c => (c as { pinned?: boolean }).pinned)
  const unpinned = chats.filter(c => !(c as { pinned?: boolean }).pinned)

  const result: CommandPaletteGroup[] = []

  // 置顶分组
  if (pinned.length > 0) {
    result.push({
      id: '置顶',
      label: '置顶',
      items: pinned.map(c => ({
        id: c.id,
        label: c.title || '加载中...',
        to: `/chat/${c.id}`,
        icon: 'i-lucide-pin',
        onSelect() { model.value = false }
      } satisfies CommandPaletteItem))
    })
  }

  // 未置顶的按日期分组
  groupChatsByDate(unpinned).forEach((group) => {
    result.push({
      id: group.label,
      label: group.label,
      items: group.items.map(c => ({
        id: c.id,
        label: c.title || '加载中...',
        to: `/chat/${c.id}`,
        icon: 'i-lucide-message-square',
        onSelect() { model.value = false }
      } satisfies CommandPaletteItem))
    })
  })

  return result
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
