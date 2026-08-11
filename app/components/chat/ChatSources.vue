<script setup lang="ts">
export interface ChatSource {
  url: string
  title?: string
  summary?: string
  siteName?: string
  publishTime?: string
  logoUrl?: string
}

defineProps<{
  sources: ChatSource[]
}>()

function hostname(url: string) {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}
</script>

<template>
  <div
    v-if="sources.length > 0"
    class="mt-3 border-t border-default pt-3"
  >
    <p class="text-xs text-muted mb-2 flex items-center gap-1">
      <UIcon
        name="i-lucide-globe"
        class="size-3.5"
      />
      搜索来源
    </p>
    <div class="flex flex-wrap gap-1.5">
      <a
        v-for="(s, i) in sources"
        :key="s.url || i"
        :href="s.url"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-1.5 rounded-lg border border-default px-2.5 py-1.5 text-xs hover:bg-elevated transition-colors no-underline"
      >
        <img
          v-if="s.logoUrl"
          :src="s.logoUrl"
          class="size-4 rounded"
          alt=""
          loading="lazy"
        >
        <span class="font-medium text-highlighted truncate max-w-32">
          {{ s.title || s.siteName || hostname(s.url) }}
        </span>
        <span
          v-if="s.siteName && s.title"
          class="text-muted truncate max-w-24"
        >
          {{ s.siteName }}
        </span>
      </a>
    </div>
  </div>
</template>
