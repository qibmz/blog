<script lang="ts" setup>
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
let chartInstance: Nullable<Chart> = null

const initChart = () => {
  nextTick(() => {
    if (!chartRef.value) return
    chartInstance = init(chartRef.value, {
      locale: 'zh-CN'
    })
    if (!chartInstance) return
    chartInstance.setSymbol({ ticker: props.symbol })
    chartInstance.setPeriod({ span: props.period.span, type: props.period.type })
    chartInstance.setDataLoader({
      getBars: ({ callback }) => {
        callback([
          { timestamp: 1517846400000, open: 7424.6, high: 7511.3, low: 6032.3, close: 7310.1, volume: 224461 },
          { timestamp: 1517932800000, open: 7310.1, high: 8499.9, low: 6810, close: 8165.4, volume: 148807 },
          { timestamp: 1518019200000, open: 8166.7, high: 8700.8, low: 7400, close: 8245.1, volume: 24467 },
          { timestamp: 1518105600000, open: 8244, high: 8494, low: 7760, close: 8364, volume: 29834 },
          { timestamp: 1518192000000, open: 8363.6, high: 9036.7, low: 8269.8, close: 8311.9, volume: 28203 },
          { timestamp: 1518278400000, open: 8301, high: 8569.4, low: 7820.2, close: 8426, volume: 59854 },
          { timestamp: 1518364800000, open: 8426, high: 8838, low: 8024, close: 8640, volume: 54457 },
          { timestamp: 1518451200000, open: 8640, high: 8976.8, low: 8360, close: 8500, volume: 51156 },
          { timestamp: 1518537600000, open: 8504.9, high: 9307.3, low: 8474.3, close: 9307.3, volume: 49118 },
          { timestamp: 1518624000000, open: 9307.3, high: 9897, low: 9182.2, close: 9774, volume: 48092 }
        ])
      }
    })
  })
}

onMounted(() => {
  initChart()
})

watch(
  () => props.period,
  (newPeriod) => {
    if (chartInstance) {
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
    <div
      ref="chart"
      class="w-full h-200"
    />
  </ClientOnly>
</template>

<style lang="scss" scoped></style>
