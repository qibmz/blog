<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'

interface Props {
  value: number | string
  duration?: number // 动画持续时间，默认1000ms
  fontSize?: string // 字体大小，如 'text-2xl', 'text-4xl'，默认 'text-2xl'
  textColor?: string // 文字颜色，如 'text-gray-900 dark:text-white'
  digitWidth?: string // 数字宽度，如 'w-10', 'w-12', 'w-16'，默认 'w-10'
  digitHeight?: string // 数字高度，如 'h-14', 'h-16', 'h-20'，默认 'h-14'
  bgClass?: string // 背景样式类，默认为有边框和渐变背景
}

const props = withDefaults(defineProps<Props>(), {
  duration: 2000,
  fontSize: 'text-2xl',
  textColor: 'text-gray-900 dark:text-white',
  digitWidth: 'w-10',
  digitHeight: 'h-14',
  bgClass: 'border border-gray-200 dark:border-gray-700 bg-linear-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-400/10 dark:to-purple-400/10'
})

// 内部状态
const targetValue = ref<string>(String(props.value))
let timerId: ReturnType<typeof setTimeout> | null = null

// 计算显示的值（转换为字符串数组）
const displayedChars = computed(() => targetValue.value.split(''))

// 清理 timer 的函数
const clearTimer = () => {
  if (timerId !== null) {
    clearTimeout(timerId)
    timerId = null
  }
}

// 获取某个digit的偏移距离
const getTranslateY = (char: string): string => {
  if (char === '.') return '0'
  const digit = parseInt(char, 10)
  return digit * -100 + '%'
}

// 监听数值变化
watch(
  () => props.value,
  (newValue) => {
    clearTimer() // 清理之前的 timer
    targetValue.value = String(newValue) // 立即更新目标值，触发动画
  }
)

// 组件卸载时清理 timer
onUnmounted(() => clearTimer())
</script>

<template>
  <div class="flex items-center justify-center gap-1 [font-variant-numeric:tabular-nums]">
    <div
      v-for="(char, index) in displayedChars"
      :key="index"
      class="relative flex justify-center overflow-hidden rounded"
      :class="[
        char === '.'
          ? 'w-4 bg-transparent'
          : `${props.digitWidth} ${props.digitHeight} ${props.bgClass}`
      ]"
    >
      <!-- 小数点 -->
      <template v-if="char === '.'">
        <div :class="`text-3xl font-bold leading-none ${props.textColor}`">
          .
        </div>
      </template>

      <!-- 数字 -->
      <template v-else>
        <div
          class="flex flex-col transition-transform duration-300 ease-out"
          :style="{
            transform: `translateY(${getTranslateY(char)})`,
            transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
          }"
        >
          <div
            v-for="n in 10"
            :key="n"
            :class="`flex h-full items-center justify-center shrink-0 ${props.fontSize} font-bold leading-none ${props.textColor}`"
          >
            {{ n - 1 }}
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
