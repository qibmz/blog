import { neon } from '@neondatabase/serverless'

export default defineEventHandler(async () => {
  const { databaseUrl } = useRuntimeConfig()
  const sql = neon(databaseUrl)
  const [response] = await sql`SELECT version()`
  return { version: response.version }
})
