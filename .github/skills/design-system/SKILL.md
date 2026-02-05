# Design System & Guidelines

## 设计理念

本项目采用 **现代极简主义 + 渐变特效** 的设计风格，基于 Nuxt UI / UI Pro 组件库构建，强调：

- ✨ **现代感**：渐变背景、光效、Backdrop Blur
- 🎨 **品牌化**：统一的色彩系统和视觉语言
- ♿ **可访问性**：高对比度、清晰的视觉层次
- 📱 **响应式**：Mobile First 的设计方法

---

## 色彩系统

### 主色彩

| 颜色 | Tailwind 类名 | 使用场景 | RGB |
|------|--------------|--------|-----|
| Primary | `primary-500` / `primary-600` | 按钮、链接、强调 | `#3b82f6` |
| Purple | `purple-500` / `purple-600` | 次级强调、渐变 | `#a855f7` |
| Pink | `pink-500` / `pink-600` | 渐变、装饰 | `#ec4899` |
| Green | `green-500` / `emerald-500` | 成功、积极指标 | `#10b981` |
| Yellow | `yellow-300` / `orange-500` | 警告、高亮 | `#fbbf24` |

### 背景与文本

**浅色模式：**
- 背景：`white`
- 文本：`gray-900`（深灰）
- 次级文本：`gray-600`（中灰）
- 卡片背景：`white` + `ring-1 ring-gray-200`

**深色模式：**
- 背景：`gray-950` / `gray-900`
- 文本：`white`
- 次级文本：`gray-400`（浅灰）
- 卡片背景：`dark:bg-gray-900` + `dark:ring-gray-800`

### 渐变组合

推荐的渐变方向：`bg-gradient-to-br`（左上到右下）

**常用渐变：**
```tailwind
/* 主色渐变 */
from-primary-600 via-purple-600 to-pink-600

/* 技能卡片渐变 */
from-green-500 to-emerald-500      /* 跨平台 */
from-purple-500 to-pink-500        /* 区块链 */
from-yellow-500 to-orange-500      /* 性能 */
from-blue-500 to-indigo-500        /* 工具 */
```

---

## 排版规范

### 字体栈

```css
font-family: 'Helvetica Neue', Arial, sans-serif;
```

### 文字大小等级

| 用途 | Tailwind | 字号 | 字重 |
|------|---------|-----|-----|
| 大标题（Hero） | `text-4xl` ~ `text-6xl` | 36px ~ 60px | `font-bold` |
| 页面标题 | `text-3xl` | 30px | `font-bold` |
| 段落标题 | `text-lg` ~ `text-xl` | 18px ~ 20px | `font-semibold` |
| 正文 | `text-base` | 16px | `font-normal` |
| 引导文本 | `text-sm` | 14px | `font-medium` |
| 辅助文本 | `text-xs` ~ `text-sm` | 12px ~ 14px | `font-normal` |

### 行高

```tailwind
leading-tight      /* 1.25 - 标题 */
leading-normal     /* 1.5 - 正文 */
leading-relaxed    /* 1.625 - 段落 */
```

### 文字截断与省略

```tailwind
/* 单行省略 */
truncate

/* 多行省略（2行、3行等） */
line-clamp-2
line-clamp-3

/* 行内折叠 */
text-balance     /* 更智能的文字换行 */
```

---

## 卡片与容器设计

### 卡片基础样式

```html
<!-- 标准卡片 -->
<div class="bg-white dark:bg-gray-900 rounded-2xl p-6 ring-1 ring-gray-200 dark:ring-gray-800">
  <!-- 内容 -->
</div>

<!-- 悬停卡片（带动画） -->
<div class="group bg-white dark:bg-gray-900 rounded-2xl p-6 
            ring-1 ring-gray-200 dark:ring-gray-800
            transition-all duration-300 hover:shadow-xl hover:-translate-y-1
            cursor-pointer">
  <!-- 内容 -->
</div>
```

### 圆角规范

| 大小 | Tailwind | 使用场景 |
|------|---------|--------|
| 极小 | `rounded-lg` | 小按钮、小图标 |
| 小 | `rounded-xl` | 卡片、中等组件 |
| 中 | `rounded-2xl` | 主要卡片 |
| 大 | `rounded-3xl` | CTA 容器、Hero |
| 最大 | `rounded-full` | 圆形元素、徽章 |

### 间距与内边距

```tailwind
/* 容器间距 */
py-12           /* 顶部/底部 */
py-16 / py-20   /* 大容器 */

/* 内容内边距 */
p-6             /* 标准卡片 */
p-8 / p-12      /* 大容器 */

/* 元素间距 */
gap-3 / gap-4   /* 卡片内元素 */
gap-6           /* 网格间距 */
```

---

## 交互与动画

### 过渡效应

```tailwind
/* 标准过渡 */
transition-all duration-300      /* 所有属性，300ms */
transition-colors duration-200   /* 仅颜色，200ms */
transition-transform duration-300 /* 仅变形，300ms */

/* 时间窗口 */
duration-200   /* 快速交互 - 按钮、颜色变化 */
duration-300   /* 标准交互 - 卡片展开、缩放 */
duration-500   /* 缓慢动画 - 页面加载 */
```

### Hover 效果规范

```tailwind
/* 阴影提升 */
hover:shadow-lg
hover:shadow-xl

/* 位移 */
hover:-translate-y-1    /* 向上浮起 1px */
hover:translate-y-0     /* 恢复位置 */

/* 缩放 */
group-hover:scale-110   /* 按钮、图标缩放 */

/* 旋转 */
group-hover:rotate-6    /* 卡片微妙旋转 */

/* 颜色变化 */
group-hover:text-primary-500
group-hover:opacity-20
```

### 常见交互模式

**按钮悬停：**
```html
<UButton class="group">
  <template #trailing>
    <UIcon name="i-lucide-arrow-right" 
            class="group-hover:translate-x-1 transition-transform" />
  </template>
</UButton>
```

**卡片悬停：**
```html
<div class="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
  <h3 class="group-hover:text-primary-500 transition-colors">标题</h3>
</div>
```

**图标缩放：**
```html
<UIcon class="group-hover:scale-110 transition-transform duration-300" />
```

---

## 装饰性元素

### 光效（Blur Orb）

用于营造高级感的半透明圆形光效：

```html
<!-- 顶部右侧光效 -->
<div class="absolute top-0 right-0 w-96 h-96 
            bg-white/10 rounded-full blur-3xl 
            -translate-y-1/2 translate-x-1/2" />

<!-- 底部左侧光效 -->
<div class="absolute bottom-0 left-0 w-96 h-96 
            bg-white/5 rounded-full blur-3xl 
            translate-y-1/2 -translate-x-1/2" />
```

### 网格纹理

作为背景装饰增加质感：

```html
<div class="absolute inset-0 opacity-10"
     style="background-image: url('data:image/svg+xml,%3Csvg width=%2760%27 height=%2760%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cg stroke=%27white%27 stroke-width=%271%27 fill=%27none%27%3E%3Cpath d=%27M0 0l60 60M0 60l60 -60%27/%3E%3C/g%3E%3C/svg%3E')" />
```

### Backdrop Blur

用于创建毛玻璃效果的背景层：

```tailwind
backdrop-blur-xl    /* 强模糊 - CTA 徽章 */
backdrop-blur-lg    /* 中模糊 - 信息卡片 */
backdrop-blur-sm    /* 弱模糊 - 辅助元素 */

/* 配合半透明背景 */
bg-white/10 backdrop-blur-xl          /* 浅色背景 */
bg-white/5 backdrop-blur-xl rounded-xl /* 深色背景 */
```

---

## 响应式设计

### 断点（Tailwind 标准）

```tailwind
/* 移动端优先（Mobile First） */
/* 无前缀 - 超小屏幕 (320px+) */
sm:  /* 640px+ */
md:  /* 768px+ */
lg:  /* 1024px+ */
xl:  /* 1280px+ */
2xl: /* 1536px+ */
```

### 常见响应式模式

**栅格布局：**
```html
<!-- 2列移动/4列桌面 -->
<div class="grid grid-cols-2 md:grid-cols-4 gap-6"></div>

<!-- 1列移动/3列平板/4列桌面 -->
<div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6"></div>
```

**字体大小：**
```html
<h1 class="text-3xl md:text-4xl lg:text-5xl"></h1>
```

**间距：**
```html
<div class="px-4 md:px-8 py-6 md:py-12"></div>
```

**弹性布局：**
```html
<!-- 移动竖排/桌面横排 -->
<div class="flex flex-col sm:flex-row gap-4"></div>
```

---

## 特殊页面规范

### Hero 区域

```html
<UPageHero
  :title="title"
  :description="description"
>
  <template #top>
    <!-- 装饰背景 -->
    <HeroBackground />
    <StarsBg />
  </template>
  <template #links>
    <!-- CTA 按钮 -->
  </template>
</UPageHero>
```

**特点：**
- 大型渐变背景
- Hero 标题 4-6xl
- 装饰性背景元素
- 清晰的 CTA 按钮

### CTA 区域

遵循以下结构：

```html
<div class="py-16 rounded-3xl overflow-hidden relative">
  <!-- 背景层 -->
  <div class="absolute inset-0">
    <!-- 主渐变 -->
    <div class="bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600" />
    <!-- 光效 -->
    <!-- 纹理 -->
  </div>
  
  <!-- 内容层 -->
  <div class="relative text-center px-8 py-16">
    <!-- 顶部标签 -->
    <!-- 标题 -->
    <!-- 描述 -->
    <!-- 按钮组 -->
    <!-- 信息卡片 -->
  </div>
</div>
```

### 统计卡片（Stats）

```html
<div class="group relative bg-white dark:bg-gray-900 
            rounded-2xl p-6 text-center
            transition-all duration-300 hover:shadow-xl hover:-translate-y-1
            ring-1 ring-gray-200 dark:ring-gray-800">
  <UIcon class="w-10 h-10 group-hover:scale-110 transition-transform" />
  <div class="text-3xl font-bold">{{ value }}</div>
  <div class="text-sm text-gray-600 dark:text-gray-400">{{ label }}</div>
</div>
```

---

## 暗色模式支持

所有组件都应支持 `dark:` 前缀的暗色主题：

```tailwind
/* 标准模式 / 暗色模式 */
bg-white dark:bg-gray-900
text-gray-900 dark:text-white
ring-gray-200 dark:ring-gray-800
text-gray-600 dark:text-gray-400
```

### 暗色模式激活

在 `app.vue` 或全局配置中：

```ts
// app.config.ts
export default defineAppConfig({
  ui: {
    // 使用系统主题偏好
    colors: {
      primary: 'blue'
    }
  }
})
```

---

## 最佳实践

✅ **推荐做法：**
- 使用 `group` 和 `group-hover:` 实现卡片交互
- 遵循 4px 间距规范（p-4, gap-4, py-12 = 3×4）
- 所有过渡时间使用 `duration-300` 作为标准
- 深色模式文本颜色：`text-gray-600 dark:text-gray-400`
- 始终在卡片上使用 `ring-1` 以增强边界感

❌ **避免做法：**
- 自定义颜色而不是使用 Tailwind 调色板
- 混合不同的 `rounded` 大小（统一使用 `rounded-2xl` / `rounded-xl`）
- 过度使用阴影（仅在 hover 状态和特殊强调时使用）
- 忽视暗色模式支持
- 使用过长的过渡时间（超过 500ms 会感觉迟缓）

---

## 示例代码

### 标准卡片组件

```vue
<template>
  <div class="group relative bg-white dark:bg-gray-900 rounded-2xl p-6
              ring-1 ring-gray-200 dark:ring-gray-800
              transition-all duration-300 hover:shadow-xl hover:-translate-y-1
              cursor-pointer">
    
    <!-- 可选：渐变背景 -->
    <div class="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-500 
                opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 
                rounded-2xl transition-opacity duration-300" />
    
    <!-- 内容 -->
    <div class="relative">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white 
                 group-hover:text-primary-500 transition-colors">
        标题
      </h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
        描述文本
      </p>
    </div>
  </div>
</template>
```

### CTA 按钮组

```vue
<template>
  <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
    <UButton
      size="xl"
      color="white"
      variant="solid"
      icon="i-lucide-mail"
      label="发送邮件"
      class="group"
    >
      <template #trailing>
        <UIcon name="i-lucide-arrow-right" 
                class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </template>
    </UButton>

    <UButton
      size="xl"
      color="gray"
      variant="outline"
      icon="i-lucide-book-open"
      label="查看文档"
      class="border-white/30 hover:bg-white/10"
    />
  </div>
</template>
```

---

## 相关文件

- `app/app.config.ts` - UI 主题配置
- `app/assets/css/main.css` - 全局样式
- `nuxt.config.ts` - Nuxt 配置

## 更新日期

最后更新于：2026年2月5日

