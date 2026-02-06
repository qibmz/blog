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

// 将 UI 周期转换为币安 K 线间隔字符串 (例如: {span: 1, type: 'day'} -> '1d')
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

  // 币安特殊处理：月线是 1M，其它通常是 1m, 1h 等
  return `${span}${suffix}`
})

// 使用 WebSocket 实时获取数据
const { klineData, latestTrade, status } = useBinanceBusiness(symbol, binanceInterval)

// 实时更新交易列表 (按时间倒序排列，限制显示数量)
const trades = ref<BinanceTradeData[]>([])
watch(latestTrade, (newTrade) => {
  if (newTrade) {
    trades.value = [newTrade, ...trades.value].slice(0, 50)
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
      <UPageHeader
        title="📈 K线图表"
        description="基于币安实现的实时K线图表组件演示"
        class="py-12.5"
      >
        <template #links>
          <UButton
            icon="i-lucide-code"
            label="源代码"
            to="https://github.com/qibmz/blog/blob/main/app/components/demo/kline"
            target="_blank"
          />
          <UButton
            icon="i-lucide-external-link"
            label="币安API"
            to="https://www.binance.com/zh-CN/binance-api"
            target="_blank"
            color="warning"
          />
        </template>
      </UPageHeader>
      <UPageBody ref="pageBody">
        <div class="space-y-6">
          <!-- 主图表区域 -->
          <div class="overflow-hidden rounded-3xl border border-slate-200/60 bg-white ring-1 ring-slate-200/50 shadow-2xl shadow-slate-200/20 dark:border-slate-800/60 dark:bg-slate-950 dark:ring-slate-800/50 dark:shadow-none">
            <!-- 顶部切换栏 -->
            <DemoKlinePeriodBar
              :symbol="symbol"
              contract-address="0x2260fac5e5542a773aa44fbcff0b76cda6eb69cf"
              :is-fullscreen="isFullscreen"
              @toggle-fullscreen="toggleFullscreen"
              @period-change="handlePeriodChange"
            />
            <!-- K线图表 -->
            <DemoKlineChart
              :symbol="symbol"
              :period="period"
              :latest-data="klineData"
              class="border-t border-slate-100 dark:border-slate-900 mt-3"
            />
          </div>

          <!-- 底部交易列表 -->
          <div class="grid grid-cols-1 gap-6">
            <div class="space-y-4">
              <div class="flex items-center justify-between px-2">
                <div class="flex items-center gap-2">
                  <div class="h-5 w-1 rounded-full bg-primary-500" />
                  <h3 class="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
                    实时成交历史
                  </h3>
                </div>
                <div class="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                  <span class="relative flex h-2 w-2">
                    <span :class="['absolute inline-flex h-full w-full rounded-full opacity-75', status === 'OPEN' ? 'animate-ping bg-emerald-400' : 'bg-red-400']" />
                    <span :class="['relative inline-flex rounded-full h-2 w-2', status === 'OPEN' ? 'bg-emerald-500' : 'bg-red-500']" />
                  </span>
                  {{ status === 'OPEN' ? '实时连接中' : '连接已断开' }}
                </div>
              </div>
              <DemoKlineTradesList
                :trades="trades"
                :symbol="symbol"
              />
            </div>
          </div>
        </div>
      </UPageBody>
    </UContainer>
  </div>
</template>
