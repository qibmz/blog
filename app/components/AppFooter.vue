<script setup lang="ts">

</script>

<template>
  <div class="relative">
    <div class="h-px bg-linear-to-r from-transparent via-primary-300/50 to-transparent dark:via-primary-500/30" />

    <UFooter class="relative bg-white/60 backdrop-blur-md dark:bg-white/[0.02]">
      <template #left>
        <p class="text-muted text-sm">
          Built with qbimz • © {{ new Date().getFullYear() }}
        </p>
      </template>

      <template #right>
        <UButton
          to="https://github.com/qibmz"
          target="_blank"
          icon="i-simple-icons-github"
          aria-label="Nuxt UI on GitHub"
          color="neutral"
          variant="ghost"
          class="rounded-lg hover:bg-primary-50 dark:hover:bg-primary-500/10"
        />
      </template>
    </UFooter>
  </div>
</template>
