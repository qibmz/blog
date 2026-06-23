<script setup lang="ts">
import type { FileUIPart } from 'ai'
import type { AvatarProps } from '@nuxt/ui'

type FileStatus = 'idle' | 'uploading' | 'uploaded' | 'error'

const props = withDefaults(defineProps<{
  parts: FileUIPart[]
  size?: AvatarProps['size']
  removable?: boolean
  statuses?: Record<number, FileStatus>
  errors?: Record<number, string>
  compact?: boolean
}>(), {
  size: '2xl',
  removable: false,
  compact: false
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
      :compact="compact"
      :removable="removable && props.statuses?.[i] !== 'uploading'"
      :status="props.statuses?.[i] ?? 'idle'"
      :error="props.errors?.[i]"
      @remove="$emit('remove', i)"
    />
  </div>
</template>
