import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

type Db = ReturnType<typeof drizzle<typeof schema>>

let _instance: Db | undefined

function getInstance(): Db {
  if (!_instance) {
    _instance = drizzle(neon(process.env.DATABASE_URL!), { schema })
  }
  return _instance
}

// Proxy 懒初始化：首次实际调用时才建立连接，避免模块加载时 env 未就绪
export const db: Db = new Proxy({} as Db, {
  get(_, prop: string | symbol) {
    return getInstance()[prop as keyof Db]
  }
})

export { schema }
