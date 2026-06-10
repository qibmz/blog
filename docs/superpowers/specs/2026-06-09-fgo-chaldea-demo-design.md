# FGO Chaldea Terminal — AI 生成官网 Demo 设计 Spec

**日期：** 2026-06-09  
**状态：** 待审批  
**分支：** develop

---

## 一、概念

一个 **Fate/Grand Order 英灵召唤主题** 的单页沉浸式体验。用户从"召唤阵"进入，逐步解锁内容，像游戏主线一样滚动下去。

右下角浮动卡片展示生成这个页面的 AI 提示词/工具/模型，体现"Prompt → Design"的自解释关系。

**页面名：** `Chaldea Terminal`（迦勒底终端）  
**定位：** Playground Demo + 可直接复用的 FGO 风格模板  
**路由：** `/playground/fgo-chaldea`  
**文件：** `app/pages/playground/fgo-chaldea.vue`

---

## 二、视觉方向

| 维度 | 方案 |
|------|------|
| **底色** | `#080c1a` 深渊蓝黑，叠加 CSS 星场噪点 |
| **主色调** | 皇室金 `#c9a84c` → `#f0d060`（魔力金） |
| **辅色** | 令咒红 `#c41e3a` + 魔术蓝 `#4a9eff`（辉光） |
| **字体** | 标题：**Cinzel**（Google Fonts，衬线体，极像 FGO 标题字）；正文：**DM Sans**；数字：**JetBrains Mono** |
| **卡片** | 暗色面板 + 金色细边 `border-[#c9a84c]/20` + 四角 bracket 装饰 |
| **背景** | 多层径向渐变模拟魔力光 + CSS 星场 + 浮动粒子 |
| **按钮** | 金底黑字主按钮 hover 外发光；次按钮金色描边 |
| **装饰** | 召唤阵（CSS/SVG 金色几何曼陀罗）、令咒图案（SVG path）、职阶符号（SVG inline） |

### 色调参考

```
Obsidian Base    #080c1a  →  #0d1230  →  #141c3a
Royal Gold       #c9a84c  →  #d4af37  →  #f0d060
Command Red      #8b1a2b  →  #c41e3a  →  #ff4d6a
Magic Blue       #1e3a5f  →  #4a9eff  →  #88ccff
```

---

## 三、区块结构

| # | 区块 | 内容 | 核心动画 |
|---|------|------|---------|
| 1 | **Nav** | 极简顶栏：Logo + 导航链接 | 滚动后 backdrop-blur 渐显 |
| 2 | **Hero** | 中央巨型召唤阵（CSS/SVG 金色圆环几何曼陀罗），标题 "Chaldea Terminal"，副标题，CTA 按钮 | 召唤阵持续旋转 + 粒子从中心飘散 + 文字 stagger 浮现 |
| 3 | **Servant Classes** | 7 个职阶卡片网格（Saber / Archer / Lancer / Rider / Caster / Assassin / Berserker），每张含职阶图标 + 简短描述 | ScrollTrigger 错位滑入 + hover 金色 border glow + scale(1.05) |
| 4 | **Tech Stack** | 工具链以"令咒"风格展示（Vue / Nuxt / GSAP / Tailwind / TypeScript / Claude 等） | ScrollTrigger + pin + 横向无限滚动 |
| 5 | **Stats** | 3 个巨型魔力数值（类似游戏内面板） | ScrollTrigger 触发 counter 递增动画 |
| 6 | **CTA** | 全宽金色辉光底 + 大按钮"开始召唤" | ScrollTrigger scale 0.8→1 + 金光爆发 |

**浮动卡片（右下角）：**

```
┌──────────────────────────┐
│ ⚡ AI 生成信息            │
│ 📝 Prompt                 │
│ "Design a Fate/Grand Order│
│  themed landing page..."  │
│ 🛠 Claude Code            │
│ 🧠 Claude Opus 4.8        │
│ 🎨 Tailwind CSS + GSAP    │
└──────────────────────────┘
```

---

## 四、素材策略

**核心原则：最大化 CSS/SVG 自绘，减少外部依赖。**

| 素材 | 实现方式 |
|------|---------|
| FGO Logo 风格标题 | Cinzel 字体 + CSS gold gradient text |
| 召唤阵 | 纯 CSS 多层 border-radius + conic-gradient 圆环 + SVG inline 几何图案 |
| 职阶图标 | 7 个简单 SVG inline（剑/弓/枪/马/杖/面具/链） |
| 令咒图案 | CSS clip-path + SVG path 红色抽象图形 |
| 星场背景 | CSS radial-gradient 多层 + animation @keyframes 闪烁 |
| 粒子效果 | 多个绝对定位小圆点 + CSS animation 飘散 |
| 魔力辉光 | Tailwind gradient + blur 滤镜 |

**外部依赖：**
- Google Fonts：Cinzel + DM Sans + JetBrains Mono（CDN，不影响复制使用）
- npm：`gsap`（ScrollTrigger 插件）

---

## 五、动画方案

所有动画使用 GSAP + ScrollTrigger，在 `onMounted` 中初始化。

| 区块 | GSAP 实现 |
|------|----------|
| **Hero 召唤阵** | `gsap.to(ring, { rotation: 360, duration: 20, repeat: -1, ease: 'none' })`；粒子 `gsap.fromTo` 循环扩散 |
| **职阶卡片** | `gsap.from(cards, { y: 80, opacity: 0, stagger: 0.15, scrollTrigger: { trigger: section, start: 'top 80%' } })` |
| **技术栈滚动** | `gsap.to(track, { x: -scrollWidth, scrollTrigger: { trigger: section, pin: true, scrub: 1 } })` |
| **魔力数值** | `gsap.fromTo(counter, { textContent: 0 }, { textContent: target, duration: 2, snap: { textContent: 1 }, scrollTrigger: ... })` |
| **CTA** | `gsap.from(cta, { scale: 0.8, opacity: 0, scrollTrigger: { trigger: section, start: 'top 80%' } })` |
| **Nav** | `gsap.to(nav, { backgroundColor: 'rgba(8,12,26,0.8)', backdropFilter: 'blur(20px)', scrollTrigger: ... })` |

---

## 六、响应式

| 断点 | 布局变化 |
|------|---------|
| **Desktop (≥1024px)** | 完整布局，召唤阵 400px，职阶 4+3 网格 |
| **Tablet (768-1023px)** | 召唤阵 300px，职阶 3+2+2 网格 |
| **Mobile (<768px)** | 召唤阵 220px，单列堆叠，浮动卡片改为底部居中 bar |

---

## 七、技术约束

- ✅ **纯 Tailwind CSS**，零 Nuxt UI 组件
- ✅ **GSAP** + ScrollTrigger（`npm install gsap`）
- ✅ 单个 `.vue` 文件 `app/pages/playground/fgo-chaldea.vue`
- ✅ `onMounted` 初始化动画，`onUnmounted` `ScrollTrigger.killAll()`
- ✅ 复制到其他 Vue/Nuxt 项目：装 `gsap` + 有 Tailwind 即可运行
- ✅ 提示词卡片在模板中写死，字体用 Google Fonts CDN
- ✅ 所有装饰元素 CSS/SVG 自绘，零外部图片依赖

---

## 八、与 Playground 列表集成

在 `app/pages/playground/index.vue` 的 `playgrounds` 数组中新增：

```ts
{
  title: 'FGO 迦勒底终端',
  description: 'Fate/Grand Order 主题沉浸式单页，GSAP + Tailwind CSS 驱动',
  icon: 'i-lucide-sparkles',
  to: '/playground/fgo-chaldea',
  gradient: 'from-amber-500 to-rose-500'
}
```
