import { normalizeError } from '~/utils/error'

let _api: ReturnType<typeof $fetch.create> | null = null

function getApi() {
  if (_api) return _api

  const nuxtApp = useNuxtApp()

  _api = $fetch.create({
    onResponseError({ response, options }) {
      const skipAuthRedirect = (options as unknown as Record<string, unknown>).skipAuthRedirect

      if (import.meta.server) {
        throw Object.assign(new Error(normalizeError(response._data)), {
          statusCode: response.status
        })
      }

      // 401 → 跳转登录（skipAuthRedirect 可跳过）
      if (response.status === 401) {
        if (skipAuthRedirect) {
          throw Object.assign(new Error(normalizeError(response._data)), {
            statusCode: 401
          })
        }
        window.location.href = '/login'
        return
      }

      // 其他错误 → toast + 透传
      const message = normalizeError(response._data)
      nuxtApp.runWithContext(() => {
        useToast().add({
          title: '请求失败',
          description: message,
          color: 'error',
          icon: 'i-lucide-alert-circle',
          duration: 6000
        })
      })

      throw Object.assign(new Error(message), { statusCode: response.status })
    }
  })

  return _api
}

/**
 * 带统一错误拦截的 $fetch 实例，用于命令式 API 调用（POST/PATCH/DELETE）。
 * GET 类请求优先使用 useAPI()。
 */
export const api = () => getApi()

/**
 * 带统一错误拦截的 API composable，签名和 useFetch 一致。
 * - 401 自动跳转 /login（传 skipAuthRedirect: true 可跳过，仅透传错误）
 * - 其他 4xx/5xx 弹出 toast 并透传错误
 */
export const useAPI = createUseFetch((callerOptions) => {
  const { skipAuthRedirect, ...rest } = callerOptions
  return {
    ...rest,
    skipAuthRedirect,
    $fetch: getApi() as typeof $fetch
  }
})
