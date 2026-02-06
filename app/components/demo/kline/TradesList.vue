<script lang="ts" setup>
import { useMediaQuery, useVirtualList } from '@vueuse/core'

interface TradeItem {
  e: string// 事件类型
  E: number // 事件时间
  s: string // 交易对
  t: number // 交易ID
  p: string// 成交价格
  q: string// 成交数量
  T: number// 成交时间
  m: boolean // 买方是否是做市方。如true，则此次成交是一个主动卖出单，否则是一个主动买入单。
  M: boolean // 请忽略该字段
}

interface Props {
  trades?: TradeItem[]
  loading?: boolean
  symbol?: string
}

const props = withDefaults(defineProps<Props>(), {
  trades: () => [],
  loading: false,
  symbol: 'BNB/USDT'
})

const symbol = computed(() => props.symbol?.split('/')?.[0] ?? '')
const trades = computed(() => props.trades)
const isDesktop = useMediaQuery('(min-width: 768px)')
const itemHeight = computed(() => (isDesktop.value ? 48 : 96))
const { list, containerProps, wrapperProps } = useVirtualList(
  trades,
  {
    itemHeight: () => itemHeight.value,
    overscan: 5
  }
)
const containerRef = containerProps.ref
const lastHeadTradeId = ref<number | null>(null)

const formatPrice = (price: string) => {
  return parseFloat(price).toFixed(8)
}

const formatQuantity = (quantity: string) => {
  return parseFloat(quantity).toFixed(2)
}

const formatAmount = (price: string, quantity: string) => {
  const amount = parseFloat(price) * parseFloat(quantity)
  return amount.toFixed(2)
}

const formatTime = (timestamp: number) => {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) {
    return '刚刚'
  } else if (minutes < 60) {
    return `${minutes}分钟前`
  } else if (hours < 24) {
    return `${hours}小时前`
  } else if (days < 30) {
    return `${days}天前`
  } else {
    const date = new Date(timestamp)
    return date.toLocaleDateString('zh-CN')
  }
}

watch(
  () => props.trades,
  (nextTrades) => {
    if (!nextTrades.length) {
      lastHeadTradeId.value = null
      return
    }

    const container = containerRef.value
    const nextHeadId = nextTrades[0]?.t ?? null

    if (!container || nextHeadId === null) {
      lastHeadTradeId.value = nextHeadId
      return
    }

    if (lastHeadTradeId.value === null) {
      lastHeadTradeId.value = nextHeadId
      return
    }

    if (nextHeadId !== lastHeadTradeId.value) {
      const isAtTop = container.scrollTop <= 4
      if (!isAtTop) {
        container.scrollTop += itemHeight.value
      } else {
        container.scrollTop = 0
      }
      containerProps.onScroll()
    }

    lastHeadTradeId.value = nextHeadId
  },
  { deep: true }
)
</script>

<template>
  <div
    v-bind="containerProps"
    class="relative h-125 w-full overflow-auto rounded-3xl border border-slate-200/60 bg-white shadow-xl shadow-slate-200/20 dark:border-slate-800/60 dark:bg-slate-950 dark:shadow-none"
  >
    <!-- 表头 (PC端) -->
    <div
      class="sticky top-0 z-10 hidden border-b border-slate-100 bg-white/90 backdrop-blur-md dark:border-slate-800/50 dark:bg-slate-950/90 md:block"
    >
      <div
        class="grid grid-cols-6 gap-4 px-6 py-4 text-[11px] font-black uppercase tracking-tighter text-slate-400 dark:text-slate-500"
      >
        <div>方向</div>
        <div>价格 (USDT)</div>
        <div>数量</div>
        <div>成交额</div>
        <div>时间</div>
        <div class="text-right">
          市场
        </div>
      </div>
    </div>

    <!-- 虚拟滚动列表 -->
    <div v-bind="wrapperProps">
      <template v-if="list.length === 0">
        <div
          class="flex h-full min-h-100 flex-col items-center justify-center p-12"
        >
          <div class="rounded-full bg-slate-50 p-6 dark:bg-slate-900">
            <UIcon
              name="i-lucide-layers"
              class="h-10 w-10 text-slate-300 dark:text-slate-700"
            />
          </div>
          <p class="mt-4 text-sm font-medium text-slate-400 dark:text-slate-600">
            暂无成交记录
          </p>
        </div>
      </template>

      <!-- PC端列表 -->
      <div
        class="hidden divide-y divide-slate-50 dark:divide-slate-900 md:block"
      >
        <div
          v-for="item in list"
          :key="item.data.t"
          class="group grid grid-cols-6 gap-4 px-6 py-4 text-slate-700 transition-all duration-200 hover:bg-slate-50/80 dark:text-slate-200 dark:hover:bg-slate-900/50"
        >
          <div class="flex items-center">
            <span
              :class="[
                'inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider',
                item.data.m
                  ? 'bg-red-50 text-red-600 ring-1 ring-inset ring-red-500/20 dark:bg-red-500/10 dark:text-red-400'
                  : 'bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400'
              ]"
            >
              {{ item.data.m ? '卖出' : '买入' }}
            </span>
          </div>
          <div
            :class="[
              'flex items-center text-sm font-bold font-mono tabular-nums tracking-tight',
              item.data.m ? 'text-red-500' : 'text-emerald-500'
            ]"
          >
            {{ formatPrice(item.data.p) }}
          </div>
          <div class="flex items-center text-sm font-medium font-mono tabular-nums text-slate-600 dark:text-slate-300">
            {{ formatQuantity(item.data.q) }}
            <span class="ml-1 text-[10px] font-bold opacity-40 uppercase">{{ symbol }}</span>
          </div>
          <div class="flex items-center text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            <span class="mr-0.5 text-xs opacity-30">$</span>{{ formatAmount(item.data.p, item.data.q) }}
          </div>
          <div class="flex items-center text-xs text-slate-400 font-medium font-mono group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
            {{ formatTime(item.data.T) }}
          </div>
          <div class="flex items-center justify-end text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest group-hover:text-primary-500 transition-colors">
            {{ item.data.s }}
          </div>
        </div>
      </div>

      <!-- 手机端列表 -->
      <div
        class="divide-y divide-slate-50 dark:divide-slate-900 md:hidden"
      >
        <div
          v-for="item in list"
          :key="item.data.t"
          class="flex items-center justify-between px-5 py-4 transition-colors active:bg-slate-50 dark:active:bg-slate-900"
        >
          <div class="space-y-1.5 flex-1">
            <div class="flex items-center gap-2">
              <span
                :class="[
                  'text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md',
                  item.data.m
                    ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                    : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                ]"
              >
                {{ item.data.m ? '卖出' : '买入' }}
              </span>
              <span class="text-[10px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-widest">{{ item.data.s }}</span>
            </div>
            <div
              :class="[
                'text-lg font-black font-mono tabular-nums tracking-tighter',
                item.data.m ? 'text-red-500' : 'text-emerald-500'
              ]"
            >
              {{ formatPrice(item.data.p) }}
            </div>
            <div class="flex items-center gap-2 text-[10px] font-medium text-slate-400 dark:text-slate-500 font-mono">
              <span>数量: {{ formatQuantity(item.data.q) }}</span>
              <span class="opacity-30">|</span>
              <span class="text-slate-600 dark:text-slate-300 font-bold">总计: ${{ formatAmount(item.data.p, item.data.q) }}</span>
            </div>
          </div>
          <div class="text-right">
            <div class="text-[10px] font-bold text-slate-300 dark:text-slate-700 font-mono uppercase">
              {{ formatTime(item.data.T) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div
      v-if="loading"
      class="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm dark:bg-black/40"
    >
      <UIcon
        name="i-lucide-loader-circle"
        class="h-6 w-6 animate-spin"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
