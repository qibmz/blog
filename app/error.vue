<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps({
  error: {
    type: Object as PropType<NuxtError>,
    required: true
  }
})

useHead({
  htmlAttrs: {
    lang: 'en'
  }
})

useSeoMeta({
  title: 'Page not found',
  description: 'We are sorry but this page could not be found.'
})

// 使用独立 key 避免与 docs.vue 布局冲突
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
  <div>
    <AppHeader />

    <UMain>
      <UContainer>
        <UPage>
          <UError
            :error="error"
            :clear="{
              color: 'neutral',
              size: 'xl',
              icon: 'i-lucide-arrow-left',
              class: 'rounded-full'
            }"
          />
        </UPage>
      </UContainer>
    </UMain>

    <AppFooter />

    <ClientOnly>
      <LazyUContentSearch
        :files="mergedFiles"
        shortcut="meta_k"
        :navigation="searchNavigation"
        :links="links"
        :fuse="{ resultLimit: 42 }"
      />
    </ClientOnly>

    <UToaster />
  </div>
</template>
