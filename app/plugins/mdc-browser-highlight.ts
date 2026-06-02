// 强制 MDC 使用浏览器端 Shiki 高亮（#mdc-highlighter），
// 跳过首次 /api/_mdc/highlight 网络请求，避免代码块渲染延迟和闪烁。
// 对应 @nuxtjs/mdc 的 rehype-nuxt.js 高亮器逻辑：
//   默认 → $fetch("/api/_mdc/highlight") → 404 后才切到浏览器端
//   设置此 flag → 直接走 import("#mdc-highlighter")，语言包在构建时已打包
export default defineNuxtPlugin(() => {
  if (import.meta.client) {
    window.sessionStorage.setItem('mdc-shiki-highlighter', 'browser')
  }
})
