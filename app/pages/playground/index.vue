<script setup lang="ts">
const title = '🎮 试炼场'
const description = '各种 Vue 组件和技术的交互式演示'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description
})

const playgrounds = [
  {
    title: '数字滚动动画',
    description: '高性能的数字滚动效果组件演示',
    icon: 'i-lucide-bar-chart-3',
    to: '/playground/number-scroll',
    gradient: 'from-purple-500 to-pink-500'
  }
]
</script>

<template>
  <UContainer>
    <UPageHeader
      title="🎮 试炼场"
      description="各种 Vue 组件和技术的交互式演示"
      class="py-12.5"
    />

    <UPageBody>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <NuxtLink
          v-for="playground in playgrounds"
          :key="playground.to"
          :to="playground.to"
          class="group"
        >
          <div class="relative overflow-hidden bg-white dark:bg-gray-900 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ring-1 ring-gray-200 dark:ring-gray-800 h-full">
            <!-- 渐变背景 -->
            <div
              :class="`absolute inset-0 bg-gradient-to-br ${playground.gradient} opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity duration-300`"
            />

            <!-- 内容 -->
            <div class="relative">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 p-2 mb-4 group-hover:scale-110 transition-transform duration-300">
                <UIcon
                  :name="playground.icon"
                  class="w-full h-full text-white"
                />
              </div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary-500 transition-colors">
                {{ playground.title }}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ playground.description }}
              </p>
            </div>
          </div>
        </NuxtLink>
      </div>
    </UPageBody>
  </UContainer>
</template>
