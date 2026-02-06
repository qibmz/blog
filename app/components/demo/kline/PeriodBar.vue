<script lang="ts" setup>
type PeriodType = 'minute' | 'hour' | 'day' | 'week' | 'month'

interface Period {
  span: number
  type: PeriodType
  label: string
}

interface Props {
  symbol?: string
  contractAddress?: string
  isFullscreen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  symbol: 'BNB/USDT',
  contractAddress: '0xea4e119339027bd04fd252c24edb1922da2a6272',
  isFullscreen: false
})

const emit = defineEmits<{
  periodChange: [period: Period]
  toggleFullscreen: []
}>()

const { copy, copied } = useClipboard()

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

// 将 BTC/USDT 转换为 BTCUSDT
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
  { span: 1, type: 'minute', label: '1m' },
  { span: 3, type: 'minute', label: '3m' },
  { span: 5, type: 'minute', label: '5m' },
  { span: 15, type: 'minute', label: '15m' },
  { span: 30, type: 'minute', label: '30m' },
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

const handleCopyAddress = () => {
  copy(props.contractAddress)
}

const shortAddress = computed(() => {
  if (!props.contractAddress) return ''
  return `${props.contractAddress.slice(0, 6)}...${props.contractAddress.slice(-4)}`
})
</script>

<template>
  <div class="space-y-4">
    <!-- 顶部：代币名称 + 市场数据 -->
    <div class="p-4 sm:p-6 bg-linear-to-br from-primary-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-3xl ring-1 ring-primary-200 dark:ring-gray-700 shadow-sm hover:shadow-md transition-all duration-300">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <!-- 左侧：代币信息 & 价格信息 -->
        <div class="flex flex-col md:flex-row md:items-center gap-6 flex-1">
          <!-- 代币名称 -->
          <div class="flex items-center justify-between md:block shrink-0">
            <div class="space-y-0.5">
              <div class="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest opacity-70">
                代币名称
              </div>
              <div class="text-2xl sm:text-3xl font-black bg-linear-to-r from-primary-600 to-purple-600 dark:from-primary-400 dark:to-purple-400 bg-clip-text text-transparent">
                {{ props.symbol }}
              </div>
            </div>

            <!-- 移动端全屏按钮 -->
            <div class="flex md:hidden items-center gap-2">
              <button
                :class="[
                  'p-2.5 rounded-xl transition-all duration-200 active:scale-90',
                  props.isFullscreen
                    ? 'bg-primary-500 text-white shadow-lg'
                    : 'bg-white dark:bg-gray-800 ring-1 ring-primary-100 dark:ring-gray-700'
                ]"
                @click="emit('toggleFullscreen')"
              >
                <UIcon
                  :name="props.isFullscreen ? 'i-lucide-minimize' : 'i-lucide-maximize'"
                  class="w-5 h-5"
                />
              </button>
            </div>
          </div>

          <!-- 纵向分割线 (中大屏幕) -->
          <div class="hidden md:block w-px h-12 bg-linear-to-b from-primary-200 via-purple-200 to-pink-200 dark:from-primary-800 dark:via-purple-800 dark:to-pink-800 opacity-40 shrink-0" />

          <!-- 市场数据网格 -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4 flex-1">
            <!-- 最新价格 -->
            <div class="space-y-1">
              <div class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                最新价格
              </div>
              <div class="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono flex items-baseline gap-1">
                <template v-if="!tickerLoading && tickerData">
                  <span class="text-sm opacity-50">$</span>{{ formatPrice(tickerData.lastPrice) }}
                </template>
                <div
                  v-else
                  class="h-6 w-20 bg-slate-200 dark:bg-slate-700 animate-pulse rounded"
                />
              </div>
            </div>

            <!-- 24h涨跌幅 -->
            <div class="space-y-1 text-right sm:text-left">
              <div class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                24H 涨跌
              </div>
              <div :class="['text-lg font-bold font-mono', isPositive ? 'text-emerald-500' : 'text-red-500']">
                <span v-if="!tickerLoading && tickerData">{{ isPositive ? '+' : '' }}{{ priceChangePercent }}%</span>
                <div
                  v-else
                  class="h-6 w-16 bg-slate-200 dark:bg-slate-700 animate-pulse rounded ml-auto sm:ml-0"
                />
              </div>
            </div>

            <!-- 24h高/低 -->
            <div class="space-y-1">
              <div class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                24H 最高/最低
              </div>
              <div class="text-sm font-bold font-mono">
                <div
                  v-if="!tickerLoading && tickerData"
                  class="flex flex-col sm:flex-row sm:items-center gap-x-1"
                >
                  <span class="text-emerald-500">${{ formatPrice(tickerData.highPrice) }}</span>
                  <span class="hidden sm:inline opacity-20">/</span>
                  <span class="text-red-500">${{ formatPrice(tickerData.lowPrice) }}</span>
                </div>
                <div
                  v-else
                  class="h-6 w-24 bg-slate-200 dark:bg-slate-700 animate-pulse rounded"
                />
              </div>
            </div>

            <!-- 24h成交量 -->
            <div class="space-y-1 text-right sm:text-left">
              <div class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                24H 成交量
              </div>
              <div class="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono uppercase">
                <span v-if="!tickerLoading && tickerData">{{ formatVolume(tickerData.volume) }}</span>
                <div
                  v-else
                  class="h-6 w-16 bg-slate-200 dark:bg-slate-700 animate-pulse rounded ml-auto sm:ml-0"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：合约地址 & 全屏 (仅桌面端) -->
        <div class="hidden lg:flex items-center gap-6 shrink-0">
          <div class="flex flex-col items-end gap-1">
            <span class="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest opacity-50">合约地址</span>
            <div class="flex items-center gap-2 group">
              <code class="text-xs font-mono text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-gray-800/50 px-2 py-1 rounded-lg border border-primary-100 dark:border-gray-700">{{ shortAddress }}</code>
              <button
                class="p-1.5 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/50 text-primary-600 dark:text-primary-400 transition-colors"
                @click="handleCopyAddress"
              >
                <UIcon
                  :name="copied ? 'i-lucide-check' : 'i-lucide-copy'"
                  class="w-4 h-4"
                />
              </button>
            </div>
          </div>

          <div class="w-px h-8 bg-gray-200 dark:bg-gray-700" />

          <button
            :class="[
              'p-3.5 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95',
              props.isFullscreen
                ? 'bg-linear-to-r from-primary-500 to-purple-500 text-white shadow-lg shadow-primary-500/25'
                : 'bg-white dark:bg-gray-800 ring-1 ring-primary-100 dark:ring-gray-700 hover:ring-primary-300'
            ]"
            @click="emit('toggleFullscreen')"
          >
            <UIcon
              :name="props.isFullscreen ? 'i-lucide-minimize' : 'i-lucide-maximize'"
              class="w-5 h-5"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- 中间：核心操作栏 (周期选择 + 移动端合约) -->
    <div class="grid grid-cols-1 md:grid-cols-[1fr_auto] lg:grid-cols-1 gap-4">
      <!-- 周期选择 -->
      <div class="flex items-center gap-3 p-2 sm:p-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur rounded-2xl ring-1 ring-gray-200 dark:ring-gray-800 shadow-xs overflow-x-auto no-scrollbar">
        <div class="px-3 py-1.5 text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-tighter border-r border-gray-100 dark:border-gray-800 whitespace-nowrap shrink-0">
          时间周期
        </div>
        <div class="flex gap-1.5 flex-1 p-1 md:justify-between">
          <button
            v-for="(period, index) in periods"
            :key="period.label"
            :class="[
              'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap shrink-0',
              selectedIndex === index
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-800'
            ]"
            @click="handlePeriodClick(index)"
          >
            {{ period.label }}
          </button>
        </div>
      </div>

      <!-- 移动端专有合约地址展示 -->
      <div class="lg:hidden flex items-center justify-between p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur rounded-2xl ring-1 ring-gray-200 dark:ring-gray-800 shadow-xs">
        <div class="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest">
          合约地址
        </div>
        <div class="flex items-center gap-2">
          <code class="text-xs font-mono text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
            {{ shortAddress }}
          </code>
          <button
            class="p-2 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
            @click="handleCopyAddress"
          >
            <UIcon
              :name="copied ? 'i-lucide-check' : 'i-lucide-copy'"
              class="w-4 h-4"
            />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
@keyframes pulse-copy {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

button:has(i-lucide-check) {
  animation: pulse-copy 0.4s ease-in-out;
}
</style>
