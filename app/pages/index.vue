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

// ========== Hero 视频延迟加载 ==========
const videoRef = ref<HTMLVideoElement | null>(null)
const videoReady = ref(false)
onMounted(() => {
  // 检测用户动效偏好
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

  // 不使用动效的用户才加载视频
  if (!motionQuery.matches) {
    // 延迟加载视频，不阻塞 LCP
    const loadVideo = () => {
      if (videoRef.value) {
        // 动态设置 src 触发加载
        const source = videoRef.value.querySelector('source')
        if (source && !source.src) {
          source.src = '/video/hero-bg.mp4'
          videoRef.value.load()
        }
      }
    }

    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(loadVideo, { timeout: 2000 })
    } else {
      setTimeout(loadVideo, 200)
    }
  }
})

function onVideoReady() {
  videoReady.value = true
  videoRef.value?.play().catch(() => {
    // Autoplay was blocked or interrupted; poster remains visible
  })
}

// 打字机标签
const typingTexts = ['前端开发者', 'Web3 Builder', 'UniApp 跨平台']

// 统计数据
const stats = [
  { label: '开发经验', value: '3年', numericValue: '3', suffix: '年', icon: 'i-lucide-calendar', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { label: '技术文章', value: '10+', numericValue: '10+', suffix: '', icon: 'i-lucide-file-text', color: 'text-green-500', bg: 'bg-green-500/10' },
  { label: '项目经验', value: '15+', numericValue: '15+', suffix: '', icon: 'i-lucide-folder', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { label: '持续学习', value: '每天', numericValue: null, suffix: '', icon: 'i-lucide-book-open', color: 'text-orange-500', bg: 'bg-orange-500/10' }
]

// 最新动态
const { data: posts } = await useAsyncData('posts', () => queryCollection('posts').all())

// 分类竖线颜色映射（最新动态卡片左侧竖线）
const categoryColorMap: Record<string, string> = {
  blog: 'bg-blue-500 dark:bg-blue-400',
  web3: 'bg-purple-500 dark:bg-purple-400',
  frontend: 'bg-green-500 dark:bg-green-400',
  default: 'bg-gray-400 dark:bg-gray-500'
}

const getCategoryColor = (category: string) => categoryColorMap[category] ?? categoryColorMap.default

const recentUpdates = computed(() =>
  (posts.value || [])
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3)
    .map(post => ({
      title: post.title,
      description: post.description || '',
      date: new Date(post.date).toISOString().split('T')[0],
      category: post.badge.label || 'blog',
      tags: [] as string[],
      to: `${post.path}`
    }))
)

// 最新动态：首篇作为特色大卡，其余作为紧凑小卡（bento 布局）
const featuredUpdate = computed(() => recentUpdates.value[0])
const restUpdates = computed(() => recentUpdates.value.slice(1))

// 联系方式（用于 Hero 社交链接与收尾 CTA）
const githubUrl = 'https://github.com/qibmz'
const contactEmail = (page.value as unknown as { contact?: { email?: string } })?.contact?.email || '1583326640@qq.com'

// 技能亮点
const highlights = [
  { title: '跨平台应用', description: 'UniApp 跨平台开发经验，覆盖微信/H5/App', icon: 'i-lucide-smartphone', gradient: 'from-green-500 to-emerald-500' },
  { title: '区块链开发', description: 'Web3、DApp 去中心化应用，Wagmi/Viem', icon: 'i-lucide-blocks', gradient: 'from-purple-500 to-pink-500' },
  { title: '性能优化', description: '前端性能调优与最佳实践，Lighthouse 满分', icon: 'i-lucide-zap', gradient: 'from-yellow-500 to-orange-500' },
  { title: '现代化工具', description: 'Vue 3 / Nuxt 4 生态，完整工程化体系', icon: 'i-lucide-wrench', gradient: 'from-blue-500 to-indigo-500' }
]
</script>

<template>
  <div
    v-if="page"
    class="relative min-h-screen"
  >
    <!-- ========== HERO ========== -->
    <UPageHero
      class="relative"
      :ui="{
        wrapper: 'max-w-3xl mx-auto px-6 py-16 md:py-24'
      }"
    >
      <template #top>
        <!-- 视频背景：poster 静态图先展示，视频延迟加载 -->
        <div class="absolute inset-0 overflow-hidden -z-1">
          <!-- Poster 静态图：页面加载时立即渲染，LCP 走文本而非视频 -->
          <img
            v-if="!videoReady"
            src="/video/hero-bg-poster.webp"
            srcset="/video/hero-bg-poster-sm.webp 640w, /video/hero-bg-poster.webp 1280w"
            sizes="100vw"
            width="1280"
            height="720"
            loading="eager"
            fetchpriority="high"
            alt=""
            class="absolute inset-0 w-full h-full object-cover brightness-110 contrast-90 saturate-75 dark:brightness-100 dark:contrast-100 dark:saturate-100"
          >
          <!-- 视频：页面可交互后延迟加载；prefers-reduced-motion 用户永不加载 -->
          <video
            v-show="videoReady"
            ref="videoRef"
            autoplay
            loop
            muted
            playsinline
            preload="none"
            class="absolute inset-0 w-full h-full object-cover brightness-110 contrast-90 saturate-75 dark:brightness-100 dark:contrast-100 dark:saturate-100"
            @loadeddata="onVideoReady"
          >
            <source
              type="video/mp4"
            >
          </video>
          <!-- light 模式：白色叠加层洗淡视频；dark 模式：保持原有暗色叠加 -->
          <div class="absolute inset-0 bg-linear-to-b from-white/70 via-white/45 to-white dark:from-gray-900/30 dark:via-gray-900/20 dark:to-gray-950" />
        </div>
      </template>

      <template #headline>
        <Motion
          :initial="{ opacity: 0, y: 12 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.4 }"
          class="inline-flex items-center gap-2 rounded-full bg-white dark:bg-white/5 backdrop-blur px-4 py-1.5 ring-1 ring-gray-300 dark:ring-white/10 shadow-sm"
        >
          <span class="relative flex h-2 w-2">
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
            <span class="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          <span class="text-xs font-medium text-gray-700 dark:text-gray-300">持续更新中 · 开放技术合作</span>
        </Motion>
      </template>

      <template #title>
        <span class="block text-4xl md:text-6xl font-bold text-gray-900 dark:text-white">{{ page.title }}</span>
        <span class="block text-2xl md:text-4xl font-medium text-gray-600 dark:text-gray-400 mt-3">
          <TypewriterText :texts="typingTexts" />
        </span>
      </template>

      <template #description>
        <p class="text-lg md:text-xl text-gray-700 dark:text-gray-400 max-w-xl mx-auto leading-relaxed mt-4">
          {{ page.description }}
        </p>
      </template>

      <template #links>
        <div class="flex flex-wrap items-center justify-center gap-4 mt-6">
          <Motion
            :initial="{ opacity: 0, y: 15 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.4, delay: 0.3 }"
          >
            <UButton
              to="/about-us"
              size="xl"
              color="primary"
              variant="solid"
              icon="i-lucide-user-round"
              class="rounded-xl px-8 text-base"
            >
              关于我
            </UButton>
          </Motion>
          <Motion
            :initial="{ opacity: 0, y: 15 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.4, delay: 0.45 }"
          >
            <UButton
              to="/blog"
              size="xl"
              color="primary"
              variant="outline"
              icon="i-lucide-pencil-line"
              class="rounded-xl px-8 text-base"
            >
              博客
            </UButton>
          </Motion>
        </div>

        <Motion
          :initial="{ opacity: 0 }"
          :animate="{ opacity: 1 }"
          :transition="{ duration: 0.4, delay: 0.6 }"
          class="flex items-center justify-center gap-2 mt-6"
        >
          <UButton
            :to="githubUrl"
            target="_blank"
            size="lg"
            color="neutral"
            variant="outline"
            icon="i-simple-icons-github"
            square
            aria-label="GitHub"
            class="rounded-xl bg-white dark:bg-transparent"
          />
          <UButton
            :to="`mailto:${contactEmail}`"
            size="lg"
            color="neutral"
            variant="outline"
            icon="i-lucide-mail"
            square
            aria-label="发送邮件"
            class="rounded-xl bg-white dark:bg-transparent"
          />
          <UButton
            to="/blog"
            size="lg"
            color="neutral"
            variant="outline"
            icon="i-lucide-rss"
            square
            aria-label="订阅博客"
            class="rounded-xl bg-white dark:bg-transparent"
          />
        </Motion>
      </template>
    </UPageHero>

    <!-- ========== 统计数据区域 ========== -->
    <div class="bg-gray-50/80 dark:bg-gray-950/60 border-y border-gray-200 dark:border-gray-800">
      <UContainer>
        <div class="py-10">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <Motion
              v-for="(stat, i) in stats"
              :key="stat.label"
              :initial="{ opacity: 0, y: 30 }"
              :while-in-view="{ opacity: 1, y: 0 }"
              :transition="{ type: 'spring', stiffness: 300, damping: 35, delay: i * 0.1 }"
              :viewport="{ once: true, margin: '-80px' }"
              :while-hover="{ scale: 1.03 }"
              class="group relative bg-white dark:bg-gray-900 rounded-2xl p-6 text-center ring-1 ring-gray-200 dark:ring-gray-800"
            >
              <div class="flex flex-col items-center gap-3">
                <div :class="`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`">
                  <UIcon
                    :name="stat.icon"
                    :class="`w-6 h-6 ${stat.color}`"
                  />
                </div>
                <div>
                  <div class="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">
                    <CountUp
                      v-if="stat.numericValue"
                      :value="stat.numericValue"
                      :duration="1200"
                    />
                    <span v-else>{{ stat.value }}</span>
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
                    {{ stat.label }}
                  </div>
                </div>
              </div>
            </Motion>
          </div>
        </div>
      </UContainer>
    </div>

    <UContainer>
      <!-- ========== 技能亮点区域 ========== -->
      <div class="py-16">
        <div class="text-center mb-10">
          <span class="inline-block text-xs font-semibold uppercase tracking-widest text-primary-500 mb-2">核心能力</span>
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
            技术专长
          </h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <Motion
            v-for="(highlight, i) in highlights"
            :key="highlight.title"
            :initial="{ opacity: 0, y: 30 }"
            :while-in-view="{ opacity: 1, y: 0 }"
            :transition="{ type: 'spring', stiffness: 300, damping: 35, delay: i * 0.1 }"
            :viewport="{ once: true, margin: '-80px' }"
            :while-hover="{ scale: 1.03 }"
            class="group relative overflow-hidden bg-white dark:bg-gray-900 rounded-2xl p-6 ring-1 ring-gray-200 dark:ring-gray-800"
          >
            <div
              :class="`absolute inset-0 bg-linear-to-br ${highlight.gradient} opacity-0 group-hover:opacity-8 dark:group-hover:opacity-15 transition-opacity duration-300`"
            />
            <div class="relative flex flex-col items-center text-center gap-4">
              <div
                :class="`w-14 h-14 rounded-xl bg-linear-to-br ${highlight.gradient} p-0.5 group-hover:scale-110 transition-all duration-300 shadow-lg`"
              >
                <div class="w-full h-full bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center">
                  <UIcon
                    :name="highlight.icon"
                    class="w-7 h-7"
                  />
                </div>
              </div>
              <div>
                <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-1.5">
                  {{ highlight.title }}
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {{ highlight.description }}
                </p>
              </div>
            </div>
          </Motion>
        </div>
      </div>
    </UContainer>

    <!-- ========== 技术栈区域（交替背景） ========== -->
    <div class="bg-gray-50/80 dark:bg-gray-950/60 border-y border-gray-200 dark:border-gray-800">
      <UContainer>
        <Motion
          :initial="{ opacity: 0, y: 20 }"
          :while-in-view="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.5 }"
          :viewport="{ once: true, margin: '-60px' }"
        >
          <div class="py-16">
            <div class="text-center mb-10">
              <span class="inline-block text-xs font-semibold uppercase tracking-widest text-primary-500 mb-2">工具 & 框架</span>
              <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
                技术栈
              </h2>
            </div>
            <TechStack />
          </div>
        </Motion>
      </UContainer>
    </div>

    <UContainer>
      <!-- ========== 最新动态区域 ========== -->
      <div class="py-16">
        <div class="flex items-end justify-between mb-10">
          <div>
            <span class="inline-block text-xs font-semibold uppercase tracking-widest text-primary-500 mb-2">近期更新</span>
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
              最新动态
            </h2>
          </div>
          <NuxtLink
            to="/blog"
            class="flex items-center gap-1.5 text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors group"
          >
            查看全部
            <UIcon
              name="i-lucide-arrow-right"
              class="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200"
            />
          </NuxtLink>
        </div>

        <div
          v-if="recentUpdates.length"
          class="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          <!-- 特色大卡：最新一篇 -->
          <Motion
            v-if="featuredUpdate"
            :initial="{ opacity: 0, y: 24 }"
            :while-in-view="{ opacity: 1, y: 0 }"
            :transition="{ type: 'tween', duration: 0.4, ease: 'easeOut' }"
            :viewport="{ once: true, margin: '-80px' }"
            class="md:col-span-2"
          >
            <NuxtLink
              :to="featuredUpdate.to"
              class="group relative flex flex-col justify-between overflow-hidden bg-white dark:bg-gray-900 rounded-2xl p-7 ring-1 ring-gray-200 dark:ring-gray-800 h-full min-h-56 transition-shadow duration-300 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-black/30"
            >
              <!-- 装饰性顶部渐变条 -->
              <div
                :class="`absolute inset-x-0 top-0 h-1 ${getCategoryColor(featuredUpdate.category)}`"
              />
              <div class="flex flex-col gap-3">
                <div class="flex items-center gap-2">
                  <span class="inline-flex items-center rounded-full bg-primary-500/10 px-2.5 py-1 text-xs font-semibold text-primary-500">
                    {{ featuredUpdate.category }}
                  </span>
                  <span class="text-xs font-medium text-gray-400 dark:text-gray-500">最新发布</span>
                </div>
                <h3 class="text-xl md:text-2xl font-bold text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors duration-200 line-clamp-2 leading-snug text-balance">
                  {{ featuredUpdate.title }}
                </h3>
                <p
                  v-if="featuredUpdate.description"
                  class="text-sm md:text-base text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed"
                >
                  {{ featuredUpdate.description }}
                </p>
              </div>
              <div class="flex items-center justify-between mt-6">
                <div class="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                  <UIcon
                    name="i-lucide-calendar"
                    class="w-3.5 h-3.5"
                  />
                  {{ featuredUpdate.date }}
                </div>
                <span class="flex items-center gap-1 text-sm font-medium text-primary-500">
                  阅读全文
                  <UIcon
                    name="i-lucide-arrow-right"
                    class="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200"
                  />
                </span>
              </div>
            </NuxtLink>
          </Motion>

          <!-- 右侧：其余紧凑小卡 -->
          <div class="flex flex-col gap-5">
            <Motion
              v-for="(update, i) in restUpdates"
              :key="update.title"
              :initial="{ opacity: 0, y: 24 }"
              :while-in-view="{ opacity: 1, y: 0 }"
              :transition="{ type: 'tween', duration: 0.4, ease: 'easeOut', delay: (i + 1) * 0.1 }"
              :viewport="{ once: true, margin: '-80px' }"
              class="flex-1"
            >
              <NuxtLink
                :to="update.to"
                class="group flex gap-4 bg-white dark:bg-gray-900 rounded-2xl p-5 ring-1 ring-gray-200 dark:ring-gray-800 h-full transition-shadow duration-300 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/30"
              >
                <!-- 左侧分类竖线 -->
                <div
                  :class="`shrink-0 w-0.5 rounded-full transition-all duration-300 bg-gray-300 dark:bg-gray-600 group-hover:w-1 ${getCategoryColor(update.category)}`"
                />

                <div class="flex flex-col gap-2 min-w-0">
                  <!-- 标题 -->
                  <h3 class="font-semibold text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors duration-200 line-clamp-2 leading-snug text-[15px]">
                    {{ update.title }}
                  </h3>

                  <!-- 摘要 -->
                  <p
                    v-if="update.description"
                    class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed"
                  >
                    {{ update.description }}
                  </p>

                  <!-- 日期 -->
                  <div class="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mt-auto pt-1">
                    <UIcon
                      name="i-lucide-calendar"
                      class="w-3.5 h-3.5"
                    />
                    {{ update.date }}
                  </div>
                </div>
              </NuxtLink>
            </Motion>
          </div>
        </div>

        <!-- 空状态 -->
        <div
          v-else
          class="text-center py-16 text-gray-400 dark:text-gray-600"
        >
          <UIcon
            name="i-lucide-file-text"
            class="w-12 h-12 mx-auto mb-3 opacity-40"
          />
          <p>暂无文章，敬请期待</p>
        </div>
      </div>
    </UContainer>

    <!-- ========== 收尾 CTA 区域 ========== -->
    <div class="bg-gray-50/80 dark:bg-gray-950/60 border-t border-gray-200 dark:border-gray-800">
      <UContainer>
        <div class="py-16">
          <Motion
            :initial="{ opacity: 0, y: 24 }"
            :while-in-view="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.5 }"
            :viewport="{ once: true, margin: '-80px' }"
            class="relative overflow-hidden rounded-3xl bg-gray-900 dark:bg-gray-900 px-6 py-14 md:px-16 md:py-16 text-center ring-1 ring-gray-800"
          >
            <!-- 装饰渐变光晕 -->
            <div class="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-primary-500/20 blur-3xl" />
            <div class="relative flex flex-col items-center gap-5">
              <span class="inline-block text-xs font-semibold uppercase tracking-widest text-primary-400">保持联系</span>
              <h2 class="text-2xl md:text-4xl font-bold text-white text-balance max-w-xl">
                一起做点有意思的东西
              </h2>
              <p class="text-base text-gray-400 max-w-md leading-relaxed text-pretty">
                无论是技术交流、项目合作还是随便聊聊，欢迎通过下面的方式找到我。
              </p>
              <div class="flex flex-wrap items-center justify-center gap-3 mt-2">
                <UButton
                  :to="`mailto:${contactEmail}`"
                  size="xl"
                  color="primary"
                  variant="solid"
                  icon="i-lucide-mail"
                  class="rounded-xl px-8 text-base"
                >
                  发邮件给我
                </UButton>
                <UButton
                  :to="githubUrl"
                  target="_blank"
                  size="xl"
                  color="neutral"
                  variant="outline"
                  icon="i-simple-icons-github"
                  class="rounded-xl px-8 text-base"
                >
                  GitHub
                </UButton>
              </div>
            </div>
          </Motion>
        </div>
      </UContainer>
    </div>
  </div>
</template>
