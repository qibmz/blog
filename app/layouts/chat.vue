<script setup lang="ts">
const route = useRoute()

const chatSearchOpen = ref(false)

const { loggedIn, user, clear } = useUserSession()

// 使用 useLazyFetch 避免 SSR 阶段未登录时触发 401 阻塞渲染
const { data: chatsData, refresh: refreshSidebar } = useLazyFetch('/api/chats', {
  key: 'sidebar-chats',
  watch: [loggedIn, () => route.path],
  default: () => ({ chats: [], remainingToday: 0 }),
  ignoreResponseError: true
})

// 提供给子页面调用，在发送消息后刷新侧边栏数据（聊天列表 + 今日剩余次数）
provide('refreshSidebar', refreshSidebar)

type Chat = NonNullable<typeof chatsData.value>['chats'][number]

const chatItems = computed(() => {
  const chats = (chatsData.value?.chats ?? []) as Chat[]
  return groupChatsByDate(chats).flatMap(group => [
    { label: group.label, type: 'label' as const },
    ...group.items.map(item => ({
      id: item.id,
      label: item.title || '加载中...',
      to: `/chat/${item.id}`,
      slot: 'chat' as const,
      icon: undefined
    }))
  ])
})

const topItems = [
  {
    label: '回到首页',
    to: '/',
    icon: 'i-lucide-home'
  },
  {
    label: '新对话',
    to: '/chat',
    icon: 'i-lucide-circle-plus',
    kbds: ['meta', 'O']
  },
  {
    label: '搜索对话',
    icon: 'i-lucide-search',
    kbds: ['meta', 'K'],
    onClick: () => { chatSearchOpen.value = true }
  }
]

async function logout() {
  await clear()
  await navigateTo('/chat')
}
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
        <template v-if="loggedIn">
          <div
            v-if="!collapsed"
            class="flex items-center gap-2 px-1 py-1"
          >
            <UAvatar
              :src="user!.avatar"
              :alt="user!.name"
              size="xs"
            />
            <span class="text-sm text-highlighted truncate flex-1">{{ user!.name }}</span>
            <UTooltip text="退出登录">
              <UButton
                icon="i-lucide-log-out"
                color="neutral"
                variant="ghost"
                size="xs"
                aria-label="退出登录"
                @click="logout"
              />
            </UTooltip>
          </div>
          <UButton
            v-else
            :src="user!.avatar"
            icon="i-lucide-log-out"
            color="neutral"
            variant="ghost"
            size="xs"
            class="w-full"
            aria-label="退出登录"
            @click="logout"
          />
          <div
            v-if="!collapsed"
            class="px-1 pb-1 space-y-1"
          >
            <div class="flex items-center justify-between text-xs text-muted">
              <span>今日提问</span>
              <span :class="(chatsData?.remainingToday ?? 0) === 0 ? 'text-error font-semibold' : 'text-primary'">{{ chatsData?.remainingToday ?? 0 }} / 5</span>
            </div>
            <UProgress
              :value="chatsData?.remainingToday ?? 0"
              :max="5"
              size="xs"
              :color="(chatsData?.remainingToday ?? 0) === 0 ? 'error' : 'primary'"
              animated
            />
          </div>
        </template>
        <template v-else>
          <UButton
            icon="i-simple-icons-github"
            :label="collapsed ? '' : '使用 GitHub 登录'"
            color="neutral"
            variant="ghost"
            class="w-full"
            @click="loginWithGithub()"
          />
        </template>
      </template>
    </UDashboardSidebar>

    <div class="flex-1 flex m-4 lg:ml-0 rounded-lg ring ring-default bg-default/75 shadow min-w-0 overflow-hidden">
      <NuxtLoadingIndicator />
      <slot />
    </div>

    <ChatSearch v-model="chatSearchOpen" />
  </UDashboardGroup>
</template>
