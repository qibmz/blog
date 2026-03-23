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

const displayText = ref('')
const currentIndex = ref(0)
const isDeleting = ref(false)
const isBlinking = ref(true)

// 用 useTimeoutFn 替代手写 setTimeout
const { start } = useTimeoutFn(tick, 500, { immediate: false })

function tick() {
  const current = props.texts[currentIndex.value]

  if (!isDeleting.value) {
    displayText.value = current.slice(0, displayText.value.length + 1)
    if (displayText.value === current) {
      isBlinking.value = true
      useTimeoutFn(() => {
        isDeleting.value = true
        isBlinking.value = false
        tick()
      }, props.pauseDuration)
      return
    }
  } else {
    displayText.value = current.slice(0, displayText.value.length - 1)
    if (displayText.value === '') {
      isDeleting.value = false
      currentIndex.value = (currentIndex.value + 1) % props.texts.length
    }
  }

  const speed = isDeleting.value ? props.deletingSpeed : props.typingSpeed
  useTimeoutFn(tick, speed)
}

onMounted(() => {
  start()
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
