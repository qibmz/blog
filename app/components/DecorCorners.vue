<script setup lang="ts">
withDefaults(defineProps<{
  inset?: string
}>(), {
  inset: '0.75rem'
})
</script>

<template>
  <div
    class="pointer-events-none absolute inset-0 hidden opacity-60 sm:block"
    aria-hidden="true"
  >
    <span
      class="absolute size-3 border-t border-l border-slate-400/50 dark:border-white/25"
      :style="{ top: inset, left: inset }"
    />
    <span
      class="absolute size-3 border-t border-r border-slate-400/50 dark:border-white/25"
      :style="{ top: inset, right: inset }"
    />
    <span
      class="absolute size-3 border-b border-l border-slate-400/50 dark:border-white/25"
      :style="{ bottom: inset, left: inset }"
    />
    <span
      class="absolute size-3 border-b border-r border-slate-400/50 dark:border-white/25"
      :style="{ bottom: inset, right: inset }"
    />
  </div>
</template>
