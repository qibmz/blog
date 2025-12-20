<script setup lang="ts">
interface TechItem {
  title: string
  description: string
  icon: string
}

const techStack: TechItem[] = [
  {
    title: '核心前端技术',
    description: '熟练掌握JavaScript、CSS、HTML',
    icon: 'i-lucide-code'
  },
  {
    title: 'Vue.js 生态系统',
    description: '熟练使用 Vue.js 生态系统，包括 Vue 3，Pinia，Vue Router，以及 Element UI',
    icon: 'i-lucide-box'
  },
  {
    title: '跨平台开发',
    description: '具备丰富的 UniApp 开发经验，能够高效构建跨平台移动应用，确保优质用户体验',
    icon: 'i-lucide-smartphone'
  },
  {
    title: 'UniApp组件库',
    description: '熟悉使用uView和wot-design-ui等UniApp组件库',
    icon: 'i-lucide-puzzle'
  },
  {
    title: '样式处理',
    description: '熟练使用 Unocss，Sass 等 CSS 预处理器和框架',
    icon: 'i-lucide-palette'
  },
  {
    title: '性能优化',
    description: '了解前端的代码优化',
    icon: 'i-lucide-zap'
  },
  {
    title: '区块链开发',
    description: '熟悉使用 reown+wagmi+viem 实现去中心化 dapp 网站的用户界面和交互功能',
    icon: 'i-lucide-link'
  },
  {
    title: '版本控制',
    description: '熟练使用 Git 进行版本控制和团队协作',
    icon: 'i-lucide-git-branch'
  },
  {
    title: 'TypeScript',
    description: '掌握TypeScript并能在实际项目中应用',
    icon: 'i-lucide-languages'
  }
]
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <UCard
      v-for="(item, index) in techStack"
      :key="index"
      :ui="{
        root: 'bg-white dark:bg-gray-900 rounded-lg overflow-hidden ring-1 ring-gray-200 dark:ring-gray-800',
        header: 'p-4 sm:px-6',
        body: 'p-4 sm:p-6 flex flex-col space-y-2',
        footer: 'p-4 sm:px-6'
      }"
      class="hover:shadow-lg transition-shadow duration-300"
    >
      <template #header>
        <div class="flex items-center space-x-2">
          <UIcon
            :name="item.icon"
            class="w-5 h-5 text-primary-500 dark:text-primary-400"
          />
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ item.title }}
          </h3>
        </div>
      </template>

      <p class="text-gray-700 dark:text-gray-300">
        {{ item.description }}
      </p>
    </UCard>
  </div>
</template>
