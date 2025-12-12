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
</script>

<template>
  <div v-if="page">
    <UPageHero
      :title="page.title"
      :description="page.description"
      :links="page.hero.links"
    >
      <template #top>
        <HeroBackground />
        <StarsBg />
      </template>
    </UPageHero>

    <UContainer>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 py-12">
        <UPageCard
          title="技术博客"
          description="分享我在工作中遇到的技术难题和解决方案"
          :links="[{ label: '查看博客', to: '/blog', icon: 'i-lucide-arrow-right' }]"
          spotlight
        />
        <UPageCard
          title="项目文档"
          description="整理常用的技术文档和开发资源"
          :links="[{ label: '浏览文档', to: '/docs', icon: 'i-lucide-arrow-right' }]"
          spotlight
        />
        <UPageCard
          title="关于我"
          description="了解我的工作经验和技术背景"
          :links="[{ label: '了解更多', to: '/aboutUs', icon: 'i-lucide-arrow-right' }]"
          spotlight
        />
      </div>
    </UContainer>
  </div>
</template>
