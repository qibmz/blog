<script setup lang="ts">
import { convertFileListToFileUIParts } from 'ai'
import type { FileUIPart } from 'ai'

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

const quickSuggestions = [
  { label: '为什么选择 Nuxt UI？', icon: 'i-logos-nuxt-icon' },
  { label: '帮我创建一个 Vue composable', icon: 'i-logos-vue' },
  { label: 'Tailwind CSS 最佳实践', icon: 'i-logos-tailwindcss-icon' },
  { label: '为什么要考虑 VueUse？', icon: 'i-logos-vueuse' },
  { label: '展示一张销售数据图表', icon: 'i-lucide-line-chart' },
  { label: '帮我查询今天的天气', icon: 'i-lucide-sun' }
]

const { loggedIn } = useUserSession()

const { model: selectedModel, models: modelOptions } = useModels()
const { thinkingMode } = useChatOptions()

// ─── 图片上传状态 ────────────────────────────────
const uploadFiles = ref<File | null>(null)
const selectedFiles = ref<File[]>([])
const fileParts = ref<FileUIPart[]>([])
const converting = ref(false)

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp']
const MAX_FILE_SIZE = 5 * 1024 * 1024
const MAX_FILES = 3

async function handleFiles(incoming: File[]) {
  const list = Array.from(incoming)

  if (selectedFiles.value.length + list.length > MAX_FILES) {
    useToast().add({ title: `最多上传 ${MAX_FILES} 张图片`, color: 'warning', icon: 'i-lucide-alert-triangle', duration: 3000 })
    return
  }

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
    const dt = new DataTransfer()
    valid.forEach(f => dt.items.add(f))
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

function clearFiles() {
  selectedFiles.value = []
  fileParts.value = []
}

function removeFile(index: number) {
  selectedFiles.value.splice(index, 1)
  fileParts.value.splice(index, 1)
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
  const hasFiles = fileParts.value.length > 0
  if (!trimmed && !hasFiles) return

  chatBody.value = {
    message: {
      id: crypto.randomUUID(),
      role: 'user',
      parts: [
        ...fileParts.value,
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

function onSubmit() {
  createChat(input.value)
}

function onQuickChat(label: string) {
  createChat(label)
}
</script>

<template>
  <div class="flex flex-1 flex-col min-h-0">
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
              :disabled="pending"
              class="[view-transition-name:chat-prompt]"
              :ui="{ footer: 'flex-wrap' }"
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
                    :status="pending ? 'submitted' : 'ready'"
                    color="neutral"
                    size="sm"
                  />
                </div>
              </template>
            </UChatPrompt>

            <div class="flex flex-wrap gap-2">
              <UButton
                v-for="item in quickSuggestions"
                :key="item.label"
                :icon="item.icon"
                :label="item.label"
                size="sm"
                color="neutral"
                variant="outline"
                class="rounded-full"
                @click="onQuickChat(item.label)"
              />
            </div>

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
