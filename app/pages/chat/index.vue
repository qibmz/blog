<script setup lang="ts">
definePageMeta({ layout: 'chat' })

useSeoMeta({ title: 'AI Chat' })

const input = ref('')
const chatBody = ref<Record<string, unknown> | null>(null)

const { data, pending, error, execute } = useAPI<{ id: string }>('/api/chats', {
  method: 'POST',
  body: chatBody,
  immediate: false,
  watch: false
})

const hour = new Date().getHours()
const greeting = hour < 12 ? '早上好，Master' : hour < 18 ? '下午好，Master' : '晚上好，Master'

const { loggedIn } = useUserSession()

const { model: selectedModel, models: modelOptions } = useModels()
const { thinkingMode } = useChatOptions()

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

async function createChat(text: string) {
  if (!loggedIn.value) {
    await navigateTo('/login')
    return
  }
  const trimmed = text.trim()
  const hasFiles = readyParts.value.length > 0
  if (!trimmed && !hasFiles) return

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
    options: { thinkingMode: thinkingMode.value }
  }
  await execute()
  if (error.value) return
  if (data.value) {
    clearFiles()
    refreshNuxtData('sidebar-chats')
    await navigateTo(`/chat/${data.value.id}`)
  }
}

async function onSubmit() {
  await createChat(input.value)
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

            <!-- POST 请求期间显示加载状态，避免漫长等待中用户感知不到反馈 -->
            <div
              v-if="pending"
              class="flex flex-col items-center justify-center gap-4 py-20"
            >
              <UIcon
                name="i-lucide-loader-circle"
                class="w-12 h-12 animate-spin text-primary"
              />
              <span class="text-sm text-muted">正在创建对话...</span>
            </div>

            <UChatPrompt
              v-else
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
