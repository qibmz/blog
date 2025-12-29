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
  <div
    v-if="page"
    class="relative min-h-screen"
  >
    <!-- 背景图片 -->
    <div
      class="absolute inset-0 bg-cover bg-center bg-fixed opacity-20 z-0"
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
