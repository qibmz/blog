<script setup lang="ts">
const props = withDefaults(defineProps<{
  texts: string[]
  typingSpeed?: number
  deletingSpeed?: number
  pauseDuration?: number
}>(), {
  typingSpeed: 80,
  deletingSpeed: 40,
  pauseDuration: 1800
})

// 初始就显示第一个词的首字符，避免页面抖动
const displayText = ref(props.texts[0]?.charAt(0) ?? '')
const currentIndex = ref(0)
const isDeleting = ref(false)
const isBlinking = ref(true)

function scheduleTick(delay: number) {
  useTimeoutFn(tick, delay)
}

function tick() {
  const current = props.texts[currentIndex.value] ?? ''

  if (!current) {
    displayText.value = ''
    isBlinking.value = true
    return
  }

  if (!isDeleting.value) {
    // === 打字阶段 ===
    isBlinking.value = false
    if (displayText.value.length < current.length) {
      displayText.value = current.slice(0, displayText.value.length + 1)
    }

    if (displayText.value === current) {
      // 打完当前词，闪烁等待后进入删除
      isBlinking.value = true
      isDeleting.value = true
      scheduleTick(props.pauseDuration)
      return
    }

    scheduleTick(props.typingSpeed)
  } else {
    // === 删除阶段 ===
    isBlinking.value = false
    displayText.value = current.slice(0, displayText.value.length - 1)

    if (displayText.value === '') {
      // 删完，切到下一个词并立即显示首字符（Vue 响应式批处理，DOM 不会看到空状态）
      isDeleting.value = false
      currentIndex.value = (currentIndex.value + 1) % props.texts.length
      const nextText = props.texts[currentIndex.value] ?? ''
      displayText.value = nextText.charAt(0)
      scheduleTick(props.typingSpeed)
      return
    }

    scheduleTick(props.deletingSpeed)
  }
}

onMounted(() => {
  // 首字符已展示，短暂延迟后开始打第二个字符
  scheduleTick(props.typingSpeed)
})
</script>

<template>
  <span class="inline-flex items-center">
    <span class="text-primary">{{ displayText }}</span>
    <span
      class="ml-0.5 inline-block w-0.5 h-[1em] bg-primary align-middle"
      :class="isBlinking ? 'animate-pulse' : 'opacity-100'"
    />
  </span>
</template>
