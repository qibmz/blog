/**
 * 带 loading / error 状态的 API 调用封装
 *
 * 配合 app/plugins/api.ts 全局拦截器使用：
 * - Plugin 已统一弹 toast + 处理 401
 * - 本 composable 提供额外的 loading 和 error 状态
 *
 * @example
 * const { isLoading, error, execute } = useApi()
 * const result = await execute(() => $fetch('/api/chats', { method: 'POST', body: { ... } }))
 */

export function useApi() {
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  /**
   * 执行一个请求，自动管理 loading / error 状态
   *
   * @param fn  返回 Promise 的请求函数（通常包装 $fetch 调用）
   * @returns   请求成功时返回 data；失败时透传异常（toast 已由 plugin 弹出）
   */
  async function execute<T>(fn: () => Promise<T>): Promise<T> {
    isLoading.value = true
    error.value = null
    try {
      return await fn()
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return { isLoading, error, execute }
}
