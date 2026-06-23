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
  connected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  trades: () => [],
  loading: false,
  symbol: 'BNB/USDT',
  connected: false
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

// Flash 动画追踪：新到达的成交 ID 集合 + 冷却计时
const flashTradeIds = ref<Set<number>>(new Set())
const lastFlashTime = ref(0)
const FLASH_COOLDOWN = 500 // 两次 flash 之间最少间隔 ms
const flashTimeoutIds = new Set<ReturnType<typeof setTimeout>>()

const formatPrice = (price: string) => {
  return parseFloat(price).toFixed(2)
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

    // 检测新到达的成交，加入 flash 集合（带冷却，避免高频闪烁）
    const now = Date.now()
    if (lastHeadTradeId.value !== null && nextHeadId !== null && nextHeadId !== lastHeadTradeId.value && now - lastFlashTime.value >= FLASH_COOLDOWN) {
      const newIds: number[] = []
      for (const trade of nextTrades) {
        if (trade.t === lastHeadTradeId.value) break
        newIds.push(trade.t)
      }
      // 只取最新的一笔做 flash（太多会眼花）
      if (newIds.length > 0) {
        const latestId = newIds[0]!
        const updated = new Set(flashTradeIds.value)
        updated.add(latestId)
        flashTradeIds.value = updated
        lastFlashTime.value = now
        const timeoutId = setTimeout(() => {
          const cleared = new Set(flashTradeIds.value)
          cleared.delete(latestId)
          flashTradeIds.value = cleared
          flashTimeoutIds.delete(timeoutId)
        }, 700)
        flashTimeoutIds.add(timeoutId)
      }
    }

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
onUnmounted(() => {
  for (const id of flashTimeoutIds) {
    clearTimeout(id)
  }
  flashTimeoutIds.clear()
})
</script>

<template>
  <div
    v-bind="containerProps"
    class="relative h-full w-full overflow-auto"
  >
    <!-- 表头 (PC端) -->
    <div
      class="sticky top-0 z-10 hidden border-b border-slate-100 bg-white/90 backdrop-blur-md dark:border-slate-800/50 dark:bg-slate-950/90 md:block"
    >
      <div
        class="grid grid-cols-[auto_1fr_auto_auto] gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-tighter text-slate-400 dark:text-slate-500"
      >
        <div>方向</div>
        <div>价格 (USDT)</div>
        <div>数量</div>
        <div class="text-right">
          时间
        </div>
      </div>
    </div>

    <!-- 虚拟滚动列表 -->
    <div v-bind="wrapperProps">
      <!-- 空状态：连接中 -->
      <template v-if="list.length === 0 && props.connected">
        <div class="flex h-64 flex-col items-center justify-center gap-3 p-8">
          <div class="relative">
            <div class="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
              <UIcon
                name="i-lucide-radio"
                class="h-5 w-5 text-emerald-400 animate-pulse"
              />
            </div>
          </div>
          <p class="text-sm font-medium text-slate-500 dark:text-slate-400">
            等待成交数据...
          </p>
          <p class="text-[11px] text-slate-400 dark:text-slate-500">
            数据流已连接，新成交将实时显示
          </p>
        </div>
      </template>

      <!-- 空状态：未连接 -->
      <template v-if="list.length === 0 && !props.connected">
        <div class="flex h-64 flex-col items-center justify-center gap-3 p-8">
          <div class="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
            <UIcon
              name="i-lucide-wifi-off"
              class="h-5 w-5 text-amber-400"
            />
          </div>
          <p class="text-sm font-medium text-slate-500 dark:text-slate-400">
            正在连接数据流...
          </p>
          <p class="text-[11px] text-slate-400 dark:text-slate-500">
            尝试连接币安 WebSocket 实时推送
          </p>
        </div>
      </template>

      <!-- PC端列表 -->
      <div class="hidden md:block divide-y divide-slate-50 dark:divide-slate-900">
        <div
          v-for="item in list"
          :key="item.data.t"
          :class="[
            'group grid grid-cols-[auto_1fr_auto_auto] gap-3 px-4 py-2.5 text-slate-700 transition-colors duration-200 hover:bg-slate-50/80 dark:text-slate-200 dark:hover:bg-slate-900/50',
            flashTradeIds.has(item.data.t)
              ? (item.data.m ? 'animate-flash-red' : 'animate-flash-green')
              : ''
          ]"
        >
          <!-- 方向 -->
          <div class="flex items-center">
            <span
              :class="[
                'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider',
                item.data.m
                  ? 'bg-red-50 text-red-600 ring-1 ring-inset ring-red-500/20 dark:bg-red-500/10 dark:text-red-400'
                  : 'bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400'
              ]"
            >
              {{ item.data.m ? '卖' : '买' }}
            </span>
          </div>
          <!-- 价格 + 成交额 -->
          <div class="flex items-center gap-2 min-w-0">
            <span
              :class="[
                'text-sm font-bold font-mono tabular-nums tracking-tight truncate',
                item.data.m ? 'text-red-500' : 'text-emerald-500'
              ]"
            >
              {{ formatPrice(item.data.p) }}
            </span>
            <span class="text-[11px] font-medium font-mono tabular-nums text-slate-400 dark:text-slate-500 truncate">
              ${{ formatAmount(item.data.p, item.data.q) }}
            </span>
          </div>
          <!-- 数量 -->
          <div class="flex items-center text-sm font-medium font-mono tabular-nums text-slate-600 dark:text-slate-300 whitespace-nowrap">
            {{ formatQuantity(item.data.q) }}
            <span class="ml-1 text-[10px] font-bold opacity-40 uppercase">{{ symbol }}</span>
          </div>
          <!-- 时间 -->
          <div class="flex items-center justify-end text-xs text-slate-400 font-medium font-mono tabular-nums whitespace-nowrap">
            {{ formatTime(item.data.T) }}
          </div>
        </div>
      </div>

      <!-- 手机端列表 -->
      <div class="md:hidden divide-y divide-slate-50 dark:divide-slate-900">
        <div
          v-for="item in list"
          :key="item.data.t"
          :class="[
            'flex items-center justify-between px-4 py-3 transition-colors active:bg-slate-50 dark:active:bg-slate-900',
            flashTradeIds.has(item.data.t)
              ? (item.data.m ? 'animate-flash-red' : 'animate-flash-green')
              : ''
          ]"
        >
          <div class="space-y-1 flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span
                :class="[
                  'text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded',
                  item.data.m
                    ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                    : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                ]"
              >
                {{ item.data.m ? '卖出' : '买入' }}
              </span>
              <span class="text-[10px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-widest truncate">{{ item.data.s }}</span>
            </div>
            <div
              :class="[
                'text-lg font-black font-mono tabular-nums tracking-tighter',
                item.data.m ? 'text-red-500' : 'text-emerald-500'
              ]"
            >
              {{ formatPrice(item.data.p) }}
            </div>
            <div class="flex items-center gap-2 text-[10px] font-medium text-slate-400 dark:text-slate-500 font-mono tabular-nums">
              <span>数量: {{ formatQuantity(item.data.q) }}</span>
              <span class="opacity-30">|</span>
              <span class="text-slate-600 dark:text-slate-300 font-bold">${{ formatAmount(item.data.p, item.data.q) }}</span>
            </div>
          </div>
          <div class="text-right shrink-0">
            <div class="text-[10px] font-bold text-slate-300 dark:text-slate-700 font-mono tabular-nums uppercase">
              {{ formatTime(item.data.T) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div
      v-if="loading"
      class="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm dark:bg-black/40 z-20"
    >
      <UIcon
        name="i-lucide-loader-circle"
        class="h-6 w-6 animate-spin text-slate-400"
      />
    </div>
  </div>
</template>

<style lang="css" scoped>
/* Flash 动画：新成交到达时的背景闪烁
   买入（绿）和卖出（红）分别有独立的闪烁效果
   在浅色和深色模式下均使用半透明色，自动适配背景 */
@keyframes flash-green {
  0%   { background-color: transparent; }
  15%  { background-color: rgba(16, 185, 129, 0.18); }
  100% { background-color: transparent; }
}

@keyframes flash-red {
  0%   { background-color: transparent; }
  15%  { background-color: rgba(239, 68, 68, 0.18); }
  100% { background-color: transparent; }
}

.animate-flash-green {
  animation: flash-green 0.8s ease-out;
}

.animate-flash-red {
  animation: flash-red 0.8s ease-out;
}
</style>
