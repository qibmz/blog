<script setup lang="ts">
const route = useRoute()

const chatSearchOpen = ref(false)

const { loggedIn, user, clear, fetch: refreshSession } = useUserSession()

// 使用 useLazyFetch 避免 SSR 阶段未登录时触发 401 阻塞渲染
const { data: chatsData, refresh: refreshSidebar } = useLazyFetch('/api/chats', {
  key: 'sidebar-chats',
  watch: [loggedIn, () => route.path],
  default: () => ({ chats: [], remainingToday: 0 }),
  ignoreResponseError: true
})

// 确保 session 同步后再拉取侧边栏数据，修复客户端首次导航到 /chat 时数据为空
onMounted(async () => {
  await refreshSession()
  await refreshSidebar()
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
        <!-- 已登录 -->
        <template v-if="loggedIn">
          <!-- 折叠 -->
          <div
            v-if="collapsed"
            class="flex flex-col items-center gap-2"
          >
            <UAvatar
              :src="user!.avatar"
              :alt="user!.name"
              size="xs"
            />
            <UButton
              icon="i-lucide-log-out"
              color="neutral"
              variant="ghost"
              size="xs"
              aria-label="退出登录"
              @click="logout"
            />
          </div>

          <!-- 展开 -->
          <div
            v-else
            class="w-full pb-1 space-y-2"
          >
            <!-- 用户行 -->
            <div class="flex items-center gap-2.5">
              <div class="relative shrink-0">
                <div class="absolute -inset-0.5 rounded-full bg-linear-to-r from-primary-500 via-purple-500 to-pink-500 opacity-40 blur-sm" />
                <UAvatar
                  :src="user!.avatar"
                  :alt="user!.name"
                  size="xs"
                  class="relative ring-2 ring-white dark:ring-neutral-900"
                />
              </div>
              <span class="text-sm font-medium text-highlighted truncate flex-1">{{ user!.name }}</span>
              <UTooltip text="退出登录">
                <UButton
                  icon="i-lucide-log-out"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  class="rounded-lg hover:bg-error/10 hover:text-error transition-colors"
                  aria-label="退出登录"
                  @click="logout"
                />
              </UTooltip>
            </div>

            <!-- 配额：分段指示器 -->
            <div class="space-y-2">
              <div class="flex gap-1">
                <div
                  v-for="i in 5"
                  :key="i"
                  class="h-1 flex-1 rounded-full transition-all duration-500"
                  :class="i <= (chatsData?.remainingToday ?? 0)
                    ? 'bg-primary-500 shadow-sm shadow-primary-500/30'
                    : 'bg-neutral-200 dark:bg-neutral-700'"
                />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-[11px] text-muted">剩余次数</span>
                <span
                  class="text-[11px] tabular-nums font-semibold"
                  :class="(chatsData?.remainingToday ?? 0) === 0 ? 'text-error' : 'text-primary'"
                >
                  {{ chatsData?.remainingToday ?? 0 }} / 5
                </span>
              </div>
            </div>
          </div>
        </template>

        <!-- 未登录 -->
        <template v-else>
          <UButton
            v-if="collapsed"
            icon="i-lucide-log-in"
            color="neutral"
            variant="ghost"
            size="sm"
            class="w-full"
            aria-label="登录"
            @click="navigateTo('/login')"
          />
          <div
            v-else
            class="w-full pb-1"
          >
            <button
              class="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-muted hover:text-highlighted hover:bg-accented/60 transition-all duration-200 group"
              @click="navigateTo('/login')"
            >
              <span class="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors shrink-0">
                <UIcon
                  name="i-lucide-log-in"
                  class="w-3.5 h-3.5"
                />
              </span>
              <span class="text-left">登录 AI Chat</span>
              <UIcon
                name="i-lucide-arrow-right"
                class="w-3.5 h-3.5 ml-auto opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-primary"
              />
            </button>
          </div>
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
