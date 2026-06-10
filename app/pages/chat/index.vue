<script setup lang="ts">
definePageMeta({ layout: 'chat' })

useSeoMeta({ title: 'AI Chat' })

const input = ref('')
const { isLoading, execute } = useApi()

const hour = new Date().getHours()
const greeting = hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好'

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
const selectedModelIcon = computed(() => modelOptions.value.find(m => m.value === selectedModel.value)?.icon)
async function createChat(text: string) {
  if (!loggedIn.value) {
    loginWithGithub()
    return
  }
  const trimmed = text.trim()
  if (!trimmed) return

  try {
    const chat = await execute(() => $fetch<{ id: string }>('/api/chats', {
      method: 'POST',
      body: {
        message: { id: crypto.randomUUID(), role: 'user', parts: [{ type: 'text', text: trimmed }] },
        model: selectedModel.value
      }
    }))
    await navigateTo(`/chat/${chat.id}`)
  } catch {
    // toast 已由 app/plugins/api.ts 全局拦截器统一弹出
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
            <h1 class="text-3xl sm:text-4xl font-bold text-highlighted">
              {{ greeting }}
            </h1>

            <UChatPrompt
              v-model="input"
              placeholder="有什么可以帮你的？"
              :rows="3"
              :disabled="isLoading"
              class="[view-transition-name:chat-prompt]"
              @submit="onSubmit"
            >
              <template #footer>
                <div class="flex items-center gap-1">
                  <UButton
                    icon="i-lucide-paperclip"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    aria-label="上传附件"
                  />
                  <USelectMenu
                    v-model="selectedModel"
                    :items="modelOptions"
                    value-key="value"
                    :leading-icon="selectedModelIcon"
                    size="sm"
                    variant="ghost"
                    class="min-w-48"
                  />
                </div>
                <UChatPromptSubmit
                  :status="isLoading ? 'submitted' : 'ready'"
                  color="neutral"
                  size="sm"
                />
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
              <UIcon
                name="i-simple-icons-github"
                class="shrink-0"
              />
              <span>登录后即可开始对话 —</span>
              <UButton
                label="使用 GitHub 登录"
                variant="link"
                color="primary"
                size="sm"
                class="p-0"
                @click="loginWithGithub()"
              />
            </div>
          </UContainer>
        </div>
      </template>
    </UDashboardPanel>
  </div>
</template>
