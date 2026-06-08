<script setup lang="ts">
const { data: page } = await useAsyncData('aboutUs', () => queryCollection('aboutUs').first())

const title = page.value?.seo?.title || page.value?.title
const description = page.value?.seo?.description || page.value?.description

useSeoMeta({
  titleTemplate: '',
  title,
  ogTitle: title,
  description,
  ogDescription: description
})

const contactEmail = computed(() => page.value?.contact?.email ?? '')
</script>

<template>
  <div
    v-if="page"
    class="relative"
  >
    <!-- ========== HERO 个人名片 ========== -->
    <div class="flex flex-col items-center pt-16 pb-10">
      <!-- 头像 + 渐变光环 spring 弹入 -->
      <Motion
        :initial="{ opacity: 0, scale: 0.8 }"
        :animate="{ opacity: 1, scale: 1 }"
        :transition="{ type: 'spring', stiffness: 200, damping: 15 }"
      >
        <div class="relative group mb-8">
          <div class="absolute -inset-1.5 rounded-full bg-linear-to-r from-primary-500 via-purple-500 to-pink-500 opacity-50 blur-lg group-hover:opacity-75 transition-opacity duration-500" />
          <NuxtImg
            src="/image/avatar.avif"
            alt="头像"
            width="120"
            height="120"
            class="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover ring-4 ring-white dark:ring-gray-900 shadow-xl"
          />
          <div class="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-900 flex items-center justify-center">
            <span class="w-2 h-2 rounded-full bg-white" />
          </div>
        </div>
      </Motion>

      <!-- 姓名 + 简介 staggered 淡入 -->
      <Motion
        :initial="{ opacity: 0, y: 15 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.4, delay: 0.15 }"
        class="text-center"
      >
        <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
          {{ title }}
        </h1>
        <p class="text-base text-gray-500 dark:text-gray-400 max-w-md leading-relaxed">
          {{ description }}
        </p>
      </Motion>

      <!-- 联系方式 pill -->
      <Motion
        v-if="contactEmail"
        :initial="{ opacity: 0, y: 10 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.4, delay: 0.3 }"
      >
        <a
          :href="`mailto:${contactEmail}`"
          class="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400 hover:bg-primary-500/10 hover:text-primary-500 transition-colors duration-300"
        >
          <UIcon
            name="i-lucide-mail"
            class="w-4 h-4"
          />
          {{ contactEmail }}
        </a>
      </Motion>
    </div>

    <!-- ========== 工作经历 · 时间线 ========== -->
    <div class="py-12 bg-gray-50/80 dark:bg-gray-950/60 border-y border-gray-200 dark:border-gray-800">
      <UContainer>
        <Motion
          :initial="{ opacity: 0, y: 20 }"
          :while-in-view="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.5 }"
          :viewport="{ once: true, margin: '-60px' }"
          class="text-center mb-10"
        >
          <span class="inline-block text-xs font-semibold uppercase tracking-widest text-primary-500 mb-2">经历</span>
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
            工作经历
          </h2>
        </Motion>

        <!-- 时间线 -->
        <div class="relative max-w-2xl mx-auto">
          <!-- 竖线 -->
          <div class="absolute left-4 sm:left-6 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />

          <div class="flex flex-col gap-8">
            <div
              v-for="(v, i) in page.versions"
              :key="v.title"
              class="relative pl-10 sm:pl-14"
            >
              <!-- 时间线圆点 -->
              <Motion
                :initial="{ scale: 0 }"
                :while-in-view="{ scale: 1 }"
                :transition="{ type: 'spring', stiffness: 300, damping: 35, delay: i * 0.15 + 0.1 }"
                :viewport="{ once: true }"
                :class="[
                  'absolute left-2.5 sm:left-4.5 top-1 w-3 h-3 rounded-full ring-4 ring-white dark:ring-gray-900 z-10',
                  i === 0
                    ? 'bg-primary-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                ]"
              />

              <!-- 内容卡片 -->
              <Motion
                :initial="{ opacity: 0, x: 20 }"
                :while-in-view="{ opacity: 1, x: 0 }"
                :transition="{ type: 'spring', stiffness: 280, damping: 34, delay: i * 0.15 + 0.15 }"
                :viewport="{ once: true, margin: '-60px' }"
                class="bg-white dark:bg-gray-900 rounded-2xl p-5 ring-1 ring-gray-200 dark:ring-gray-800"
              >
                <div class="flex items-start justify-between gap-3 mb-2">
                  <h3 class="font-semibold text-gray-900 dark:text-white text-[15px]">
                    {{ v.title }}
                  </h3>
                  <span
                    :class="[
                      'shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
                      i === 0
                        ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                    ]"
                  >
                    {{ v.badge?.label }}
                  </span>
                </div>
                <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {{ v.description }}
                </p>
              </Motion>
            </div>
          </div>
        </div>
      </UContainer>
    </div>

    <!-- ========== 技术栈 ========== -->
    <UContainer>
      <Motion
        :initial="{ opacity: 0, y: 20 }"
        :while-in-view="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.5 }"
        :viewport="{ once: true, margin: '-60px' }"
      >
        <div class="py-14">
          <div class="text-center mb-10">
            <span class="inline-block text-xs font-semibold uppercase tracking-widest text-primary-500 mb-2">工具 & 框架</span>
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
              技术栈
            </h2>
          </div>
          <TechStack />
        </div>
      </Motion>
    </UContainer>

    <!-- ========== 联系方式 ========== -->
    <div
      v-if="contactEmail"
      class="bg-gray-50/80 dark:bg-gray-950/60 border-t border-gray-200 dark:border-gray-800"
    >
      <UContainer>
        <Motion
          :initial="{ opacity: 0, y: 20 }"
          :while-in-view="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.5 }"
          :viewport="{ once: true, margin: '-60px' }"
          class="py-14"
        >
          <div class="text-center mb-8">
            <span class="inline-block text-xs font-semibold uppercase tracking-widest text-primary-500 mb-2">联系</span>
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
              联系方式
            </h2>
          </div>

          <Motion
            :initial="{ opacity: 0, y: 15 }"
            :while-in-view="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.4, delay: 0.1 }"
            :viewport="{ once: true }"
            :while-hover="{ y: -2 }"
            class="max-w-sm mx-auto bg-white dark:bg-gray-900 rounded-2xl p-6 ring-1 ring-gray-200 dark:ring-gray-800 text-center hover:ring-primary-300 dark:hover:ring-primary-700 transition-all duration-300"
          >
            <div class="flex items-center justify-center gap-3">
              <UIcon
                name="i-lucide-mail"
                class="w-5 h-5 text-primary-500"
              />
              <a
                :href="`mailto:${contactEmail}`"
                class="text-primary-500 hover:text-primary-600 font-medium hover:underline"
              >
                {{ contactEmail }}
              </a>
            </div>
          </Motion>
        </Motion>
      </UContainer>
    </div>

    <!-- ========== Slogan ========== -->
    <UContainer>
      <Motion
        :initial="{ opacity: 0 }"
        :while-in-view="{ opacity: 1 }"
        :transition="{ duration: 0.6 }"
        :viewport="{ once: true, margin: '-60px' }"
        class="py-12 text-center"
      >
        <p class="text-sm text-gray-400 dark:text-gray-500 italic">
          Let's build something great together.
        </p>
      </Motion>
    </UContainer>
  </div>
</template>
