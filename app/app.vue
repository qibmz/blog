<script setup lang="ts">
const colorMode = useColorMode()

const color = computed(() => colorMode.value === 'dark' ? '#020618' : 'white')

useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content' },
    { key: 'theme-color', name: 'theme-color', content: color }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ]
})

useSeoMeta({
  titleTemplate: '%s | qibmz 博客',
  description: 'qibmz 的个人技术博客，专注于前端开发、Web3 区块链应用、UniApp 跨平台开发、Vue/Nuxt 全栈技术分享。',
  ogSiteName: 'qibmz 博客',
  ogType: 'website',
  ogLocale: 'zh_CN',
  twitterCard: 'summary_large_image',
  twitterSite: '@qibmz',
  author: 'qibmz',
  robots: 'index, follow'
})

// 注意：使用独立 key 避免与 docs.vue 布局冲突，后者需要在服务端获取导航数据
// 数据在 <ClientOnly> 内使用，服务端获取后会序列化到 payload，客户端 hydrate 直接可用
const { data: docsNavigation } = await useAsyncData('app-docsNavigation', () => queryCollectionNavigation('docs'), {
  default: () => [],
  transform: data => (Array.isArray(data) ? data.find(item => item.path === '/docs')?.children : undefined) || []
})

const { data: docsFiles } = useLazyAsyncData('docsSearch', () => queryCollectionSearchSections('docs'), {
  default: () => []
})
const { data: blogNavigation } = await useAsyncData('app-blogNavigation', () => queryCollectionNavigation('posts'), {
  default: () => []
})
const { data: blogFiles } = useLazyAsyncData('blogSearch', () => queryCollectionSearchSections('posts'), {
  default: () => []
})
const links = [{
  label: '备忘录',
  icon: 'i-lucide-bookmark',
  to: '/docs'
}, {
  label: '博客',
  icon: 'i-lucide-book-open',
  to: '/blog'
}, {
  label: '关于我',
  icon: 'i-lucide-user',
  to: '/about-us'
}
]

// 合并文件数据
const mergedFiles = computed(() => [
  ...(blogFiles.value || []),
  ...(docsFiles.value || [])
])

// 搜索导航数据
const searchNavigation = computed(() => [
  ...(blogNavigation.value || []),
  ...(docsNavigation.value || [])
])
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <ClientOnly>
      <LazyUContentSearch
        :files="mergedFiles"
        shortcut="meta_k"
        :navigation="searchNavigation"
        :links="links"
        :fuse="{ resultLimit: 42 }"
      />
    </ClientOnly>
  </UApp>
</template>

<style>
/* 页面过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 布局过渡动画 */
.slide-enter-active,
.slide-leave-active {
  transition: opacity 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
}
</style>
