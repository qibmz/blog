<script setup lang="ts">
const props = defineProps<{
  value: string
  duration?: number
}>()

const el = ref<HTMLElement | null>(null)
const displayValue = ref('0')
const triggered = ref(false)

const parsed = computed(() => {
  const match = props.value.match(/^(\d+)(.*)$/)
  if (match?.[1]) {
    return {
      num: Number.parseInt(match[1], 10),
      suffix: match[2] ?? ''
    }
  }
  return { num: null, suffix: props.value }
})

const animateCount = () => {
  if (triggered.value) return
  triggered.value = true

  const { num, suffix } = parsed.value
  if (num === null) {
    displayValue.value = props.value
    return
  }

  const dur = props.duration ?? 1200
  const start = performance.now()

  const step = (now: number) => {
    const elapsed = now - start
    const progress = Math.min(elapsed / dur, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    displayValue.value = Math.floor(eased * num) + suffix
    if (progress < 1) requestAnimationFrame(step)
    else displayValue.value = num + suffix
  }

  requestAnimationFrame(step)
}

const { stop } = useIntersectionObserver(
  el,
  ([entry]) => {
    if (entry?.isIntersecting) {
      animateCount()
      stop()
    }
  },
  { threshold: 0.3 }
)
</script>

<template>
  <span ref="el">{{ displayValue }}</span>
</template>
