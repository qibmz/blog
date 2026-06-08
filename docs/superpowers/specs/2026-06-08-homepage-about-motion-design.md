# 首页 & 关于我页面动效美化设计

**日期:** 2026-06-08
**范围:** `app/pages/index.vue`、`app/pages/about-us.vue`
**依赖:** `motion-v`（Vue Motion）

---

## 目标

为首页和关于我页面添加 scroll-triggered 入场动画和微交互，提升视觉质感，同时保持优雅克制、不抢内容风头的调性。

## 技术方案

- 使用 `motion-v`（`motion` 包的 Vue 版本），在 Nuxt 中无需额外模块，直接 `import { Motion, Presence, animate } from 'motion-v'`
- 核心用法：`<Motion>` 组件 + `whileInView` / `initial` / `animate` / `transition` props
- 替换现有 `<style scoped>` 中的手动 CSS `fadeInUp` keyframes
- 动画范式：scroll-triggered staggered fade-in-up，间隔 100-150ms

---

## 首页 (`app/pages/index.vue`)

### Hero 区域

| 元素 | 动画 | 参数 |
|------|------|------|
| 头像卡片 | scale(0.8)+opacity:0 → 弹入 | spring, stiffness:200, damping:15 |
| 打字机文字 | 保持现有逻辑，仅外层包裹 fade-in | delay:200ms |
| 描述文字 | 淡入上移 | delay:300ms, y:20→0 |
| CTA 按钮组 | 淡入上移，staggered | delay:400ms/500ms |
| StarsBg 背景 | 微弱的 loop 浮动 | y: [-2, 2], duration:6s, repeat:Infinity |

### 统计数据区

- 背景条保留（`bg-gray-50/80` + border-y）
- 4 个卡片用 `whileInView` 触发 staggered 入场
  - 每卡延迟 100ms，从 `y:30, opacity:0` → `y:0, opacity:1`
  - transition: `{ type: 'spring', stiffness: 300, damping: 20 }`
- hover: `scale(1.03)` + `shadow-xl`，spring 过渡
- CountUp 数字：进入视口时触发（使用 `:on-viewport-enter` 回调或 `whileInView` 一次性触发）

### 技能亮点区（4 卡片）

- 同统计数据，`whileInView` staggered 入场，间隔 100ms
- 图标容器 hover: 微旋转 3deg + scale(1.1)
- 渐变背景 hover: opacity 变化保留现有效果
- 移除现有 CSS `fadeInUp` 动画

### 技术栈区

- 外层 `<Motion>` 包裹 `<TechStack />`
- 整体 `whileInView` 淡入即可，不做内部 staggered

### 最新动态区（文章卡片）· 重构

现有卡片（顶部色条 + 标签 pill + 标题描述日期）替换为更安静的个人博客风格：

**卡片布局：**
```
┌──┬─────────────────────────┐
│█ │ 标题                     │
│█ │ 2026-06-08               │
│█ │ 摘要一行...              │
│█ │                         │
└──┴─────────────────────────┘
  ↑ 左侧竖线（分类颜色）
     blog→蓝, web3→紫, frontend→绿, default→灰
     宽度 3px，hover 时变 5px + glow
```

**动画：**
- 3 张卡片 staggered 入场，间隔 100ms，`whileInView`
- hover: 卡片整体 `y: -2px` + shadow + 竖线变宽变色
- "查看全部" 箭头 hover 右移保留

**移除：**
- 顶部色条（`h-1 w-full bg-linear-to-r`）
- 分类标签 pill、tag pill
- 底部日期分隔线

**新增：**
- 左侧竖线 `<div>`，分类颜色 class 用现有 `categoryConfig` 映射
- 竖线 glow：`box-shadow` 渐变从 0→12px blur，hover 触发

### 全局规则

- 每个 Section 的入场动画**只在首次进入视口时播放一次**（`once: true`）
- `whileInView` 的 `margin` 设为 `-80px`，让卡片在屏幕底部就开始动画
- 尊重 `prefers-reduced-motion`：检测 motion 偏好，必要时降级为静态

---

## 关于我页面 (`app/pages/about-us.vue`)

### 整体布局改为三区结构

```
┌──────────────────────────┐
│      Hero 个人名片        │  居中，头像+姓名+简介+社交
├──────────────────────────┤
│   工作经历 · 时间线       │  垂直时间线，逐条滚动揭示
├──────────────────────────┤
│   技术栈                  │
├──────────────────────────┤
│   联系方式卡片            │
├──────────────────────────┤
│   Slogan 尾句             │
└──────────────────────────┘
```

### Hero 名片区

- 大头像（~120px），渐变光环 ring，和首页头像风格呼应
- motion-v spring 弹入：`scale(0.8)→1`, `stiffness:200, damping:15`
- 姓名（从 content title）+ 一句话 description，延迟 150ms 淡入上移
- 邮箱 pill 标签，hover 时背景色加深

### 工作经历 · 时间线

替换现有 `UChangelogVersions` 列表，改为自定义垂直时间线：

- 左侧：竖线（`border-l-2`）+ 圆点标记
- 右侧：内容卡片
- 每条经历的入场序列：
  1. 圆点先 `scale(0)→1` spring 弹入
  2. 卡片从右侧 `x:30, opacity:0` 滑入
- 3 条 staggered，间隔 ~150ms
- 第一条（当前公司）圆点加亮色 + `animate` 呼吸光晕（pulse），用 `box-shadow` 动画表示"进行中"
- 卡片内容：公司名（标题）、日期 badge、描述文字
- 日期 badge：当前职位用 `variant="solid"` 突出，历史的用 `variant="subtle"`

### 技术栈区

- Section 标题 "技术栈"，居中
- `<TechStack />` 外层 `<Motion>` 包裹，`whileInView` 淡入
- 与首页技术栈区风格保持一致

### 联系方式卡片

- 居中窄卡片，带 `ring-1 ring-gray-200 dark:ring-gray-800` + `rounded-2xl`
- 邮箱 icon + 文字 + mailto 链接
- hover: 卡片 `y:-2px` + shadow + 边框变 primary 色
- 入场：`whileInView`, `y:20→0, opacity:0→1`

### Slogan 尾句

- 轻量文案，如 "Let's build something great together."
- 居中，淡入，字号稍小，灰色调
- 给页面一个温和的收尾

---

## 实现约束

1. **Nuxt 4 + Nuxt UI v4** 环境，组件使用 `<script setup lang="ts">` + Composition API
2. `motion-v` 通过 `pnpm add motion-v` 安装，无需 nuxt module
3. 不破坏现有功能：SEO meta、内容查询、View Transition 均保持不变
4. 不在 `<style scoped>` 中新增 CSS keyframes — 全部用 motion-v 的声明式 API
5. 保持暗色模式兼容：所有动画元素在 light/dark 下均正常显示
6. `pnpm typecheck && pnpm lint && pnpm test` 全部通过

---

## 验收标准

- [ ] 首页每个 Section 滚动进入视口时有明显的 staggered 入场动画
- [ ] 关于我页面有时间线布局 + 滚动揭示动画
- [ ] 所有 hover 交互使用 spring 过渡，手感流畅
- [ ] 动画仅在首次进入视口时播放
- [ ] 无 console 报错，TypeScript 类型无异常
- [ ] Light/Dark 模式均正常
- [ ] View Transition 路由切换正常
