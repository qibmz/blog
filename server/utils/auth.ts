import type { H3Event } from 'h3'

/**
 * OAuth 登录失败时统一重定向到 /login 并携带错误码，
 * 前端 login.vue 根据 error 参数展示对应提示。
 */
export function sendOAuthErrorRedirect(event: H3Event, provider: string) {
  return sendRedirect(event, `/login?error=${provider}_auth_failed`)
}
