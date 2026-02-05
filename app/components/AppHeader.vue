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
  label: '试炼场',
  to: '/playground',
  active: route.path.startsWith('/playground')
}, {
  label: '关于我',
  to: '/aboutUs'
}
])
</script>

<template>
  <UHeader>
    <template #left>
      <NuxtLink
        to="/"
        class="flex items-center space-x-2"
      >
        <NuxtImg
          src="/image/logo.png"
          width="40"
          height="40"
          class="rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
        />
        <span class="text-xl font-bold text-gray-800 dark:text-white">qibmz</span>
      </NuxtLink>
    </template>

    <UNavigationMenu
      :items="items"
      variant="link"
    />

    <template #right>
      <UContentSearchButton
        :collapsed="false"
        class="hidden lg:inline-flex"
      />
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
      <UContentSearchButton
        :collapsed="false"
        class="w-full"
      />
    </template>
  </UHeader>
</template>
