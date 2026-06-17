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
async function createChat(text: string) {
  if (!loggedIn.value) {
    await navigateTo('/login')
    return
  }
  const trimmed = text.trim()
  if (!trimmed) return

  chatBody.value = {
    message: { id: crypto.randomUUID(), role: 'user', parts: [{ type: 'text', text: trimmed }] },
    model: selectedModel.value,
    options: { thinkingMode: thinkingMode.value }
  }
  await execute()
  if (error.value) return
  if (data.value) {
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
              <template #footer>
                <div class="flex items-center gap-1 flex-wrap">
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
                </div>
                <UChatPromptSubmit
                  :status="pending ? 'submitted' : 'ready'"
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
