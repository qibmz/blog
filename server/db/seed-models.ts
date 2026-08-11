/**
 * 模型能力元数据 Seed 脚本
 *
 * 全量初始化 models 表的能力数据，INSERT ... ON CONFLICT DO UPDATE 保证幂等。
 * Preview (develop): prebuild-migrate.js 自动执行
 * Production (main): schema 用
 *   `npx neonctl psql main --project-id <NEON_PROJECT_ID> -- --set ON_ERROR_STOP=on --single-transaction -f server/db/migrations/xxx.sql`
 *   seed 先在环境中设置 DATABASE_URL（勿把凭据写进命令行），再执行：
 *   `SEED_TARGET=production npx tsx server/db/seed-models.ts`
 */
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

// ─── 生产环境安全保护 ────────────────────────────────────────────────────────
// 本地默认 NODE_ENV=development，因此正式服 seed 需显式 SEED_TARGET=production
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

// ─── 全量模型能力数据 ─────────────────────────────────────────────────────────
// 对话侧 MiMo 仅 mimo-v2.5-pro / mimo-v2.5；其余 seed 行作兼容/能力权威。
const seedData: { id: string, supportsImages: boolean, supportsWebSearch: boolean }[] = [
  // DeepSeek
  { id: 'deepseek-v4-pro', supportsImages: false, supportsWebSearch: false },
  { id: 'deepseek-v4-flash', supportsImages: false, supportsWebSearch: false },
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

console.log(`[seed-models] Seeding ${seedData.length} models...`)

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
    .onConflictDoUpdate({
      target: schema.models.id,
      set: {
        supportsImages: model.supportsImages,
        supportsWebSearch: model.supportsWebSearch,
        updatedAt: new Date()
      }
    })
}

console.log('[seed-models] ✅ Seed complete')
process.exit(0)
