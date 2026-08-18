<script setup lang="ts">
const siteLinks = [
  { label: '首页', to: '/' },
  { label: '博客', to: '/blog' },
  { label: '备忘录', to: '/docs' },
  { label: 'Demos', to: '/playground' }
]

const moreLinks = [
  { label: 'AI Chat', to: '/chat' },
  { label: '关于我', to: '/about-us' }
]

const socialLinks = [
  { label: 'GitHub', icon: 'i-simple-icons-github', to: 'https://github.com/qibmz', external: true },
  { label: '发邮件', icon: 'i-lucide-mail', to: 'mailto:1583326640@qq.com', external: false }
]
</script>

<template>
  <footer class="relative overflow-hidden bg-slate-50 dark:bg-slate-950">
    <div class="h-px bg-linear-to-r from-transparent via-primary-400/60 to-transparent" />

    <div class="pointer-events-none absolute inset-0 -z-1">
      <div class="absolute left-1/2 top-0 size-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-500/10 blur-[120px]" />
    </div>

    <UContainer class="relative py-12">
      <div class="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <NuxtLink
            to="/"
            class="inline-flex items-center gap-2"
          >
            <NuxtImg
              src="/image/logo.png"
              alt="qibmz logo"
              width="32"
              height="32"
              class="rounded-lg"
            />
            <span class="text-lg font-bold text-slate-900 dark:text-white">qibmz</span>
          </NuxtLink>
          <p class="mt-3 max-w-xs text-sm leading-6 text-slate-600 dark:text-slate-400">
            记录 UniApp、Nuxt、Vue 与 Web3 开发中的真实踩坑与解决方案。
          </p>
          <p class="mt-4 font-mono text-xs text-slate-500 dark:text-slate-400">
            <span class="text-emerald-400">➜</span> 持续更新中
          </p>
        </div>

        <div>
          <h3 class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-500">
            站点导航
          </h3>
          <ul class="mt-4 space-y-2.5">
            <li
              v-for="link in siteLinks"
              :key="link.label"
            >
              <NuxtLink
                :to="link.to"
                class="text-sm text-slate-500 transition-colors duration-200 hover:text-primary-300 dark:text-slate-400"
              >
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <div>
          <h3 class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-500">
            更多
          </h3>
          <ul class="mt-4 space-y-2.5">
            <li
              v-for="link in moreLinks"
              :key="link.label"
            >
              <NuxtLink
                :to="link.to"
                class="text-sm text-slate-500 transition-colors duration-200 hover:text-primary-300 dark:text-slate-400"
              >
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <div>
          <h3 class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-500">
            联系方式
          </h3>
          <ul class="mt-4 space-y-2.5">
            <li
              v-for="link in socialLinks"
              :key="link.label"
            >
              <NuxtLink
                :to="link.to"
                :target="link.external ? '_blank' : undefined"
                class="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors duration-200 hover:text-primary-300 dark:text-slate-400"
              >
                <UIcon
                  :name="link.icon"
                  class="size-4"
                />
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>

      <div class="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200/70 pt-6 dark:border-white/10 sm:flex-row">
        <p class="text-xs text-slate-500 dark:text-slate-400">
          Built with qbimz • © {{ new Date().getFullYear() }}
        </p>
        <UButton
          to="https://github.com/qibmz"
          target="_blank"
          icon="i-simple-icons-github"
          aria-label="GitHub"
          color="neutral"
          variant="ghost"
          size="sm"
          class="rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
        />
      </div>
    </UContainer>
  </footer>
</template>
