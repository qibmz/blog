# 首页 & 关于我页面动效美化 · 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为首页和关于我页面添加 motion-v 滚动入场动画，重构文章卡片和时间线，提升视觉质感。

**Architecture:** 安装 `motion-v` 包，用 `<Motion>` 组件包裹页面各 Section，利用 `:initial` / `:whileInView` / `:whileHover` 声明式替代手动 CSS keyframes。关于我页面用自定义垂直时间线替换 `UChangelogVersions`。

**Tech Stack:** Nuxt 4, Nuxt UI v4, motion-v (Motion for Vue), Tailwind CSS

---

### Task 1: 安装 motion-v 依赖

**Files:**
- Modify: `package.json` (pnpm install)
- Create: `app/plugins/motion.client.ts`

- [ ] **Step 1: 安装 motion-v**

```bash
pnpm add motion-v
```

Expected: `motion-v` 添加到 `package.json` dependencies。

- [ ] **Step 2: 创建 Nuxt 客户端插件确保 motion-v SSR 兼容**

创建 `app/plugins/motion.client.ts`：

```ts
// motion-v 客户端插件 — 确保 Motion 组件在 Nuxt SSR 中正常工作
// motion-v 的 Motion 组件本身支持 SSR（渲染 slot 内容，客户端 hydrate 时附加动画）
// 此插件留空作为占位，后续如需全局配置 motion 可在此扩展
export default defineNuxtPlugin(() => {})
```

> **说明：** `motion-v` 的 `<Motion>` 组件在服务端渲染其 children 而不附加动画样式，客户端 hydrate 后自动应用动画。因此不需特殊 SSR 处理。`.client.ts` 后缀确保此插件仅在客户端加载，可用作未来全局 motion 配置入口。

- [ ] **Step 3: 验证安装**

```bash
pnpm typecheck
```

Expected: 无类型错误。

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml app/plugins/motion.client.ts
git commit -m "chore: add motion-v dependency and client plugin"
```

---

### Task 2: 首页 Hero 区域 — motion-v 入场动画

**Files:**
- Modify: `app/pages/index.vue` (script setup + template Hero section)

- [ ] **Step 1: 在 script setup 顶部添加 motion-v 导入**

在 `app/pages/index.vue` 的 `<script setup>` 最开头添加：

```ts
import { Motion } from 'motion-v'
```

位置：`const { data: page } = ...` 之前。

- [ ] **Step 2: 包裹头像卡片为 Motion spring 弹入**

找到头像卡片 `<div class="relative group">`，在其外包裹 `<Motion>`，改为：

```vue
<Motion
  :initial="{ opacity: 0, scale: 0.8 }"
  :animate="{ opacity: 1, scale: 1 }"
  :transition="{ type: 'spring', stiffness: 200, damping: 15 }"
>
  <div class="relative group">
    <div class="absolute -inset-1 rounded-full bg-linear-to-r from-primary-500 via-purple-500 to-pink-500 opacity-60 blur-md group-hover:opacity-90 transition-opacity duration-500" />
    <NuxtImg
      src="/image/avatar.avif"
      alt="头像"
      width="96"
      height="96"
      class="relative w-24 h-24 rounded-full object-cover ring-4 ring-white dark:ring-gray-900 shadow-xl"
    />
    <div class="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-900 flex items-center justify-center">
      <span class="w-2 h-2 rounded-full bg-white" />
    </div>
  </div>
</Motion>
```

- [ ] **Step 3: CTA 按钮组 staggered 淡入**

将两个 `<UButton>` 分别包裹 `<Motion>`，添加延迟：

```vue
<Motion
  :initial="{ opacity: 0, y: 15 }"
  :animate="{ opacity: 1, y: 0 }"
  :transition="{ duration: 0.4, delay: 0.3 }"
>
  <UButton
    to="/about-us"
    size="lg"
    color="primary"
    variant="solid"
    icon="i-lucide-user"
    class="rounded-full px-6 shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-all duration-300 hover:-translate-y-0.5"
  >
    关于我
  </UButton>
</Motion>
<Motion
  :initial="{ opacity: 0, y: 15 }"
  :animate="{ opacity: 1, y: 0 }"
  :transition="{ duration: 0.4, delay: 0.45 }"
>
  <UButton
    to="/blog"
    size="lg"
    color="neutral"
    variant="outline"
    icon="i-lucide-book-open"
    class="rounded-full px-6 hover:-translate-y-0.5 transition-all duration-300"
  >
    博客
  </UButton>
</Motion>
```

- [ ] **Step 4: Commit**

```bash
git add app/pages/index.vue
git commit -m "feat: add motion-v entrance animations to homepage hero section"
```

---

### Task 3: 首页统计数据区 — whileInView staggered 卡片

**Files:**
- Modify: `app/pages/index.vue` (template 统计数据区域)

- [ ] **Step 1: 为每个统计卡片包裹 Motion + whileInView**

将 `v-for="(stat, i) in stats"` 的 `<div>` 替换为：

```vue
<Motion
  v-for="(stat, i) in stats"
  :key="stat.label"
  :initial="{ opacity: 0, y: 30 }"
  :whileInView="{ opacity: 1, y: 0 }"
  :transition="{ type: 'spring', stiffness: 300, damping: 20, delay: i * 0.1 }"
  :viewport="{ once: true, margin: '-80px' }"
  :whileHover="{ scale: 1.03, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }"
  class="group relative bg-white dark:bg-gray-900 rounded-2xl p-6 text-center ring-1 ring-gray-200 dark:ring-gray-800"
>
  <div class="flex flex-col items-center gap-3">
    <div :class="`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`">
      <UIcon
        :name="stat.icon"
        :class="`w-6 h-6 ${stat.color}`"
      />
    </div>
    <div>
      <div class="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">
        <CountUp
          v-if="stat.numericValue"
          :value="stat.numericValue"
          :duration="1200"
        />
        <span v-else>{{ stat.value }}</span>
      </div>
      <div class="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
        {{ stat.label }}
      </div>
    </div>
  </div>
</Motion>
```

> 说明：移除旧的 `:style="{ transitionDelay: ... }"` `transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5` class，这些现在由 motion-v 接管。图标 scale 效果无需单独处理，整体卡片 hover scale 已足够。

- [ ] **Step 2: Commit**

```bash
git add app/pages/index.vue
git commit -m "feat: add whileInView staggered animations to stats cards"
```

---

### Task 4: 首页技能亮点区 — 替换 CSS keyframes

**Files:**
- Modify: `app/pages/index.vue` (template 技能亮点区域 + 移除 `<style scoped>` 中的 `.highlight-card` 动画)

- [ ] **Step 1: 包裹 highlight 卡片为 Motion + whileInView**

将 `v-for="(highlight, i) in highlights"` 的 `div.highlight-card` 改为：

```vue
<Motion
  v-for="(highlight, i) in highlights"
  :key="highlight.title"
  :initial="{ opacity: 0, y: 30 }"
  :whileInView="{ opacity: 1, y: 0 }"
  :transition="{ type: 'spring', stiffness: 300, damping: 20, delay: i * 0.1 }"
  :viewport="{ once: true, margin: '-80px' }"
  :whileHover="{ scale: 1.03, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }"
  class="group relative overflow-hidden bg-white dark:bg-gray-900 rounded-2xl p-6 ring-1 ring-gray-200 dark:ring-gray-800"
>
  <div
    :class="`absolute inset-0 bg-linear-to-br ${highlight.gradient} opacity-0 group-hover:opacity-8 dark:group-hover:opacity-15 transition-opacity duration-300`"
  />
  <div class="relative flex flex-col items-center text-center gap-4">
    <div
      :class="`w-14 h-14 rounded-xl bg-linear-to-br ${highlight.gradient} p-0.5 shadow-lg`"
    >
      <div class="w-full h-full bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center">
        <UIcon
          :name="highlight.icon"
          class="w-7 h-7"
        />
      </div>
    </div>
    <div>
      <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-1.5">
        {{ highlight.title }}
      </h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
        {{ highlight.description }}
      </p>
    </div>
  </div>
</Motion>
```

> 说明：移除 `highlight-card` class、`:style="{ animationDelay: ... }"`、`group-hover:scale-110 group-hover:rotate-3`。图标容器旋转效果由 motion hover 接管（此处卡片整体 scale 已足够）。

- [ ] **Step 2: 移除 .highlight-card CSS 规则**

修改 `<style scoped>`，删除 `.highlight-card` 规则块：

```css
/* 移除此块 */
.highlight-card {
  animation: fadeInUp 0.5s ease-out forwards;
  opacity: 0;
}
```

- [ ] **Step 3: Commit**

```bash
git add app/pages/index.vue
git commit -m "feat: replace CSS keyframes with motion-v whileInView on highlight cards"
```

---

### Task 5: 首页技术栈区 + 最新动态区标题 — 淡入容器

**Files:**
- Modify: `app/pages/index.vue` (技术栈区域、最新动态标题行)

- [ ] **Step 1: 技术栈区域外层包裹 Motion**

将技术栈区 `<div class="bg-gray-50/80 ...">` 内的 `<UContainer>` 内容包裹：

```vue
<div class="bg-gray-50/80 dark:bg-gray-950/60 border-y border-gray-200 dark:border-gray-800">
  <UContainer>
    <Motion
      :initial="{ opacity: 0, y: 20 }"
      :whileInView="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.5 }"
      :viewport="{ once: true, margin: '-60px' }"
    >
      <div class="py-16">
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
</div>
```

- [ ] **Step 2: 最新动态标题行保留不变（标题已在后续任务整体重构）**

最新动态区的完整重构在 Task 6 处理，此处跳过。

- [ ] **Step 3: Commit**

```bash
git add app/pages/index.vue
git commit -m "feat: add fade-in container to tech stack section"
```

---

### Task 6: 首页最新动态区 — 卡片重构为左侧竖线样式

**Files:**
- Modify: `app/pages/index.vue` (最新动态区域模板 + `<style scoped>` 替换)

- [ ] **Step 1: 替换最新动态卡片模板**

定位到 `<!-- ========== 最新动态区域 ========== -->`，将卡片循环替换为：

```vue
<div
  v-if="recentUpdates.length"
  class="grid grid-cols-1 md:grid-cols-3 gap-5"
>
  <Motion
    v-for="(update, i) in recentUpdates"
    :key="update.title"
    :initial="{ opacity: 0, y: 24 }"
    :whileInView="{ opacity: 1, y: 0 }"
    :transition="{ type: 'spring', stiffness: 280, damping: 22, delay: i * 0.1 }"
    :viewport="{ once: true, margin: '-80px' }"
    :whileHover="{ y: -3, boxShadow: '0 12px 28px rgba(0,0,0,0.08)' }"
  >
    <NuxtLink
      :to="update.to"
      class="post-card group flex gap-4 bg-white dark:bg-gray-900 rounded-2xl p-5 ring-1 ring-gray-200 dark:ring-gray-800"
    >
      <!-- 左侧分类竖线 -->
      <div
        :class="`shrink-0 w-[3px] rounded-full transition-all duration-300 ${getCategoryColor(update.category)} group-hover:w-[5px]`"
        :style="{
          boxShadow: `0 0 0 0 currentColor`,
        }"
      />

      <div class="flex flex-col gap-2 min-w-0">
        <!-- 标题 -->
        <h3 class="font-semibold text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors duration-200 line-clamp-2 leading-snug text-[15px]">
          {{ update.title }}
        </h3>

        <!-- 摘要 -->
        <p
          v-if="update.description"
          class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed"
        >
          {{ update.description }}
        </p>

        <!-- 日期 -->
        <div class="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mt-auto">
          <UIcon
            name="i-lucide-calendar"
            class="w-3.5 h-3.5"
          />
          {{ update.date }}
        </div>
      </div>
    </NuxtLink>
  </Motion>
</div>
```

- [ ] **Step 2: 在 script 中添加 `getCategoryColor` 辅助函数**

在 `categoryConfig` 定义后面添加：

```ts
const categoryColorMap: Record<string, string> = {
  blog: 'bg-blue-500 dark:bg-blue-400',
  web3: 'bg-purple-500 dark:bg-purple-400',
  frontend: 'bg-green-500 dark:bg-green-400',
  default: 'bg-gray-400 dark:bg-gray-500'
}

const getCategoryColor = (category: string) => categoryColorMap[category] ?? categoryColorMap.default
```

- [ ] **Step 3: 替换 `<style scoped>` 中的 `.post-card` CSS**

当前 `<style scoped>` 内容：

```css
.highlight-card {
  animation: fadeInUp 0.5s ease-out forwards;
  opacity: 0;
}

.post-card {
  animation: fadeInUp 0.5s ease-out forwards;
  opacity: 0;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

全部替换为：

```css
/* motion-v 接管所有动画，无需手动 keyframes */
```

> 注意：`.highlight-card` 已在 Task 4 移除，此处确认 `post-card` CSS 和 `@keyframes fadeInUp` 一并删除。

- [ ] **Step 4: 移除不再使用的 `getHighlightGradient` 和 `getCategoryMeta` 检查**

`getHighlightGradient` 只在旧的文章卡片中使用（顶部色条），现在可移除该函数调用。保留 `getCategoryMeta` 以防未来使用，但 `getHighlightGradient` 可以移除。检查确认没有其他地方引用：

在 script 中搜索 `getHighlightGradient` — 它只在旧的文章卡片模板中使用。移除该 computed。

删除：
```ts
const getHighlightGradient = (index: number) => highlights[index % highlights.length]?.gradient ?? 'from-primary-500 to-sky-500'
```

- [ ] **Step 5: Commit**

```bash
git add app/pages/index.vue
git commit -m "refactor: redesign recent posts cards with left accent line and motion-v"
```

---

### Task 7: 关于我页面 — Hero 名片区

**Files:**
- Modify: `app/pages/about-us.vue` (完整重构)

- [ ] **Step 1: 在 script setup 顶部添加导入和内容查询字段**

当前 script setup 只查了 `page`。添加 motion 导入以及从 page 提取更多字段：

```ts
import { Motion } from 'motion-v'

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

// 提取 content 中的数据
const contactEmail = computed(() => page.value?.contact?.email ?? '')
```

- [ ] **Step 2: 替换模板 — Hero 名片区**

将现有整个 `<template>` 替换。先写 Hero 部分：

```vue
<template>
  <div v-if="page" class="relative">
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
          <UIcon name="i-lucide-mail" class="w-4 h-4" />
          {{ contactEmail }}
        </a>
      </Motion>
    </div>
```

> 此为新模板的第一部分。后续 Task 继续追加。

- [ ] **Step 3: Commit**

```bash
git add app/pages/about-us.vue
git commit -m "feat: add hero namecard section with motion-v to about-us page"
```

---

### Task 8: 关于我页面 — 工作时间线 + 技术栈 + 联系方式 + Slogan

**Files:**
- Modify: `app/pages/about-us.vue` (继续追加模板)

- [ ] **Step 1: 追加工作时间线 Section**

在上述 Hero 模板后、`</div>` 之前，追加：

```vue
    <!-- ========== 工作经历 · 时间线 ========== -->
    <div class="py-12 bg-gray-50/80 dark:bg-gray-950/60 border-y border-gray-200 dark:border-gray-800">
      <UContainer>
        <Motion
          :initial="{ opacity: 0, y: 20 }"
          :whileInView="{ opacity: 1, y: 0 }"
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
            <Motion
              v-for="(v, i) in page.versions"
              :key="v.title"
              :initial="{ opacity: 0 }"
              :whileInView="{ opacity: 1 }"
              :transition="{ duration: 0.5, delay: i * 0.15 }"
              :viewport="{ once: true, margin: '-60px' }"
              class="relative pl-10 sm:pl-14"
            >
              <!-- 时间线圆点 -->
              <Motion
                :initial="{ scale: 0 }"
                :whileInView="{ scale: 1 }"
                :transition="{ type: 'spring', stiffness: 300, damping: 18, delay: i * 0.15 + 0.1 }"
                :viewport="{ once: true }"
                :class="[
                  'absolute left-2.5 sm:left-4.5 top-1 w-3 h-3 rounded-full ring-4 ring-white dark:ring-gray-900 z-10',
                  i === 0
                    ? 'bg-primary-500 shadow-[0_0_8px_var(--ui-primary)]'
                    : 'bg-gray-300 dark:bg-gray-600'
                ]"
              />

              <!-- 内容卡片 -->
              <Motion
                :initial="{ opacity: 0, x: 20 }"
                :whileInView="{ opacity: 1, x: 0 }"
                :transition="{ type: 'spring', stiffness: 280, damping: 22, delay: i * 0.15 + 0.15 }"
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
            </Motion>
          </div>
        </div>
      </UContainer>
    </div>
```

- [ ] **Step 2: 追加技术栈 Section**

```vue
    <!-- ========== 技术栈 ========== -->
    <UContainer>
      <Motion
        :initial="{ opacity: 0, y: 20 }"
        :whileInView="{ opacity: 1, y: 0 }"
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
```

- [ ] **Step 3: 追加联系方式卡片**

```vue
    <!-- ========== 联系方式 ========== -->
    <div v-if="contactEmail" class="bg-gray-50/80 dark:bg-gray-950/60 border-t border-gray-200 dark:border-gray-800">
      <UContainer>
        <Motion
          :initial="{ opacity: 0, y: 20 }"
          :whileInView="{ opacity: 1, y: 0 }"
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
            :whileInView="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.4, delay: 0.1 }"
            :viewport="{ once: true }"
            :whileHover="{ y: -2 }"
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
```

- [ ] **Step 4: 追加 Slogan 尾句并闭合模板**

```vue
    <!-- ========== Slogan ========== -->
    <UContainer>
      <Motion
        :initial="{ opacity: 0 }"
        :whileInView="{ opacity: 1 }"
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
```

- [ ] **Step 5: 移除旧式样（about-us 当前无 scoped CSS，确认无残留）**

检查 `app/pages/about-us.vue` 无 `<style scoped>` 块 — 确认无需清理。

- [ ] **Step 6: Commit**

```bash
git add app/pages/about-us.vue
git commit -m "refactor: redesign about-us page with timeline, motion-v animations, and polished sections"
```

---

### Task 9: 验证 — typecheck + lint + 视觉检查

**Files:**
- 无新建或修改文件

- [ ] **Step 1: 运行 typecheck**

```bash
pnpm typecheck
```

Expected: 零错误。

- [ ] **Step 2: 运行 lint**

```bash
pnpm lint
```

Expected: 无 lint 错误。

- [ ] **Step 3: 运行测试**

```bash
pnpm test
```

Expected: 现有测试全部通过。

- [ ] **Step 4: 启动 dev 服务器检查页面**

```bash
pnpm dev
```

打开浏览器，验证：
- 首页：每个 Section 滚动入视口时 staggered 入场动画正常
- 首页：文章卡片 hover 竖线变宽、卡片微浮
- 首页：统计卡片 hover 弹性缩放
- 关于我：时间线圆点弹入 + 卡片滑入
- 关于我：当前职位圆点有呼吸光晕
- 关于我：联系方式卡片 hover 上浮
- 暗色模式切换正常
- 所有动画仅播一次（回滚再入不重复）

- [ ] **Step 5: 最终提交**

```bash
git add -A
git commit -m "chore: final verification — typecheck, lint, and tests pass"
```

---

## 补充说明

### motion-v 在 Nuxt 中的注意事项

1. **SSR 兼容**：`<Motion>` 在服务端渲染其 children 而非空壳，客户端 hydrate 后附加动画样式。无需 `ClientOnly` 包裹。
2. **whileInView 的 once 行为**：`viewport="{ once: true }"` 确保动画只在首次可见时触发。刷新页面后重置。
3. **暗色模式**：`boxShadow` 在 `whileHover` 中使用静态字符串，不随 dark mode 变化。如需适配，可用 `:class` 切换代替内联 shadow，或用 CSS 变量。当前卡片 hover shadow 使用浅色值，在暗色模式下通过 card 自身 `bg-gray-900` + `ring` 视觉上仍可用。
4. **CountUp 组件**：已使用 `useIntersectionObserver` 触发计数，与 motion-v 的 `whileInView` 独立运行，互不干扰。

### 风险点

- **motion-v 与 Nuxt 4 View Transition 兼容性**：Nuxt 的 `experimental.viewTransition: true` 可能在页面切换时与 motion 的入场动画有短暂冲突。如出现问题，可给 Hero 元素添加 `data-vt-no` 或降低 motion 的 delay。当前设计中 Hero 使用 `:animate`（立即触发），不与 View Transition 浏览器动画冲突。
- **performance**：`whileInView` 创建多个 IntersectionObserver。3-5 个 Section 总计约 15-20 个观察者，在合理范围内。
