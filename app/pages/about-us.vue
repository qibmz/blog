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
    <UPageSection
      v-if="page?.contact?.email"
      title="联系方式"
    >
      <div class="flex items-center justify-center gap-3 p-6 bg-gray-50 dark:bg-gray-900 rounded-xl">
        <UIcon
          name="i-lucide-mail"
          class="w-6 h-6 text-primary-500"
        />
        <span class="text-gray-600 dark:text-gray-400">邮箱:</span>
        <a
          :href="`mailto:${page.contact.email}`"
          class="text-primary-500 hover:text-primary-600 font-medium text-lg hover:underline"
        >
          {{ page.contact.email }}
        </a>
      </div>
    </UPageSection>
  </div>
</template>
