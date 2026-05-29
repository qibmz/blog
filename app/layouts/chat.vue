<script setup lang="ts">
const route = useRoute()

const mockGroups = [
  {
    label: '今天',
    items: [
      { id: 'c1', title: '为什么选择 Nuxt UI？', to: '/chat/c1' },
      { id: 'c2', title: '帮我写一个 Vue composable', to: '/chat/c2' }
    ]
  },
  {
    label: '昨天',
    items: [
      { id: 'c3', title: 'TypeScript 泛型入门教程', to: '/chat/c3' },
      { id: 'c4', title: 'Tailwind CSS 响应式布局技巧', to: '/chat/c4' }
    ]
  },
  {
    label: '前 7 天',
    items: [
      { id: 'c5', title: '前端性能优化方法汇总', to: '/chat/c5' },
      { id: 'c6', title: 'Vite 构建配置与优化', to: '/chat/c6' },
      { id: 'c7', title: 'UniApp 跨端开发注意事项', to: '/chat/c7' }
    ]
  }
]

const topItems = [
  {
    label: '新对话',
    to: '/chat',
    icon: 'i-lucide-circle-plus',
    kbds: ['meta', 'O']
  },
  {
    label: '搜索对话',
    icon: 'i-lucide-search',
    kbds: ['meta', 'K']
  }
]

const chatItems = computed(() =>
  mockGroups.flatMap(group => [
    { label: group.label, type: 'label' as const },
    ...group.items.map(item => ({
      id: item.id,
      label: item.title,
      to: item.to,
      slot: 'chat' as const,
      icon: undefined,
      class: item.to === route.path ? '' : ''
    }))
  ])
)
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      collapsible
      resizable
      :min-size="12"
      class="border-r-0 py-4 dark:[--ui-bg-elevated:var(--ui-color-neutral-900)]"
    >
      <template #header="{ collapsed }">
        <NuxtLink
          v-if="!collapsed"
          to="/chat"
          class="flex items-center gap-2 font-bold text-base text-highlighted"
        >
          <UIcon
            name="i-lucide-bot"
            class="w-6 h-6 text-primary shrink-0"
          />
          <span>AI Chat</span>
        </NuxtLink>
        <UIcon
          v-else
          name="i-lucide-bot"
          class="w-6 h-6 text-primary mx-auto"
        />
        <UDashboardSidebarCollapse class="ms-auto" />
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :items="topItems"
          :collapsed="collapsed"
          orientation="vertical"
        >
          <template #item-trailing="{ item }">
            <div
              v-if="(item as typeof topItems[number]).kbds?.length"
              class="flex items-center gap-px opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <UKbd
                v-for="kbd in (item as typeof topItems[number]).kbds"
                :key="kbd"
                :value="kbd"
                size="sm"
                variant="soft"
                class="bg-accented/50"
              />
            </div>
          </template>
        </UNavigationMenu>

        <UNavigationMenu
          v-if="!collapsed"
          :items="chatItems"
          orientation="vertical"
          :ui="{
            link: 'overflow-hidden pr-7.5',
            linkTrailing: 'translate-x-full group-hover:translate-x-0 [@media(hover:none)]:translate-x-0 group-has-data-[state=open]:translate-x-0 transition-transform absolute inset-y-0 end-0 flex items-center'
          }"
        >
          <template #chat-trailing>
            <UButton
              as="div"
              icon="i-lucide-ellipsis"
              color="neutral"
              variant="ghost"
              size="sm"
              class="rounded-[5px] hover:bg-accented/50 focus-visible:bg-accented/50"
              aria-label="更多操作"
              @click.stop.prevent
            />
          </template>
        </UNavigationMenu>
      </template>

      <template #footer="{ collapsed }">
        <UButton
          icon="i-simple-icons-github"
          :label="collapsed ? '' : '使用 GitHub 登录'"
          color="neutral"
          variant="ghost"
          class="w-full"
        />
      </template>
    </UDashboardSidebar>

    <div class="flex-1 flex m-4 lg:ml-0 rounded-lg ring ring-default bg-default/75 shadow min-w-0 overflow-hidden">
      <slot />
    </div>
  </UDashboardGroup>
</template>
