<script setup lang="ts">
import { computed } from 'vue'

const route = useRoute()

const pageSize = 7
const dateFormatter = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })

const { data: page } = await useAsyncData('blog', () => queryCollection('blog').first())
const { data: totalPosts } = await useAsyncData('posts-count', () => queryCollection('posts').count())

const rawPage = computed(() => (Array.isArray(route.query.page) ? route.query.page[0] : route.query.page))
const currentPage = computed(() => {
  const parsed = Number.parseInt(rawPage.value ?? '1', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
})

const totalPages = computed(() => {
  const total = totalPosts.value ?? 0
  return Math.max(1, Math.ceil(total / pageSize))
})

const safePage = computed(() => Math.min(currentPage.value, totalPages.value))

const { data: posts } = await useAsyncData(
  () => `${route.path}-page-${safePage.value}`,
  () => queryCollection('posts')
    .select('path', 'title', 'description', 'image', 'date', 'authors', 'badge')
    .order('date', 'DESC')
    .skip((safePage.value - 1) * pageSize)
    .limit(pageSize)
    .all(),
  {
    watch: [safePage]
  }
)

const formattedPosts = computed(() => (posts.value ?? []).map(post => ({
  ...post,
  dateLabel: post.date ? dateFormatter.format(new Date(post.date)) : ''
})))

const pageLink = (pageNumber: number) => {
  const query = { ...route.query }

  if (pageNumber <= 1) {
    delete query.page
  } else {
    query.page = String(pageNumber)
  }

  return { path: route.path, query }
}

const title = page.value?.seo?.title || page.value?.title
const description = page.value?.seo?.description || page.value?.description

useSeoMeta({
  title,
  ogTitle: title,
  description,
  ogDescription: description
})

defineOgImageComponent('Saas')
</script>

<template>
  <UContainer>
    <UPageHeader
      v-bind="page"
      class="py-12.5"
    />

    <UPageBody>
      <UBlogPosts>
        <UBlogPost
          v-for="(post, index) in formattedPosts"
          :key="post.path"
          :to="post.path"
          :title="post.title"
          :description="post.description"
          :image="post.image"
          :date="post.dateLabel"
          :authors="post.authors"
          :badge="post.badge"
          :orientation="index === 0 ? 'horizontal' : 'vertical'"
          :class="[index === 0 && 'col-span-full']"
          variant="naked"
          :ui="{
            description: 'line-clamp-2'
          }"
        />
      </UBlogPosts>

      <UPagination
        v-if="totalPages > 1"
        :page="safePage"
        :total="totalPosts || 0"
        :items-per-page="pageSize"
        :to="pageLink"
        class="mt-10 justify-center flex"
      />
    </UPageBody>
  </UContainer>
</template>
