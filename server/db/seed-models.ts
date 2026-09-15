/**
 * 模型能力元数据 Seed 脚本
 *
 * 仅写入「能力覆盖」初始行；列表本身以各家 /models API 为准。
 * ON CONFLICT DO NOTHING：不覆盖生产库手工改过的能力字段。
 *
 * Preview (develop): prebuild-migrate.js 自动执行
 * Production (main): 先设置 DATABASE_URL，再
 *   `SEED_TARGET=production npx tsx server/db/seed-models.ts`
 */
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

// ─── 生产环境安全保护 ────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'production' || process.env.SEED_TARGET === 'production') {
  console.warn('⚠️  About to seed PRODUCTION database in 3s... Press Ctrl+C to cancel.')
  await new Promise(resolve => setTimeout(resolve, 3000))
}

const dbUrl = process.env.DATABASE_URL
if (!dbUrl) {
  console.error('[seed-models] ❌ DATABASE_URL not set')
  process.exit(1)
}

const db = drizzle(neon(dbUrl), { schema })

// ─── 能力覆盖初始值（仅 insert，不覆盖已有行）───────────────────────────────
const seedData: { id: string, supportsImages: boolean, supportsWebSearch: boolean }[] = [
  // DeepSeek（官方推荐 deepseek-flash；旧 ID 保留兼容）
  { id: 'deepseek-flash', supportsImages: true, supportsWebSearch: false },
  { id: 'deepseek-v4-pro', supportsImages: false, supportsWebSearch: false },
  { id: 'deepseek-v4-flash', supportsImages: true, supportsWebSearch: false },
  // MiMo 当前对话模型
  { id: 'mimo-v2.5-pro', supportsImages: false, supportsWebSearch: true },
  { id: 'mimo-v2.5', supportsImages: true, supportsWebSearch: true },
  // 非对话 / 已下线：保留能力记录
  { id: 'mimo-v2.5-flash', supportsImages: false, supportsWebSearch: false },
  { id: 'mimo-v2.5-asr', supportsImages: false, supportsWebSearch: false },
  { id: 'mimo-v2-omni', supportsImages: true, supportsWebSearch: false },
  { id: 'mimo-v2-omni-pro', supportsImages: false, supportsWebSearch: false },
  { id: 'mimo-v2-omni-flash', supportsImages: false, supportsWebSearch: false }
]

console.log(`[seed-models] Seeding ${seedData.length} capability overrides (DO NOTHING on conflict)...`)

for (const model of seedData) {
  await db
    .insert(schema.models)
    .values({
      id: model.id,
      supportsImages: model.supportsImages,
      supportsWebSearch: model.supportsWebSearch,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    .onConflictDoNothing({ target: schema.models.id })
}

console.log('[seed-models] ✅ Seed complete')
process.exit(0)
