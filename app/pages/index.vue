<script setup lang="ts">
import { computed } from 'vue'

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

// 统计数据
const stats = [
  { label: '开发经验', value: '3年', icon: 'i-lucide-calendar', color: 'text-blue-500' },
  { label: '技术文章', value: '10+', icon: 'i-lucide-file-text', color: 'text-green-500' },
  { label: '项目经验', value: '15+', icon: 'i-lucide-folder', color: 'text-purple-500' },
  { label: '持续学习', value: '每天', icon: 'i-lucide-book-open', color: 'text-orange-500' }
]

// 最新动态
const { data: posts } = await useAsyncData('posts', () => queryCollection('posts').all())

const recentUpdates = computed(() =>
  (posts.value || [])
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3)
    .map(post => ({
      title: post.title,
      date: new Date(post.date).toISOString().split('T')[0],
      type: 'blog',
      to: `/${post.path}`
    }))
)

// 技能亮点
const highlights = [
  { title: '跨平台应用', description: 'UniApp跨平台开发经验', icon: 'i-lucide-smartphone', gradient: 'from-green-500 to-emerald-500' },
  { title: '区块链开发', description: 'Web3、DApp 去中心化应用开发', icon: 'i-lucide-blocks', gradient: 'from-purple-500 to-pink-500' },
  { title: '性能优化', description: '前端性能调优与最佳实践', icon: 'i-lucide-zap', gradient: 'from-yellow-500 to-orange-500' },
  { title: '现代化工具', description: 'Vue/Nuxt 生态与工程化技术', icon: 'i-lucide-wrench', gradient: 'from-blue-500 to-indigo-500' }
]
</script>

<template>
  <div
    v-if="page"
    class="relative min-h-screen"
  >
    <!-- 背景图片 -->
    <div
      class="absolute inset-0 bg-cover bg-center bg-fixed opacity-20 z-0 pointer-events-none"
      :style="{ backgroundImage: `url('/image/index-bg.png')` }"
    />

    <UPageHero
      :title="page.title"
      :description="page.description"
    >
      <template #top>
        <HeroBackground />
        <StarsBg />
      </template>

      <template #links>
        <div class="flex flex-wrap items-center justify-center gap-4 mt-6">
          <FancyButton
            @click="$router.push('/aboutUs')"
          >
            关于我
          </FancyButton>

          <FancyButton
            @click="$router.push('/blog')"
          >
            博客
          </FancyButton>
        </div>
      </template>
    </UPageHero>

    <UContainer>
      <!-- 统计数据区域 -->
      <div class="py-12">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div
            v-for="stat in stats"
            :key="stat.label"
            class="group relative bg-white dark:bg-gray-900 rounded-2xl p-6 text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ring-1 ring-gray-200 dark:ring-gray-800"
          >
            <div class="flex flex-col items-center space-y-3">
              <UIcon
                :name="stat.icon"
                :class="`w-10 h-10 ${stat.color} group-hover:scale-110 transition-transform duration-300`"
              />
              <div>
                <div class="text-3xl font-bold text-gray-900 dark:text-white">
                  {{ stat.value }}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {{ stat.label }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 技能亮点区域 -->
      <div class="py-12 border-t border-gray-200 dark:border-gray-800">
        <h2 class="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
          核心技能
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="highlight in highlights"
            :key="highlight.title"
            class="group relative overflow-hidden bg-white dark:bg-gray-900 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ring-1 ring-gray-200 dark:ring-gray-800"
          >
            <!-- 渐变背景 -->
            <div
              :class="`absolute inset-0 bg-linear-to-br ${highlight.gradient} opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity duration-300`"
            />

            <div class="relative flex flex-col items-center text-center space-y-3">
              <div
                :class="`w-14 h-14 rounded-xl bg-linear-to-br ${highlight.gradient} p-0.5 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg`"
              >
                <div class="w-full h-full bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center">
                  <UIcon
                    :name="highlight.icon"
                    class="w-7 h-7"
                  />
                </div>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {{ highlight.title }}
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ highlight.description }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 最新动态区域 -->
      <div class="py-12 border-t border-gray-200 dark:border-gray-800">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
            最新动态
          </h2>
          <NuxtLink
            to="/blog"
            class="text-primary-500 hover:text-primary-600 transition-colors duration-200 flex items-center gap-1 group"
          >
            查看全部
            <UIcon
              name="i-lucide-arrow-right"
              class="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200"
            />
          </NuxtLink>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="update in recentUpdates"
            :key="update.title"
            class="group cursor-pointer"
            @click="$router.push(update.to)"
          >
            <div class="bg-white dark:bg-gray-900 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ring-1 ring-gray-200 dark:ring-gray-800 h-full">
              <div class="flex items-start gap-3">
                <div class="shrink-0">
                  <div class="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
                    <UIcon
                      name="i-lucide-file-text"
                      class="w-5 h-5 text-primary-500"
                    />
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary-500 transition-colors duration-200 line-clamp-2">
                    {{ update.title }}
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ update.date }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- CTA 区域 -->
      <div class="py-12 border-t border-gray-200 dark:border-gray-800">
        <div class="relative overflow-hidden bg-linear-to-br from-primary-500 to-purple-600 rounded-3xl p-12 text-center">
          <!-- 装饰性背景 -->
          <div class="absolute inset-0 bg-grid-white/10 mask-[linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />

          <div class="relative">
            <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
              让我们一起创造些什么
            </h2>
            <p class="text-white/90 text-lg mb-6 max-w-2xl mx-auto">
              如果你有任何项目合作或技术交流的想法,随时欢迎联系我
            </p>
            <div
              v-if="page?.contact?.email"
              class="flex items-center justify-center gap-2 text-white/95"
            >
              <UIcon
                name="i-lucide-mail"
                class="w-5 h-5"
              />
              <a
                :href="`mailto:${page.contact.email}`"
                class="hover:underline text-lg font-medium"
              >
                {{ page.contact.email }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </UContainer>
  </div>
</template>
