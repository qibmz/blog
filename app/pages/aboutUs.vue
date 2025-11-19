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
    <UPageSection title="工作经历">
      <UChangelogVersions :versions="page.versions" />
    </UPageSection>
  </div>
</template>
