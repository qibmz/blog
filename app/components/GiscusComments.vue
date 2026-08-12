<script setup lang="ts">
import Giscus from '@giscus/vue'
import type { Repo, Theme } from '@giscus/vue'

const colorMode = useColorMode()
const { giscus } = useRuntimeConfig().public

const enabled = computed(() =>
  Boolean(giscus.repo && giscus.repoId && giscus.category && giscus.categoryId)
)

const theme = computed<Theme>(() =>
  colorMode.value === 'dark' ? 'noborder_dark' : 'noborder_light'
)
</script>

<template>
  <ClientOnly v-if="enabled">
    <div class="mt-10 pt-8 border-t border-default">
      <Giscus
        :repo="giscus.repo as Repo"
        :repo-id="giscus.repoId"
        :category="giscus.category"
        :category-id="giscus.categoryId"
        mapping="pathname"
        strict="1"
        reactions-enabled="1"
        emit-metadata="0"
        input-position="bottom"
        :theme="theme"
        lang="zh-CN"
        loading="lazy"
      />
    </div>
  </ClientOnly>
</template>
