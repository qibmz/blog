<script setup lang="ts">
const route = useRoute()
const items = computed(() => [{
  label: '首页',
  to: '/',
  active: route.path === '/'
}, {
  label: '常用网站/工具',
  to: '/docs',
  active: route.path.startsWith('/docs')
}, {
  label: '博客',
  to: '/blog'
}, {
  label: '关于我',
  to: '/aboutUs'
}
//  {
//   label: '期望待遇',
//   to: '/pricing'
// }
])
</script>

<template>
  <UHeader>
    <template #left>
      <NuxtLink to="/">
        <AppLogo class="w-auto h-6 shrink-0" />
      </NuxtLink>
    </template>

    <UNavigationMenu
      :items="items"
      variant="link"
    />

    <template #right>
      <UColorModeButton />

      <UButton
        icon="i-lucide-github"
        color="neutral"
        variant="ghost"
        to="https://github.com/qibmz"
        target="_blank"
        aria-label="GitHub"
      />
    </template>

    <template #body>
      <UNavigationMenu
        :items="items"
        orientation="vertical"
        class="-mx-2.5"
      />
      <USeparator class="my-6" />
    </template>
  </UHeader>
</template>
