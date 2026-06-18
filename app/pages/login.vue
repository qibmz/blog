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

const colorMode = useColorMode()
const router = useRouter()

function toggleColorMode() {
  colorMode.preference = colorMode.preference === 'dark' ? 'light' : 'dark'
}

function login(provider: OAuthProvider) {
  window.location.href = `/auth/${provider}`
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    navigateTo('/')
  }
}
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-neutral-950 flex flex-col lg:flex-row">
    <!--
      左侧：品牌区
      桌面端可见，占据黄金比例空间
    -->
    <aside
      class="hidden lg:flex lg:w-5/12 xl:w-2/5 bg-neutral-50 dark:bg-neutral-900 relative overflow-hidden border-r border-neutral-100 dark:border-neutral-800"
    >
      <!-- 点阵纹理 — 替代渐变光晕 -->
      <div
        class="absolute inset-0 opacity-30"
        style="background-image: radial-gradient(rgba(0,0,0,0.06) 1px, transparent 1px); background-size: 24px 24px;"
      />
      <div
        class="absolute inset-0 opacity-30 dark:opacity-40"
        style="background-image: radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px); background-size: 24px 24px;"
      />

      <!-- CSS 几何装饰 -->
      <!-- 大圆环 — 右上溢出 -->
      <div class="absolute -top-24 -right-24 w-96 h-96 rounded-full border border-neutral-200 dark:border-neutral-800 opacity-20" />
      <!-- 小圆环 — 左中 -->
      <div class="absolute top-1/3 -left-8 w-36 h-36 rounded-full border border-neutral-200 dark:border-neutral-800 opacity-25" />
      <!-- 实心圆点 -->
      <div class="absolute top-[28%] right-[15%] w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
      <div class="absolute top-[55%] right-[45%] w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
      <!-- 水平细线 -->
      <div class="absolute top-[42%] right-0 w-32 h-px bg-neutral-200 dark:bg-neutral-700" />
      <!-- 菱形 — 右下 -->
      <div class="absolute bottom-1/4 right-16 w-6 h-6 border border-neutral-200 dark:border-neutral-800 opacity-30 rotate-45" />

      <div class="relative flex flex-col justify-between p-10 xl:p-14 w-full">
        <!-- 顶部：返回 + 亮暗切换 -->
        <div class="flex items-center justify-between">
          <button
            class="inline-flex items-center gap-2 text-sm text-muted/70 hover:text-muted transition-colors duration-200 w-fit"
            @click="goBack"
          >
            <UIcon
              name="i-lucide-arrow-left"
              class="w-4 h-4"
            />
            返回
          </button>
          <button
            class="inline-flex items-center justify-center w-8 h-8 rounded-md text-muted/50 hover:text-muted hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-200"
            aria-label="切换亮暗模式"
            @click="toggleColorMode"
          >
            <UIcon
              :name="colorMode.preference === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'"
              class="w-4 h-4"
            />
          </button>
        </div>

        <!-- 中部：产品亮点 -->
        <div class="space-y-6">
          <div class="space-y-4">
            <div class="flex items-start gap-3">
              <UIcon
                name="i-lucide-brain"
                class="w-5 h-5 mt-0.5 text-muted/50 shrink-0"
              />
              <div>
                <p class="text-sm font-medium text-highlighted">
                  思考链推理
                </p>
                <p class="text-xs text-muted mt-0.5">
                  DeepSeek 模型原生支持思维链，展示 AI 的完整推理过程。
                </p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <UIcon
                name="i-lucide-zap"
                class="w-5 h-5 mt-0.5 text-muted/50 shrink-0"
              />
              <div>
                <p class="text-sm font-medium text-highlighted">
                  流式响应
                </p>
                <p class="text-xs text-muted mt-0.5">
                  实时流式输出，无需等待完整回复即可逐字阅读。
                </p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <UIcon
                name="i-lucide-message-square"
                class="w-5 h-5 mt-0.5 text-muted/50 shrink-0"
              />
              <div>
                <p class="text-sm font-medium text-highlighted">
                  多模型支持
                </p>
                <p class="text-xs text-muted mt-0.5">
                  DeepSeek + MiMo 双模型，灵活切换不同场景。
                </p>
              </div>
            </div>
          </div>

          <!-- 分隔线 -->
          <hr class="border-neutral-200 dark:border-neutral-800">
        </div>

        <!-- 底部品牌信息 -->
        <div class="space-y-5">
          <NuxtImg
            src="/image/logo.png"
            alt="AI Chat"
            class="w-10 h-10 opacity-70"
            style="filter: grayscale(1)"
          />
          <p class="text-sm text-muted leading-relaxed max-w-72">
            AI Chat — 基于 DeepSeek 与 MiMo 模型的智能对话平台，支持思考链推理与流式响应。
          </p>
        </div>
      </div>
    </aside>

    <!--
      右侧：登录区
    -->
    <main class="flex-1 flex items-start lg:items-center">
      <div class="w-full max-w-md mx-auto px-6 py-12 lg:py-0">
        <!-- 移动端：返回 + 亮暗切换 + logo -->
        <div class="lg:hidden space-y-10 mb-12">
          <div class="flex items-center justify-between">
            <button
              class="inline-flex items-center gap-2 text-sm text-muted/70 hover:text-muted transition-colors duration-200"
              @click="goBack"
            >
              <UIcon
                name="i-lucide-arrow-left"
                class="w-4 h-4"
              />
              返回
            </button>
            <button
              class="inline-flex items-center justify-center w-8 h-8 rounded-md text-muted/50 hover:text-muted hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-200"
              aria-label="切换亮暗模式"
              @click="toggleColorMode"
            >
              <UIcon
                :name="colorMode.preference === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'"
                class="w-4 h-4"
              />
            </button>
          </div>
          <NuxtImg
            src="/image/logo.png"
            alt="AI Chat"
            class="w-8 h-8 opacity-70"
            style="filter: grayscale(1)"
          />
        </div>

        <div class="space-y-10">
          <!-- 标题组 -->
          <div class="space-y-3">
            <h1 class="text-4xl lg:text-5xl font-bold tracking-tight text-highlighted">
              登录
            </h1>
            <p class="text-base text-muted leading-relaxed">
              选择以下方式继续使用 AI Chat
            </p>
          </div>

          <!-- 登录按钮 -->
          <div class="space-y-3">
            <button
              class="group relative w-full flex items-center justify-between px-5 py-4 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-200 cursor-pointer"
              @click="login('github')"
            >
              <span class="flex items-center gap-3">
                <UIcon
                  name="i-simple-icons-github"
                  class="w-5 h-5 text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-200 transition-colors duration-200"
                />
                <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition-colors duration-200">
                  GitHub
                </span>
              </span>
              <UIcon
                name="i-lucide-arrow-right"
                class="w-4 h-4 text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-500 dark:group-hover:text-neutral-400 group-hover:translate-x-0.5 transition-all duration-200"
              />
            </button>

            <button
              class="group relative w-full flex items-center justify-between px-5 py-4 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-200 cursor-pointer"
              @click="login('google')"
            >
              <span class="flex items-center gap-3">
                <UIcon
                  name="i-simple-icons-google"
                  class="w-5 h-5 text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-200 transition-colors duration-200"
                />
                <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition-colors duration-200">
                  Google
                </span>
              </span>
              <UIcon
                name="i-lucide-arrow-right"
                class="w-4 h-4 text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-500 dark:group-hover:text-neutral-400 group-hover:translate-x-0.5 transition-all duration-200"
              />
            </button>
          </div>

          <!-- 脚注 -->
          <p class="text-xs text-muted/60">
            每日可提问 <span class="text-muted font-medium">5</span> 次
          </p>
        </div>
      </div>
    </main>
  </div>
</template>
