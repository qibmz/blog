<script setup lang="ts">
const title = '前端组件演示 Playground：数字滚动、币安 K 线、图片热区与海报设计器'
const description = 'Vue / Nuxt 在线演示合集，包含数字滚动动画、Binance 实时 K 线、图片热区编辑器和海报设计器，可直接试用并导出 JSON 配置。'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description
})
</script>

<template>
  <UContainer>
    <UPageBody>
      <!-- 顶栏：标题 + 说明 -->
      <div class="flex items-end justify-between gap-4 mb-8 sm:mb-10">
        <div>
          <h1 class="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            Playground
          </h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            组件实验室 — 交互式演示与技术探索
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <!-- 数字滚动动画卡片 -->
        <NuxtLink
          to="/playground/number-scroll"
          class="group block overflow-hidden rounded-2xl border border-slate-200/60 bg-white dark:border-slate-800/60 dark:bg-slate-950 transition-shadow hover:shadow-md"
        >
          <!-- 卡片预览区：模拟数字滚动效果 -->
          <div class="px-6 pt-8 pb-6 bg-slate-50/50 dark:bg-slate-900/30">
            <div class="flex items-baseline gap-2 font-mono">
              <span class="text-4xl sm:text-5xl font-black tabular-nums tracking-tighter text-slate-900 dark:text-white">
                12,345
              </span>
              <span class="text-lg font-bold text-emerald-500 tabular-nums">
                +2.3%
              </span>
            </div>
            <div class="mt-3 flex items-center gap-1.5">
              <span class="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                GPU 加速 · 60fps
              </span>
            </div>
          </div>

          <!-- 卡片信息区 -->
          <div class="px-6 py-5 border-t border-slate-100 dark:border-slate-800/80">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 shrink-0 group-hover:scale-110 transition-transform duration-300">
                <UIcon
                  name="i-lucide-bar-chart-3"
                  class="w-4.5 h-4.5 text-purple-600 dark:text-purple-400"
                />
              </div>
              <div class="min-w-0">
                <h3 class="text-sm font-black text-slate-900 dark:text-white">
                  数字滚动动画
                </h3>
                <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                  高性能 GPU 加速数字滚动效果
                </p>
              </div>
              <UIcon
                name="i-lucide-arrow-right"
                class="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 group-hover:translate-x-1 transition-transform"
              />
            </div>
          </div>
        </NuxtLink>

        <!-- 图片热区卡片 -->
        <NuxtLink
          to="/playground/image-hotspot"
          class="group block overflow-hidden rounded-2xl border border-slate-200/60 bg-white dark:border-slate-800/60 dark:bg-slate-950 transition-shadow hover:shadow-md"
        >
          <div class="px-6 pt-8 pb-6 bg-slate-50/50 dark:bg-slate-900/30">
            <div class="relative h-16 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 overflow-hidden">
              <div class="absolute left-[12%] top-[28%] w-[22%] h-[36%] rounded border-2 border-sky-500/80 bg-sky-400/20" />
              <div class="absolute right-[18%] top-[20%] w-[16%] h-[16%] rounded-full border-2 border-amber-400/80 bg-amber-400/20" />
              <div class="absolute left-[40%] bottom-[18%] w-[28%] h-[22%] rounded border-2 border-emerald-400/70 bg-emerald-400/15" />
            </div>
            <div class="mt-3 flex items-center gap-1.5">
              <span class="h-1.5 w-1.5 rounded-full bg-sky-400" />
              <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Rect · Circle · Polygon
              </span>
            </div>
          </div>

          <div class="px-6 py-5 border-t border-slate-100 dark:border-slate-800/80">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-9 h-9 rounded-lg bg-sky-100 dark:bg-sky-900/30 shrink-0 group-hover:scale-110 transition-transform duration-300">
                <UIcon
                  name="i-lucide-image-plus"
                  class="w-4.5 h-4.5 text-sky-600 dark:text-sky-400"
                />
              </div>
              <div class="min-w-0">
                <h3 class="text-sm font-black text-slate-900 dark:text-white">
                  图片热区编辑器
                </h3>
                <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                  拖拽绘制热区并导出百分比 JSON
                </p>
              </div>
              <UIcon
                name="i-lucide-arrow-right"
                class="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 group-hover:translate-x-1 transition-transform"
              />
            </div>
          </div>
        </NuxtLink>

        <!-- 海报设计器卡片 -->
        <NuxtLink
          to="/playground/poster-designer"
          class="group block overflow-hidden rounded-2xl border border-slate-200/60 bg-white dark:border-slate-800/60 dark:bg-slate-950 transition-shadow hover:shadow-md"
        >
          <div class="px-6 pt-8 pb-6 bg-slate-50/50 dark:bg-slate-900/30">
            <div class="relative h-16 rounded-lg bg-gradient-to-br from-violet-200/80 to-amber-100 dark:from-violet-900/40 dark:to-slate-800 overflow-hidden">
              <div class="absolute left-[14%] top-[22%] w-[42%] h-[18%] rounded-sm bg-slate-900/80" />
              <div class="absolute right-[16%] bottom-[16%] w-[28%] h-[36%] rounded border border-violet-400/70 bg-violet-300/30" />
              <div class="absolute left-[14%] bottom-[20%] w-[34%] h-[2px] bg-amber-500/80" />
            </div>
            <div class="mt-3 flex items-center gap-1.5">
              <span class="h-1.5 w-1.5 rounded-full bg-violet-400" />
              <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Text · Image · Canvas
              </span>
            </div>
          </div>

          <div class="px-6 py-5 border-t border-slate-100 dark:border-slate-800/80">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 shrink-0 group-hover:scale-110 transition-transform duration-300">
                <UIcon
                  name="i-lucide-layout-template"
                  class="w-4.5 h-4.5 text-violet-600 dark:text-violet-400"
                />
              </div>
              <div class="min-w-0">
                <h3 class="text-sm font-black text-slate-900 dark:text-white">
                  海报设计器
                </h3>
                <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                  文字/图片图层，C 端 Canvas 渲染
                </p>
              </div>
              <UIcon
                name="i-lucide-arrow-right"
                class="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 group-hover:translate-x-1 transition-transform"
              />
            </div>
          </div>
        </NuxtLink>

        <!-- K线图表卡片 -->
        <NuxtLink
          to="/playground/kline-chart-binance"
          class="group block overflow-hidden rounded-2xl border border-slate-200/60 bg-white dark:border-slate-800/60 dark:bg-slate-950 transition-shadow hover:shadow-md"
        >
          <!-- 卡片预览区：模拟交易终端数据 -->
          <div class="px-6 pt-8 pb-6 bg-slate-50/50 dark:bg-slate-900/30">
            <div class="flex items-baseline gap-3 font-mono">
              <span class="text-4xl sm:text-5xl font-black tabular-nums tracking-tighter text-slate-900 dark:text-white">
                602.63
              </span>
              <span class="text-sm font-bold text-slate-400 dark:text-slate-500">
                USDT
              </span>
            </div>
            <div class="mt-3 flex items-center gap-3">
              <div class="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider">
                <span class="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                  买
                </span>
                <span class="text-slate-400 dark:text-slate-500">
                  0.049
                </span>
              </div>
              <span class="h-3 w-px bg-slate-200 dark:bg-slate-700" />
              <span class="relative flex h-2 w-2">
                <span class="absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-400 animate-ping" />
                <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                实时
              </span>
            </div>
          </div>

          <!-- 卡片信息区 -->
          <div class="px-6 py-5 border-t border-slate-100 dark:border-slate-800/80">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 shrink-0 group-hover:scale-110 transition-transform duration-300">
                <UIcon
                  name="i-lucide-chart-candlestick"
                  class="w-4.5 h-4.5 text-amber-600 dark:text-amber-400"
                />
              </div>
              <div class="min-w-0">
                <h3 class="text-sm font-black text-slate-900 dark:text-white">
                  K线图表
                </h3>
                <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                  币安 WebSocket 实时 K 线数据
                </p>
              </div>
              <UIcon
                name="i-lucide-arrow-right"
                class="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 group-hover:translate-x-1 transition-transform"
              />
            </div>
          </div>
        </NuxtLink>
      </div>
    </UPageBody>
  </UContainer>
</template>
