<script setup lang="ts">
interface TechItem {
  name: string
  icon: string
  url: string
  category: CategoryKey
}

type CategoryKey = 'framework' | 'language' | 'styling' | 'ui-library' | 'cross-platform' | 'build-tools' | 'blockchain' | 'visualization'

const categoryMeta: Record<CategoryKey, { label: string, color: string }> = {
  'framework': { label: '框架', color: 'text-green-500' },
  'language': { label: '语言', color: 'text-blue-500' },
  'styling': { label: '样式', color: 'text-pink-500' },
  'ui-library': { label: 'UI组件库', color: 'text-purple-500' },
  'cross-platform': { label: '跨平台', color: 'text-teal-500' },
  'build-tools': { label: '构建工具', color: 'text-orange-500' },
  'blockchain': { label: '区块链', color: 'text-indigo-500' },
  'visualization': { label: '可视化', color: 'text-red-500' }
}

const techStack: TechItem[] = [
  { name: 'Vue 3', icon: 'i-logos-vue', url: 'https://vuejs.org', category: 'framework' },
  { name: 'Nuxt 4', icon: 'i-logos-nuxt-icon', url: 'https://nuxt.com', category: 'framework' },
  { name: 'TypeScript', icon: 'i-logos-typescript-icon', url: 'https://www.typescriptlang.org', category: 'language' },
  { name: 'JavaScript', icon: 'i-logos-javascript', url: 'https://developer.mozilla.org/docs/Web/JavaScript', category: 'language' },
  { name: 'Pinia', icon: 'i-logos-pinia', url: 'https://pinia.vuejs.org', category: 'framework' },
  { name: 'Vue I18n', icon: 'i-lucide-languages', url: 'https://vue-i18n.intlify.dev', category: 'framework' },
  { name: 'Tailwind CSS', icon: 'i-logos-tailwindcss-icon', url: 'https://tailwindcss.com', category: 'styling' },
  { name: 'UnoCSS', icon: 'i-logos-unocss', url: 'https://unocss.dev', category: 'styling' },
  { name: 'Sass', icon: 'i-logos-sass', url: 'https://sass-lang.com', category: 'styling' },
  { name: 'Element Plus', icon: 'i-logos-element', url: 'https://element-plus.org', category: 'ui-library' },
  { name: 'Nuxt UI', icon: 'i-lucide-layout-grid', url: 'https://ui.nuxt.com', category: 'ui-library' },
  { name: 'Avue', icon: 'i-lucide-table-properties', url: 'https://avuejs.com', category: 'ui-library' },
  { name: 'uview', icon: 'i-lucide-box', url: 'https://uviewui.com', category: 'ui-library' },
  { name: 'Wot UI', icon: 'i-lucide-component', url: 'https://wot-design-uni.cn', category: 'ui-library' },
  { name: 'UniApp', icon: 'i-lucide-smartphone', url: 'https://uniapp.dcloud.net.cn', category: 'cross-platform' },
  { name: 'Vite', icon: 'i-logos-vitejs', url: 'https://vitejs.dev', category: 'build-tools' },
  { name: 'Webpack', icon: 'i-logos-webpack', url: 'https://webpack.js.org', category: 'build-tools' },
  { name: 'ESLint', icon: 'i-logos-eslint', url: 'https://eslint.org', category: 'build-tools' },
  { name: 'Prettier', icon: 'i-logos-prettier', url: 'https://prettier.io', category: 'build-tools' },
  { name: 'Git', icon: 'i-logos-git-icon', url: 'https://git-scm.com', category: 'build-tools' },
  { name: 'GitHub', icon: 'grommet-icons:github', url: 'https://github.com', category: 'build-tools' },
  { name: 'Web3.js', icon: 'i-logos-web3js', url: 'https://web3js.org', category: 'blockchain' },
  { name: 'Wagmi', icon: 'i-lucide-blocks', url: 'https://wagmi.sh', category: 'blockchain' },
  { name: 'Viem', icon: 'i-lucide-hexagon', url: 'https://viem.sh', category: 'blockchain' },
  { name: 'Reown/AppKit', icon: 'i-lucide-wallet', url: 'https://reown.com/appkit', category: 'blockchain' },
  { name: 'ECharts', icon: 'i-simple-icons-apacheecharts', url: 'https://echarts.apache.org', category: 'visualization' },
  { name: 'KLineCharts', icon: 'i-lucide-trending-up', url: 'https://klinecharts.com', category: 'visualization' }
]

const categoryKeys: CategoryKey[] = ['framework', 'language', 'styling', 'ui-library', 'cross-platform', 'build-tools', 'blockchain', 'visualization']
const selectedCategory = ref<CategoryKey | 'all'>('all')

const filteredStack = computed(() => {
  if (selectedCategory.value === 'all') return techStack
  return techStack.filter(item => item.category === selectedCategory.value)
})
</script>

<template>
  <div class="w-full">
    <!-- 分类筛选 -->
    <div class="flex gap-0.5 mb-6 overflow-x-auto no-scrollbar border-b border-gray-200 dark:border-gray-800">
      <button
        class="relative shrink-0 px-3 py-2 text-xs font-medium transition-colors duration-200"
        :class="selectedCategory === 'all'
          ? 'text-primary-500'
          : 'text-muted hover:text-highlighted'"
        @click="selectedCategory = 'all'"
      >
        全部
        <span
          v-if="selectedCategory === 'all'"
          class="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary-500"
        />
      </button>
      <button
        v-for="key in categoryKeys"
        :key="key"
        class="relative shrink-0 px-3 py-2 text-xs font-medium transition-colors duration-200"
        :class="selectedCategory === key
          ? 'text-primary-500'
          : 'text-muted hover:text-highlighted'"
        @click="selectedCategory = key"
      >
        {{ categoryMeta[key].label }}
        <span
          v-if="selectedCategory === key"
          class="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary-500"
        />
      </button>
    </div>

    <!-- 技术 Token 网格 -->
    <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1.5">
      <Motion
        v-for="(item, index) in filteredStack"
        :key="item.name"
        tag="div"
        :initial="{ opacity: 0, y: 8 }"
        :while-in-view="{ opacity: 1, y: 0 }"
        :transition="{ type: 'spring', stiffness: 300, damping: 25, delay: index * 0.03 }"
        :viewport="{ once: true, margin: '-20px' }"
      >
        <a
          :href="item.url"
          target="_blank"
          rel="noopener noreferrer"
          class="group flex items-center gap-1.5 px-2.5 py-2 rounded-lg
                 hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors duration-200"
        >
          <UIcon
            :name="item.icon"
            class="w-4 h-4 shrink-0"
            :class="item.icon.startsWith('i-lucide') ? categoryMeta[item.category].color : ''"
          />
          <span class="text-xs text-highlighted/80 group-hover:text-highlighted truncate transition-colors duration-200">
            {{ item.name }}
          </span>
          <UIcon
            name="i-lucide-arrow-up-right"
            class="w-3 h-3 shrink-0 text-muted/40 group-hover:text-primary-500 opacity-0 group-hover:opacity-100 transition-all duration-200"
          />
        </a>
      </Motion>
    </div>
  </div>
</template>
