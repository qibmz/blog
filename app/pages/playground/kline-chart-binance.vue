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
      </UPageBody>
    </UContainer>
  </div>
</template>
