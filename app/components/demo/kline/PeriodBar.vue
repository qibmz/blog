<script lang="ts" setup>
type PeriodType = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'

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
  symbol: 'BTC/USDT',
  contractAddress: '0x2260fac5e5542a773aa44fbcff0b76cda6eb69cf',
  isFullscreen: false
})

const emit = defineEmits<{
  periodChange: [period: Period]
  toggleFullscreen: []
}>()

const { copy, copied } = useClipboard()

const periods: Period[] = [
  { span: 1, type: 'second', label: '1s' },
  { span: 1, type: 'minute', label: '1m' },
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

const selectedIndex = ref(11) // 默认选中 1d

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
  <div class="space-y-3 sm:space-y-3">
    <!-- 顶部：代币名称 + 合约地址 -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-linear-to-br from-primary-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-2xl ring-1 ring-primary-200 dark:ring-gray-700 shadow-sm hover:shadow-md transition-shadow duration-300">
      <!-- 左侧：代币信息 -->
      <div class="flex items-start sm:items-center gap-4 w-full sm:w-auto">
        <!-- 代币名称 -->
        <div>
          <div class="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-widest">
            代币
          </div>
          <div class="text-2xl font-bold bg-linear-to-r from-primary-600 to-purple-600 dark:from-primary-400 dark:to-purple-400 bg-clip-text text-transparent mt-1">
            {{ props.symbol }}
          </div>
        </div>

        <!-- 分割线 -->
        <div class="hidden sm:block w-px h-14 bg-linear-to-b from-primary-200 via-purple-200 to-pink-200 dark:from-primary-800 dark:via-purple-800 dark:to-pink-800" />

        <!-- 合约地址 -->
        <div class="hidden sm:block flex-1">
          <div class="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-widest">
            合约地址
          </div>
          <div class="flex items-center gap-2 mt-1">
            <code class="text-sm font-mono text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 text-nowrap ring-1 ring-gray-200 dark:ring-gray-700">
              {{ shortAddress }}
            </code>
            <button
              :class="[
                'p-2 rounded-lg transition-all duration-200 shrink-0 hover:-translate-y-1 active:translate-y-0',
                copied
                  ? 'bg-emerald-100 dark:bg-emerald-900'
                  : 'bg-primary-100 dark:bg-primary-900 hover:bg-primary-200 dark:hover:bg-primary-800'
              ]"
              :title="copied ? '已复制' : '复制地址'"
              @click="handleCopyAddress"
            >
              <UIcon
                :name="copied ? 'i-lucide-check' : 'i-lucide-copy'"
                :class="[
                  'w-4 h-4',
                  copied ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary-600 dark:text-primary-400'
                ]"
              />
            </button>
          </div>
        </div>
      </div>

      <!-- 全屏按钮 -->
      <button
        :class="[
          'p-2.5 rounded-xl transition-all duration-200 hover:-translate-y-1 active:translate-y-0 shrink-0',
          props.isFullscreen
            ? 'bg-linear-to-r from-primary-500 to-purple-500 dark:from-primary-600 dark:to-purple-600'
            : 'bg-white dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-gray-700 ring-1 ring-primary-200 dark:ring-gray-600'
        ]"
        :title="props.isFullscreen ? '退出全屏' : '全屏'"
        @click="emit('toggleFullscreen')"
      >
        <UIcon
          :name="props.isFullscreen ? 'i-lucide-minimize' : 'i-lucide-maximize'"
          :class="[
            'w-5 h-5',
            props.isFullscreen
              ? 'text-white'
              : 'text-primary-600 dark:text-primary-400'
          ]"
        />
      </button>
    </div>

    <!-- 底部：时间周期选择 -->
    <div class="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-2xl ring-1 ring-gray-200 dark:ring-gray-800 overflow-x-auto shadow-sm">
      <span class="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest whitespace-nowrap">
        周期
      </span>
      <div class="flex gap-2 flex-1">
        <button
          v-for="(period, index) in periods"
          :key="period.label"
          :class="[
            'px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap hover:-translate-y-0.5 active:translate-y-0',
            selectedIndex === index
              ? 'bg-linear-to-r from-primary-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-primary-500/30 scale-105'
              : 'text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-800 border-2 border-transparent hover:border-primary-200 dark:hover:border-primary-800'
          ]"
          @click="handlePeriodClick(index)"
        >
          {{ period.label }}
        </button>
      </div>
    </div>

    <!-- 移动端：合约地址副本 -->
    <div class="sm:hidden flex items-center justify-between gap-2 p-4 bg-white dark:bg-gray-900 rounded-2xl ring-1 ring-gray-200 dark:ring-gray-800 shadow-sm">
      <div class="text-xs font-semibold text-primary-600 dark:text-primary-400">
        合约地址
      </div>
      <div class="flex items-center gap-2">
        <code class="text-xs font-mono text-gray-700 dark:text-gray-300 bg-primary-50 dark:bg-gray-800 px-2.5 py-1 rounded-lg hover:bg-primary-100 dark:hover:bg-gray-700 transition-colors duration-200 text-nowrap">
          {{ shortAddress }}
        </code>
        <button
          :class="[
            'p-1.5 rounded-lg transition-all duration-200 shrink-0',
            copied
              ? 'bg-emerald-100 dark:bg-emerald-900'
              : 'bg-primary-100 dark:bg-primary-900 hover:bg-primary-200 dark:hover:bg-primary-800'
          ]"
          @click="handleCopyAddress"
        >
          <UIcon
            :name="copied ? 'i-lucide-check' : 'i-lucide-copy'"
            :class="[
              'w-4 h-4',
              copied ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary-600 dark:text-primary-400'
            ]"
          />
        </button>
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
