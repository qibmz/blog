<script setup lang="ts">
const { data: page } = await useAsyncData('aboutUs', () => queryCollection('aboutUs').first())

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
    <div class="flex flex-col items-center mb-12">
      <NuxtImg
        src="/image/avatar.avif"
        alt="头像"
        width="120"
        height="120"
        class="rounded-full mb-4 border-4 border-gray-200 dark:border-gray-700"
      />
      <h1 class="text-3xl font-bold">
        qibmz
      </h1>
    </div>

    <UPageSection
      title="技术栈"
      class="mt-12"
    >
      <TechStack />
    </UPageSection>
    <UPageSection title="工作经历">
      <UChangelogVersions
        :versions="page.versions"
      />
    </UPageSection>
  </div>
</template>
