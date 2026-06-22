<script setup lang="ts">
import { Chat } from '@ai-sdk/vue'
import { DefaultChatTransport, isReasoningUIPart, isTextUIPart, convertFileListToFileUIParts } from 'ai'
import { isPartStreaming } from '@nuxt/ui/utils/ai'
import type { UIMessage, FileUIPart } from 'ai'
import { compressImageFile } from '~/utils/compressImage'

definePageMeta({ layout: 'chat' })

const route = useRoute()
const id = route.params.id as string

const { data: chatData } = await useAPI(`/api/chats/${id}`)
if (!chatData.value) throw createError({ statusCode: 404 })
const { model: selectedModel, models: modelOptions } = useModels()
const { thinkingMode } = useChatOptions()

// ─── 图片上传状态 ────────────────────────────────
const uploadFiles = ref<File | null>(null)
const selectedFiles = ref<File[]>([])
const fileParts = ref<FileUIPart[]>([])
const converting = ref(false)

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_FILES = 3

async function handleFiles(incoming: File[]) {
  const list = Array.from(incoming)

  // 数量上限
  if (selectedFiles.value.length + list.length > MAX_FILES) {
    useToast().add({
      title: `最多上传 ${MAX_FILES} 张图片`,
      color: 'warning',
      icon: 'i-lucide-alert-triangle',
      duration: 3000
    })
    return
  }

  // 类型 + 大小校验
  const valid: File[] = []
  for (const f of list) {
    if (!ALLOWED_TYPES.includes(f.type)) {
      useToast().add({ title: `"${f.name}" 格式不支持`, description: '支持 JPEG、PNG、GIF、WebP、BMP', color: 'warning', icon: 'i-lucide-image', duration: 3000 })
      continue
    }
    if (f.size > MAX_FILE_SIZE) {
      useToast().add({ title: `"${f.name}" 过大`, description: `最大 5MB，当前 ${(f.size / 1024 / 1024).toFixed(1)}MB`, color: 'warning', icon: 'i-lucide-alert-triangle', duration: 3000 })
      continue
    }
    valid.push(f)
  }

  if (valid.length === 0) return

  converting.value = true
  try {
    // 压缩大图，减小 base64 体积加速上传
    const compressed = await Promise.all(valid.map((f: File) => compressImageFile(f)))
    const dt = new DataTransfer()
    compressed.forEach((f: File) => dt.items.add(f))
    const parts = await convertFileListToFileUIParts(dt.files)
    fileParts.value = [...fileParts.value, ...parts]
    selectedFiles.value = [...selectedFiles.value, ...valid]
  } catch (e) {
    useToast().add({ title: '图片读取失败', description: e instanceof Error ? e.message : '请重试', color: 'error', duration: 4000 })
  } finally {
    converting.value = false
  }
}

function onUploadChange(file: File | null | undefined) {
  if (file) {
    handleFiles([file])
    nextTick(() => {
      uploadFiles.value = null
    })
  }
}

function onDrop(event: DragEvent) {
  if (!event.dataTransfer?.files.length) return
  handleFiles(Array.from(event.dataTransfer.files))
}

function clearFiles() {
  selectedFiles.value = []
  fileParts.value = []
}

function removeFile(index: number) {
  selectedFiles.value.splice(index, 1)
  fileParts.value.splice(index, 1)
}

// 当前模型是否支持图片输入
const currentModel = computed(() =>
  modelOptions.value.find(m => m.value === selectedModel.value)
)

// 仅在没有 cookie 偏好时回退到聊天记录中的模型
if (!selectedModel.value) {
  selectedModel.value = chatData.value.model ?? modelOptions.value[0]?.value ?? ''
}

const chatTitle = ref(chatData.value.title ?? '新对话')
useSeoMeta({ title: computed(() => `${chatTitle.value} — AI Chat`) })

const input = ref('')

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
      refreshNuxtData('sidebar-chats')
    }
  }
})

const { copy, copied } = useClipboard()
const toast = useToast()

const feedbackState = ref<Record<string, { liked?: boolean, disliked?: boolean }>>({})

function getTextContent(parts: UIMessage['parts']) {
  return parts?.filter(p => p.type === 'text').map(p => (p as { type: 'text', text: string }).text).join('') ?? ''
}

const assistantConfig = {
  avatar: { src: '/image/logo.png' },
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
  const hasFiles = fileParts.value.length > 0
  const hasText = input.value.trim().length > 0

  if (!hasFiles && !hasText) return

  if (hasFiles) {
    chat.sendMessage({
      text: hasText ? input.value : '',
      files: [...fileParts.value]
    })
  } else {
    chat.sendMessage({ text: input.value })
  }
  input.value = ''
  clearFiles()
}

onMounted(() => {
  const messages = chatData.value?.messages ?? []
  if (messages.at(-1)?.role === 'user') {
    nextTick(() => chat.sendMessage())
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
              @submit="onSubmit"
            >
              <template
                v-if="fileParts.length > 0"
                #header
              >
                <ChatFileList
                  :parts="fileParts"
                  removable
                  @remove="removeFile"
                />
              </template>

              <template #footer>
                <div class="flex items-center gap-1.5 flex-wrap w-full">
                  <UFileUpload
                    v-if="currentModel?.supportsImages"
                    v-model="uploadFiles"
                    variant="button"
                    :icon="converting ? 'i-lucide-loader-2' : 'i-lucide-paperclip'"
                    accept="image/jpeg,image/png,image/gif,image/webp,image/bmp"
                    :disabled="converting"
                    color="neutral"
                    size="sm"
                    aria-label="上传图片"
                    @update:model-value="onUploadChange"
                  />

                  <div class="flex-1" />

                  <UButton
                    label="深度思考"
                    icon="i-lucide-brain"
                    :variant="thinkingMode ? 'soft' : 'ghost'"
                    :color="thinkingMode ? 'primary' : 'neutral'"
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
                </div>
              </template>
            </UChatPrompt>
          </UContainer>
        </div>
      </template>
    </UDashboardPanel>
  </div>
</template>
