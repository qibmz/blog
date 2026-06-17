<script setup lang="ts">
import type { OAuthProvider } from '#auth-utils'

definePageMeta({ layout: false })

useSeoMeta({ title: '登录 - AI Chat' })

const { loggedIn, ready } = useUserSession()
const toast = useToast()
const route = useRoute()

// 等 session 就绪后再检查，避免未初始化时误判
watchEffect(() => {
  if (ready.value && loggedIn.value) {
    navigateTo('/chat', { replace: true })
  }
})

// OAuth 回调失败 — 显示错误提示
onMounted(() => {
  const error = route.query.error as string | undefined
  if (error === 'github_auth_failed') {
    toast.add({
      title: '登录失败',
      description: 'GitHub 授权失败，请重试',
      color: 'error',
      icon: 'i-lucide-alert-circle',
      duration: 5000
    })
  } else if (error === 'google_auth_failed') {
    toast.add({
      title: '登录失败',
      description: 'Google 授权失败，请重试',
      color: 'error',
      icon: 'i-lucide-alert-circle',
      duration: 5000
    })
  }
})

const router = useRouter()

function login(provider: OAuthProvider) {
  window.location.href = `/auth/${provider}`
}

function goBack() {
  // 有浏览器历史则返回上一页，无则跳首页
  if (window.history.length > 1) {
    router.back()
  } else {
    navigateTo('/')
  }
}
</script>

<template>
  <div class="relative flex min-h-screen items-center justify-center px-4 overflow-hidden">
    <!-- 背景氛围光 -->
    <div class="absolute inset-0 -z-10 flex items-center justify-center">
      <div class="w-150 h-150 rounded-full bg-linear-to-br from-primary-500/6 via-purple-500/4 to-transparent blur-3xl" />
    </div>

    <div class="flex flex-col items-center gap-8 w-full max-w-sm">
      <!-- 图标 · 渐变辉光环 -->
      <Motion
        tag="div"
        :initial="{ opacity: 0, scale: 0.9 }"
        :animate="{ opacity: 1, scale: 1 }"
        :transition="{ type: 'spring', stiffness: 250, damping: 22 }"
        class="relative"
      >
        <div class="absolute -inset-1 rounded-2xl bg-linear-to-r from-primary-500 via-purple-500 to-pink-500 opacity-60 blur-md" />
        <div class="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-white dark:bg-neutral-900 ring-1 ring-inset ring-gray-950/6 dark:ring-white/6">
          <NuxtImg
            src="/image/logo.png"
            alt="AI Chat"
            class="w-8 h-8"
          />
        </div>
      </Motion>

      <!-- 标题组 -->
      <Motion
        tag="div"
        :initial="{ opacity: 0, y: 12 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ type: 'spring', stiffness: 200, damping: 25, delay: 0.1 }"
        class="flex flex-col items-center gap-2"
      >
        <h1 class="text-2xl font-bold text-highlighted tracking-tight">
          登录 AI Chat
        </h1>
        <p class="text-sm text-muted text-center leading-relaxed max-w-56">
          登录后开始对话，每天可提问 5 次
        </p>
      </Motion>

      <!-- 登录按钮 -->
      <Motion
        tag="div"
        :initial="{ opacity: 0, y: 12 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ type: 'spring', stiffness: 200, damping: 25, delay: 0.2 }"
        class="w-full space-y-3"
      >
        <UButton
          icon="i-simple-icons-github"
          label="使用 GitHub 登录"
          color="neutral"
          variant="outline"
          size="lg"
          block
          class="transition-all duration-300 hover:-translate-y-0.5"
          @click="login('github')"
        />
        <UButton
          icon="i-simple-icons-google"
          label="使用 Google 登录"
          color="neutral"
          variant="outline"
          size="lg"
          block
          class="transition-all duration-300 hover:-translate-y-0.5"
          @click="login('google')"
        />
      </Motion>
    </div>

    <!-- 左上角返回 -->
    <Motion
      tag="div"
      :initial="{ opacity: 0 }"
      :animate="{ opacity: 1 }"
      :transition="{ delay: 0.35 }"
      class="absolute top-6 left-6"
    >
      <NuxtLink
        to="/"
        class="inline-flex items-center gap-1.5 text-xs text-muted/70 hover:text-muted transition-colors duration-200"
        @click.prevent="goBack"
      >
        <UIcon
          name="i-lucide-arrow-left"
          class="w-3.5 h-3.5"
        />
        返回
      </NuxtLink>
    </Motion>
  </div>
</template>
