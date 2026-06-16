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

declare module 'nuxt/app' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface UseFetchOptions<ResT, DataT, PickKeys, DefaultT, R, M> {
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
