<script lang="ts" setup>
type PeriodType = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'

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

// Mock 交易数据
const trades = ref([
  { e: 'trade', E: 1672515782136, s: 'BNBUSDT', t: 12345, p: '0.001', q: '100', T: 1672515782136, m: true, M: true },
  { e: 'trade', E: 1672515783136, s: 'BNBUSDT', t: 12346, p: '0.0011', q: '50', T: 1672515783136, m: false, M: true },
  { e: 'trade', E: 1672515784136, s: 'BNBUSDT', t: 12347, p: '0.00105', q: '75.5', T: 1672515784136, m: true, M: true },
  { e: 'trade', E: 1672515785136, s: 'BNBUSDT', t: 12348, p: '0.001', q: '200', T: 1672515785136, m: false, M: true },
  { e: 'trade', E: 1672515786136, s: 'BNBUSDT', t: 12349, p: '0.00102', q: '120.3', T: 1672515786136, m: true, M: true },
  { e: 'trade', E: 1672515787136, s: 'BNBUSDT', t: 12350, p: '0.0012', q: '80', T: 1672515787136, m: false, M: true },
  { e: 'trade', E: 1672515788136, s: 'BNBUSDT', t: 12351, p: '0.00099', q: '150.8', T: 1672515788136, m: true, M: true },
  { e: 'trade', E: 1672515789136, s: 'BNBUSDT', t: 12352, p: '0.001', q: '90', T: 1672515789136, m: false, M: true },
  { e: 'trade', E: 1672515790136, s: 'BNBUSDT', t: 12353, p: '0.00108', q: '110', T: 1672515790136, m: true, M: true },
  { e: 'trade', E: 1672515791136, s: 'BNBUSDT', t: 12354, p: '0.00101', q: '200.5', T: 1672515791136, m: false, M: true }
])

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
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  实时连接中
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
