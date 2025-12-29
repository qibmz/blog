<script setup lang="ts">

</script>

<template>
  <USeparator
    :avatar="{
      src: '/image/logo.png'
    }"

    class="h-px"
  />

  <UFooter :ui="{ top: 'border-b border-default' }">
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
      />
      <UButton
        to="tencent://message/?uin=1583326640&Site=qq&Menu=yes"
        target="_blank"
        icon="i-simple-icons-tencentqq"
        aria-label="QQ联系"
        color="neutral"
        variant="ghost"
      />
    </template>
  </UFooter>
</template>
