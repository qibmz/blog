<script setup lang="ts">
import { Analytics } from '@vercel/analytics/nuxt'

const colorMode = useColorMode()

const color = computed(() => colorMode.value === 'dark' ? '#020618' : 'white')

useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: color }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    class: 'dark'
  }
})

const { origin } = useRequestURL()
useSeoMeta({
  titleTemplate: '%s - qibmz blog',
  ogImage: `${origin}/image/blog.png`,
  twitterImage: `${origin}/image/blog.png`,
  twitterCard: 'summary_large_image'
})

const { data: docsNavigation } = await useAsyncData('docsNavigation', () => queryCollectionNavigation('docs'), {
  transform: data => data.find(item => item.path === '/docs')?.children || []
})

const { data: docsFiles } = useLazyAsyncData('docsSearch', () => queryCollectionSearchSections('docs'), {
  server: false
})
const { data: blogNavigation } = await useAsyncData('blogNavigation', () => queryCollectionNavigation('posts'))
const { data: blogFiles } = useLazyAsyncData('blogSearch', () => queryCollectionSearchSections('posts'), {
  server: false
})
const links = [{
  label: '常用网站/工具',
  icon: 'i-lucide-pen-tool',
  to: '/docs'
}, {
  label: '博客',
  icon: 'i-lucide-book-open',
  to: '/blog'
}, {
  label: '关于我',
  icon: 'i-lucide-user',
  to: '/aboutUs'
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
      <Analytics />
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
