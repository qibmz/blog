<script lang="ts" setup>
type PeriodType = 'minute' | 'hour' | 'day' | 'week' | 'month'

interface Period {
  span: number
  type: PeriodType
  label: string
}

interface Props {
  symbol?: string
}

const props = withDefaults(defineProps<Props>(), {
  symbol: 'BNB/USDT'
})

const emit = defineEmits<{
  periodChange: [period: Period]
}>()

interface TickerData {
  symbol: string
  lastPrice: string
  priceChangePercent: string
  highPrice: string
  lowPrice: string
  volume: string
}

const runtimeConfig = useRuntimeConfig()
const binanceApiUrl = runtimeConfig.public.binanceApi || 'https://api.binance.com'

const binanceSymbol = computed(() => {
  return props.symbol.replace('/', '')
})

const { data: tickerData, pending: tickerLoading } = useFetch<TickerData>(
  () => `${binanceApiUrl}/api/v3/ticker/24hr?symbol=${binanceSymbol.value}`,
  {
    watch: [binanceSymbol],
    server: false
  }
)

const formatPrice = (price: string) => {
  const num = parseFloat(price)
  return num.toFixed(2)
}

const formatVolume = (volume: string) => {
  const num = parseFloat(volume)
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K'
  return num.toFixed(2)
}

const priceChangePercent = computed(() => {
  const percent = parseFloat(tickerData.value?.priceChangePercent || '0')
  return percent.toFixed(2)
})

const isPositive = computed(() => {
  return parseFloat(priceChangePercent.value) >= 0
})

const periods: Period[] = [
  { span: 1, type: 'hour', label: '1h' },
  { span: 2, type: 'hour', label: '2h' },
  { span: 4, type: 'hour', label: '4h' },
  { span: 6, type: 'hour', label: '6h' },
  { span: 8, type: 'hour', label: '8h' },
  { span: 12, type: 'hour', label: '12h' },
  { span: 1, type: 'day', label: '1d' },
  { span: 3, type: 'day', label: '3d' },
  { span: 1, type: 'week', label: '1w' },
  { span: 1, type: 'month', label: '1M' }
]
const selectedIndex = ref(6)

const handlePeriodClick = (index: number) => {
  selectedIndex.value = index
  emit('periodChange', periods[index]!)
}
</script>

<template>
  <div class="space-y-3 p-4 sm:p-5">
    <!-- 市场数据网格 -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-x-5 gap-y-3">
      <!-- 最新价格 -->
      <div class="space-y-1">
        <div class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          最新价格
        </div>
        <div class="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums flex items-baseline gap-0.5">
          <template v-if="!tickerLoading && tickerData">
            <span class="text-xs opacity-40">$</span>{{ formatPrice(tickerData.lastPrice) }}
          </template>
          <div
            v-else
            class="h-5 w-18 bg-slate-100 dark:bg-slate-800 animate-pulse rounded"
          />
        </div>
      </div>

      <!-- 24h涨跌幅 -->
      <div class="space-y-1">
        <div class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          24H 涨跌
        </div>
        <div :class="['text-lg font-bold font-mono tabular-nums', isPositive ? 'text-emerald-500' : 'text-red-500']">
          <span v-if="!tickerLoading && tickerData">{{ isPositive ? '+' : '' }}{{ priceChangePercent }}%</span>
          <div
            v-else
            class="h-5 w-14 bg-slate-100 dark:bg-slate-800 animate-pulse rounded"
          />
        </div>
      </div>

      <!-- 24h高/低 -->
      <div class="space-y-1">
        <div class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          24H 最高/最低
        </div>
        <div class="text-sm font-bold font-mono tabular-nums">
          <div
            v-if="!tickerLoading && tickerData"
            class="flex items-center gap-x-1.5 flex-wrap"
          >
            <span class="text-emerald-500">${{ formatPrice(tickerData.highPrice) }}</span>
            <span class="text-[10px] text-slate-300 dark:text-slate-600">/</span>
            <span class="text-red-500">${{ formatPrice(tickerData.lowPrice) }}</span>
          </div>
          <div
            v-else
            class="h-5 w-22 bg-slate-100 dark:bg-slate-800 animate-pulse rounded"
          />
        </div>
      </div>

      <!-- 24h成交量 -->
      <div class="space-y-1">
        <div class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          24H 成交量
        </div>
        <div class="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
          <span v-if="!tickerLoading && tickerData">{{ formatVolume(tickerData.volume) }}</span>
          <div
            v-else
            class="h-5 w-14 bg-slate-100 dark:bg-slate-800 animate-pulse rounded"
          />
        </div>
      </div>
    </div>

    <!-- 周期选择 -->
    <div class="flex items-center gap-3 p-2 bg-slate-50/80 dark:bg-slate-900/50 rounded-xl ring-1 ring-slate-100 dark:ring-slate-800/50 overflow-x-auto no-scrollbar">
      <span class="px-2.5 py-1 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap shrink-0 border-r border-slate-200 dark:border-slate-800 pr-3 mr-0.5">
        周期
      </span>
      <div class="flex gap-1 flex-1">
        <button
          v-for="(period, index) in periods"
          :key="period.label"
          :class="[
            'px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap shrink-0',
            selectedIndex === index
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
          ]"
          @click="handlePeriodClick(index)"
        >
          {{ period.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
/* 隐藏滚动条 */
.no-scrollbar {
  scrollbar-width: none;
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
