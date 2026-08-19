<script setup lang="ts">
const props = withDefaults(defineProps<{
  variant?: 'up' | 'scale' | 'soft'
  mode?: 'view' | 'load'
  delay?: number
  once?: boolean
}>(), {
  variant: 'up',
  mode: 'view',
  delay: 0,
  once: true
})

const preferredMotion = usePreferredReducedMotion()
const reduceMotion = computed(() => preferredMotion.value === 'reduce')

const ease = [0.16, 1, 0.3, 1] as const

const presets = {
  up: {
    hidden: { opacity: 0, y: 36, filter: 'blur(10px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
    duration: 0.72
  },
  scale: {
    hidden: { opacity: 0, y: 48, scale: 0.96, filter: 'blur(12px)' },
    visible: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
    duration: 0.85
  },
  soft: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    duration: 0.55
  }
} as const

const motionProps = computed(() => {
  const preset = presets[props.variant]
  const visible = preset.visible
  const initial = reduceMotion.value ? visible : preset.hidden
  const transition = {
    duration: reduceMotion.value ? 0 : preset.duration,
    delay: reduceMotion.value ? 0 : props.delay,
    ease
  }

  if (props.mode === 'load') {
    return {
      initial,
      animate: visible,
      transition
    }
  }

  return {
    initial,
    whileInView: visible,
    transition,
    inViewOptions: { once: props.once, margin: '-80px' as const }
  }
})
</script>

<template>
  <Motion v-bind="motionProps">
    <slot />
  </Motion>
</template>
