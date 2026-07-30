<script setup lang="ts">
import type { UIMessage } from 'ai'

definePageMeta({ layout: 'chat' })

useSeoMeta({ title: 'AI Chat' })

const input = ref('')

const hour = new Date().getHours()
const greeting = hour < 12 ? '早上好，Master' : hour < 18 ? '下午好，Master' : '晚上好，Master'

const { loggedIn } = useUserSession()

const { model: selectedModel, models: modelOptions } = useModels()
const { thinkingMode } = useChatOptions()
const pendingChat = usePendingChat()

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

const currentModel = computed(() =>
  modelOptions.value.find(m => m.value === selectedModel.value)
)

function createChat(text: string) {
  if (!loggedIn.value) {
    navigateTo('/login')
    return
  }
  const trimmed = text.trim()
  const hasFiles = readyParts.value.length > 0
  if (!trimmed && !hasFiles) return

  const chatId = crypto.randomUUID()
  const message: UIMessage = {
    id: crypto.randomUUID(),
    role: 'user',
    parts: [
      ...readyParts.value,
      ...(trimmed ? [{ type: 'text' as const, text: trimmed }] : [])
    ]
  }

  pendingChat.value = {
    id: chatId,
    message,
    model: selectedModel.value,
    options: { thinkingMode: thinkingMode.value }
  }

  // 乐观更新侧边栏，立即出现新对话
  const sidebar = useNuxtData<{ chats: Array<Record<string, unknown>>, remainingToday: number }>('sidebar-chats')
  if (sidebar.data.value) {
    sidebar.data.value = {
      chats: [
        {
          id: chatId,
          title: null,
          model: selectedModel.value,
          userId: null,
          pinned: false,
          createdAt: new Date().toISOString(),
          deletedAt: null
        },
        ...sidebar.data.value.chats
      ],
      remainingToday: Math.max(0, (sidebar.data.value.remainingToday ?? 1) - 1)
    }
  }

  clearFiles()
  input.value = ''
  navigateTo(`/chat/${chatId}`)
}

function onSubmit() {
  createChat(input.value)
}
</script>

<template>
  <div
    class="flex flex-1 flex-col min-h-0"
    @dragover.prevent
    @drop.prevent="onDrop"
  >
    <UDashboardPanel
      id="home"
      class="min-h-0 flex-1"
      :ui="{ body: 'p-0 sm:p-0' }"
    >
      <template #header>
        <UDashboardNavbar>
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
        <div class="flex flex-1 overflow-y-auto items-center justify-center">
          <UContainer class="w-full max-w-2xl py-10 flex flex-col gap-6">
            <h1 class="text-3xl sm:text-4xl font-bold text-highlighted flex items-center justify-center gap-3">
              <NuxtImg
                src="/image/logo.png"
                alt="AI Chat"
                class="w-8 h-8 sm:w-9 sm:h-9 shrink-0"
              />
              {{ greeting }}
            </h1>

            <UChatPrompt
              v-model="input"
              placeholder="有什么可以帮你的？"
              :rows="3"
              :disabled="isCompressing"
              class="[view-transition-name:chat-prompt]"
              :ui="{ footer: 'flex-wrap' }"
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
                  <UChatPromptSubmit
                    status="ready"
                    color="neutral"
                    size="sm"
                  />
                </div>
              </template>
            </UChatPrompt>

            <div
              v-if="!loggedIn"
              class="flex items-center gap-2 text-sm text-muted"
            >
              <span>登录后即可开始对话 —</span>
              <UButton
                label="立即登录"
                variant="link"
                color="primary"
                size="sm"
                class="p-0"
                @click="navigateTo('/login')"
              />
            </div>
          </UContainer>
        </div>
      </template>
    </UDashboardPanel>
  </div>
</template>
