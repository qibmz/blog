<script setup lang="ts">
definePageMeta({ layout: 'chat' })

useSeoMeta({ title: 'AI Chat' })

const input = ref('')

const hour = new Date().getHours()
const greeting = computed(() => {
  if (hour < 12) return '早上好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const quickSuggestions = [
  { label: '为什么选择 Nuxt UI？', icon: 'i-logos-nuxt-icon' },
  { label: '帮我创建一个 Vue composable', icon: 'i-logos-vue' },
  { label: 'Tailwind CSS 最佳实践', icon: 'i-logos-tailwindcss-icon' },
  { label: '为什么要考虑 VueUse？', icon: 'i-logos-vueuse' },
  { label: '展示一张销售数据图表', icon: 'i-lucide-line-chart' },
  { label: '帮我查询今天的天气', icon: 'i-lucide-sun' }
]

const selectedModel = ref('claude-haiku-4-5')
const modelOptions = [
  { label: 'Claude Haiku 4.5', value: 'claude-haiku-4-5' },
  { label: 'GPT-5 Nano', value: 'gpt-5-nano' },
  { label: 'Gemini 3 Flash', value: 'gemini-3-flash' }
]

function onSubmit() {
  // TODO: 创建对话并跳转
}

function onQuickChat(label: string) {
  input.value = label
  // TODO: 直接发送
}
</script>

<template>
  <UDashboardPanel
    id="home"
    class="min-h-0"
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
                  size="sm"
                  variant="ghost"
                  class="min-w-36"
                />
              </div>
              <UChatPromptSubmit
                :status="'ready'"
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
        </UContainer>
      </div>
    </template>
  </UDashboardPanel>
</template>
