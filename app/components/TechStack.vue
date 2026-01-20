<script setup lang="ts">
interface TechItem {
  name: string
  icon: string
  color: string
  category: string
}

const techStack: TechItem[] = [
  // 前端框架
  { name: 'Vue 3', icon: 'i-logos-vue', color: 'from-green-400 to-emerald-500', category: '框架' },
  { name: 'Nuxt 4', icon: 'i-logos-nuxt-icon', color: 'from-green-500 to-teal-500', category: '框架' },

  // 核心语言
  { name: 'TypeScript', icon: 'i-logos-typescript-icon', color: 'from-blue-500 to-blue-600', category: '语言' },
  { name: 'JavaScript', icon: 'i-logos-javascript', color: 'from-yellow-400 to-yellow-500', category: '语言' },

  // 状态管理
  { name: 'Pinia', icon: 'i-logos-pinia', color: 'from-yellow-400 to-amber-500', category: '框架' },

  // 样式工具
  { name: 'Tailwind CSS', icon: 'i-logos-tailwindcss-icon', color: 'from-cyan-400 to-blue-500', category: '样式' },
  { name: 'UnoCSS', icon: 'i-lucide-palette', color: 'from-gray-500 to-gray-700', category: '样式' },
  { name: 'Sass', icon: 'i-logos-sass', color: 'from-pink-400 to-pink-600', category: '样式' },

  // UI组件库
  { name: 'Element Plus', icon: 'i-logos-element', color: 'from-blue-500 to-indigo-600', category: 'UI组件库' },
  { name: 'Nuxt UI', icon: 'i-lucide-layout-grid', color: 'from-green-400 to-green-600', category: 'UI组件库' },
  { name: 'Avue', icon: 'i-lucide-table-properties', color: 'from-cyan-500 to-blue-600', category: 'UI组件库' },
  { name: 'uview', icon: 'i-lucide-box', color: 'from-purple-500 to-pink-600', category: 'UI组件库' },
  { name: 'Wot UI', icon: 'i-lucide-component', color: 'from-orange-500 to-red-600', category: 'UI组件库' },

  // 跨平台开发
  { name: 'UniApp', icon: 'i-lucide-smartphone', color: 'from-green-500 to-emerald-600', category: '跨平台' },

  // 工程化工具
  { name: 'Vite', icon: 'i-logos-vitejs', color: 'from-purple-500 to-yellow-400', category: '构建工具' },
  { name: 'Webpack', icon: 'i-logos-webpack', color: 'from-blue-400 to-blue-600', category: '构建工具' },
  { name: 'ESLint', icon: 'i-logos-eslint', color: 'from-indigo-500 to-purple-600', category: '构建工具' },
  { name: 'Prettier', icon: 'i-lucide-wand-sparkles', color: 'from-gray-600 to-gray-800', category: '构建工具' },

  // 版本控制
  { name: 'Git', icon: 'i-logos-git-icon', color: 'from-orange-500 to-red-600', category: '构建工具' },
  { name: 'GitHub', icon: 'grommet-icons:github', color: 'from-blue-400 to-purple-500', category: '构建工具' },

  // 区块链
  { name: 'Web3.js', icon: 'i-lucide-link', color: 'from-purple-500 to-indigo-600', category: '区块链' },
  { name: 'Wagmi', icon: 'i-lucide-blocks', color: 'from-blue-500 to-purple-600', category: '区块链' },
  { name: 'Viem', icon: 'i-lucide-hexagon', color: 'from-indigo-500 to-purple-500', category: '区块链' },
  { name: 'Reown/AppKit', icon: 'i-lucide-wallet', color: 'from-violet-500 to-fuchsia-600', category: '区块链' },

  // 可视化
  { name: 'ECharts', icon: 'i-lucide-bar-chart-3', color: 'from-red-500 to-orange-600', category: '可视化' },
  { name: 'KLineCharts', icon: 'i-lucide-trending-up', color: 'from-indigo-500 to-blue-600', category: '可视化' }

]

const categories = ['全部', '框架', '语言', '样式', 'UI组件库', '跨平台', '构建工具', '区块链', '可视化']
const selectedCategory = ref('全部')

const filteredStack = computed(() => {
  if (selectedCategory.value === '全部') {
    return techStack
  }
  return techStack.filter(item => item.category === selectedCategory.value)
})
</script>

<template>
  <div class="w-full">
    <!-- 分类筛选 -->
    <div class="flex flex-wrap gap-2 mb-8 justify-center">
      <button
        v-for="category in categories"
        :key="category"
        :class="[
          'px-4 py-2 rounded-full text-sm font-medium transition-all duration-300',
          'hover:scale-105 active:scale-95',
          selectedCategory === category
            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        ]"
        @click="selectedCategory = category"
      >
        {{ category }}
      </button>
    </div>

    <!-- 技术栈网格 -->
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
      <div
        v-for="(item, index) in filteredStack"
        :key="item.name"
        :style="{ animationDelay: `${index * 50}ms` }"
        class="tech-item group relative bg-white dark:bg-gray-900 rounded-2xl cursor-pointer transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-1"
      >
        <!-- 背景渐变 -->
        <div
          :class="`absolute inset-0 bg-linear-to-br ${item.color} opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 rounded-2xl transition-opacity duration-300`"
        />

        <!-- 内容 -->
        <div class="relative flex flex-col items-center justify-center p-4 md:p-6 space-y-3 h-full">
          <!-- 图标容器 -->
          <div
            :class="`relative w-12 h-12 md:w-14 md:h-14 rounded-xl bg-linear-to-br ${item.color} p-0.5 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`"
          >
            <div class="w-full h-full bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center">
              <UIcon
                :name="item.icon"
                class="w-6 h-6 md:w-8 md:h-8"
              />
            </div>
          </div>

          <!-- 技术名称 -->
          <div class="text-center">
            <p class="text-xs md:text-sm font-semibold text-gray-900 dark:text-white group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors duration-300">
              {{ item.name }}
            </p>
            <p class="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ item.category }}
            </p>
          </div>
        </div>

        <!-- 悬浮边框效果 -->
        <div class="absolute inset-0 rounded-2xl ring-1 ring-gray-200 dark:ring-gray-800 group-hover:ring-2 group-hover:ring-primary-400 dark:group-hover:ring-primary-500 transition-all duration-300" />
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="mt-12 text-center">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        共掌握 <span class="font-bold text-primary-500">{{ filteredStack.length }}</span> 项技术
        <span v-if="selectedCategory !== '全部'"> · {{ selectedCategory }}</span>
      </p>
    </div>
  </div>
</template>

<style scoped>
.tech-item {
  animation: fadeInUp 0.5s ease-out forwards;
  opacity: 0;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 移动端优化 */
@media (max-width: 640px) {
  .tech-item:hover {
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    transform: translateY(-2px);
  }
}
</style>
