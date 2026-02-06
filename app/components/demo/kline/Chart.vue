<script lang="ts" setup>
import { useWindowSize, useDebounceFn } from '@vueuse/core'
import { dispose, init, type Chart, type KLineData, type Nullable, type PeriodType } from 'klinecharts'
import type { BinanceKlineData } from '~/composables/useBinanceBusiness'

interface Props {
  symbol?: string
  period?: { span: number, type: PeriodType }
  latestData?: BinanceKlineData | null
}

type BinanceKlineApiItem = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string
]

type ChartKlineData = {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  turnover: number
}

const props = withDefaults(defineProps<Props>(), {
  symbol: 'BTC/USDT',
  period: () => ({ span: 1, type: 'day' }),
  latestData: null
})

const chartRef = useTemplateRef('chart')
const isLoading = ref(true)
const { width } = useWindowSize()
const runtimeConfig = useRuntimeConfig()
let chartInstance: Nullable<Chart> = null
let stopLatestWatch: (() => void) | null = null

const handleResize = useDebounceFn(() => {
  if (chartInstance) {
    chartInstance.resize()
  }
}, 300)

const binanceApiUrl = runtimeConfig.public.binanceApi || 'https://api.binance.com'

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
          const formattedSymbol = props.symbol.replace('/', '')
          const typeMap: Record<string, string> = {
            minute: 'm',
            hour: 'h',
            day: 'd',
            week: 'w',
            month: 'M'
          }
          const intervalStr = `${props.period.span}${typeMap[props.period.type]}`
          fetch(`${binanceApiUrl}/api/v3/klines?symbol=${formattedSymbol}&interval=${intervalStr}&limit=500`)
            .then(res => res.json())
            .then((data: BinanceKlineApiItem[]) => {
              console.log(data)
              const dataList: ChartKlineData[] = data.map(item => ({
                timestamp: item[0],
                open: parseFloat(item[1]),
                high: parseFloat(item[2]),
                low: parseFloat(item[3]),
                close: parseFloat(item[4]),
                volume: parseFloat(item[5]),
                turnover: parseFloat(item[7])
              }))
              callback(dataList)
            })
        },
        subscribeBar: ({ callback }) => {
          if (stopLatestWatch) stopLatestWatch()
          stopLatestWatch = watch(
            () => props.latestData,
            (k) => {
              if (!k) return
              const update: KLineData = {
                timestamp: k.t,
                open: parseFloat(k.o),
                high: parseFloat(k.h),
                low: parseFloat(k.l),
                close: parseFloat(k.c),
                volume: parseFloat(k.v),
                turnover: parseFloat(k.q)
              }
              callback(update)
            },
            { deep: true }
          )
        },
        unsubscribeBar: () => {
          if (stopLatestWatch) {
            stopLatestWatch()
            stopLatestWatch = null
          }
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
      chartInstance.setPeriod({ span: newPeriod.span, type: newPeriod.type })
    }
  },
  { deep: true }
)

onUnmounted(() => {
  if (stopLatestWatch) {
    stopLatestWatch()
    stopLatestWatch = null
  }
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
