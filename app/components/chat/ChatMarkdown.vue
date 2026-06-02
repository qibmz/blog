<script setup lang="ts">
import { parseMarkdown } from '@nuxtjs/mdc/runtime'

const props = defineProps<{
  content: string
}>()

const ast = computedAsync(
  () => parseMarkdown(props.content),
  null
)
</script>

<template>
  <div
    class="prose prose-sm dark:prose-invert max-w-none
           prose-pre:bg-elevated prose-pre:border prose-pre:border-default prose-pre:rounded-lg
           prose-code:text-primary prose-code:before:content-none prose-code:after:content-none
           prose-a:text-primary prose-a:no-underline hover:prose-a:underline
           prose-p:leading-relaxed prose-p:my-2
           [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
           [&>*>:first-child]:mt-0 [&>*>:last-child]:mb-0"
  >
    <MDCRenderer
      v-if="ast"
      :body="ast.body"
      :data="(ast.data as Record<string, unknown>) ?? {}"
    />
    <UChatShimmer
      v-else
      text="..."
      class="text-xs"
    />
  </div>
</template>
