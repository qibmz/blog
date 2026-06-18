<script setup lang="ts">
import type { FileUIPart } from 'ai'
import type { AvatarProps } from '@nuxt/ui'

withDefaults(defineProps<{
  parts: FileUIPart[]
  size?: AvatarProps['size']
  removable?: boolean
}>(), {
  size: '2xl',
  removable: false
})

defineEmits<{
  remove: [index: number]
}>()
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <ChatFilePreview
      v-for="(part, i) in parts"
      :key="i"
      :part="part"
      :size="size"
      :removable="removable"
      @remove="$emit('remove', i)"
    />
  </div>
</template>
