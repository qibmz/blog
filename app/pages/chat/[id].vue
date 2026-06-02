<script setup lang="ts">
import { Chat } from '@ai-sdk/vue'
import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'

definePageMeta({ layout: 'chat' })

const route = useRoute()
const id = route.params.id as string

const { data: chatData } = await useFetch(`/api/chats/${id}`)
if (!chatData.value) throw createError({ statusCode: 404 })

const { data: modelsData } = await useFetch('/api/models')

const chatTitle = ref(chatData.value.title ?? '新对话')
useSeoMeta({ title: computed(() => `${chatTitle.value} — AI Chat`) })

const selectedModel = ref(chatData.value.model ?? modelsData.value?.default ?? '')

const input = ref('')
const chat = new Chat({
  id,
  messages: chatData.value.messages as unknown as UIMessage[],
  transport: new DefaultChatTransport({
    api: `/api/chats/${id}`,
    body: () => ({ model: selectedModel.value })
  }),
  onFinish: () => {
    if (chatTitle.value === '新对话') {
      $fetch<{ title: string | null }>(`/api/chats/${id}`).then((updated) => {
        if (updated?.title) chatTitle.value = updated.title
      })
    }
  }
})

const { copy } = useClipboard()

function getTextContent(parts: UIMessage['parts']) {
  return parts?.filter(p => p.type === 'text').map(p => (p as { type: 'text', text: string }).text).join('') ?? ''
}

const assistantConfig = {
  icon: 'i-lucide-bot',
  avatar: undefined,
  variant: undefined,
  side: undefined,
  ui: undefined,
  actions: [
    {
      label: '复制',
      icon: 'i-lucide-copy',
      onClick: (_e: MouseEvent, message: UIMessage) => copy(getTextContent(message.parts))
    },
    { label: '赞', icon: 'i-lucide-thumbs-up' },
    { label: '踩', icon: 'i-lucide-thumbs-down' }
  ]
}

function onSubmit() {
  if (!input.value.trim()) return
  chat.sendMessage({ text: input.value })
  input.value = ''
}

// 从首页新建聊天跳转过来时，最后一条是用户消息且无 AI 回复，自动触发生成
// nextTick 等 View Transition 动画结束后再发请求，避免 InvalidStateError
onMounted(() => {
  const messages = chatData.value?.messages ?? []
  if (messages.at(-1)?.role === 'user') {
    nextTick(() => chat.sendMessage())
  }
})
</script>

<template>
  <UDashboardPanel
    id="chat"
    class="relative min-h-0"
    :ui="{ body: 'p-0 sm:p-0 overscroll-none' }"
  >
    <template #header>
      <UDashboardNavbar :title="chatTitle">
        <template #right>
          <UColorModeButton />
          <UButton
            to="/chat"
            icon="i-lucide-circle-plus"
            color="neutral"
            variant="ghost"
            aria-label="新对话"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-1">
        <UContainer class="flex-1 flex flex-col gap-4 sm:gap-6">
          <UChatMessages
            :messages="chat.messages"
            :assistant="assistantConfig"
            :status="chat.status"
            :should-auto-scroll="chat.status === 'streaming' || chat.status === 'submitted'"
            class="pt-(--ui-header-height) pb-4 sm:pb-6"
          >
            <template #content="{ message }">
              <ChatMarkdown
                v-if="(message as UIMessage).role === 'assistant'"
                :content="getTextContent((message as UIMessage).parts)"
              />
              <span
                v-else
                class="whitespace-pre-wrap"
              >{{ getTextContent((message as UIMessage).parts) }}</span>
            </template>

            <template #indicator>
              <UChatShimmer text="思考中..." />
            </template>
          </UChatMessages>

          <UChatPrompt
            v-model="input"
            placeholder="继续提问..."
            variant="subtle"
            class="sticky bottom-0 [view-transition-name:chat-prompt] rounded-b-none z-10"
            :ui="{ base: 'px-1.5' }"
            @submit="onSubmit"
          >
            <template #footer>
              <UButton
                icon="i-lucide-paperclip"
                color="neutral"
                variant="ghost"
                size="sm"
                aria-label="上传附件"
              />
              <UChatPromptSubmit
                :status="chat.status"
                color="neutral"
                size="sm"
              />
            </template>
          </UChatPrompt>
        </UContainer>
      </div>
    </template>
  </UDashboardPanel>
</template>
