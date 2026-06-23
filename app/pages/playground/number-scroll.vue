<script setup lang="ts">
const title = '数字滚动动画'
const description = '高性能 GPU 加速数字滚动组件演示'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description
})

// 基础计数
const counter1 = ref(0)

let autoIncrementTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  autoIncrementTimer = setInterval(() => {
    counter1.value = +(counter1.value + 2.3).toFixed(1)
  }, 2000)
})

onUnmounted(() => {
  if (autoIncrementTimer) {
    clearInterval(autoIncrementTimer)
    autoIncrementTimer = null
  }
})

// 实时数据
const visits = ref(12345)
const pageviews = ref(56789)
const conversion = ref(3.21)

const simulateUpdate = () => {
  visits.value += Math.floor(Math.random() * 1000)
  pageviews.value += Math.floor(Math.random() * 2000)
  conversion.value = +(Math.random() * 10).toFixed(2)
}
</script>

<template>
  <UContainer>
    <UPageBody>
      <!-- 紧凑顶栏 -->
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-10">
        <div>
          <h1 class="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            数字滚动动画
          </h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            高性能 GPU 加速数字滚动效果，使用 CSS transform 实现 60fps 流畅过渡
          </p>
        </div>
        <div class="flex items-center gap-2">
          <UButton
            icon="i-lucide-code"
            size="xs"
            color="neutral"
            variant="ghost"
            to="https://github.com/qibmz/blog/blob/main/app/components/demo/NumberScroll.vue"
            target="_blank"
          />
          <UButton
            icon="i-lucide-arrow-left"
            size="xs"
            color="neutral"
            variant="ghost"
            to="/blog/number-scroll-animation"
          >
            文章
          </UButton>
        </div>
      </div>

      <div class="space-y-12">
        <!-- 基础演示：数字作为主角 -->
        <section>
          <div class="rounded-2xl border border-slate-200/60 bg-white dark:border-slate-800/60 dark:bg-slate-950 overflow-hidden">
            <!-- 大数字展示区 -->
            <div class="px-6 sm:px-10 py-10 sm:py-14 flex flex-col items-center gap-8">
              <div class="text-6xl sm:text-8xl font-black font-mono tabular-nums tracking-tighter text-slate-900 dark:text-white select-none">
                <DemoNumberScroll
                  :value="counter1"
                  :duration="800"
                />
              </div>

              <!-- 控制按钮 -->
              <div class="flex flex-wrap items-center justify-center gap-2.5">
                <UButton
                  color="neutral"
                  variant="outline"
                  size="sm"
                  @click="counter1 += 100"
                >
                  +100
                </UButton>
                <UButton
                  color="neutral"
                  variant="outline"
                  size="sm"
                  @click="counter1 += 1000"
                >
                  +1,000
                </UButton>
                <div class="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  @click="counter1 = 0"
                >
                  重置
                </UButton>
              </div>
            </div>

            <!-- 底栏提示 -->
            <div class="px-6 py-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
              <p class="text-[11px] text-slate-400 dark:text-slate-500 text-center font-medium">
                每 2 秒自动增加 2.3 — 点击按钮手动改变数值
              </p>
            </div>
          </div>
        </section>

        <!-- 实时数据面板 -->
        <section>
          <h2 class="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
            多指标数据面板
          </h2>
          <div class="rounded-2xl border border-slate-200/60 bg-white dark:border-slate-800/60 dark:bg-slate-950 overflow-hidden">
            <div class="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800/80">
              <!-- 访客数 -->
              <div class="p-6 sm:p-7 flex flex-col gap-3">
                <span class="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  访客数
                </span>
                <div class="text-4xl sm:text-5xl font-black font-mono tabular-nums text-purple-600 dark:text-purple-400">
                  <DemoNumberScroll
                    :value="visits"
                    :duration="600"
                  />
                </div>
                <span class="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  月度访问人数
                </span>
              </div>

              <!-- 浏览量 -->
              <div class="p-6 sm:p-7 flex flex-col gap-3">
                <span class="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  浏览量
                </span>
                <div class="text-4xl sm:text-5xl font-black font-mono tabular-nums text-pink-600 dark:text-pink-400">
                  <DemoNumberScroll
                    :value="pageviews"
                    :duration="600"
                  />
                </div>
                <span class="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  总页面浏览次数
                </span>
              </div>

              <!-- 转化率 -->
              <div class="p-6 sm:p-7 flex flex-col gap-3">
                <span class="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  转化率
                </span>
                <div class="flex items-baseline gap-1">
                  <span class="text-4xl sm:text-5xl font-black font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
                    <DemoNumberScroll
                      :value="conversion"
                      :duration="800"
                    />
                  </span>
                  <span class="text-lg font-bold text-slate-400 dark:text-slate-500">%</span>
                </div>
                <span class="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  用户转化百分比
                </span>
              </div>
            </div>

            <div class="px-6 py-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex justify-center">
              <UButton
                icon="i-lucide-refresh-cw"
                size="sm"
                color="neutral"
                variant="ghost"
                @click="simulateUpdate"
              >
                模拟数据更新
              </UButton>
            </div>
          </div>
        </section>

        <!-- 性能对比 + 特性 -->
        <section>
          <h2 class="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
            性能与特性
          </h2>
          <div class="rounded-2xl border border-slate-200/60 bg-white dark:border-slate-800/60 dark:bg-slate-950 overflow-hidden">
            <!-- 性能对比表 -->
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-slate-100 dark:border-slate-800/80">
                    <th class="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      实现方式
                    </th>
                    <th class="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      FPS
                    </th>
                    <th class="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      内存泄漏
                    </th>
                    <th class="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      响应性
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-50 dark:divide-slate-900">
                  <tr>
                    <td class="px-5 py-3 font-medium text-slate-600 dark:text-slate-300">
                      margin 修改
                    </td>
                    <td class="px-5 py-3 font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      30–45
                    </td>
                    <td class="px-5 py-3">
                      <span class="text-[11px] font-bold text-red-500 dark:text-red-400">存在</span>
                    </td>
                    <td class="px-5 py-3">
                      <span class="text-[11px] font-bold text-amber-500 dark:text-amber-400">中等</span>
                    </td>
                  </tr>
                  <tr>
                    <td class="px-5 py-3 font-medium text-slate-600 dark:text-slate-300">
                      position 修改
                    </td>
                    <td class="px-5 py-3 font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      45–55
                    </td>
                    <td class="px-5 py-3">
                      <span class="text-[11px] font-bold text-red-500 dark:text-red-400">存在</span>
                    </td>
                    <td class="px-5 py-3">
                      <span class="text-[11px] font-bold text-amber-500 dark:text-amber-400">中等</span>
                    </td>
                  </tr>
                  <tr class="bg-emerald-50/50 dark:bg-emerald-900/10">
                    <td class="px-5 py-3 font-bold text-emerald-700 dark:text-emerald-400">
                      transform（本组件）
                    </td>
                    <td class="px-5 py-3 font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                      55–60
                    </td>
                    <td class="px-5 py-3">
                      <span class="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">无</span>
                    </td>
                    <td class="px-5 py-3">
                      <span class="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">优秀</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 特性标签 -->
            <div class="px-5 py-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-2">
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 text-[11px] font-bold text-slate-600 dark:text-slate-400 ring-1 ring-slate-100 dark:ring-slate-800">
                <UIcon
                  name="i-lucide-timer"
                  class="w-3 h-3"
                />
                自动清理定时器
              </span>
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 text-[11px] font-bold text-slate-600 dark:text-slate-400 ring-1 ring-slate-100 dark:ring-slate-800">
                <UIcon
                  name="i-lucide-sigma"
                  class="w-3 h-3"
                />
                支持小数点
              </span>
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 text-[11px] font-bold text-slate-600 dark:text-slate-400 ring-1 ring-slate-100 dark:ring-slate-800">
                <UIcon
                  name="i-lucide-zap"
                  class="w-3 h-3"
                />
                GPU 加速
              </span>
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 text-[11px] font-bold text-slate-600 dark:text-slate-400 ring-1 ring-slate-100 dark:ring-slate-800">
                <UIcon
                  name="i-lucide-refresh-cw"
                  class="w-3 h-3"
                />
                快速更新
              </span>
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 text-[11px] font-bold text-slate-600 dark:text-slate-400 ring-1 ring-slate-100 dark:ring-slate-800">
                <UIcon
                  name="i-lucide-code-2"
                  class="w-3 h-3"
                />
                完整类型
              </span>
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 text-[11px] font-bold text-slate-600 dark:text-slate-400 ring-1 ring-slate-100 dark:ring-slate-800">
                <UIcon
                  name="i-lucide-sliders"
                  class="w-3 h-3"
                />
                可自定义时长
              </span>
            </div>
          </div>
        </section>
      </div>
    </UPageBody>
  </UContainer>
</template>
