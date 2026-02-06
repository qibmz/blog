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
  symbol: ''
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
</script>

<template>
  <div
    v-bind="containerProps"
    class="relative h-96 w-full overflow-auto rounded-xl border border-slate-200/80 bg-linear-to-b from-white via-slate-50 to-white shadow-sm ring-1 ring-slate-200/70 dark:border-slate-800 dark:from-slate-950 dark:via-slate-900/60 dark:to-slate-950 dark:ring-slate-800"
  >
    <!-- 表头 (PC端) -->
    <div
      class="sticky top-0 z-10 hidden border-b border-slate-200/70 bg-white/85 backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/70 md:block"
    >
      <div
        class="grid grid-cols-6 gap-4 px-4 py-3 text-xs font-semibold tracking-wide text-slate-600 dark:text-slate-300"
      >
        <div>方向</div>
        <div>价格</div>
        <div>数量</div>
        <div>成交额</div>
        <div>时间</div>
        <div>交易对</div>
      </div>
      <div class="h-px bg-slate-200/70 dark:bg-slate-800/80" />
    </div>

    <!-- 虚拟滚动列表 -->
    <div v-bind="wrapperProps">
      <template v-if="list.length === 0">
        <div
          class="flex h-full items-center justify-center py-12 text-gray-500 dark:text-gray-400"
        >
          <div class="text-center">
            <UIcon
              name="i-lucide-inbox"
              class="mx-auto h-12 w-12 opacity-50"
            />
            <p class="mt-2">
              暂无交易记录
            </p>
          </div>
        </div>
      </template>

      <!-- PC端列表 -->
      <div
        class="hidden divide-y divide-slate-200/70 dark:divide-slate-800/80 md:block"
      >
        <div
          v-for="item in list"
          :key="item.data.t"
          class="grid grid-cols-6 gap-4 px-4 py-3 text-slate-700 transition-colors duration-200 odd:bg-slate-50/60 hover:bg-slate-100/70 dark:text-slate-200 dark:odd:bg-slate-900/40 dark:hover:bg-slate-800/70"
        >
          <div class="flex items-center">
            <span
              :class="[
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
                item.data.m
                  ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                  : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
              ]"
            >
              {{ item.data.m ? '卖出' : '买入' }}
            </span>
          </div>
          <div
            :class="[
              'flex items-center text-sm font-mono tabular-nums',
              item.data.m ? 'text-red-500 dark:text-red-400' : 'text-emerald-500 dark:text-emerald-400'
            ]"
          >
            ${{ formatPrice(item.data.p) }}
          </div>
          <div
            :class="[
              'flex items-center text-sm font-mono tabular-nums',
              item.data.m ? 'text-red-500 dark:text-red-400' : 'text-emerald-500 dark:text-emerald-400'
            ]"
          >
            {{ formatQuantity(item.data.q) }}
            <span
              v-if="symbol"
              class="ml-1 text-xs opacity-80"
            >
              {{ symbol }}
            </span>
          </div>
          <div
            :class="[
              'flex items-center text-sm font-mono tabular-nums',
              item.data.m ? 'text-red-500 dark:text-red-400' : 'text-emerald-500 dark:text-emerald-400'
            ]"
          >
            ${{ formatAmount(item.data.p, item.data.q) }}
          </div>
          <div class="flex items-center text-xs text-slate-500 dark:text-slate-400">
            {{ formatTime(item.data.T) }}
          </div>
          <div class="flex items-center text-sm font-mono text-slate-600 dark:text-slate-300">
            {{ item.data.s }}
          </div>
        </div>
      </div>

      <!-- 手机端卡片列表 -->
      <div
        class="divide-y divide-slate-200/70 dark:divide-slate-800/80 md:hidden"
      >
        <div
          v-for="item in list"
          :key="item.data.t"
          class="space-y-2 px-3 py-4 text-slate-700 transition-colors duration-200 odd:bg-slate-50/60 hover:bg-slate-100/70 dark:text-slate-200 dark:odd:bg-slate-900/40 dark:hover:bg-slate-800/70"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-mono text-slate-500 dark:text-slate-400">
              {{ item.data.s }}
            </span>
            <span
              :class="[
                'text-xs font-semibold',
                item.data.m ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
              ]"
            >
              {{ item.data.m ? '卖出' : '买入' }}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <div class="text-xs text-slate-600 dark:text-slate-400">
              <div
                :class="[
                  'font-mono tabular-nums',
                  item.data.m ? 'text-red-500 dark:text-red-400' : 'text-emerald-500 dark:text-emerald-400'
                ]"
              >
                价格: ${{ formatPrice(item.data.p) }}
              </div>
              <div
                :class="[
                  'font-mono tabular-nums',
                  item.data.m ? 'text-red-500 dark:text-red-400' : 'text-emerald-500 dark:text-emerald-400'
                ]"
              >
                数量: {{ formatQuantity(item.data.q) }}
                <span
                  v-if="symbol"
                  class="ml-1 text-[11px] opacity-80"
                >
                  {{ symbol }}
                </span>
              </div>
              <div
                :class="[
                  'font-mono tabular-nums',
                  item.data.m ? 'text-red-500 dark:text-red-400' : 'text-emerald-500 dark:text-emerald-400'
                ]"
              >
                成交额: ${{ formatAmount(item.data.p, item.data.q) }}
              </div>
            </div>
            <div class="text-xs text-slate-500 dark:text-slate-400">
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
