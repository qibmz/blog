<template>
  <button
    :class="[
      'border text-gray-50 duration-300 relative group cursor-pointer overflow-hidden h-14 w-40 rounded-md p-2 font-extrabold text-sm',
      'transition-all duration-300 ease-out transform hover:-translate-y-1 focus:outline-none',
      buttonClasses
    ]"
    :style="buttonStyle"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- 彩色圆形装饰元素 -->
    <div
      class="absolute group-hover:-top-1 group-hover:-right-2 z-0 w-16 h-16 rounded-full group-hover:scale-150 duration-700 right-12 top-12 opacity-30"
      :class="circleColors[0]"
    />
    <div
      class="absolute group-hover:-top-1 group-hover:-right-2 z-0 w-12 h-12 rounded-full group-hover:scale-150 duration-700 right-20 -top-6 opacity-30"
      :class="circleColors[1]"
    />
    <div
      class="absolute group-hover:-top-1 group-hover:-right-2 z-0 w-8 h-8 rounded-full group-hover:scale-150 duration-700 right-32 top-6 opacity-30"
      :class="circleColors[2]"
    />
    <div
      class="absolute group-hover:-top-1 group-hover:-right-2 z-0 w-4 h-4 rounded-full group-hover:scale-150 duration-700 right-2 top-12 opacity-30"
      :class="circleColors[3]"
    />

    <!-- 按钮文本 -->
    <span class="z-10 absolute bottom-2 left-3 flex items-center justify-center gap-2">
      <slot name="icon" />
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'outline'
  glow?: boolean
  icon?: string
}>(), {
  variant: 'primary',
  glow: true
})

const isHovered = ref(false)

const handleMouseEnter = () => {
  isHovered.value = true
}
const handleMouseLeave = () => {
  isHovered.value = false
}

const buttonClasses = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'bg-neutral-800 hover:bg-sky-800 border-sky-900'
    case 'secondary':
      return 'bg-neutral-800 hover:bg-purple-800 border-purple-900'
    case 'outline':
      return 'bg-transparent hover:bg-sky-900/50 border-sky-700'
    default:
      return 'bg-neutral-800 hover:bg-sky-800 border-sky-900'
  }
})

const buttonStyle = computed(() => {
  return {}
})

// 不同变体的圆形颜色
const circleColors = computed(() => {
  switch (props.variant) {
    case 'primary':
      return ['bg-sky-500', 'bg-cyan-400', 'bg-blue-500', 'bg-indigo-600']
    case 'secondary':
      return ['bg-purple-500', 'bg-fuchsia-400', 'bg-violet-500', 'bg-pink-600']
    case 'outline':
      return ['bg-sky-400', 'bg-cyan-300', 'bg-blue-400', 'bg-indigo-500']
    default:
      return ['bg-sky-500', 'bg-cyan-400', 'bg-blue-500', 'bg-indigo-600']
  }
})
</script>
