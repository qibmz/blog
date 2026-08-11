import type { ParsedContent } from '@nuxt/content'
import type { Avatar, Badge, Link } from '#ui/types'

declare module '#auth-utils' {
  interface User {
    id: string
    name: string
    login: string
    avatar: string
  }
}

/**
 * UseFetchOptions 定义在 nuxt/dist/app/composables/fetch.js，
 * 扩充 nuxt/app 不会合并到 createUseFetch 用的那个接口。
 */
declare module 'nuxt/dist/app/composables/fetch.js' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface UseFetchOptions<ResT, DataT, PickKeys, DefaultT, R, M> {
    /** 为 true 时 401 不跳转登录，仅透传错误 */
    skipAuthRedirect?: boolean
  }
}

declare module 'ofetch' {
  interface FetchOptions {
    /** 透传到 onResponseError，控制 401 是否跳转登录 */
    skipAuthRedirect?: boolean
  }
}

export interface BlogPost extends ParsedContent {
  title: string
  description: string
  date: string
  image?: HTMLImageElement
  badge?: Badge
  authors?: ({
    name: string
    description?: string
    avatar: Avatar
  } & Link)[]
}
