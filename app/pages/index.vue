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
    <UPageHero>
      <template #top>
        <HeroBackground />
        <StarsBg />
      </template>

      <template #title>
        <span class="block">{{ page.title }}</span>
        <span class="block text-2xl md:text-3xl font-medium text-gray-500 dark:text-gray-400 mt-2">
          <TypewriterText :texts="typingTexts" />
        </span>
      </template>

      <template #description>
        <p class="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto leading-relaxed">
          {{ page.description }}
        </p>
      </template>

      <template #links>
        <!-- 头像卡片 -->
        <div class="flex flex-col items-center gap-6 mt-4">
          <Motion
            :initial="{ opacity: 0, scale: 0.8 }"
            :animate="{ opacity: 1, scale: 1 }"
            :transition="{ type: 'spring', stiffness: 200, damping: 15 }"
          >
            <div class="relative group">
              <div class="absolute -inset-1 rounded-full bg-linear-to-r from-primary-500 via-purple-500 to-pink-500 opacity-60 blur-md group-hover:opacity-90 transition-opacity duration-500" />
              <NuxtImg
                src="/image/avatar.avif"
                alt="头像"
                width="96"
                height="96"
                class="relative w-24 h-24 rounded-full object-cover ring-4 ring-white dark:ring-gray-900 shadow-xl"
              />
              <div class="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-900 flex items-center justify-center">
                <span class="w-2 h-2 rounded-full bg-white" />
              </div>
            </div>
          </Motion>

          <!-- CTA 按钮 -->
          <div class="flex flex-wrap items-center justify-center gap-3">
            <Motion
              :initial="{ opacity: 0, y: 15 }"
              :animate="{ opacity: 1, y: 0 }"
              :transition="{ duration: 0.4, delay: 0.3 }"
            >
              <UButton
                to="/about-us"
                size="lg"
                color="primary"
                variant="solid"
                icon="i-lucide-user"
                class="rounded-full px-6 shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-all duration-300 hover:-translate-y-0.5"
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
                size="lg"
                color="neutral"
                variant="outline"
                icon="i-lucide-book-open"
                class="rounded-full px-6 hover:-translate-y-0.5 transition-all duration-300"
              >
                博客
              </UButton>
            </Motion>
          </div>
        </div>
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
              :transition="{ type: 'spring', stiffness: 300, damping: 20, delay: i * 0.1 }"
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
            :transition="{ type: 'spring', stiffness: 300, damping: 20, delay: i * 0.1 }"
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
          <Motion
            v-for="(update, i) in recentUpdates"
            :key="update.title"
            :initial="{ opacity: 0, y: 24 }"
            :while-in-view="{ opacity: 1, y: 0 }"
            :transition="{ type: 'spring', stiffness: 280, damping: 22, delay: i * 0.1 }"
            :viewport="{ once: true, margin: '-80px' }"
            :while-hover="{ y: -3 }"
          >
            <NuxtLink
              :to="update.to"
              class="group flex gap-4 bg-white dark:bg-gray-900 rounded-2xl p-5 ring-1 ring-gray-200 dark:ring-gray-800 h-full"
            >
              <!-- 左侧分类竖线 -->
              <div
                :class="`shrink-0 w-0.75 rounded-full transition-all duration-300 bg-gray-300 dark:bg-gray-600 group-hover:w-1.25 ${getCategoryColor(update.category)}`"
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
  </div>
</template>
