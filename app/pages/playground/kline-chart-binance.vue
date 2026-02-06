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

const symbol = ref('BTC/USDT')
const period = ref<{ span: number, type: PeriodType }>({ span: 1, type: 'day' })

// Mock 交易数据
const trades = ref([
  { e: 'trade', E: 1672515782136, s: 'BNBBTC', t: 12345, p: '0.001', q: '100', T: 1672515782136, m: true, M: true },
  { e: 'trade', E: 1672515783136, s: 'BNBBTC', t: 12346, p: '0.0011', q: '50', T: 1672515783136, m: false, M: true },
  { e: 'trade', E: 1672515784136, s: 'BNBBTC', t: 12347, p: '0.00105', q: '75.5', T: 1672515784136, m: true, M: true },
  { e: 'trade', E: 1672515785136, s: 'BNBBTC', t: 12348, p: '0.001', q: '200', T: 1672515785136, m: false, M: true },
  { e: 'trade', E: 1672515786136, s: 'BNBBTC', t: 12349, p: '0.00102', q: '120.3', T: 1672515786136, m: true, M: true },
  { e: 'trade', E: 1672515787136, s: 'BNBBTC', t: 12350, p: '0.0012', q: '80', T: 1672515787136, m: false, M: true },
  { e: 'trade', E: 1672515788136, s: 'BNBBTC', t: 12351, p: '0.00099', q: '150.8', T: 1672515788136, m: true, M: true },
  { e: 'trade', E: 1672515789136, s: 'BNBBTC', t: 12352, p: '0.001', q: '90', T: 1672515789136, m: false, M: true },
  { e: 'trade', E: 1672515790136, s: 'BNBBTC', t: 12353, p: '0.00108', q: '110', T: 1672515790136, m: true, M: true },
  { e: 'trade', E: 1672515791136, s: 'BNBBTC', t: 12354, p: '0.00101', q: '200.5', T: 1672515791136, m: false, M: true }
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
        </template>
      </UPageHeader>
      <UPageBody ref="pageBody">
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
        />
        <!-- 交易历史 -->
        <div class="mt-6">
          <DemoKlineTradesList
            :trades="trades"
            :symbol="symbol"
          />
        </div>
      </UPageBody>
    </UContainer>
  </div>
</template>
