/**
 * 全局 $fetch 异常拦截插件
 *
 * - 统一解析不同来源的错误消息格式
 * - 自动弹出 toast 通知
 * - 401 跳转 GitHub 登录
 * - 错误透传给调用方（useFetch 会设置 error ref，useApi 可额外处理）
 */

const ERROR_TITLE = '请求失败'

export default defineNuxtPlugin((nuxtApp) => {
  // 仅客户端需要 toast / 登录跳转
  if (import.meta.server) return

  globalThis.$fetch = globalThis.$fetch.create({
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

      // 透传错误，让调用方（useFetch / useApi）仍可捕获
      throw Object.assign(new Error(message), {
        statusCode: response.status
      })
    }
  })
})
