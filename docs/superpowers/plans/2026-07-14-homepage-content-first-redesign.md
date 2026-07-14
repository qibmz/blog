# Homepage Content-First Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the homepage into a content-first technical blog while preserving a compact version of the existing animated tree Hero.

**Architecture:** Keep content fetching, sorting, and section composition in `app/pages/index.vue`. Add a `compact` display mode to `TechStack.vue` without duplicating its technology data, update the homepage content YAML, and use source-contract tests to protect section order and removed template content because the current Vitest setup does not mount Nuxt UI pages.

**Tech Stack:** Nuxt 4, Vue 3, Nuxt UI 4, Tailwind CSS 4, Motion Vue, Vitest 4.

## Global Constraints

- Preserve the existing Hero poster, delayed video source assignment, playback fallback, and `prefers-reduced-motion` behavior.
- Desktop Hero height is 600px; mobile Hero height is 560px.
- Use existing Public Sans typography and do not add dependencies.
- Light-mode palette: canvas `#F6F8FB`, surface `#FFFFFF`, primary text `#0F172A`, secondary text `#475569`, border `#E2E8F0`, accent `#2563EB`.
- Display five recent posts from the existing `posts` collection.
- Writing topics are informational and non-interactive.
- Compact stack contains Vue 3, Nuxt 4, TypeScript, Tailwind CSS, Nuxt UI, UniApp, Vite, Git, Wagmi, and Viem.
- Keep existing routes, SEO metadata, dark mode, and backend behavior unchanged.
- Do not add newsletter signup, new routes, a CMS, or new network requests.

---

### Task 1: Add a compact technology-stack variant

**Files:**
- Modify: `vitest.config.ts:10-14`
- Create: `app/__test__/homepage-ui.contract.test.ts`
- Modify: `app/components/TechStack.vue:1-129`

**Interfaces:**
- Consumes: the existing `TechItem[]` list and category filtering in `TechStack.vue`.
- Produces: `<TechStack compact />`, where `compact?: boolean` defaults to `false` and renders exactly the ten globally constrained technologies without category tabs.

- [ ] **Step 1: Extend Vitest discovery for app contract tests**

Change the test include without changing the existing Node environment or setup file:

```ts
test: {
  environment: 'node',
  globals: true,
  include: [
    'server/**/__test__/*.test.ts',
    'app/**/__test__/*.test.ts'
  ],
  setupFiles: ['server/utils/__test__/setup.ts'],
```

- [ ] **Step 2: Write the failing compact-stack contract test**

Create `app/__test__/homepage-ui.contract.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const readProjectFile = (relativePath: string) =>
  readFileSync(fileURLToPath(new URL(`../../${relativePath}`, import.meta.url)), 'utf8')

describe('homepage UI contracts', () => {
  it('provides a compact ten-item technology stack', () => {
    const source = readProjectFile('app/components/TechStack.vue')

    expect(source).toContain('compact?: boolean')
    expect(source).toContain("const compactTechNames = [")
    expect(source).toContain("'Vue 3'")
    expect(source).toContain("'Nuxt 4'")
    expect(source).toContain("'TypeScript'")
    expect(source).toContain("'Tailwind CSS'")
    expect(source).toContain("'Nuxt UI'")
    expect(source).toContain("'UniApp'")
    expect(source).toContain("'Vite'")
    expect(source).toContain("'Git'")
    expect(source).toContain("'Wagmi'")
    expect(source).toContain("'Viem'")
    expect(source).toContain('v-if="!compact"')
  })
})
```

- [ ] **Step 3: Run the test and verify RED**

Run:

```bash
pnpm vitest run app/__test__/homepage-ui.contract.test.ts
```

Expected: FAIL because `TechStack.vue` does not declare a `compact` prop or compact technology names.

- [ ] **Step 4: Implement the compact prop and derived display list**

Add to the top of `TechStack.vue` after the types:

```ts
interface Props {
  compact?: boolean
}

const { compact = false } = defineProps<Props>()
```

Add after `techStack`:

```ts
const compactTechNames = [
  'Vue 3',
  'Nuxt 4',
  'TypeScript',
  'Tailwind CSS',
  'Nuxt UI',
  'UniApp',
  'Vite',
  'Git',
  'Wagmi',
  'Viem'
] as const

const compactStack = techStack.filter(item =>
  compactTechNames.includes(item.name as typeof compactTechNames[number])
)
```

Replace the computed list with:

```ts
const displayedStack = computed(() => {
  if (compact) return compactStack
  if (selectedCategory.value === 'all') return techStack
  return techStack.filter(item => item.category === selectedCategory.value)
})
```

Update the template so category controls use `v-if="!compact"`, the loop uses `displayedStack`, and compact mode uses a ten-item responsive grid with consistent neutral cards:

```vue
<div
  v-if="!compact"
  class="flex gap-0.5 mb-6 overflow-x-auto no-scrollbar border-b border-gray-200 dark:border-gray-800"
>
  <button
    class="relative shrink-0 px-3 py-2 text-xs font-medium transition-colors duration-200"
    :class="selectedCategory === 'all' ? 'text-primary-500' : 'text-muted hover:text-highlighted'"
    @click="selectedCategory = 'all'"
  >
    全部
    <span v-if="selectedCategory === 'all'" class="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary-500" />
  </button>
  <button
    v-for="key in categoryKeys"
    :key="key"
    class="relative shrink-0 px-3 py-2 text-xs font-medium transition-colors duration-200"
    :class="selectedCategory === key ? 'text-primary-500' : 'text-muted hover:text-highlighted'"
    @click="selectedCategory = key"
  >
    {{ categoryMeta[key].label }}
    <span v-if="selectedCategory === key" class="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary-500" />
  </button>
</div>

<div
  class="grid gap-2.5"
  :class="compact
    ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'
    : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1.5'"
>
  <Motion
    v-for="(item, index) in displayedStack"
    :key="item.name"
    tag="div"
    :initial="{ opacity: 0, y: 8 }"
    :while-in-view="{ opacity: 1, y: 0 }"
    :transition="{ duration: 0.25, delay: index * 0.025 }"
    :viewport="{ once: true, margin: '-20px' }"
  >
    <a
      :href="item.url"
      target="_blank"
      rel="noopener noreferrer"
      class="group flex min-h-11 items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
      :class="compact
        ? 'border border-slate-200 bg-white hover:border-primary-300 hover:bg-primary-50/40 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-primary-800'
        : 'hover:bg-gray-100 dark:hover:bg-gray-800/60'"
    >
      <UIcon
        :name="item.icon"
        class="size-4 shrink-0"
        :class="item.icon.startsWith('i-lucide')
          ? (compact ? 'text-primary-500' : categoryMeta[item.category].color)
          : ''"
      />
      <span class="truncate text-xs text-slate-700 transition-colors duration-200 group-hover:text-slate-950 dark:text-gray-300 dark:group-hover:text-white">
        {{ item.name }}
      </span>
      <UIcon
        name="i-lucide-arrow-up-right"
        class="ml-auto size-3 shrink-0 text-slate-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:text-gray-500"
      />
    </a>
  </Motion>
</div>
```

In compact mode, use `text-primary-500` for Lucide icons instead of category rainbow colors.

- [ ] **Step 5: Run the contract test and typecheck**

Run:

```bash
pnpm vitest run app/__test__/homepage-ui.contract.test.ts
pnpm typecheck
```

Expected: contract test PASS; typecheck exits 0.

- [ ] **Step 6: Commit the compact-stack task**

```bash
git add vitest.config.ts app/__test__/homepage-ui.contract.test.ts app/components/TechStack.vue
git commit -m "feat: add compact homepage technology stack"
```

---

### Task 2: Recompose the homepage around recent articles

**Files:**
- Modify: `app/__test__/homepage-ui.contract.test.ts`
- Modify: `content/0.index.yml:1-3`
- Modify: `app/pages/index.vue:51-562`

**Interfaces:**
- Consumes: the existing `page` and `posts` async data, `TypewriterText`, `TechStack`, Hero media, `githubUrl`, and `contactEmail`.
- Produces: the in-page anchor `#recent-articles`, five `recentUpdates`, four informational `writingTopics`, and `<TechStack compact />`.

- [ ] **Step 1: Add failing homepage composition contracts**

Append inside the existing `describe` block:

```ts
it('places five recent articles directly after a compact hero', () => {
  const source = readProjectFile('app/pages/index.vue')
  const heroEnd = source.indexOf('</UPageHero>')
  const recent = source.indexOf('id="recent-articles"')
  const topics = source.indexOf('id="writing-topics"')
  const stack = source.indexOf('<TechStack compact')

  expect(source).toContain('min-h-[560px]')
  expect(source).toContain('md:min-h-[600px]')
  expect(source).toContain('to="#recent-articles"')
  expect(source).toContain('.slice(0, 5)')
  expect(heroEnd).toBeGreaterThan(-1)
  expect(recent).toBeGreaterThan(heroEnd)
  expect(topics).toBeGreaterThan(recent)
  expect(stack).toBeGreaterThan(topics)
})

it('removes portfolio-template sections and the fake RSS action', () => {
  const source = readProjectFile('app/pages/index.vue')

  expect(source).not.toContain('const stats =')
  expect(source).not.toContain('const highlights =')
  expect(source).not.toContain('<CountUp')
  expect(source).not.toContain('i-lucide-rss')
  expect(source).not.toContain('技术专长')
})

it('uses the approved content-first introduction', () => {
  const content = readProjectFile('content/0.index.yml')

  expect(content).toContain(
    'description: 记录前端开发、UniApp、Web3 与工程化实践中的问题和解决方案。'
  )
})
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
pnpm vitest run app/__test__/homepage-ui.contract.test.ts
```

Expected: FAIL because the current Hero is not height constrained, only three posts render, old statistics/skill sections remain, and required anchors are absent.

- [ ] **Step 3: Update the homepage introduction**

Change `content/0.index.yml` to:

```yaml
title: qibmz 的博客
description: 记录前端开发、UniApp、Web3 与工程化实践中的问题和解决方案。
```

Keep the existing `seo`, `navigation`, `hero`, and `contact` mappings unchanged.

- [ ] **Step 4: Replace obsolete page data with writing topics and five posts**

Remove `stats`, `highlights`, `categoryColorMap`, and `getCategoryColor`. Change recent-post derivation to five items and avoid mutating the Nuxt Content result:

```ts
const recentUpdates = computed(() =>
  [...(posts.value || [])]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .map(post => ({
      title: post.title,
      description: post.description || '',
      date: new Date(post.date).toISOString().split('T')[0],
      category: post.badge.label || '文章',
      to: `${post.path}`
    }))
)

const featuredUpdate = computed(() => recentUpdates.value[0])
const restUpdates = computed(() => recentUpdates.value.slice(1))

const writingTopics = [
  { label: 'UniApp', description: '跨端开发与移动端踩坑', icon: 'i-lucide-smartphone' },
  { label: 'Vue / Nuxt', description: '框架实践与组件设计', icon: 'i-lucide-layers-3' },
  { label: '工程化', description: '工具链、性能与开发效率', icon: 'i-lucide-wrench' },
  { label: 'Web3', description: 'DApp、Wagmi 与 Viem', icon: 'i-lucide-blocks' }
]
```

- [ ] **Step 5: Rebuild the Hero as the compact signature cover**

Set the Hero root and wrapper to the approved heights:

```vue
<UPageHero
  class="relative isolate min-h-[560px] overflow-hidden md:min-h-[600px]"
  :ui="{
    container: 'min-h-[560px] md:min-h-[600px]',
    wrapper: 'max-w-3xl mx-auto min-h-[560px] md:min-h-[600px] px-6 py-12 flex flex-col justify-center'
  }"
>
```

Use the existing poster and video elements with this media treatment:

```vue
class="absolute inset-0 h-full w-full object-cover brightness-90 contrast-105 saturate-90 dark:brightness-90 dark:contrast-100 dark:saturate-100"
```

Replace the white wash with:

```vue
<div class="absolute inset-0 bg-linear-to-b from-slate-950/70 via-slate-900/45 to-[#F6F8FB] dark:from-gray-950/55 dark:via-gray-950/35 dark:to-gray-950" />
```

Use white/slate-100 Hero copy, change the primary action to `to="#recent-articles"` with label `阅读最新文章`, keep `/about-us` as the secondary action, retain only the GitHub and email tertiary actions, and remove the RSS action.

- [ ] **Step 6: Place recent articles immediately after the Hero**

Add this section directly after `</UPageHero>`:

```vue
<section
  id="recent-articles"
  aria-labelledby="recent-articles-title"
  class="scroll-mt-20 py-14 md:py-18"
>
  <UContainer>
    <div class="mb-8 flex items-end justify-between gap-4">
      <div>
        <p class="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-400">
          近期更新
        </p>
        <h2 id="recent-articles-title" class="text-3xl font-bold text-slate-950 dark:text-white">
          最新文章
        </h2>
      </div>
      <NuxtLink to="/blog" class="group inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-500">
        查看全部文章
        <UIcon name="i-lucide-arrow-right" class="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      </NuxtLink>
    </div>

    <div v-if="recentUpdates.length" class="grid gap-4 lg:grid-cols-12">
      <Motion
        v-if="featuredUpdate"
        :initial="{ opacity: 0, y: 16 }"
        :while-in-view="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.3 }"
        :viewport="{ once: true, margin: '-60px' }"
        class="lg:col-span-7"
      >
        <NuxtLink
          :to="featuredUpdate.to"
          class="group flex h-full min-h-72 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-primary-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-500 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-primary-800"
        >
          <div>
            <div class="mb-4 flex items-center gap-2 text-xs">
              <span class="rounded-full bg-primary-50 px-2.5 py-1 font-semibold text-primary-700 dark:bg-primary-950/50 dark:text-primary-300">{{ featuredUpdate.category }}</span>
              <span class="font-medium text-slate-500 dark:text-gray-400">最新发布</span>
            </div>
            <h3 class="text-balance text-2xl font-bold leading-tight text-slate-950 transition-colors duration-200 group-hover:text-primary-700 dark:text-white dark:group-hover:text-primary-300">{{ featuredUpdate.title }}</h3>
            <p v-if="featuredUpdate.description" class="mt-4 line-clamp-3 text-base leading-7 text-slate-600 dark:text-gray-400">{{ featuredUpdate.description }}</p>
          </div>
          <div class="mt-8 flex items-center justify-between gap-4 text-sm">
            <span class="inline-flex items-center gap-1.5 text-slate-500 dark:text-gray-400"><UIcon name="i-lucide-calendar" class="size-4" />{{ featuredUpdate.date }}</span>
            <span class="inline-flex items-center gap-1 font-semibold text-primary-600 dark:text-primary-400">阅读全文<UIcon name="i-lucide-arrow-right" class="size-4 transition-transform duration-200 group-hover:translate-x-0.5" /></span>
          </div>
        </NuxtLink>
      </Motion>

      <div class="grid gap-4 sm:grid-cols-2 lg:col-span-5">
        <Motion
          v-for="(update, index) in restUpdates"
          :key="update.title"
          :initial="{ opacity: 0, y: 12 }"
          :while-in-view="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.25, delay: index * 0.05 }"
          :viewport="{ once: true, margin: '-40px' }"
        >
          <NuxtLink
            :to="update.to"
            class="group flex h-full min-h-48 flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-[border-color,box-shadow] duration-200 hover:border-primary-300 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-500 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-primary-800"
          >
            <span class="mb-3 text-xs font-semibold text-primary-700 dark:text-primary-300">{{ update.category }}</span>
            <h3 class="line-clamp-3 text-base font-semibold leading-snug text-slate-950 transition-colors duration-200 group-hover:text-primary-700 dark:text-white dark:group-hover:text-primary-300">{{ update.title }}</h3>
            <p v-if="update.description" class="mt-2 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-gray-400">{{ update.description }}</p>
            <span class="mt-auto inline-flex items-center gap-1.5 pt-4 text-xs text-slate-500 dark:text-gray-400"><UIcon name="i-lucide-calendar" class="size-3.5" />{{ update.date }}</span>
          </NuxtLink>
        </Motion>
      </div>
    </div>

    <div v-else class="rounded-2xl border border-slate-200 bg-white py-14 text-center text-slate-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
      <UIcon name="i-lucide-file-text" class="mx-auto mb-3 size-10" />
      <p>暂无文章，敬请期待</p>
    </div>
  </UContainer>
</section>
```

Use the markup above as the complete article layout; do not retain the old latest-updates cards.

- [ ] **Step 7: Add topics, compact stack, and smaller contact CTA**

After recent articles, add:

```vue
<section id="writing-topics" aria-labelledby="writing-topics-title" class="border-y border-slate-200 bg-white/70 py-12 dark:border-gray-800 dark:bg-gray-900/40">
  <UContainer>
    <div class="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
      <div>
        <p class="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-400">内容方向</p>
        <h2 id="writing-topics-title" class="text-2xl font-bold text-slate-950 dark:text-white">我主要写这些</h2>
        <p class="mt-3 max-w-lg text-sm leading-6 text-slate-600 dark:text-gray-400">记录真实开发中遇到的问题、取舍和可以复用的解决方案。</p>
      </div>
      <ul class="grid gap-3 sm:grid-cols-2">
        <li v-for="topic in writingTopics" :key="topic.label" class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
          <UIcon :name="topic.icon" class="size-5 shrink-0 text-primary-600 dark:text-primary-400" />
          <div>
            <h3 class="text-sm font-semibold text-slate-900 dark:text-white">{{ topic.label }}</h3>
            <p class="mt-0.5 text-xs text-slate-600 dark:text-gray-400">{{ topic.description }}</p>
          </div>
        </li>
      </ul>
    </div>
  </UContainer>
</section>
```

Follow it with these two sections:

```vue
<section aria-labelledby="tech-stack-title" class="py-12 md:py-14">
  <UContainer>
    <div class="mb-7">
      <p class="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-400">常用工具</p>
      <h2 id="tech-stack-title" class="text-2xl font-bold text-slate-950 dark:text-white">核心技术栈</h2>
    </div>
    <TechStack compact />
  </UContainer>
</section>

<section class="pb-14 md:pb-18">
  <UContainer>
    <div class="rounded-2xl bg-slate-950 px-6 py-10 text-center ring-1 ring-slate-900 md:px-12 md:py-12 dark:bg-gray-900 dark:ring-gray-800">
      <p class="text-xs font-semibold uppercase tracking-[0.18em] text-primary-400">保持联系</p>
      <h2 class="mt-3 text-2xl font-bold text-white md:text-3xl">一起做点有意思的东西</h2>
      <p class="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-300">无论是技术交流、项目合作还是随便聊聊，欢迎通过下面的方式找到我。</p>
      <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
        <UButton :to="`mailto:${contactEmail}`" size="lg" color="primary" variant="solid" icon="i-lucide-mail" class="min-h-11 rounded-xl px-6">发邮件给我</UButton>
        <UButton :to="githubUrl" target="_blank" size="lg" color="neutral" variant="outline" icon="i-simple-icons-github" class="min-h-11 rounded-xl px-6">GitHub</UButton>
      </div>
    </div>
  </UContainer>
</section>
```

- [ ] **Step 8: Remove the old sections and apply the page canvas**

The page root becomes:

```vue
<div v-if="page" class="relative min-h-screen bg-[#F6F8FB] text-slate-900 dark:bg-gray-950 dark:text-gray-100">
```

Delete the old statistics, skill highlights, full technology-stack section, old latest-updates section, and oversized CTA. Keep one instance of each new section only.

- [ ] **Step 9: Run the contract test and typecheck**

Run:

```bash
pnpm vitest run app/__test__/homepage-ui.contract.test.ts
pnpm typecheck
```

Expected: all homepage contracts PASS; typecheck exits 0.

- [ ] **Step 10: Commit the content-first homepage**

```bash
git add app/__test__/homepage-ui.contract.test.ts content/0.index.yml app/pages/index.vue
git commit -m "feat: make homepage content first"
```

---

### Task 3: Quiet the header and finish visual/accessibility verification

**Files:**
- Modify: `app/__test__/homepage-ui.contract.test.ts`
- Modify: `app/components/AppHeader.vue:38-53`
- Verify: `app/pages/index.vue`
- Verify: `app/components/TechStack.vue`

**Interfaces:**
- Consumes: the existing Nuxt UI `UHeader` and logo link.
- Produces: a translucent light-mode header with a subtle divider and a non-jumping logo hover state.

- [ ] **Step 1: Add a failing header contract**

Append inside the contract test `describe` block:

```ts
it('uses a quiet translucent header without a jumping logo shadow', () => {
  const source = readProjectFile('app/components/AppHeader.vue')

  expect(source).toContain("class=\"border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-950/85\"")
  expect(source).not.toContain('shadow-md hover:shadow-lg')
})
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
pnpm vitest run app/__test__/homepage-ui.contract.test.ts
```

Expected: FAIL because the current header has no surface class and the logo uses medium/large shadow states.

- [ ] **Step 3: Apply the quieter header treatment**

Update the header root and logo image:

```vue
<UHeader class="border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-950/85">
```

```vue
<NuxtImg
  src="/image/logo.png"
  alt="qibmz logo"
  width="40"
  height="40"
  class="rounded-lg shadow-sm transition-opacity duration-200 hover:opacity-90"
/>
```

- [ ] **Step 4: Run focused and full automated verification**

Run:

```bash
pnpm vitest run app/__test__/homepage-ui.contract.test.ts
pnpm test
pnpm typecheck
pnpm build
```

Expected: all tests PASS; typecheck and build exit 0.

- [ ] **Step 5: Render and inspect the required responsive states**

Start the local app and capture the homepage with the `/api/version` request stubbed so unrelated missing database configuration does not cover the design:

- Light mode: 1440x1000 and 390x844.
- Dark mode: 1440x1000 and 390x844.
- Reduced motion: 390x844 with `reducedMotion: 'reduce'`.

For every capture, verify:

- Header, Hero, recent articles, topics, compact stack, CTA, and footer render.
- Latest-article heading is visible at 1440x1000 before scrolling.
- Mobile reaches latest articles immediately after the 560px Hero.
- No horizontal overflow or clipped controls.
- Text contrast and card boundaries are clear in both modes.
- Reduced motion keeps the poster visible and does not load/play the video.
- Keyboard Tab order reaches Header, Hero actions, article cards, stack links, and CTA with visible focus.

- [ ] **Step 6: Fix only verified visual or accessibility defects and rerun verification**

Any fix must be followed by the focused contract test, typecheck, and a fresh screenshot at the affected viewport. Do not broaden scope beyond the approved design.

- [ ] **Step 7: Commit final polish**

```bash
git add app/__test__/homepage-ui.contract.test.ts app/components/AppHeader.vue app/pages/index.vue app/components/TechStack.vue
git commit -m "fix: polish homepage responsive presentation"
```

## Plan Self-Review

- Spec coverage: Hero preservation, content order, five posts, writing topics, compact stack, contact CTA, palette, responsive behavior, accessibility, dark mode, and reduced motion each map to a task and verification step.
- Placeholder scan: no `TBD`, `TODO`, or deferred implementation steps remain.
- Type consistency: the only new public component interface is `compact?: boolean`; every later use is `<TechStack compact />`.
- Scope: all changes are limited to the homepage, its content entry, the shared header polish, the technology-stack display variant, and test discovery.
