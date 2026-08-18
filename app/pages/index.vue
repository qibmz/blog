<script setup lang="ts">
const { data: page } = await useAsyncData('index', () => queryCollection('index').first())

const title = page.value?.seo?.title || page.value?.title
const description = page.value?.seo?.description || page.value?.description

useSeoMeta({
  titleTemplate: '',
  title,
  ogTitle: title,
  description,
  ogDescription: description
})

// Hero 视频延迟加载与主题资源切换
const colorMode = useColorMode()
const heroMedia = {
  light: {
    video: '/video/hero-bg-light.mp4',
    poster: '/video/hero-bg-light-poster.webp',
    posterSm: '/video/hero-bg-light-poster-sm.webp'
  },
  dark: {
    video: '/video/hero-bg-dark.mp4',
    poster: '/video/hero-bg-dark-poster.webp',
    posterSm: '/video/hero-bg-dark-poster-sm.webp'
  }
} as const

const currentHeroTheme = computed(() => colorMode.value === 'dark' ? 'dark' : 'light')
const currentHeroMedia = computed(() => heroMedia[currentHeroTheme.value])
const videoRef = useTemplateRef('videoRef')
const videoReady = ref(false)
const reduceMotion = ref(false)

function loadHeroVideo() {
  if (reduceMotion.value || !videoRef.value) return

  const source = videoRef.value.querySelector('source')
  const nextVideo = currentHeroMedia.value.video

  if (!source || source.getAttribute('src') === nextVideo) return

  videoReady.value = false
  source.src = nextVideo
  videoRef.value.load()
}

onMounted(() => {
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  reduceMotion.value = motionQuery.matches

  if (!motionQuery.matches) {
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(loadHeroVideo, { timeout: 2000 })
    } else {
      setTimeout(loadHeroVideo, 200)
    }
  }
})

watch(currentHeroTheme, () => {
  videoReady.value = false
  loadHeroVideo()
})

function onVideoReady() {
  const source = videoRef.value?.querySelector('source')
  if (!source) return

  if (
    source.getAttribute('src') !== currentHeroMedia.value.video
    || !videoRef.value?.currentSrc.endsWith(currentHeroMedia.value.video)
  ) return

  videoReady.value = true
  videoRef.value?.play().catch(() => {
    // Autoplay was blocked or interrupted; poster remains visible
  })
}

const typingTexts = ['前端开发者', 'Web3 Builder', 'UniApp 跨平台']

const { data: posts } = await useAsyncData('posts', () => queryCollection('posts').all(), { default: () => [] })

const recentUpdates = computed(() =>
  [...(posts.value || [])]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .map(post => ({
      title: post.title,
      description: post.description || '',
      date: new Date(post.date).toISOString().split('T')[0],
      category: post.badge?.label || '文章',
      to: `${post.path}`
    }))
)

const featuredUpdate = computed(() => recentUpdates.value[0])
const restUpdates = computed(() => recentUpdates.value.slice(1))

const writingTopics = [
  { label: 'UniApp', description: '跨端开发与移动端踩坑', icon: 'i-lucide-smartphone' },
  { label: 'Vue / Nuxt', description: '框架实践与组件设计', icon: 'i-lucide-layers-3' },
  { label: '工程化', description: '工具链、性能与开发效率', icon: 'i-lucide-wrench' },
  { label: 'Web3', description: 'DApp、Wagmi 与 Viem', icon: 'i-lucide-blocks' }
]

const githubUrl = 'https://github.com/qibmz'
const contactEmail = (page.value as unknown as { contact?: { email?: string } })?.contact?.email || '1583326640@qq.com'

const stats = computed(() => [
  { label: '技术文章', value: String(posts.value?.length || 0), suffix: '篇' },
  { label: '深耕方向', value: '3', suffix: '年+' },
  { label: '技术栈', value: '27', suffix: '项' }
])

const exploreLinks = [
  {
    label: '备忘录',
    description: '零散的技术笔记与代码速查',
    icon: 'i-lucide-notebook-pen',
    to: '/docs',
    accent: 'text-sky-500 bg-sky-50 ring-sky-200/70 dark:text-sky-300 dark:bg-sky-500/10 dark:ring-sky-400/20',
    hoverShadow: 'hover:border-sky-300 hover:shadow-[0_0_32px_-8px_rgba(14,165,233,0.35)] dark:hover:border-sky-400/40'
  },
  {
    label: 'AI Chat',
    description: '和 AI 聊聊技术方案与思路',
    icon: 'i-lucide-bot',
    to: '/chat',
    accent: 'text-violet-500 bg-violet-50 ring-violet-200/70 dark:text-violet-300 dark:bg-violet-500/10 dark:ring-violet-400/20',
    hoverShadow: 'hover:border-violet-300 hover:shadow-[0_0_32px_-8px_rgba(139,92,246,0.35)] dark:hover:border-violet-400/40'
  },
  {
    label: 'Demos',
    description: 'K 线图、海报设计器等实验',
    icon: 'i-lucide-flask-conical',
    to: '/playground',
    accent: 'text-amber-500 bg-amber-50 ring-amber-200/70 dark:text-amber-300 dark:bg-amber-500/10 dark:ring-amber-400/20',
    hoverShadow: 'hover:border-amber-300 hover:shadow-[0_0_32px_-8px_rgba(245,158,11,0.35)] dark:hover:border-amber-400/40'
  },
  {
    label: '关于我',
    description: '工作经历与技术方向',
    icon: 'i-lucide-user-round',
    to: '/about-us',
    accent: 'text-primary-500 bg-primary-50 ring-primary-200/70 dark:text-primary-300 dark:bg-primary-500/10 dark:ring-primary-400/20',
    hoverShadow: 'hover:border-primary-300 hover:shadow-[0_0_32px_-8px_rgba(59,130,246,0.35)] dark:hover:border-primary-400/40'
  }
]
</script>

<template>
  <div
    v-if="page"
    class="relative min-h-screen bg-[#F6F8FB] text-slate-900 dark:bg-gray-950 dark:text-gray-100"
  >
    <UPageHero
      data-home-hero
      class="relative isolate -mt-(--ui-header-height) min-h-[calc(560px+var(--ui-header-height))] overflow-hidden md:min-h-[calc(600px+var(--ui-header-height))]"
      :ui="{
        container: 'min-h-[calc(560px+var(--ui-header-height))] md:min-h-[calc(600px+var(--ui-header-height))] py-0 sm:py-0 lg:py-0',
        wrapper: 'max-w-3xl mx-auto px-6 pt-[calc(var(--ui-header-height)+2.5rem)] pb-10 flex flex-col justify-center'
      }"
    >
      <template #top>
        <div class="absolute inset-0 -z-1 overflow-hidden">
          <img
            v-if="!videoReady"
            src="/video/hero-bg-light-poster.webp"
            srcset="/video/hero-bg-light-poster-sm.webp 640w, /video/hero-bg-light-poster.webp 1280w"
            sizes="100vw"
            width="1280"
            height="720"
            loading="eager"
            fetchpriority="high"
            alt=""
            aria-hidden="true"
            class="absolute inset-0 h-full w-full object-cover brightness-100 contrast-100 saturate-100 block dark:hidden"
          >
          <img
            v-if="!videoReady"
            src="/video/hero-bg-dark-poster.webp"
            srcset="/video/hero-bg-dark-poster-sm.webp 640w, /video/hero-bg-dark-poster.webp 1280w"
            sizes="100vw"
            width="1280"
            height="720"
            loading="eager"
            fetchpriority="high"
            alt=""
            aria-hidden="true"
            class="absolute inset-0 h-full w-full object-cover brightness-90 contrast-100 saturate-100 hidden dark:block"
          >
          <video
            v-show="videoReady"
            ref="videoRef"
            autoplay
            loop
            muted
            playsinline
            preload="none"
            class="absolute inset-0 h-full w-full object-cover brightness-100 contrast-100 saturate-100 dark:brightness-90 dark:contrast-100 dark:saturate-100"
            @loadeddata="onVideoReady"
          >
            <source type="video/mp4">
          </video>
          <div class="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-[#F6F8FB] dark:from-gray-950/55 dark:via-gray-950/35 dark:to-gray-950" />
        </div>
      </template>

      <template #headline>
        <Motion
          :initial="{ opacity: 0, y: 10 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.35 }"
          class="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 ring-1 ring-slate-900/10 backdrop-blur-md dark:bg-slate-950/45 dark:ring-white/20"
        >
          <span class="relative flex size-2">
            <span class="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-70 motion-reduce:animate-none" />
            <span class="relative inline-flex size-2 rounded-full bg-emerald-400" />
          </span>
          <span class="text-xs font-medium text-slate-700 dark:text-slate-100">持续更新中 · 开放技术合作</span>
        </Motion>
      </template>

      <template #title>
        <span class="block text-4xl font-bold text-slate-950 dark:text-white dark:drop-shadow-sm md:text-6xl">
          {{ page.title }}
        </span>
        <span class="mt-3 block text-2xl font-medium text-primary-300 md:text-4xl">
          <TypewriterText :texts="typingTexts" />
        </span>
      </template>

      <template #description>
        <p class="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-700 dark:text-slate-100 md:text-lg">
          {{ page.description }}
        </p>
      </template>

      <template #links>
        <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Motion
            :initial="{ opacity: 0, y: 12 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.35, delay: 0.2 }"
          >
            <UButton
              to="#recent-articles"
              size="xl"
              color="primary"
              variant="solid"
              icon="i-lucide-book-open"
              class="min-h-11 rounded-xl px-7 text-base"
            >
              阅读最新文章
            </UButton>
          </Motion>
          <Motion
            :initial="{ opacity: 0, y: 12 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.35, delay: 0.3 }"
          >
            <UButton
              to="/about-us"
              size="xl"
              color="neutral"
              variant="outline"
              icon="i-lucide-user-round"
              class="min-h-11 rounded-xl border-slate-300 bg-white/65 px-7 text-base text-slate-900 hover:bg-white/90 dark:border-white/35 dark:bg-slate-950/25 dark:text-white dark:hover:bg-slate-950/40"
            >
              关于我
            </UButton>
          </Motion>
        </div>

        <Motion
          :initial="{ opacity: 0 }"
          :animate="{ opacity: 1 }"
          :transition="{ duration: 0.35, delay: 0.4 }"
          class="mt-5 flex items-center justify-center gap-2"
        >
          <UButton
            :to="githubUrl"
            target="_blank"
            size="md"
            color="neutral"
            variant="ghost"
            icon="i-simple-icons-github"
            aria-label="GitHub"
            class="min-h-11 min-w-11 rounded-xl text-slate-800 hover:bg-white/70 dark:text-white dark:hover:bg-white/10"
          />
          <UButton
            :to="`mailto:${contactEmail}`"
            size="md"
            color="neutral"
            variant="ghost"
            icon="i-lucide-mail"
            aria-label="发送邮件"
            class="min-h-11 min-w-11 rounded-xl text-slate-800 hover:bg-white/70 dark:text-white dark:hover:bg-white/10"
          />
        </Motion>
      </template>
    </UPageHero>

    <div class="relative overflow-hidden">
      <!-- 延续 Hero 的氛围光斑，贯穿后续所有区块 -->
      <div class="pointer-events-none absolute inset-x-0 top-0 -z-1 h-[1400px] overflow-hidden">
        <div class="absolute left-1/2 top-[-10%] size-[900px] -translate-x-1/2 rounded-full bg-primary-400/10 blur-[140px] dark:bg-primary-500/15" />
        <div class="absolute -left-40 top-[420px] size-[600px] rounded-full bg-primary-300/10 blur-[120px] dark:bg-primary-400/10" />
        <div class="absolute -right-40 top-[900px] size-[700px] rounded-full bg-primary-500/10 blur-[130px] dark:bg-primary-600/10" />
      </div>

      <section
        aria-label="个人简介与数据"
        class="relative -mt-12 md:-mt-16"
      >
        <UContainer>
          <Motion
            :initial="{ opacity: 0, y: 16 }"
            :while-in-view="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.35 }"
            :viewport="{ once: true, margin: '-60px' }"
            class="relative flex flex-col items-center gap-6 overflow-hidden rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-xl shadow-slate-900/5 backdrop-blur-xl md:flex-row md:items-center md:justify-between md:p-8 dark:border-white/10 dark:bg-white/[0.05] dark:shadow-black/20"
          >
            <div
              class="pointer-events-none absolute inset-0 -z-1 opacity-[0.35] [mask-image:linear-gradient(to_bottom,black,transparent)] dark:opacity-[0.12]"
              aria-hidden="true"
              style="background-image: radial-gradient(currentColor 1px, transparent 1px); background-size: 16px 16px; color: rgb(100 116 139);"
            />
            <DecorCorners />
            <div class="flex items-center gap-4">
              <span class="relative shrink-0">
                <span class="absolute -inset-0.5 rounded-full bg-linear-to-br from-primary-400 to-primary-600 opacity-70 blur-[6px]" />
                <NuxtImg
                  src="/image/avatar.avif"
                  alt="qibmz 头像"
                  width="64"
                  height="64"
                  class="relative size-16 rounded-full object-cover ring-2 ring-white dark:ring-gray-950"
                />
                <span class="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-emerald-400 ring-2 ring-white dark:ring-gray-950">
                  <span class="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-70 motion-reduce:animate-none" />
                </span>
              </span>
              <div>
                <p class="font-mono text-xs text-primary-600 dark:text-primary-400">
                  $ whoami
                </p>
                <h2 class="mt-0.5 text-lg font-bold text-slate-950 dark:text-white">
                  qibmz · 前端开发者
                </h2>
                <p class="mt-1 max-w-xs text-sm leading-6 text-slate-600 dark:text-gray-400">
                  用代码记录踩坑，把弯路变成别人的近路
                </p>
              </div>
            </div>

            <div class="flex items-center gap-4 md:gap-6">
              <template
                v-for="(stat, index) in stats"
                :key="stat.label"
              >
                <div
                  v-if="index > 0"
                  class="h-8 w-px shrink-0 bg-slate-200 dark:bg-white/10"
                />
                <div class="text-center">
                  <p class="text-2xl font-bold text-slate-950 tabular-nums dark:text-white">
                    {{ stat.value }}<span class="text-sm font-semibold text-primary-500">{{ stat.suffix }}</span>
                  </p>
                  <p class="mt-0.5 text-xs text-slate-500 dark:text-gray-400">
                    {{ stat.label }}
                  </p>
                </div>
              </template>
            </div>
          </Motion>
        </UContainer>
      </section>

      <section
        id="recent-articles"
        aria-labelledby="recent-articles-title"
        class="relative scroll-mt-20 py-14 md:py-18"
      >
        <UContainer>
          <div class="relative mb-8 flex items-end justify-between gap-4">
            <span
              class="pointer-events-none absolute -top-6 right-0 hidden select-none font-mono text-6xl font-bold text-slate-900/[0.04] md:block dark:text-white/[0.04]"
              aria-hidden="true"
            >
              01
            </span>
            <div>
              <p class="mb-2 flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-primary-600 dark:text-primary-400">
                <span class="text-slate-400 dark:text-gray-500">//</span> 近期更新
              </p>
              <h2
                id="recent-articles-title"
                class="text-3xl font-bold text-slate-950 dark:text-white"
              >
                最新文章
              </h2>
            </div>
            <NuxtLink
              to="/blog"
              class="group inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-500 dark:text-primary-400"
            >
              查看全部文章
              <UIcon
                name="i-lucide-arrow-right"
                class="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </NuxtLink>
          </div>

          <div
            v-if="recentUpdates.length"
            class="grid gap-4 lg:grid-cols-12"
          >
            <Motion
              v-if="featuredUpdate"
              :initial="{ opacity: 0, y: 16 }"
              :while-in-view="{ opacity: 1, y: 0 }"
              :transition="{ duration: 0.3 }"
              :viewport="{ once: true, margin: '-80px' }"
              class="lg:col-span-7"
            >
              <NuxtLink
                :to="featuredUpdate.to"
                class="group relative flex h-full min-h-72 flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/70 bg-white/60 p-6 shadow-[0_1px_0_rgba(255,255,255,0.4)_inset] backdrop-blur-md transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-500 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_1px_0_rgba(255,255,255,0.06)_inset] dark:hover:border-primary-400/40 dark:hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.35)]"
              >
                <DecorCorners inset="1rem" />
                <span class="absolute -right-9 top-5 flex w-32 -rotate-45 items-center justify-center gap-1 bg-primary-500 py-1 text-[11px] font-semibold text-white shadow-md">
                  <UIcon
                    name="i-lucide-pin"
                    class="size-3"
                  />
                  精选
                </span>
                <div>
                  <div class="mb-4 flex items-center gap-2 text-xs">
                    <span class="rounded-full bg-primary-50 px-2.5 py-1 font-semibold text-primary-700 ring-1 ring-primary-200/70 dark:bg-primary-500/10 dark:text-primary-300 dark:ring-primary-400/20">
                      {{ featuredUpdate.category }}
                    </span>
                    <span class="font-medium text-slate-500 dark:text-gray-400">最新发布</span>
                  </div>
                  <h3 class="text-balance text-2xl font-bold leading-tight text-slate-950 transition-colors duration-200 group-hover:text-primary-700 dark:text-white dark:group-hover:text-primary-300">
                    {{ featuredUpdate.title }}
                  </h3>
                  <p
                    v-if="featuredUpdate.description"
                    class="mt-4 line-clamp-3 text-base leading-7 text-slate-600 dark:text-gray-400"
                  >
                    {{ featuredUpdate.description }}
                  </p>
                </div>
                <div class="mt-8 flex items-center justify-between gap-4 text-sm">
                  <span class="inline-flex items-center gap-1.5 text-slate-500 dark:text-gray-400">
                    <UIcon
                      name="i-lucide-calendar"
                      class="size-4"
                    />
                    {{ featuredUpdate.date }}
                  </span>
                  <span class="inline-flex items-center gap-1 font-semibold text-primary-600 dark:text-primary-400">
                    阅读全文
                    <UIcon
                      name="i-lucide-arrow-right"
                      class="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                    />
                  </span>
                </div>
              </NuxtLink>
            </Motion>

            <div class="grid gap-4 sm:grid-cols-2 lg:col-span-5">
              <Motion
                v-for="(update, index) in restUpdates"
                :key="update.title"
                :initial="{ opacity: 0, y: 12 }"
                :while-in-view="{ opacity: 1, y: 0 }"
                :transition="{ duration: 0.25, delay: index * 0.05 }"
                :viewport="{ once: true, margin: '-80px' }"
              >
                <NuxtLink
                  :to="update.to"
                  class="group flex h-full min-h-48 flex-col rounded-2xl border border-slate-200/70 bg-white/60 p-5 backdrop-blur-md transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-500 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-primary-400/40 dark:hover:shadow-[0_0_30px_-10px_rgba(59,130,246,0.3)]"
                >
                  <span class="mb-3 text-xs font-semibold text-primary-700 dark:text-primary-300">
                    {{ update.category }}
                  </span>
                  <h3 class="line-clamp-3 text-base font-semibold leading-snug text-slate-950 transition-colors duration-200 group-hover:text-primary-700 dark:text-white dark:group-hover:text-primary-300">
                    {{ update.title }}
                  </h3>
                  <p
                    v-if="update.description"
                    class="mt-2 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-gray-400"
                  >
                    {{ update.description }}
                  </p>
                  <span class="mt-auto inline-flex items-center gap-1.5 pt-4 text-xs text-slate-500 dark:text-gray-400">
                    <UIcon
                      name="i-lucide-calendar"
                      class="size-3.5"
                    />
                    {{ update.date }}
                  </span>
                </NuxtLink>
              </Motion>
            </div>
          </div>

          <div
            v-else
            class="rounded-2xl border border-slate-200/70 bg-white/60 py-14 text-center text-slate-600 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-400"
          >
            <UIcon
              name="i-lucide-file-text"
              class="mx-auto mb-3 size-10"
            />
            <p>暂无文章，敬请期待</p>
          </div>
        </UContainer>
      </section>

      <section
        id="writing-topics"
        aria-labelledby="writing-topics-title"
        class="relative py-12 md:py-16"
      >
        <UContainer>
          <div class="relative grid gap-8 overflow-hidden rounded-3xl border border-slate-200/70 bg-white/50 p-6 backdrop-blur-md md:p-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center dark:border-white/10 dark:bg-white/[0.03]">
            <DecorCorners />
            <UIcon
              name="i-lucide-braces"
              class="pointer-events-none absolute -bottom-8 -left-8 hidden size-40 text-slate-900/[0.03] md:block dark:text-white/[0.04]"
              aria-hidden="true"
            />
            <div>
              <p class="mb-2 flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-primary-600 dark:text-primary-400">
                <span class="text-slate-400 dark:text-gray-500">//</span> 内容方向
              </p>
              <h2
                id="writing-topics-title"
                class="text-2xl font-bold text-slate-950 dark:text-white"
              >
                我主要写这些
              </h2>
              <p class="mt-3 max-w-lg text-sm leading-6 text-slate-600 dark:text-gray-400">
                记录真实开发中遇到的问题、取舍和可以复用的解决方案。
              </p>
            </div>
            <ul class="grid gap-3 sm:grid-cols-2">
              <li
                v-for="topic in writingTopics"
                :key="topic.label"
                class="group flex items-center gap-3 rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-primary-400/40 dark:hover:shadow-[0_0_24px_-8px_rgba(59,130,246,0.35)]"
              >
                <span class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 ring-1 ring-primary-200/70 dark:bg-primary-500/10 dark:text-primary-300 dark:ring-primary-400/20">
                  <UIcon
                    :name="topic.icon"
                    class="size-5"
                  />
                </span>
                <div>
                  <h3 class="text-sm font-semibold text-slate-900 dark:text-white">
                    {{ topic.label }}
                  </h3>
                  <p class="mt-0.5 text-xs text-slate-600 dark:text-gray-400">
                    {{ topic.description }}
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </UContainer>
      </section>

      <section
        aria-labelledby="explore-title"
        class="relative py-12 md:py-16"
      >
        <UContainer>
          <div class="relative mb-7">
            <span
              class="pointer-events-none absolute -top-6 right-0 hidden select-none font-mono text-6xl font-bold text-slate-900/[0.04] md:block dark:text-white/[0.04]"
              aria-hidden="true"
            >
              02
            </span>
            <p class="mb-2 flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-primary-600 dark:text-primary-400">
              <span class="text-slate-400 dark:text-gray-500">//</span> 不止于博客
            </p>
            <h2
              id="explore-title"
              class="text-2xl font-bold text-slate-950 dark:text-white"
            >
              探索更多
            </h2>
          </div>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Motion
              v-for="(link, index) in exploreLinks"
              :key="link.label"
              :initial="{ opacity: 0, y: 12 }"
              :while-in-view="{ opacity: 1, y: 0 }"
              :transition="{ duration: 0.25, delay: index * 0.06 }"
              :viewport="{ once: true, margin: '-80px' }"
            >
              <NuxtLink
                :to="link.to"
                class="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/60 p-5 backdrop-blur-md transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-500 dark:border-white/10 dark:bg-white/[0.04]"
                :class="link.hoverShadow"
              >
                <span
                  class="pointer-events-none absolute right-3 top-3 select-none font-mono text-[11px] text-slate-400/70 dark:text-gray-500/70"
                  aria-hidden="true"
                >
                  {{ String(index + 1).padStart(2, '0') }}
                </span>
                <span
                  class="flex size-11 shrink-0 items-center justify-center rounded-xl ring-1"
                  :class="link.accent"
                >
                  <UIcon
                    :name="link.icon"
                    class="size-5"
                  />
                </span>
                <h3 class="mt-4 text-base font-semibold text-slate-950 dark:text-white">
                  {{ link.label }}
                </h3>
                <p class="mt-1.5 text-sm leading-6 text-slate-600 dark:text-gray-400">
                  {{ link.description }}
                </p>
                <UIcon
                  name="i-lucide-arrow-up-right"
                  class="mt-auto ml-auto size-4 shrink-0 pt-3 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 dark:text-gray-500"
                />
              </NuxtLink>
            </Motion>
          </div>
        </UContainer>
      </section>

      <section
        aria-labelledby="tech-stack-title"
        class="relative py-12 md:py-14"
      >
        <UContainer>
          <div class="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/40 p-6 backdrop-blur-md md:p-8 dark:border-white/10 dark:bg-white/[0.02]">
            <DecorCorners />
            <span
              class="pointer-events-none absolute -bottom-10 -right-6 hidden select-none font-mono text-7xl font-bold text-slate-900/[0.03] md:block dark:text-white/[0.04]"
              aria-hidden="true"
            >
              03
            </span>
            <div class="relative mb-7">
              <p class="mb-2 flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-primary-600 dark:text-primary-400">
                <span class="text-slate-400 dark:text-gray-500">//</span> 常用工具
              </p>
              <h2
                id="tech-stack-title"
                class="text-2xl font-bold text-slate-950 dark:text-white"
              >
                核心技术栈
              </h2>
            </div>
            <TechStack compact />
          </div>
        </UContainer>
      </section>

      <section class="relative pb-14 md:pb-18">
        <UContainer>
          <div class="relative mx-auto max-w-2xl">
            <span
              class="pointer-events-none absolute -top-8 right-2 hidden select-none font-mono text-5xl font-bold text-slate-900/[0.05] md:block dark:text-white/[0.06]"
              aria-hidden="true"
            >
              04
            </span>
          </div>
          <div class="relative mx-auto max-w-2xl overflow-hidden rounded-2xl bg-slate-950 ring-1 ring-white/10 shadow-2xl shadow-primary-900/20">
            <div class="pointer-events-none absolute inset-0 -z-1">
              <div class="absolute left-1/2 top-1/2 size-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-500/25 blur-[110px]" />
              <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_55%)]" />
              <div class="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:20px_20px] opacity-40" />
            </div>

            <!-- 终端标题栏 -->
            <div class="relative flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-3">
              <span class="size-2.5 rounded-full bg-red-400/80" />
              <span class="size-2.5 rounded-full bg-amber-400/80" />
              <span class="size-2.5 rounded-full bg-emerald-400/80" />
              <span class="ml-2 font-mono text-xs text-slate-400">contact.sh</span>
            </div>

            <div class="relative px-6 py-10 text-center md:px-12 md:py-12">
              <p class="font-mono text-xs text-primary-300">
                <span class="text-emerald-400">$</span> ./contact --me<span
                  class="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-primary-300 align-middle"
                  aria-hidden="true"
                />
              </p>
              <h2 class="mt-3 text-2xl font-bold text-white md:text-3xl">
                一起做点有意思的东西
              </h2>
              <p class="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-300">
                无论是技术交流、项目合作还是随便聊聊，欢迎通过下面的方式找到我。
              </p>
              <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
                <UButton
                  :to="`mailto:${contactEmail}`"
                  size="lg"
                  color="primary"
                  variant="solid"
                  icon="i-lucide-mail"
                  class="min-h-11 rounded-xl px-6 shadow-[0_0_30px_-8px_rgba(59,130,246,0.6)]"
                >
                  发邮件给我
                </UButton>
                <UButton
                  :to="githubUrl"
                  target="_blank"
                  size="lg"
                  color="neutral"
                  variant="outline"
                  icon="i-simple-icons-github"
                  class="min-h-11 rounded-xl border-white/20 px-6 text-white hover:bg-white/10"
                >
                  GitHub
                </UButton>
              </div>
              <p class="mt-8 font-mono text-[11px] text-slate-500">
                <span class="text-emerald-400">➜</span> 响应速度：通常 24 小时内回复
              </p>
            </div>
          </div>
        </UContainer>
      </section>
    </div>
  </div>
</template>
