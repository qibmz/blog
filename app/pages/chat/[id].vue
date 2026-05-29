<script setup lang="ts">
definePageMeta({ layout: 'chat' })

useSeoMeta({ title: '为什么选择 Nuxt UI？ — AI Chat' })

const input = ref('')
const selectedModel = ref('claude-haiku-4-5')
const modelOptions = [
  { label: 'Claude Haiku 4.5', value: 'claude-haiku-4-5' },
  { label: 'GPT-5 Nano', value: 'gpt-5-nano' },
  { label: 'Gemini 3 Flash', value: 'gemini-3-flash' }
]

type MessagePart = { type: 'text', text: string }
type Message = { id: string, role: string, parts: MessagePart[] }

const messages = ref<Message[]>([
  {
    id: 'm1',
    role: 'user',
    parts: [{ type: 'text', text: '为什么选择 Nuxt UI？' }]
  },
  {
    id: 'm2',
    role: 'assistant',
    parts: [{ type: 'text', text: 'Nuxt UI 是一个专为 Nuxt 应用设计的 UI 组件库，基于 Tailwind CSS v4 构建，提供以下核心优势：\n\n**1. 深度集成 Nuxt**\n与 Nuxt 生态无缝配合，支持自动导入、服务端渲染（SSR）和静态生成。\n\n**2. 完整的 TypeScript 支持**\n所有组件均有完整类型定义，配合 Volar 插件可获得精准的代码补全。\n\n**3. 高度可定制**\n通过 `app.config.ts` 统一配置主题颜色、变体等，无需覆盖 CSS。\n\n**4. 开箱即用的组件**\n涵盖表单、导航、反馈、布局等数十个常用组件，覆盖大多数业务场景。' }]
  },
  {
    id: 'm3',
    role: 'user',
    parts: [{ type: 'text', text: '能给我一个 UButton 的使用示例吗？' }]
  },
  {
    id: 'm4',
    role: 'assistant',
    parts: [{ type: 'text', text: '当然！以下是几种常见的 `UButton` 用法：\n\n```vue\n<template>\n  <!-- 基础按钮 -->\n  <UButton color="primary">提交</UButton>\n\n  <!-- 带图标 -->\n  <UButton icon="i-lucide-check" color="success">确认</UButton>\n\n  <!-- 加载状态 -->\n  <UButton :loading="isLoading" color="primary">保存中...</UButton>\n\n  <!-- 链接模式 -->\n  <UButton to="/about" variant="link">关于我们</UButton>\n</template>\n```\n\n你可以通过 `color`、`variant`、`size` 等属性灵活控制样式，完整属性列表请参考 [Nuxt UI 文档](https://ui.nuxt.com/components/button)。' }]
  }
])

const status = ref<'submitted' | 'streaming' | 'ready' | 'error'>('ready')

const { copy } = useClipboard()

function getTextContent(parts: MessagePart[]) {
  return parts.filter(p => p.type === 'text').map(p => p.text).join('')
}

const assistantConfig = computed(() => ({
  icon: 'i-lucide-bot',
  actions: [
    {
      label: '复制',
      icon: 'i-lucide-copy',
      onClick: (_e: MouseEvent, message: Message) => copy(getTextContent(message.parts))
    },
    { label: '赞', icon: 'i-lucide-thumbs-up' },
    { label: '踩', icon: 'i-lucide-thumbs-down' },
    { label: '重新生成', icon: 'i-lucide-refresh-cw' }
  ]
}))

function onSubmit() {
  if (!input.value.trim()) return
  // TODO: 发送消息并接收 AI 流式响应
  input.value = ''
}
</script>

<template>
  <UDashboardPanel
    id="chat"
    class="relative min-h-0"
    :ui="{ body: 'p-0 sm:p-0 overscroll-none' }"
  >
    <template #header>
      <UDashboardNavbar title="为什么选择 Nuxt UI？">
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
            :messages="messages"
            :assistant="assistantConfig"
            :status="status"
            should-auto-scroll
            class="pt-(--ui-header-height) pb-4 sm:pb-6"
          >
            <template #content="{ message }">
              <ChatMarkdown
                v-if="(message as Message).role === 'assistant'"
                :content="getTextContent((message as Message).parts)"
              />
              <span
                v-else
                class="whitespace-pre-wrap"
              >{{ getTextContent((message as Message).parts) }}</span>
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
                :status="status"
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
