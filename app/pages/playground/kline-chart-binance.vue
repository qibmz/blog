<script lang="ts" setup>
import type { PeriodType } from 'klinecharts'
import type { BinanceTradeData } from '~/composables/useBinanceBusiness'

const title = 'K线图表'
const description = '基于币安实现的实时K线图表组件演示'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description
})

const pageBodyRef = useTemplateRef('pageBody')
const { isFullscreen, enter, exit } = useFullscreen(pageBodyRef)

const symbol = ref('BNB/USDT')
const period = ref<{ span: number, type: PeriodType }>({ span: 1, type: 'day' })

const binanceInterval = computed(() => {
  const { span, type } = period.value
  const typeMap: Record<string, string> = {
    minute: 'm',
    hour: 'h',
    day: 'd',
    week: 'w',
    month: 'M'
  }
  const suffix = typeMap[type] || 'd'
  return `${span}${suffix}`
})

const { klineData, latestTrade, connected } = useBinanceBusiness(symbol, binanceInterval)

const trades = ref<BinanceTradeData[]>([])
watch(latestTrade, (newTrade) => {
  if (newTrade) {
    trades.value = [newTrade, ...trades.value].slice(0, 1000)
  }
})

const toggleFullscreen = () => {
  if (isFullscreen.value) {
    exit()
  } else {
    enter()
  }
}

const handlePeriodChange = (newPeriod: { span: number, type: PeriodType, label: string }) => {
  period.value = { span: newPeriod.span, type: newPeriod.type }
}
</script>

<template>
  <div>
    <UContainer>
      <UPageBody ref="pageBody">
        <!-- 桌面端：图表+交易左右分栏 -->
        <div class="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 lg:gap-6">
          <!-- 左侧：主图表卡片 -->
          <div class="flex flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-950">
            <!-- 紧凑顶栏：标题 + 链接 + 全屏 -->
            <div class="flex items-center justify-between gap-4 px-4 sm:px-6 py-3 border-b border-slate-100 dark:border-slate-800/80">
              <div class="flex items-center gap-3 min-w-0">
                <div class="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 shrink-0">
                  <UIcon
                    name="i-lucide-chart-candlestick"
                    class="w-4 h-4 text-amber-600 dark:text-amber-400"
                  />
                </div>
                <div class="min-w-0">
                  <h1 class="text-sm font-black text-slate-900 dark:text-white tracking-tight truncate">
                    K线图表
                  </h1>
                  <p class="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
                    币安 WebSocket 实时数据
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <UButton
                  icon="i-lucide-code"
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  to="https://github.com/qibmz/blog/blob/main/app/components/demo/kline"
                  target="_blank"
                />
                <UButton
                  icon="i-lucide-external-link"
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  to="https://www.binance.com/zh-CN/binance-api"
                  target="_blank"
                />
                <div class="w-px h-4 bg-slate-200 dark:bg-slate-800" />
                <UButton
                  :icon="isFullscreen ? 'i-lucide-minimize' : 'i-lucide-maximize'"
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  @click="toggleFullscreen"
                />
              </div>
            </div>

            <!-- 市场数据 + 周期选择 -->
            <DemoKlinePeriodBar
              :symbol="symbol"
              @period-change="handlePeriodChange"
            />

            <!-- K线图表 -->
            <div class="border-t border-slate-100 dark:border-slate-800/80">
              <DemoKlineChart
                :symbol="symbol"
                :period="period"
                :latest-data="klineData"
              />
            </div>
          </div>

          <!-- 右侧：实时成交历史 -->
          <div class="flex flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-950">
            <!-- 列表顶栏 -->
            <div class="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-100 dark:border-slate-800/80">
              <div class="flex items-center gap-2">
                <div class="h-4 w-1 rounded-full bg-emerald-500" />
                <h3 class="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
                  实时成交
                </h3>
              </div>
              <div class="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <span class="relative flex h-2 w-2">
                  <span :class="['absolute inline-flex h-full w-full rounded-full opacity-75', connected ? 'animate-ping bg-emerald-400' : 'bg-red-400']" />
                  <span :class="['relative inline-flex rounded-full h-2 w-2', connected ? 'bg-emerald-500' : 'bg-red-500']" />
                </span>
                <span class="hidden sm:inline">{{ connected ? '实时' : '断开' }}</span>
              </div>
            </div>

            <!-- 交易列表 -->
            <div class="flex-1 min-h-0">
              <DemoKlineTradesList
                :trades="trades"
                :symbol="symbol"
                :connected="connected"
              />
            </div>
          </div>
        </div>
      </UPageBody>
    </UContainer>
  </div>
</template>
