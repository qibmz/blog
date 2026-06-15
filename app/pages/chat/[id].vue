<script setup lang="ts">
import { Chat } from '@ai-sdk/vue'
import { DefaultChatTransport, isReasoningUIPart, isTextUIPart } from 'ai'
import { isPartStreaming } from '@nuxt/ui/utils/ai'
import type { UIMessage } from 'ai'

definePageMeta({ layout: 'chat' })

const route = useRoute()
const id = route.params.id as string

const { data: chatData } = await useAPI(`/api/chats/${id}`)
if (!chatData.value) throw createError({ statusCode: 404 })
const { model: selectedModel, models: modelOptions } = useModels()
const { thinkingMode } = useChatOptions()
// 仅在没有 cookie 偏好时回退到聊天记录中的模型
if (!selectedModel.value) {
  selectedModel.value = chatData.value.model ?? modelOptions.value[0]?.value ?? ''
}

const chatTitle = ref(chatData.value.title ?? '新对话')
useSeoMeta({ title: computed(() => `${chatTitle.value} — AI Chat`) })

const input = ref('')

// refreshNuxtData('sidebar-chats') 直接刷新布局中的侧边栏数据
// 服务端 onFinish 在流结束前已完成 DB 写入，客户端 onFinish 触发时数据已就绪

const chat = new Chat({
  id,
  messages: chatData.value.messages as unknown as UIMessage[],
  transport: new DefaultChatTransport({
    api: `/api/chats/${id}`,
    body: () => ({ model: selectedModel.value, options: { thinkingMode: thinkingMode.value } })
  }),
  onError: (err) => {
    const msg = normalizeError(err)
    useToast().add({
      title: '发送失败',
      description: msg,
      color: 'error',
      icon: 'i-lucide-alert-circle',
      duration: 6000
    })
  },
  onFinish: ({ isError }) => {
    if (!isError) {
      // 服务端 onFinish 在流结束前已完成 DB 写入，无需延迟等待
      refreshNuxtData('sidebar-chats')
    }
  }
})

const { copy, copied } = useClipboard()
const toast = useToast()

// 每条消息的反馈状态（赞/踩互斥）
const feedbackState = ref<Record<string, { liked?: boolean, disliked?: boolean }>>({})

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
      onClick: async (_e: MouseEvent, message: UIMessage) => {
        await copy(getTextContent(message.parts))
        toast.add({
          title: copied.value ? '已复制到剪贴板' : '复制失败，请重试',
          icon: copied.value ? 'i-lucide-check' : 'i-lucide-x',
          color: copied.value ? 'success' : 'error',
          duration: 2000
        })
      }
    },
    {
      label: '赞',
      icon: 'i-lucide-thumbs-up',
      onClick: (_e: MouseEvent, message: UIMessage) => {
        const fb = (feedbackState.value[message.id] ??= {})
        fb.liked = !fb.liked
        if (fb.liked) fb.disliked = false
        toast.add({
          title: fb.liked ? '已点赞' : '已取消点赞',
          duration: 1500
        })
      }
    },
    {
      label: '踩',
      icon: 'i-lucide-thumbs-down',
      onClick: (_e: MouseEvent, message: UIMessage) => {
        const fb = (feedbackState.value[message.id] ??= {})
        fb.disliked = !fb.disliked
        if (fb.disliked) fb.liked = false
        toast.add({
          title: fb.disliked ? '已点踩' : '已取消点踩',
          duration: 1500
        })
      }
    }
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
  <div class="flex flex-1 flex-col min-h-0">
    <UDashboardPanel
      id="chat"
      class="relative min-h-0 flex-1"
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
              :spacing-offset="160"
              auto-scroll-icon="i-lucide-chevron-down"
              :should-auto-scroll="chat.status === 'streaming' || chat.status === 'submitted'"
              class="pt-(--ui-header-height) pb-4 sm:pb-6"
            >
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
                  :label="'思考'"
                  :icon="thinkingMode ? 'i-lucide-brain' : 'i-lucide-brain-off'"
                  :variant="thinkingMode ? 'soft' : 'outline'"
                  color="primary"
                  size="sm"
                  @click="thinkingMode = !thinkingMode"
                />
                <UChatPromptSubmit
                  :status="chat.status"
                  color="neutral"
                  size="sm"
                  @stop="chat.stop()"
                  @reload="chat.regenerate()"
                />
              </template>
            </UChatPrompt>
          </UContainer>
        </div>
      </template>
    </UDashboardPanel>
  </div>
</template>
