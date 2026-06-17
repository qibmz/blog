<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const chatSearchOpen = ref(false)

const { loggedIn, user, clear, fetch: refreshSession } = useUserSession()

// 未登录优雅降级，不跳转 /login
const { data: chatsData, pending: sidebarLoading, refresh: refreshSidebar } = useAPI('/api/chats', {
  lazy: true,
  skipAuthRedirect: true,
  key: 'sidebar-chats',
  watch: [loggedIn],
  default: () => ({ chats: [], remainingToday: 0 }),
  ignoreResponseError: true
})

// 仅首次加载显示骨架屏，避免 refreshNuxtData 后台刷新时闪烁
const hasInitialSidebarData = ref(false)
watch(sidebarLoading, (loading) => {
  if (!loading) hasInitialSidebarData.value = true
})
const showSidebarSkeleton = computed(() => !hasInitialSidebarData.value && sidebarLoading.value)

// 确保 session 同步后再拉取侧边栏数据，修复客户端首次导航到 /chat 时数据为空
onMounted(async () => {
  await refreshSession()
  await refreshSidebar()
})

// 提供给子页面调用，在发送消息后刷新侧边栏数据（聊天列表 + 今日剩余次数）
provide('refreshSidebar', refreshSidebar)

// ─── 侧边栏操作菜单（重命名/置顶/删除）────────────────────
const renameOpen = ref(false)
const renameChat = ref<Chat | null>(null)
const renameInput = ref('')

const deleteOpen = ref(false)
const deleteTarget = ref<Chat | null>(null)

// 遵循项目规范：命令式 API 调用使用 useAPI + immediate:false + execute()
// 与 chat/index.vue 的 POST 模式保持一致
const patchId = ref('')
const patchBody = ref<PatchChatBody>({} as PatchChatBody)
const { execute: executePatch } = useAPI(
  () => `/api/chats/${patchId.value}`,
  {
    method: 'PATCH',
    body: patchBody,
    immediate: false,
    watch: false
  }
)

async function patchChat(id: string, body: PatchChatBody) {
  patchId.value = id
  patchBody.value = body
  try {
    await executePatch()
  } catch {
    // useAPI 拦截器已弹出 toast，此处仅阻止异常继续传播
    return
  }
}

function getChatMenuItems(chat: Chat): DropdownMenuItem[][] {
  const isPinned = !!(chat as { pinned?: boolean }).pinned
  return [
    [
      {
        label: '重命名',
        icon: 'i-lucide-pencil',
        onSelect() {
          renameChat.value = chat
          renameInput.value = chat.title ?? ''
          renameOpen.value = true
        }
      },
      isPinned
        ? {
            label: '取消置顶',
            icon: 'i-lucide-pin-off',
            onSelect() {
              patchChat(chat.id, { action: 'pin', pinned: false })
                .then(() => refreshNuxtData('sidebar-chats'))
                .catch(() => {}) // error handled by useAPI interceptor
            }
          }
        : {
            label: '置顶',
            icon: 'i-lucide-pin',
            onSelect() {
              patchChat(chat.id, { action: 'pin', pinned: true })
                .then(() => refreshNuxtData('sidebar-chats'))
                .catch(() => {}) // error handled by useAPI interceptor
            }
          }
    ],
    [
      {
        label: '删除',
        icon: 'i-lucide-trash-2',
        color: 'error',
        onSelect() {
          deleteTarget.value = chat
          deleteOpen.value = true
        }
      }
    ]
  ]
}

async function handleRename() {
  if (!renameChat.value || !renameInput.value.trim()) return
  await patchChat(renameChat.value.id, { action: 'rename', title: renameInput.value.trim() })
  // patchChat 内部已 catch 错误（toast 由拦截器处理），只有成功时才继续
  renameOpen.value = false
  refreshNuxtData('sidebar-chats')
}

async function handleDelete() {
  if (!deleteTarget.value) return
  const id = deleteTarget.value.id
  await patchChat(id, { action: 'delete' })
  // patchChat 内部已 catch 错误，只有成功时才继续
  deleteOpen.value = false
  refreshNuxtData('sidebar-chats')
  // 如果当前正在被删除的聊天页面，跳转到 /chat
  const route = useRoute()
  if (route.params.id === id) {
    await navigateTo('/chat')
  }
}

type Chat = NonNullable<typeof chatsData.value>['chats'][number]

const chatItems = computed(() => {
  const chats = (chatsData.value?.chats ?? []) as Chat[]
  // 分离置顶和未置顶
  const pinned = chats.filter(c => (c as { pinned?: boolean }).pinned)
  const unpinned = chats.filter(c => !(c as { pinned?: boolean }).pinned)

  interface ChatNavItem {
    id?: string
    label: string
    type: 'link' | 'label'
    to?: string
    slot?: string
    icon?: string
    chatData?: Chat
  }

  const result: ChatNavItem[] = []

  // 置顶分组（不关心日期，直接列在顶部）
  if (pinned.length > 0) {
    result.push({ label: '置顶', type: 'label' })
    pinned.forEach((item) => {
      result.push({
        id: item.id,
        label: item.title || '加载中...',
        type: 'link',
        to: `/chat/${item.id}`,
        slot: 'chat',
        icon: 'i-lucide-pin',
        chatData: item
      })
    })
  }

  // 未置顶的按日期分组
  groupChatsByDate(unpinned).forEach((group) => {
    result.push({ label: group.label, type: 'label' })
    group.items.forEach((item) => {
      result.push({
        id: item.id,
        label: item.title || '加载中...',
        type: 'link',
        to: `/chat/${item.id}`,
        slot: 'chat',
        chatData: item
      })
    })
  })

  return result
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
          <NuxtImg
            src="/image/logo.png"
            alt="AI Chat"
            class="w-6 h-6 shrink-0"
          />
          <span>AI Chat</span>
        </NuxtLink>
        <NuxtImg
          v-else
          src="/image/logo.png"
          alt="AI Chat"
          class="w-6 h-6 mx-auto"
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

        <!-- 侧边栏加载骨架屏 -->
        <div
          v-if="!collapsed && showSidebarSkeleton && loggedIn"
          class="space-y-1 mt-2"
        >
          <USkeleton class="h-3 w-10 mb-1" />
          <USkeleton
            v-for="i in 3"
            :key="i"
            class="h-8 w-full"
          />
          <USkeleton class="h-3 w-12 mb-1 mt-3" />
          <USkeleton
            v-for="i in 2"
            :key="i"
            class="h-8 w-full"
          />
        </div>

        <UNavigationMenu
          v-else-if="!collapsed"
          :items="chatItems"
          orientation="vertical"
          :ui="{
            link: 'overflow-hidden pr-7.5',
            linkTrailing: 'translate-x-full group-hover:translate-x-0 [@media(hover:none)]:translate-x-0 group-has-data-[state=open]:translate-x-0 transition-transform absolute inset-y-0 end-0 flex items-center'
          }"
        >
          <template #chat-trailing="{ item }">
            <UDropdownMenu
              :items="getChatMenuItems((item as { chatData: Chat }).chatData)"
              :content="{ align: 'end' }"
            >
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
            </UDropdownMenu>
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
              <!-- 加载骨架 -->
              <template v-if="showSidebarSkeleton">
                <div class="flex gap-1">
                  <USkeleton
                    v-for="i in 5"
                    :key="i"
                    class="h-1 flex-1 rounded-full"
                  />
                </div>
                <div class="flex items-center justify-between">
                  <USkeleton class="h-3 w-12" />
                  <USkeleton class="h-3 w-8" />
                </div>
              </template>
              <template v-else>
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
              </template>
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

    <!-- 重命名弹窗 -->
    <UModal
      v-model:open="renameOpen"
      title="重命名对话"
    >
      <template #body>
        <UInput
          v-model="renameInput"
          placeholder="输入新标题"
          autofocus
          @keyup.enter="handleRename"
        />
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            label="取消"
            color="neutral"
            variant="ghost"
            @click="renameOpen = false"
          />
          <UButton
            label="确认"
            color="primary"
            @click="handleRename"
          />
        </div>
      </template>
    </UModal>

    <!-- 删除确认弹窗 -->
    <UModal
      v-model:open="deleteOpen"
      title="删除对话"
    >
      <template #body>
        <p>确定删除「<strong>{{ deleteTarget?.title || '新对话' }}</strong>」？此操作不可撤销。</p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            label="取消"
            color="neutral"
            variant="ghost"
            @click="deleteOpen = false"
          />
          <UButton
            label="删除"
            color="error"
            @click="handleDelete"
          />
        </div>
      </template>
    </UModal>
  </UDashboardGroup>
</template>
