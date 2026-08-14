<script setup lang="ts">
import type { ChartUIToolInvocation } from '#shared/utils/tools/chart'
import {
  buildChartOption,
  isChartPayload,
  normalizeChartType,
  type ChartPayload
} from '#shared/utils/tools/chartOption'

const props = defineProps<{
  invocation: ChartUIToolInvocation
}>()

const colorMode = useColorMode()
const toast = useToast()
const chartRef = ref<{ getDataURL?: (opts?: Record<string, unknown>) => string } | null>(null)

/** chart tool 的 execute 只是 echo；input 齐全即可渲染，不必死等 output-available */
const chart = computed<ChartPayload | null>(() => {
  if (props.invocation.state === 'output-available' && isChartPayload(props.invocation.output)) {
    return props.invocation.output
  }
  if (
    (props.invocation.state === 'input-available' || props.invocation.state === 'output-available')
    && isChartPayload(props.invocation.input)
  ) {
    return props.invocation.input
  }
  return null
})

const chartType = computed(() => normalizeChartType(chart.value?.type))

const titleIcon = computed(() => {
  return ({
    line: 'i-lucide-line-chart',
    area: 'i-lucide-chart-area',
    bar: 'i-lucide-chart-column',
    donut: 'i-lucide-chart-pie'
  })[chartType.value]
})

const color = computed(() => {
  return ({
    'output-error': 'bg-muted text-error'
  })[props.invocation.state as string] || 'bg-muted text-white'
})

const icon = computed(() => {
  return ({
    'input-available': 'i-lucide-line-chart',
    'output-error': 'i-lucide-triangle-alert'
  })[props.invocation.state as string] || 'i-lucide-loader-circle'
})

const message = computed(() => {
  return ({
    'input-available': '正在生成图表...',
    'output-error': '图表生成失败，请重试'
  })[props.invocation.state as string] || '正在加载图表数据...'
})

const theme = computed<'light' | 'dark'>(() =>
  colorMode.value === 'light' ? 'light' : 'dark'
)

const option = computed(() => {
  if (!chart.value) return null
  return buildChartOption(chart.value, theme.value)
})

function saveAsImage() {
  const instance = chartRef.value
  if (!instance?.getDataURL) {
    toast.add({
      title: '暂无法导出',
      description: '图表尚未渲染完成，请稍后再试',
      color: 'warning',
      icon: 'i-lucide-image-off'
    })
    return
  }

  try {
    const url = instance.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: theme.value === 'dark' ? '#0b1220' : '#ffffff'
    })
    const link = document.createElement('a')
    const safeTitle = (chart.value?.title || 'chart').replace(/[\\/:*?"<>|]/g, '_')
    link.href = url
    link.download = `${safeTitle}.png`
    link.click()
    toast.add({
      title: '已保存图片',
      color: 'success',
      icon: 'i-lucide-download',
      duration: 2000
    })
  } catch (err) {
    console.error('Failed to export chart:', err)
    toast.add({
      title: '导出失败',
      color: 'error',
      icon: 'i-lucide-triangle-alert'
    })
  }
}
</script>

<template>
  <div
    v-if="chart && option"
    class="my-5"
  >
    <div class="flex items-center gap-2 mb-2">
      <UIcon
        :name="titleIcon"
        class="size-5 text-primary shrink-0"
      />
      <div class="min-w-0 flex-1">
        <h3
          v-if="chart.title"
          class="text-lg font-semibold truncate"
        >
          {{ chart.title }}
        </h3>
      </div>
      <UTooltip text="保存为图片">
        <UButton
          icon="i-lucide-download"
          size="xs"
          color="neutral"
          variant="ghost"
          aria-label="保存为图片"
          @click="saveAsImage"
        />
      </UTooltip>
    </div>

    <div class="relative overflow-hidden rounded-lg">
      <ClientOnly>
        <VChart
          ref="chartRef"
          class="h-[300px] w-full"
          :option="option"
          autoresize
        />
        <template #fallback>
          <div class="flex items-center justify-center h-[300px] text-sm text-muted">
            正在渲染图表...
          </div>
        </template>
      </ClientOnly>
    </div>
  </div>

  <div
    v-else
    class="rounded-xl px-5 py-4 my-5"
    :class="color"
  >
    <div class="flex items-center justify-center h-44">
      <div class="text-center">
        <UIcon
          :name="icon"
          class="size-8 mx-auto mb-2"
          :class="[invocation.state === 'input-streaming' && 'animate-spin']"
        />
        <div class="text-sm">
          {{ message }}
        </div>
      </div>
    </div>
  </div>
</template>
