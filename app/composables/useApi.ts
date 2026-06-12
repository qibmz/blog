/**
 * 自定义 API composable — Nuxt 官方推荐的 createUseFetch 封装
 *
 * 配合 app/plugins/api.ts 提供的 $api 实例使用：
 * - Plugin 已统一弹 toast + 处理 401
 * - 本 composable 拥有和 useFetch 完全一致的签名和返回类型
 *
 * @example
 * // GET（SSR 友好）
 * const { data } = await useAPI('/api/chats')
 *
 * // POST（动态 body）
 * const body = ref({ message: 'hello' })
 * const { data, pending, execute } = useAPI('/api/chats', {
 *   method: 'POST', body, immediate: false, watch: false
 * })
 * await execute()
 */

export const useAPI = createUseFetch(options => ({
  ...options,
  $fetch: useNuxtApp().$api as typeof $fetch
}))
