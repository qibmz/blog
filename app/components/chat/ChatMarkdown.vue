<script setup lang="ts">
import { parseMarkdown } from '@nuxtjs/mdc/runtime'

const props = defineProps<{
  content: string
  /** 是否正在流式传输中。为 true 时直接渲染纯文本，避免 markdown 解析造成卡顿 */
  isStreaming?: boolean
}>()

// AI 回复中列表项内的 code fence 会带 4 空格缩进（如 "    ```vue"），
// CommonMark 解析器将 4+ 空格视为缩进代码块而非 fenced code block，
// 导致 fence 标记被当成代码内容，高亮失效，代码块显示"断开"。
// 此处去掉 fence 标记前的空白，让其能被正确识别为 fenced code block。
function dedentFences(md: string): string {
  return md.replace(/^[ \t]+(```|~~~)/gm, '$1')
}

// 对内容做防抖，避免流式输出时每个 token 都触发昂贵的 parseMarkdown（重建 unified processor + Shiki 高亮）
// 仅在非流式状态下启用防抖 + markdown 解析
const debouncedContent = refDebounced(computed(() => props.content), 100)

const ast = computedAsync(
  () => props.isStreaming ? null : parseMarkdown(dedentFences(debouncedContent.value)),
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
           [&>*>:first-child]:mt-0 [&>*>:last-child]:mb-0
           [&_pre_code_.line]:block"
  >
    <template v-if="props.isStreaming">
      <span class="whitespace-pre-wrap text-sm leading-relaxed">{{ props.content }}</span>
    </template>
    <template v-else>
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
    </template>
  </div>
</template>
