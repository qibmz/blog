<script lang="ts" setup>
import { useWindowSize, useDebounceFn } from '@vueuse/core'
import { dispose, init, type Chart, type Nullable, type PeriodType } from 'klinecharts'

interface Props {
  symbol?: string
  period?: { span: number, type: PeriodType }
}

const props = withDefaults(defineProps<Props>(), {
  symbol: 'BTC/USDT',
  period: () => ({ span: 1, type: 'day' })
})

const chartRef = useTemplateRef('chart')
const isLoading = ref(true)
const { width } = useWindowSize()
let chartInstance: Nullable<Chart> = null

const handleResize = useDebounceFn(() => {
  if (chartInstance) {
    chartInstance.resize()
  }
}, 300)

const initChart = () => {
  isLoading.value = true
  nextTick(() => {
    try {
      if (!chartRef.value) return
      chartInstance = init(chartRef.value, {
        locale: 'zh-CN'

      })
      if (!chartInstance) return
      chartInstance.setSymbol({ ticker: props.symbol })
      chartInstance.setPeriod({ span: props.period.span, type: props.period.type })
      chartInstance.setDataLoader({
        getBars: ({
          callback
        }) => {
          fetch('https://klinecharts.com/datas/kline.json')
            .then(res => res.json())
            .then((dataList) => {
              callback(dataList)
            })
        }
      })
      isLoading.value = false
    } catch (e) {
      console.error('K线图表初始化失败:', e)
      isLoading.value = false
    }
  })
}

onMounted(() => {
  initChart()
})

watch(width, () => {
  handleResize()
})

watch(
  () => props.period,
  (newPeriod) => {
    if (chartInstance) {
      console.log(newPeriod)
      chartInstance.setPeriod({ span: newPeriod.span, type: newPeriod.type })
    }
  },
  { deep: true }
)

watch(
  () => props.symbol,
  (newSymbol) => {
    if (chartInstance) {
      chartInstance.setSymbol({ ticker: newSymbol })
    }
  }
)

onUnmounted(() => {
  if (chartRef.value) {
    dispose(chartRef.value)
  }
})
</script>

<template>
  <ClientOnly>
    <div class="relative h-150 sm:h-200 w-full">
      <div
        ref="chart"
        class="h-full w-full"
      />
      <div
        v-if="isLoading"
        class="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="h-8 w-8 animate-spin"
        />
      </div>
    </div>
  </ClientOnly>
</template>

<style lang="scss" scoped></style>
