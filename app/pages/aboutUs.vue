<script setup lang="ts">
const { data: page } = await useAsyncData('blog', () => queryCollection('blog').first())

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
    123
  </div>
</template>
