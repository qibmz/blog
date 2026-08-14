<script setup lang="ts">
/**
 * 4×4 点阵思考动画（来自 Nuxt UI ChatMessages indicator 示例，稍作封装）
 */
const props = withDefaults(defineProps<{
  /** 是否播放动画；关掉时保持最后一帧 */
  playing?: boolean
  /** 格子边长（点数） */
  size?: number
  /** 格子间距 px */
  gap?: number
  /** 步进间隔 ms */
  interval?: number
}>(), {
  playing: true,
  size: 4,
  gap: 2,
  interval: 120
})

const patterns = [
  [[0], [1], [2], [3], [7], [11], [15], [14], [13], [12], [8], [4], [5], [6], [10], [9]],
  [[0, 4, 8, 12], [1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15]],
  [[5, 6, 9, 10], [1, 4, 7, 8, 11, 14], [0, 3, 12, 15], [1, 4, 7, 8, 11, 14], [5, 6, 9, 10]],
  [[0], [1, 4], [2, 5, 8], [3, 6, 9, 12], [7, 10, 13], [11, 14], [15]]
] as const

const totalDots = computed(() => props.size * props.size)
const activeDots = ref(new Set<number>())
const patternIndex = ref(0)
const stepIndex = ref(0)

function nextStep() {
  const pattern = patterns[patternIndex.value]
  if (!pattern) return

  activeDots.value = new Set(pattern[stepIndex.value] ?? [])
  stepIndex.value += 1

  if (stepIndex.value >= pattern.length) {
    stepIndex.value = 0
    patternIndex.value = (patternIndex.value + 1) % patterns.length
  }
}

const { pause, resume } = useIntervalFn(nextStep, () => props.interval, {
  immediate: false
})

watch(
  () => props.playing,
  (playing) => {
    if (playing) {
      if (activeDots.value.size === 0) nextStep()
      resume()
    } else {
      pause()
    }
  },
  { immediate: true }
)
</script>

<template>
  <div
    class="shrink-0 grid size-4"
    :style="{
      gridTemplateColumns: `repeat(${size}, 1fr)`,
      gap: `${gap}px`
    }"
    aria-hidden="true"
  >
    <span
      v-for="i in totalDots"
      :key="i"
      class="rounded-sm bg-current transition-opacity duration-100"
      :class="activeDots.has(i - 1) ? 'opacity-100' : 'opacity-20'"
    />
  </div>
</template>
