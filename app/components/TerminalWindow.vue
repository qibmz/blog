<script setup lang="ts">
const props = withDefaults(defineProps<{
  /** 标题栏显示的文件名 / 标题，如 component-first-guardian.md */
  title?: string
  /** 要展示的源码文本；不传则渲染默认插槽内容 */
  code?: string
  /** 内容区最大高度，超出滚动 */
  maxHeight?: string
}>(), {
  title: 'terminal',
  maxHeight: '70vh'
})

const copied = ref(false)

async function copyCode() {
  const code = props.code ?? ''
  if (!code || copied.value) return
  try {
    await navigator.clipboard.writeText(code)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    // clipboard not available — silently ignore
  }
}
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-slate-950">
    <!-- 终端标题栏 -->
    <div class="flex items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
      <div class="flex min-w-0 items-center gap-2">
        <span class="size-2.5 shrink-0 rounded-full bg-red-400/80" />
        <span class="size-2.5 shrink-0 rounded-full bg-amber-400/80" />
        <span class="size-2.5 shrink-0 rounded-full bg-emerald-400/80" />
        <span class="ml-2 truncate font-mono text-xs text-slate-500 dark:text-slate-400">{{ title }}</span>
      </div>
      <UButton
        v-if="code"
        :label="copied ? '已复制' : '复制'"
        :icon="copied ? 'i-lucide-check' : 'i-lucide-clipboard-copy'"
        variant="ghost"
        size="xs"
        :color="copied ? 'success' : 'neutral'"
        :class="['shrink-0 transition-all duration-300', copied ? 'pointer-events-none' : '']"
        @click="copyCode"
      />
    </div>

    <!-- 内容 -->
    <pre
      class="overflow-auto p-5 font-mono text-[13px] leading-relaxed text-slate-800 dark:text-slate-200"
      :style="{ maxHeight }"
    >
      <code>
        <template v-if="code">{{ code }}</template>
        <slot v-else />
      </code>
    </pre>
  </div>
</template>
