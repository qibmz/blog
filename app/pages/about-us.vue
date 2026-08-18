<script setup lang="ts">
const { data: page } = await useAsyncData('aboutUs', () => queryCollection('aboutUs').first())

const title = page.value?.title || '关于我'
const description = page.value?.description || ''
const seoTitle = page.value?.seo?.title || title
const seoDescription = page.value?.seo?.description || description

useSeoMeta({
  titleTemplate: '',
  title: seoTitle,
  ogTitle: seoTitle,
  description: seoDescription,
  ogDescription: seoDescription
})

const githubUrl = 'https://github.com/qibmz'
const contactEmail = (page.value as unknown as { contact?: { email?: string } })?.contact?.email || '1583326640@qq.com'
</script>

<template>
  <div
    v-if="page"
    class="relative min-h-screen bg-[#F6F8FB] text-slate-900 dark:bg-gray-950 dark:text-gray-100"
  >
    <!-- 延续全站氛围的光斑 -->
    <div
      class="pointer-events-none absolute inset-x-0 top-0 -z-1 h-[1600px] overflow-hidden"
      aria-hidden="true"
    >
      <div class="absolute left-1/2 top-[-10%] size-[900px] -translate-x-1/2 rounded-full bg-primary-400/10 blur-[140px] dark:bg-primary-500/15" />
      <div class="absolute -left-40 top-[420px] size-[600px] rounded-full bg-primary-300/10 blur-[120px] dark:bg-primary-400/10" />
      <div class="absolute -right-40 top-[900px] size-[700px] rounded-full bg-primary-500/10 blur-[130px] dark:bg-primary-600/10" />
    </div>

    <!-- 全页极淡网格线，向下渐隐 -->
    <div
      class="pointer-events-none absolute inset-0 -z-1 bg-[linear-gradient(to_right,rgb(148_163_184/0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgb(148_163_184/0.07)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent_92%)]"
      aria-hidden="true"
    />

    <!-- ========== HERO 个人名片 ========== -->
    <section class="relative z-10 overflow-hidden pt-16 pb-10">
      <!-- 顶部渐变横幅 -->
      <div
        class="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-linear-to-b from-primary-500/[0.07] via-primary-400/[0.03] to-transparent dark:from-primary-500/10 dark:via-primary-400/[0.04]"
        aria-hidden="true"
      />
      <!-- 点阵纹理 -->
      <div
        class="pointer-events-none absolute inset-x-0 top-0 h-[520px] opacity-70 [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)] dark:opacity-30"
        aria-hidden="true"
        style="background-image: radial-gradient(currentColor 1px, transparent 1px); background-size: 22px 22px; color: rgb(100 116 139 / 0.4);"
      />
      <!-- 水印文字 -->
      <span
        class="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 select-none font-mono text-[26vw] sm:text-[11rem] font-bold leading-none text-slate-900/[0.03] dark:text-white/[0.04]"
        aria-hidden="true"
      >
        about.me
      </span>

      <UContainer>
        <div class="flex flex-col items-center">
          <!-- 头像 + 渐变光环 spring 弹入 -->
          <Motion
            :initial="{ opacity: 0, scale: 0.8 }"
            :animate="{ opacity: 1, scale: 1 }"
            :transition="{ type: 'spring', stiffness: 200, damping: 15 }"
          >
            <div class="relative group mb-8">
              <!-- 装饰圆环 -->
              <div
                class="absolute -inset-4 rounded-full border border-dashed border-slate-300/70 dark:border-white/15"
                aria-hidden="true"
              />
              <div
                class="absolute -inset-8 rounded-full border border-primary-300/20 dark:border-primary-400/15"
                aria-hidden="true"
              />
              <div class="absolute -inset-1.5 rounded-full bg-linear-to-r from-primary-500 via-purple-500 to-pink-500 opacity-50 blur-lg group-hover:opacity-75 transition-opacity duration-500" />
              <NuxtImg
                src="/image/avatar.avif"
                alt="qibmz 头像"
                width="120"
                height="120"
                class="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover ring-4 ring-white dark:ring-gray-900 shadow-xl"
              />
              <div class="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-900 flex items-center justify-center">
                <span class="w-2 h-2 rounded-full bg-white" />
              </div>
            </div>
          </Motion>

          <!-- 姓名 + 简介 -->
          <ScrollReveal
            mode="load"
            variant="soft"
            :delay="0.15"
            class="text-center"
          >
            <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              {{ title }}
            </h1>
            <p class="text-base text-gray-500 dark:text-gray-400 max-w-md leading-relaxed">
              {{ description }}
            </p>
          </ScrollReveal>

          <!-- 社交入口 -->
          <ScrollReveal
            mode="load"
            variant="soft"
            :delay="0.25"
            class="mt-6 flex items-center justify-center gap-2"
          >
            <UButton
              :to="githubUrl"
              target="_blank"
              size="md"
              color="neutral"
              variant="ghost"
              icon="i-simple-icons-github"
              aria-label="GitHub"
              class="min-h-11 min-w-11 rounded-xl text-slate-800 hover:bg-white/70 dark:text-white dark:hover:bg-white/10"
            />
            <UButton
              :to="`mailto:${contactEmail}`"
              size="md"
              color="neutral"
              variant="ghost"
              icon="i-lucide-mail"
              aria-label="发送邮件"
              class="min-h-11 min-w-11 rounded-xl text-slate-800 hover:bg-white/70 dark:text-white dark:hover:bg-white/10"
            />
          </ScrollReveal>
        </div>
      </UContainer>
    </section>

    <!-- ========== 工作经历 · 时间线 ========== -->
    <section
      aria-labelledby="experience-title"
      class="relative py-12 md:py-14"
    >
      <!-- 代码符号水印 -->
      <span
        class="pointer-events-none absolute left-2 top-24 hidden select-none font-mono text-[9rem] font-bold leading-none text-slate-900/[0.03] lg:block dark:text-white/[0.04]"
        aria-hidden="true"
      >
        &lt;/&gt;
      </span>

      <UContainer>
        <ScrollReveal
          variant="soft"
          class="relative mb-8"
        >
          <span
            class="pointer-events-none absolute -top-6 right-0 hidden select-none font-mono text-6xl font-bold text-slate-900/[0.04] md:block dark:text-white/[0.04]"
            aria-hidden="true"
          >
            01
          </span>
          <p class="mb-2 flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-primary-600 dark:text-primary-400">
            <span class="text-slate-400 dark:text-gray-500">//</span> 经历
          </p>
          <h2
            id="experience-title"
            class="text-3xl font-bold text-slate-950 dark:text-white"
          >
            工作经历
          </h2>
        </ScrollReveal>

        <!-- 时间线（移动端单列靠左，桌面端左右交错） -->
        <div class="relative mx-auto max-w-5xl">
          <!-- 竖线 -->
          <div class="absolute left-4 sm:left-6 lg:left-1/2 top-0 bottom-0 w-px bg-slate-200 dark:bg-white/10 lg:-translate-x-1/2" />

          <div class="flex flex-col gap-8 lg:gap-12">
            <div
              v-for="(v, i) in page.versions ?? []"
              :key="v.title"
              class="relative lg:grid lg:grid-cols-2 lg:gap-14"
            >
              <!-- 时间线圆点 -->
              <Motion
                :initial="{ scale: 0 }"
                :while-in-view="{ scale: 1 }"
                :transition="{ type: 'spring', stiffness: 300, damping: 35, delay: i * 0.1 + 0.1 }"
                :viewport="{ once: true }"
                :class="[
                  'absolute left-2.5 sm:left-4.5 lg:left-1/2 top-1 w-3 h-3 rounded-full ring-4 ring-white dark:ring-gray-950 z-10 lg:-translate-x-1/2',
                  i === 0
                    ? 'bg-primary-500'
                    : 'bg-slate-300 dark:bg-gray-600'
                ]"
              />

              <!-- 内容卡片 -->
              <div
                :class="[
                  'pl-10 sm:pl-14 lg:pl-0',
                  i % 2 === 0 ? 'lg:col-start-1' : 'lg:col-start-2'
                ]"
              >
                <ScrollReveal :delay="0.08 * i">
                  <article
                    class="group overflow-hidden rounded-2xl border border-slate-200/70 bg-white/60 backdrop-blur-md transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-lg dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-primary-400/40 dark:hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.35)]"
                  >
                    <!-- 封面图 -->
                    <div
                      v-if="v.image"
                      class="relative aspect-video overflow-hidden"
                    >
                      <NuxtImg
                        :src="v.image"
                        :alt="v.title"
                        loading="lazy"
                        width="640"
                        height="360"
                        class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div
                        class="absolute inset-0 bg-linear-to-t from-slate-950/45 via-transparent to-transparent"
                        aria-hidden="true"
                      />
                      <span
                        v-if="v.badge?.label"
                        class="absolute top-3 right-3 inline-flex items-center rounded-full bg-slate-950/55 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm"
                      >
                        {{ v.badge.label }}
                      </span>
                    </div>

                    <div class="p-5 md:p-6">
                      <div class="flex items-start justify-between gap-3 mb-2">
                        <h3 class="font-semibold text-gray-900 dark:text-white text-[15px]">
                          {{ v.title }}
                        </h3>
                        <span
                          v-if="!v.image && v.badge?.label"
                          :class="[
                            'shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
                            i === 0
                              ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                          ]"
                        >
                          {{ v.badge.label }}
                        </span>
                      </div>
                      <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        {{ v.description }}
                      </p>

                      <!-- 工作亮点 -->
                      <ul
                        v-if="v.highlights?.length"
                        class="mt-4 flex flex-col gap-2"
                      >
                        <li
                          v-for="h in v.highlights"
                          :key="h"
                          class="flex items-start gap-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300"
                        >
                          <UIcon
                            name="i-lucide-circle-check"
                            class="mt-0.5 size-4 shrink-0 text-primary-500"
                          />
                          <span>{{ h }}</span>
                        </li>
                      </ul>

                      <!-- 技能标签 -->
                      <div
                        v-if="v.tags?.length"
                        class="mt-4 flex flex-wrap gap-1.5"
                      >
                        <span
                          v-for="t in v.tags"
                          :key="t"
                          class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-gray-200/80 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10"
                        >
                          {{ t }}
                        </span>
                      </div>
                    </div>
                  </article>
                </ScrollReveal>
              </div>
            </div>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- ========== 技术栈 ========== -->
    <section
      aria-labelledby="stack-title"
      class="relative py-12 md:py-14"
    >
      <UContainer>
        <ScrollReveal variant="scale">
          <div class="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/40 p-6 backdrop-blur-md md:p-8 dark:border-white/10 dark:bg-white/[0.02]">
            <DecorCorners />
            <!-- 点阵纹理（与首页名片卡一致） -->
            <div
              class="pointer-events-none absolute inset-0 -z-1 opacity-[0.35] [mask-image:linear-gradient(to_bottom,black,transparent)] dark:opacity-[0.12]"
              aria-hidden="true"
              style="background-image: radial-gradient(currentColor 1px, transparent 1px); background-size: 16px 16px; color: rgb(100 116 139);"
            />
            <span
              class="pointer-events-none absolute -bottom-10 -right-6 hidden select-none font-mono text-7xl font-bold text-slate-900/[0.03] md:block dark:text-white/[0.04]"
              aria-hidden="true"
            >
              02
            </span>
            <div class="relative mb-7">
              <p class="mb-2 flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-primary-600 dark:text-primary-400">
                <span class="text-slate-400 dark:text-gray-500">//</span> 工具 & 框架
              </p>
              <h2
                id="stack-title"
                class="text-3xl font-bold text-slate-950 dark:text-white"
              >
                技术栈
              </h2>
            </div>
            <TechStack />
          </div>
        </ScrollReveal>
      </UContainer>
    </section>

    <!-- ========== 联系 ========== -->
    <section
      aria-labelledby="contact-title"
      class="relative py-12 pb-16 md:py-14 md:pb-20"
    >
      <UContainer>
        <ScrollReveal
          variant="scale"
          class="relative mx-auto max-w-2xl"
        >
          <span
            class="pointer-events-none absolute -top-8 right-2 hidden select-none font-mono text-5xl font-bold text-slate-900/[0.05] md:block dark:text-white/[0.06]"
            aria-hidden="true"
          >
            03
          </span>
          <div class="relative overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-200/70 shadow-2xl shadow-slate-200/20 dark:bg-slate-950 dark:ring-white/10 dark:shadow-primary-900/20">
            <div class="pointer-events-none absolute inset-0 -z-1">
              <div class="absolute left-1/2 top-1/2 size-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-500/25 blur-[110px]" />
              <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_55%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_55%)]" />
              <div class="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:20px_20px] opacity-20 dark:opacity-40" />
            </div>

            <!-- 终端标题栏 -->
            <div class="relative flex items-center gap-2 border-b border-slate-200/70 bg-slate-900/[0.03] px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
              <span class="size-2.5 rounded-full bg-red-400/80" />
              <span class="size-2.5 rounded-full bg-amber-400/80" />
              <span class="size-2.5 rounded-full bg-emerald-400/80" />
              <span class="ml-2 font-mono text-xs text-slate-400">contact.sh</span>
            </div>

            <div class="relative px-6 py-10 text-center md:px-12 md:py-12">
              <p class="font-mono text-xs text-primary-700 dark:text-primary-300">
                <span class="text-emerald-400">$</span> ./contact --me<span
                  class="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-primary-300 align-middle"
                  aria-hidden="true"
                />
              </p>
              <h2
                id="contact-title"
                class="mt-3 text-2xl font-bold text-slate-900 dark:text-white md:text-3xl"
              >
                一起做点有意思的东西
              </h2>
              <p class="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600 dark:text-slate-300">
                无论是技术交流、项目合作还是随便聊聊，欢迎通过下面的方式找到我。
              </p>
              <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
                <UButton
                  :to="`mailto:${contactEmail}`"
                  size="lg"
                  color="primary"
                  variant="solid"
                  icon="i-lucide-mail"
                  class="min-h-11 rounded-xl px-6 shadow-[0_0_30px_-8px_rgba(59,130,246,0.6)]"
                >
                  发邮件给我
                </UButton>
                <UButton
                  :to="githubUrl"
                  target="_blank"
                  size="lg"
                  color="neutral"
                  variant="outline"
                  icon="i-simple-icons-github"
                  class="min-h-11 rounded-xl border-slate-200/70 px-6 text-slate-900 hover:bg-slate-100 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
                >
                  GitHub
                </UButton>
              </div>
              <p class="mt-8 font-mono text-[11px] text-slate-500">
                <span class="text-emerald-400">➜</span> 响应速度：通常 24 小时内回复
              </p>
            </div>
          </div>
        </ScrollReveal>
      </UContainer>
    </section>
  </div>
</template>
