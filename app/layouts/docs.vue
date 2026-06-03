<script setup lang="ts">
import { SpeedInsights } from '@vercel/speed-insights/vue'

const { data: docsNavigation } = await useAsyncData('docsNavigation', () => queryCollectionNavigation('docs').catch((err) => {
  console.error('Failed to fetch docs navigation:', err)
  return []
}), {
  transform: data => (Array.isArray(data) ? data.find(item => item.path === '/docs')?.children : undefined) || []
})
</script>

<template>
  <div>
    <AppHeader />

    <UMain>
      <UContainer>
        <UPage>
          <template #left>
            <UPageAside>
              <UContentNavigation
                :navigation="docsNavigation"
                highlight
              />
            </UPageAside>
          </template>

          <slot />
        </UPage>
      </UContainer>
    </UMain>

    <AppFooter />
    <SpeedInsights />
  </div>
</template>
