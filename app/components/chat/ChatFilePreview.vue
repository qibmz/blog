<script setup lang="ts">
import type { FileUIPart } from 'ai'
import type { AvatarProps } from '@nuxt/ui'
import { AnimatePresence, Motion } from 'motion-v'

interface ChatFilePreviewProps {
  part: FileUIPart
  size?: AvatarProps['size']
  removable?: boolean
  status?: 'idle' | 'uploading' | 'uploaded' | 'error'
  error?: string
}

const props = withDefaults(defineProps<ChatFilePreviewProps>(), {
  size: '2xl',
  removable: false,
  status: 'idle'
})

const emit = defineEmits<{
  remove: []
}>()

const open = ref(false)

const isImage = computed(() => props.part.mediaType?.startsWith('image/'))

function getFileIcon(): string {
  if (isImage.value) return ''
  const ext = props.part.filename?.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return 'i-lucide-file-text'
  if (ext === 'zip' || ext === 'rar' || ext === '7z') return 'i-lucide-file-archive'
  return 'i-lucide-file'
}

function openZoom() {
  if (isImage.value) {
    open.value = true
  }
}

function closeZoom() {
  open.value = false
}

defineShortcuts({
  escape: closeZoom
})

onMounted(() => {
  window.addEventListener('scroll', closeZoom, true)
})

onUnmounted(() => {
  window.removeEventListener('scroll', closeZoom, true)
})
</script>

<template>
  <div class="relative group">
    <UTooltip :text="part.filename ?? '文件'">
      <UAvatar
        :size="size"
        :src="isImage ? part.url : undefined"
        :icon="getFileIcon()"
        class="rounded-lg"
        :class="{
          'opacity-50': status === 'uploading',
          'cursor-zoom-in': isImage
        }"
        @click="openZoom"
      />
    </UTooltip>

    <!-- Uploading overlay -->
    <div
      v-if="status === 'uploading'"
      class="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="size-6 animate-spin text-white"
      />
    </div>

    <!-- Error overlay -->
    <UTooltip
      v-if="status === 'error'"
      :text="error"
    >
      <div class="absolute inset-0 flex items-center justify-center bg-error/50 rounded-lg">
        <UIcon
          name="i-lucide-alert-circle"
          class="size-6 text-white"
        />
      </div>
    </UTooltip>

    <!-- Remove button -->
    <UButton
      v-if="removable && status !== 'uploading'"
      icon="i-lucide-x"
      size="xs"
      color="neutral"
      class="absolute p-0 -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity rounded-full ring ring-bg"
      aria-label="Remove file"
      @click="emit('remove')"
    />

    <!-- Lightbox zoom -->
    <Teleport to="body">
      <AnimatePresence>
        <div
          v-if="open"
          class="fixed inset-0 z-50"
        >
          <Motion
            :initial="{ opacity: 0 }"
            :animate="{ opacity: 1 }"
            :exit="{ opacity: 0 }"
            class="absolute inset-0 bg-default/75 backdrop-blur-sm"
          />

          <Motion
            :initial="{ opacity: 0, scale: 0.9 }"
            :animate="{ opacity: 1, scale: 1 }"
            :exit="{ opacity: 0, scale: 0.9 }"
            :transition="{ type: 'spring', bounce: 0.15, duration: 0.5, ease: 'easeInOut' }"
            class="absolute inset-0 flex items-center justify-center cursor-zoom-out"
            @click="closeZoom"
          >
            <img
              :src="part.url"
              :alt="part.filename ?? '图片预览'"
              class="max-w-[95vw] max-h-[95vh] object-contain rounded-md"
            >
          </Motion>
        </div>
      </AnimatePresence>
    </Teleport>
  </div>
</template>
