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
    <div class="flex flex-col items-center mt-6">
      <NuxtImg
        src="/image/avatar.avif"
        alt="头像"
        width="352"
        height="589"
        class=" mb-4 border-4 border-gray-200 dark:border-gray-700"
      />
    </div>

    <UPageSection
      title="技术栈"
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
