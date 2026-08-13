<script setup lang="ts">
import { useChat } from '@ai-sdk/vue'
import { DefaultChatTransport, isReasoningUIPart, isTextUIPart } from 'ai'
import { isPartStreaming } from '@nuxt/ui/utils/ai'
import type { UIMessage, FileUIPart } from 'ai'
import { getProvisionalChatTitle } from '#shared/utils/chatTitle'
import { modelShowsWebSearch } from '#shared/utils/modelCapability'

definePageMeta({ layout: 'chat' })

const route = useRoute()
const id = route.params.id as string

const pendingChat = usePendingChat()
const optimistic = pendingChat.value?.id === id ? { ...pendingChat.value } : null
if (optimistic) pendingChat.value = null

const { data: chatData, refresh: refreshChat } = await useAPI(`/api/chats/${id}`, {
  key: `chat-${id}`,
  immediate: !optimistic,
  lazy: !!optimistic
})

if (optimistic) {
  chatData.value = {
    id: optimistic.id,
    title: getProvisionalChatTitle(optimistic.message.parts),
    model: optimistic.model,
    userId: null,
    pinned: false,
    createdAt: new Date().toISOString(),
    deletedAt: null,
    messages: [{
      id: optimistic.message.id,
      chatId: optimistic.id,
      role: 'user',
      parts: optimistic.message.parts as Record<string, unknown>[],
      createdAt: new Date().toISOString()
    }]
  } as typeof chatData.value
} else if (!chatData.value) {
  throw createError({ statusCode: 404 })
}

const { model: selectedModel, models: modelOptions } = useModels()
const { thinkingMode, webSearch } = useChatOptions()

// ─── 图片上传 ────────────────────────────────
const {
  previewParts,
  readyParts,
  statuses,
  errors,
  isCompressing,
  addFiles,
  removeFile,
  clearFiles
} = useChatFileUpload()

const uploadFiles = ref<File | null>(null)

function onUploadChange(file: File | null | undefined) {
  if (!currentModel.value?.supportsImages) {
    useToast().add({
      title: '当前模型不支持图片输入',
      color: 'warning',
      icon: 'i-lucide-alert-triangle',
      duration: 3000
    })
    uploadFiles.value = null
    return
  }
  if (file) {
    addFiles([file])
    nextTick(() => {
      uploadFiles.value = null
    })
  }
}

function onDrop(event: DragEvent) {
  if (!currentModel.value?.supportsImages) {
    useToast().add({
      title: '当前模型不支持图片输入',
      color: 'warning',
      icon: 'i-lucide-alert-triangle',
      duration: 3000
    })
    return
  }
  if (!event.dataTransfer?.files.length) return
  addFiles(Array.from(event.dataTransfer.files))
}

// 当前模型是否支持图片输入
const currentModel = computed(() =>
  modelOptions.value.find(m => m.value === selectedModel.value)
)

const showWebSearch = computed(() =>
  modelShowsWebSearch(currentModel.value, selectedModel.value)
)

// 仅在没有 cookie 偏好时回退到聊天记录中的模型
if (!selectedModel.value) {
  selectedModel.value = chatData.value!.model ?? modelOptions.value[0]?.value ?? ''
}

const chatTitle = ref(chatData.value!.title ?? '新对话')
// 服务器异步生成标题后，刷新数据时同步更新本地 title
watch(() => chatData.value?.title, (newTitle) => {
  if (newTitle) chatTitle.value = newTitle
})
useSeoMeta({ title: computed(() => `${chatTitle.value} — AI Chat`) })

const input = ref('')

function toggleThinkingMode() {
  thinkingMode.value = !thinkingMode.value
}

function toggleWebSearch() {
  webSearch.value = !webSearch.value
}

function getMessageSources(message: UIMessage) {
  const parts = message.parts ?? []
  for (const part of parts) {
    const p = part as {
      type: string
      sources?: Array<{
        url: string
        title?: string
        summary?: string
        siteName?: string
        publishTime?: string
        logoUrl?: string
      }>
      data?: Array<{
        url: string
        title?: string
        summary?: string
        siteName?: string
        publishTime?: string
        logoUrl?: string
      }>
    }
    // 落库格式
    if (p.type === 'sources' && Array.isArray(p.sources) && p.sources.length > 0) {
      return p.sources
    }
    // 流式 data-* 格式（结束前注入，刷新前即可显示）
    if (p.type === 'data-sources' && Array.isArray(p.data) && p.data.length > 0) {
      return p.data
    }
  }
  return []
}

const { messages, status, sendMessage, regenerate, stop } = useChat({
  id,
  messages: chatData.value!.messages as unknown as UIMessage[],
  transport: new DefaultChatTransport({
    api: `/api/chats/${id}`,
    body: () => ({
      model: selectedModel.value,
      options: {
        thinkingMode: currentModel.value?.supportsThinking === false ? false : Boolean(thinkingMode.value),
        webSearch: showWebSearch.value ? Boolean(webSearch.value) : false
      }
    })
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
  onFinish: async ({ isError }) => {
    if (isError) return
    refreshNuxtData('sidebar-chats')
    // 流已带 data-sources 时无需依赖 refresh；此处兜底同步落库后的 sources
    await syncSourcesFromServer()
  }
})

/** 按序把服务端最后一条助手消息的 sources 合并进本地 messages（id 可能不一致） */
async function syncSourcesFromServer() {
  for (let attempt = 0; attempt < 3; attempt++) {
    await refreshChat()
    const dbAssistants = (chatData.value?.messages ?? []).filter(m => m.role === 'assistant')
    const lastDb = dbAssistants.at(-1) as UIMessage | undefined
    const lastLive = messages.value.filter(m => m.role === 'assistant').at(-1)
    if (!lastDb || !lastLive) {
      await new Promise(r => setTimeout(r, 150 * (attempt + 1)))
      continue
    }
    const sources = getMessageSources(lastDb)
    if (sources.length === 0) {
      await new Promise(r => setTimeout(r, 150 * (attempt + 1)))
      continue
    }
    if (getMessageSources(lastLive).length > 0) return
    const parts = (lastLive.parts ?? []).filter(p => (p as { type: string }).type !== 'data-sources')
    lastLive.parts = [
      ...parts,
      { type: 'sources', sources } as unknown as UIMessage['parts'][number]
    ]
    messages.value = [...messages.value]
    return
  }
}

const { copy, copied } = useClipboard()
const toast = useToast()

const feedbackState = ref<Record<string, { liked?: boolean, disliked?: boolean }>>({})
const feedbackPulse = ref<Record<string, { like?: number, dislike?: number }>>({})

function getTextContent(parts: UIMessage['parts']) {
  return parts?.filter(p => p.type === 'text').map(p => (p as { type: 'text', text: string }).text).join('') ?? ''
}

function isLiked(messageId: string) {
  return !!feedbackState.value[messageId]?.liked
}

function isDisliked(messageId: string) {
  return !!feedbackState.value[messageId]?.disliked
}

async function onCopy(message: UIMessage) {
  await copy(getTextContent(message.parts))
  toast.add({
    title: copied.value ? '已复制到剪贴板' : '复制失败，请重试',
    icon: copied.value ? 'i-lucide-check' : 'i-lucide-x',
    color: copied.value ? 'success' : 'error',
    duration: 2000
  })
}

function toggleLike(message: UIMessage) {
  const fb = (feedbackState.value[message.id] ??= {})
  fb.liked = !fb.liked
  if (fb.liked) {
    fb.disliked = false
    const pulse = (feedbackPulse.value[message.id] ??= {})
    pulse.like = (pulse.like ?? 0) + 1
  }
}

function toggleDislike(message: UIMessage) {
  const fb = (feedbackState.value[message.id] ??= {})
  fb.disliked = !fb.disliked
  if (fb.disliked) {
    fb.liked = false
    const pulse = (feedbackPulse.value[message.id] ??= {})
    pulse.dislike = (pulse.dislike ?? 0) + 1
  }
}

const assistantConfig = {
  avatar: { src: '/image/logo.png' },
  variant: undefined,
  side: undefined,
  ui: undefined
}

// 乐观跳转：先落库再触发流式回复
const createBody = ref<{
  id: string
  message: UIMessage
  model: string
  options: { thinkingMode: boolean, webSearch: boolean }
} | null>(null)

const { execute: executeCreate, error: createChatError } = useAPI('/api/chats', {
  method: 'POST',
  body: createBody,
  immediate: false,
  watch: false
})

function onSubmit() {
  const hasFiles = readyParts.value.length > 0
  const hasText = input.value.trim().length > 0

  if (!hasFiles && !hasText) return
  if (isCompressing.value) return

  if (hasFiles) {
    sendMessage({
      text: hasText ? input.value : '',
      files: [...readyParts.value]
    })
  } else {
    sendMessage({ text: input.value })
  }
  input.value = ''
  clearFiles()
}

onMounted(async () => {
  if (optimistic) {
    createBody.value = {
      id: optimistic.id,
      message: optimistic.message,
      model: optimistic.model,
      options: optimistic.options
    }
    await executeCreate()
    if (createChatError.value) {
      // 回滚侧边栏乐观条目
      const sidebar = useNuxtData<{
        chats: Array<{ id: string }>
        remainingToday: number | null
        dailyLimit?: number | null
      }>('sidebar-chats')
      if (sidebar.data.value) {
        sidebar.data.value = {
          chats: sidebar.data.value.chats.filter(c => c.id !== optimistic.id),
          remainingToday: sidebar.data.value.remainingToday == null
            ? null
            : sidebar.data.value.remainingToday + 1,
          dailyLimit: sidebar.data.value.dailyLimit
        }
      }
      await navigateTo('/chat')
      return
    }
    refreshNuxtData('sidebar-chats')
    nextTick(() => sendMessage())
    return
  }

  const existing = chatData.value?.messages ?? []
  if (existing.at(-1)?.role === 'user') {
    nextTick(() => sendMessage())
  }
})
</script>

<template>
  <div
    class="flex flex-1 flex-col min-h-0 overflow-hidden"
    @dragover.prevent
    @drop.prevent="onDrop"
  >
    <UDashboardPanel
      id="chat"
      class="relative min-h-0 flex-1"
      :ui="{ body: 'p-0 sm:p-0 overscroll-none' }"
    >
      <template #header>
        <UDashboardNavbar :title="chatTitle">
          <template #right>
            <UBadge
              v-if="currentModel"
              :label="currentModel.label"
              size="sm"
              variant="subtle"
              color="neutral"
              class="hidden sm:inline-flex"
            />
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
              :messages="messages"
              :assistant="assistantConfig"
              :user="{ ui: { container: '!pb-0' } }"
              :status="status"
              :spacing-offset="160"
              auto-scroll-icon="i-lucide-chevron-down"
              :should-auto-scroll="status === 'streaming' || status === 'submitted'"
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
                      :value="part.text"
                      :streaming="isPartStreaming(part)"
                    />
                  </UChatReasoning>
                  <template v-else-if="isTextUIPart(part)">
                    <ChatComark
                      v-if="(message as UIMessage).role === 'assistant'"
                      :value="part.text"
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
                <ChatSources
                  v-if="(message as UIMessage).role === 'assistant'"
                  :sources="getMessageSources(message as UIMessage)"
                />
              </template>

              <template #actions="{ message }">
                <template v-if="(message as UIMessage).role === 'assistant'">
                  <UTooltip text="复制">
                    <UButton
                      icon="i-lucide-copy"
                      size="sm"
                      color="neutral"
                      variant="ghost"
                      aria-label="复制"
                      @click="onCopy(message as UIMessage)"
                    />
                  </UTooltip>

                  <UTooltip :text="isLiked((message as UIMessage).id) ? '取消点赞' : '点赞'">
                    <Motion
                      :key="`like-${(message as UIMessage).id}-${feedbackPulse[(message as UIMessage).id]?.like ?? 0}`"
                      :initial="{ scale: 1 }"
                      :animate="isLiked((message as UIMessage).id)
                        ? { scale: [1, 1.4, 1] }
                        : { scale: 1 }"
                      :transition="{ duration: 0.35, ease: 'easeOut' }"
                    >
                      <UButton
                        icon="i-lucide-thumbs-up"
                        size="sm"
                        :color="isLiked((message as UIMessage).id) ? 'primary' : 'neutral'"
                        :variant="isLiked((message as UIMessage).id) ? 'soft' : 'ghost'"
                        aria-label="点赞"
                        :aria-pressed="isLiked((message as UIMessage).id)"
                        @click="toggleLike(message as UIMessage)"
                      />
                    </Motion>
                  </UTooltip>

                  <UTooltip :text="isDisliked((message as UIMessage).id) ? '取消点踩' : '点踩'">
                    <Motion
                      :key="`dislike-${(message as UIMessage).id}-${feedbackPulse[(message as UIMessage).id]?.dislike ?? 0}`"
                      :initial="{ scale: 1 }"
                      :animate="isDisliked((message as UIMessage).id)
                        ? { scale: [1, 1.4, 1] }
                        : { scale: 1 }"
                      :transition="{ duration: 0.35, ease: 'easeOut' }"
                    >
                      <UButton
                        icon="i-lucide-thumbs-down"
                        size="sm"
                        :color="isDisliked((message as UIMessage).id) ? 'error' : 'neutral'"
                        :variant="isDisliked((message as UIMessage).id) ? 'soft' : 'ghost'"
                        aria-label="点踩"
                        :aria-pressed="isDisliked((message as UIMessage).id)"
                        @click="toggleDislike(message as UIMessage)"
                      />
                    </Motion>
                  </UTooltip>
                </template>
              </template>

              <template #indicator>
                <UChatShimmer text="思考中..." />
              </template>

              <template #files="{ parts: msgFileParts }">
                <ChatFileList :parts="msgFileParts as FileUIPart[]" />
              </template>
            </UChatMessages>

            <UChatPrompt
              v-model="input"
              placeholder="继续提问..."
              variant="subtle"
              class="sticky bottom-0 [view-transition-name:chat-prompt] rounded-b-none z-10"
              :ui="{ base: 'px-1.5', footer: 'flex-wrap' }"
              :disabled="isCompressing"
              @submit="onSubmit"
            >
              <template
                v-if="previewParts.length > 0"
                #header
              >
                <ChatFileList
                  :parts="previewParts"
                  :statuses="statuses"
                  :errors="errors"
                  removable
                  compact
                  @remove="removeFile"
                />
              </template>

              <template #footer>
                <div class="flex items-center gap-1.5 flex-wrap w-full">
                  <UFileUpload
                    v-if="currentModel?.supportsImages"
                    v-model="uploadFiles"
                    variant="button"
                    icon="i-lucide-paperclip"
                    accept="image/jpeg,image/png,image/gif,image/webp,image/bmp"
                    color="neutral"
                    size="sm"
                    aria-label="上传图片"
                    :preview="false"
                    @update:model-value="onUploadChange"
                  />

                  <div class="flex-1" />

                  <UButton
                    v-if="showWebSearch"
                    label="联网搜索"
                    :icon="webSearch ? 'i-lucide-globe' : 'i-lucide-globe-off'"
                    :variant="webSearch ? 'soft' : 'ghost'"
                    :color="webSearch ? 'primary' : 'neutral'"
                    size="sm"
                    @click="toggleWebSearch"
                  />
                  <UButton
                    label="深度思考"
                    icon="i-lucide-brain"
                    :variant="thinkingMode ? 'soft' : 'ghost'"
                    :color="thinkingMode ? 'primary' : 'neutral'"
                    size="sm"
                    @click="toggleThinkingMode"
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
                  <UChatPromptSubmit
                    :status="status"
                    color="neutral"
                    size="sm"
                    @stop="stop()"
                    @reload="regenerate()"
                  />
                </div>
              </template>
            </UChatPrompt>
          </UContainer>
        </div>
      </template>
    </UDashboardPanel>
  </div>
</template>
