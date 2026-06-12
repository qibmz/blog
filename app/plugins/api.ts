/**
 * 自定义 $fetch 实例插件
 *
 * 通过 nuxtApp.provide 暴露 $api，配合 app/composables/useApi.ts 的 createUseFetch 使用。
 * 遵循 Nuxt 官方推荐方案，不覆写 globalThis.$fetch。
 *
 * - 统一解析不同来源的错误消息格式
 * - 自动弹出 toast 通知
 * - 401 跳转 GitHub 登录
 * - 错误透传给调用方（useFetch 会设置 error ref）
 */

const ERROR_TITLE = '请求失败'

export default defineNuxtPlugin((nuxtApp) => {
  // 仅客户端需要 toast / 登录跳转
  if (import.meta.server) return

  const api = $fetch.create({
    async onResponseError({ response }) {
      const message = normalizeError(response._data)
      // 401 → 直接跳转登录，不弹 toast
      if (response.status === 401) {
        window.location.href = '/auth/github'
        return
      }

      // 弹出 toast 通知
      await nuxtApp.runWithContext(() => {
        const toast = useToast()
        toast.add({
          title: ERROR_TITLE,
          description: message,
          color: 'error',
          icon: 'i-lucide-alert-circle',
          duration: 6000
        })
      })

      // 透传错误，让调用方仍可捕获
      throw Object.assign(new Error(message), {
        statusCode: response.status
      })
    }
  })

  return {
    provide: {
      api
    }
  }
})
