<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const title = '数字滚动动画试炼场'
const description = '高性能数字滚动动画组件的交互式演示'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description
})

// 基础计数
const counter1 = ref(0)

// 自动递增定时器
let autoIncrementTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  // 每秒增加 2.3
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
    <UPageHeader
      title="🎚️ 数字滚动动画"
      description="高性能数字滚动组件的交互式演示"
      class="py-12.5"
    >
      <template #links>
        <NuxtLink to="/blog/number-scroll-animation">
          <UButton
            icon="i-lucide-arrow-left"
            label="返回文章"
          />
        </NuxtLink>
      </template>
    </UPageHeader>

    <UPageBody>
      <div class="space-y-12">
        <!-- 基础计数演示 -->
        <div class="space-y-4">
          <h2 class="text-2xl font-bold">
            基础计数演示
          </h2>
          <div class="flex flex-col md:flex-row justify-center items-center md:items-center gap-4 md:gap-8 p-4 md:p-8 bg-linear-to-br from-primary-500/10 to-purple-500/10 rounded-2xl ring-1 ring-primary-500/20">
            <div class="text-4xl md:text-6xl font-bold">
              <NumberScroll
                :value="counter1"
                :duration="800"
              />
            </div>
            <div class="space-y-3 w-full md:w-auto">
              <UButton
                color="primary"
                size="lg"
                class="w-full md:w-32"
                @click="counter1 += 100"
              >
                +100
              </UButton>
              <UButton
                color="primary"
                size="lg"
                class="w-full md:w-32"
                variant="outline"
                @click="counter1 += 1000"
              >
                +1000
              </UButton>
              <UButton
                color="neutral"
                size="lg"
                class="w-full md:w-32"
                @click="counter1 = 0"
              >
                重置
              </UButton>
            </div>
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400">
            💡 提示：数字每秒自动增加 2.3，点击按钮可手动改变数值
          </div>
        </div>

        <!-- 实时数据面板 -->
        <div class="space-y-4">
          <h2 class="text-2xl font-bold">
            实时数据演示
          </h2>
          <div class="p-8 bg-linear-to-br from-purple-500/10 to-pink-500/10 rounded-2xl ring-1 ring-purple-500/20 space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <!-- 访客数 -->
              <div class="p-6 bg-white dark:bg-gray-900 rounded-xl ring-1 ring-gray-200 dark:ring-gray-800">
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium">
                  👥 访客数
                </p>
                <div class="text-4xl font-bold text-purple-500 mb-2">
                  <NumberScroll
                    :value="visits"
                    :duration="600"
                  />
                </div>
                <p class="text-xs text-gray-500">
                  这个月的访问人数
                </p>
              </div>

              <!-- 浏览量 -->
              <div class="p-6 bg-white dark:bg-gray-900 rounded-xl ring-1 ring-gray-200 dark:ring-gray-800">
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium">
                  📊 浏览量
                </p>
                <div class="text-4xl font-bold text-pink-500 mb-2">
                  <NumberScroll
                    :value="pageviews"
                    :duration="600"
                  />
                </div>
                <p class="text-xs text-gray-500">
                  总页面浏览次数
                </p>
              </div>

              <!-- 转化率 -->
              <div class="p-6 bg-white dark:bg-gray-900 rounded-xl ring-1 ring-gray-200 dark:ring-gray-800">
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium">
                  📈 转化率
                </p>
                <div class="text-4xl font-bold text-indigo-500 mb-2">
                  <NumberScroll
                    :value="conversion"
                    :duration="800"
                  />
                </div>
                <p class="text-xs text-gray-500">
                  用户转化百分比(%)
                </p>
              </div>
            </div>

            <UButton
              color="primary"
              size="lg"
              class="w-full"
              icon="i-lucide-refresh-cw"
              @click="simulateUpdate"
            >
              模拟数据更新
            </UButton>
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400">
            💡 提示：点击按钮随机生成新的数据，每次更新会触发动画
          </div>
        </div>

        <!-- 性能对比 -->
        <div class="space-y-4">
          <h2 class="text-2xl font-bold">
            性能对比
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th class="px-4 py-3 text-left font-semibold">
                    实现方式
                  </th>
                  <th class="px-4 py-3 text-left font-semibold">
                    FPS
                  </th>
                  <th class="px-4 py-3 text-left font-semibold">
                    内存泄漏
                  </th>
                  <th class="px-4 py-3 text-left font-semibold">
                    响应性
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td class="px-4 py-3">
                    margin 修改
                  </td>
                  <td class="px-4 py-3">
                    30-45
                  </td>
                  <td class="px-4 py-3">
                    ⚠️ 有
                  </td>
                  <td class="px-4 py-3">
                    ⚠️ 中等
                  </td>
                </tr>
                <tr>
                  <td class="px-4 py-3">
                    position 修改
                  </td>
                  <td class="px-4 py-3">
                    45-55
                  </td>
                  <td class="px-4 py-3">
                    ⚠️ 有
                  </td>
                  <td class="px-4 py-3">
                    ⚠️ 中等
                  </td>
                </tr>
                <tr class="bg-green-50 dark:bg-green-900/20">
                  <td class="px-4 py-3 font-semibold text-green-700 dark:text-green-400">
                    transform（本组件）
                  </td>
                  <td class="px-4 py-3 font-semibold text-green-700 dark:text-green-400">
                    55-60
                  </td>
                  <td class="px-4 py-3 font-semibold text-green-700 dark:text-green-400">
                    ✅ 无
                  </td>
                  <td class="px-4 py-3 font-semibold text-green-700 dark:text-green-400">
                    ✅ 优秀
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 关键特性 -->
        <div class="space-y-4">
          <h2 class="text-2xl font-bold">
            关键特性
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 bg-white dark:bg-gray-900 rounded-xl ring-1 ring-gray-200 dark:ring-gray-800 space-y-2">
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-lucide-check"
                  class="w-5 h-5 text-green-500"
                />
                <span class="font-semibold">自动清理定时器</span>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                无内存泄漏风险
              </p>
            </div>

            <div class="p-4 bg-white dark:bg-gray-900 rounded-xl ring-1 ring-gray-200 dark:ring-gray-800 space-y-2">
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-lucide-check"
                  class="w-5 h-5 text-green-500"
                />
                <span class="font-semibold">支持小数点</span>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                适合价格、数率等场景
              </p>
            </div>

            <div class="p-4 bg-white dark:bg-gray-900 rounded-xl ring-1 ring-gray-200 dark:ring-gray-800 space-y-2">
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-lucide-check"
                  class="w-5 h-5 text-green-500"
                />
                <span class="font-semibold">GPU 加速</span>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                使用 transform 实现高性能
              </p>
            </div>

            <div class="p-4 bg-white dark:bg-gray-900 rounded-xl ring-1 ring-gray-200 dark:ring-gray-800 space-y-2">
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-lucide-check"
                  class="w-5 h-5 text-green-500"
                />
                <span class="font-semibold">快速更新</span>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                智能处理连续数据更新
              </p>
            </div>

            <div class="p-4 bg-white dark:bg-gray-900 rounded-xl ring-1 ring-gray-200 dark:ring-gray-800 space-y-2">
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-lucide-check"
                  class="w-5 h-5 text-green-500"
                />
                <span class="font-semibold">完整类型</span>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                TypeScript 完整提示
              </p>
            </div>

            <div class="p-4 bg-white dark:bg-gray-900 rounded-xl ring-1 ring-gray-200 dark:ring-gray-800 space-y-2">
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-lucide-check"
                  class="w-5 h-5 text-green-500"
                />
                <span class="font-semibold">可自定义</span>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                支持自定义动画时长
              </p>
            </div>
          </div>
        </div>
      </div>
    </UPageBody>
  </UContainer>
</template>
