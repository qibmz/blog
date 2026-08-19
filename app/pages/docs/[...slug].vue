<script setup lang="ts">
definePageMeta({
  layout: 'docs'
})

const route = useRoute()

const { data: page } = await useAsyncData(route.path, () => queryCollection('docs').path(route.path).first())
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const { data: surround } = await useAsyncData(`${route.path}-surround`, () => {
  return queryCollectionItemSurroundings('docs', route.path, {
    fields: ['description']
  })
})

const title = page.value.seo?.title || page.value.title
const description = page.value.seo?.description || page.value.description

useSeoMeta({
  title,
  ogTitle: title,
  description,
  ogDescription: description
})

// 真实 skill 文档（frontmatter 含 name）直接渲染原始 md 源码，而非排版后的富文本
const isSkillSource = computed(() => Boolean(page.value?.name))
</script>

<template>
  <UPage v-if="page">
    <UPageHeader
      :title="page.title"
      :description="page.description"
    />

    <UPageBody>
      <!-- 真实 skill：直接渲染原始 md 源码 -->
      <TerminalWindow
        v-if="isSkillSource"
        :title="`${page.name}.md`"
        :code="page.rawbody"
      />

      <ContentRenderer
        v-else-if="page.body"
        :value="page"
      />

      <GiscusComments />

      <USeparator v-if="surround?.length" />

      <UContentSurround :surround="surround" />
    </UPageBody>

    <template
      v-if="!isSkillSource && page?.body?.toc?.links?.length"
      #right
    >
      <UContentToc
        :links="page.body.toc.links"
        highlight
        highlight-color="primary"
        highlight-variant="circuit"
      />
    </template>
  </UPage>
</template>
