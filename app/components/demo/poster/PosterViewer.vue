<script setup lang="ts">
import type { PosterConfig } from '#shared/types/poster'
import type { PosterRenderData } from '~/utils/posterCanvas'
import { preloadPosterImages, renderPosterToCanvas } from '~/utils/posterCanvas'

const props = defineProps<{
  config: PosterConfig
  /** 业务数据：文字图层 field 从此解析 */
  data?: PosterRenderData | null
}>()

const rootRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const pending = ref(false)
const errorMsg = ref('')
const displayWidth = ref(0)

let abortController: AbortController | null = null

function isAbortError(e: unknown) {
  return e instanceof Error && e.name === 'AbortError'
}

async function paint() {
  const canvas = canvasRef.value
  const root = rootRef.value
  if (!canvas || !root) return

  const width = root.clientWidth
  if (width <= 0) return
  displayWidth.value = width

  abortController?.abort()
  abortController = new AbortController()
  const { signal } = abortController

  pending.value = true
  errorMsg.value = ''

  try {
    await preloadPosterImages(props.config)
    if (signal.aborted) return
    await renderPosterToCanvas(canvas as HTMLCanvasElement, props.config, width, props.data, signal)
  } catch (e) {
    if (signal.aborted || isAbortError(e)) return
    errorMsg.value = e instanceof Error ? e.message : '渲染失败'
  } finally {
    if (!signal.aborted) pending.value = false
  }
}

useResizeObserver(rootRef as never, () => {
  paint()
})

watch(() => [props.config, props.data], () => {
  paint()
}, { deep: true })

onMounted(() => {
  paint()
})

onBeforeUnmount(() => {
  abortController?.abort()
  abortController = null
})
</script>

<template>
  <div
    ref="rootRef"
    class="relative w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900"
  >
    <canvas
      ref="canvasRef"
      class="block w-full h-auto"
    />

    <div
      v-if="pending"
      class="absolute inset-0 flex items-center justify-center bg-white/40 dark:bg-slate-950/40 text-xs text-slate-500"
    >
      Canvas 渲染中…
    </div>

    <div
      v-if="errorMsg"
      class="absolute bottom-2 left-2 right-2 rounded-lg bg-red-500/90 px-3 py-2 text-xs text-white"
    >
      {{ errorMsg }}
    </div>

    <div
      v-if="!config.bgImage && config.layers.length === 0"
      class="absolute inset-0 flex items-center justify-center text-sm text-slate-400 pointer-events-none"
    >
      暂无海报内容
    </div>
  </div>
</template>
