/**
 * 模型目录 Seed —— 列表与能力全部以本文件 + DB 为准（不读 Provider /models）。
 *
 * ON CONFLICT DO UPDATE：以本文件为权威。
 *
 * Preview (develop): prebuild-migrate.js 自动执行
 * Production (main): 先设置 DATABASE_URL，再
 *   `SEED_TARGET=production npx tsx server/db/seed-models.ts`
 */
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { notInArray } from 'drizzle-orm'
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

type SeedRow = {
  id: string
  label: string
  icon: string
  supportsImages: boolean
  supportsThinking: boolean
  supportsWebSearch: boolean
  enabled: boolean
  sortOrder: number
}

const DEEPSEEK_ICON = 'i-simple-icons-deepseek'
const MIMO_ICON = 'i-simple-icons-xiaomi'

/** 对话下拉：enabled=true；其余保留行供历史会话能力查询。
 *  正式库 migration `0005_models_catalog.sql` 内嵌同清单 —— 改这里时请同步改 SQL。
 */
const seedData: SeedRow[] = [
  {
    id: 'deepseek-flash',
    label: 'DeepSeek Flash',
    icon: DEEPSEEK_ICON,
    supportsImages: true,
    supportsThinking: true,
    supportsWebSearch: false,
    enabled: true,
    sortOrder: 10
  },
  {
    id: 'deepseek-v4-pro',
    label: 'DeepSeek V4 Pro',
    icon: DEEPSEEK_ICON,
    supportsImages: false,
    supportsThinking: true,
    supportsWebSearch: false,
    enabled: true,
    sortOrder: 20
  },
  {
    id: 'deepseek-v4-flash',
    label: 'DeepSeek V4 Flash',
    icon: DEEPSEEK_ICON,
    supportsImages: true,
    supportsThinking: true,
    supportsWebSearch: false,
    enabled: true,
    sortOrder: 30
  },
  {
    id: 'mimo-v2.5-pro',
    label: 'MiMo V2.5 Pro',
    icon: MIMO_ICON,
    supportsImages: false,
    supportsThinking: true,
    supportsWebSearch: true,
    enabled: true,
    sortOrder: 40
  },
  {
    id: 'mimo-v2.5',
    label: 'MiMo V2.5',
    icon: MIMO_ICON,
    supportsImages: true,
    supportsThinking: true,
    supportsWebSearch: true,
    enabled: true,
    sortOrder: 50
  },
  // ── 已下线 / 非对话：enabled=false，不出现在下拉 ──────────────────────────
  {
    id: 'mimo-v2.5-flash',
    label: 'MiMo V2.5 Flash',
    icon: MIMO_ICON,
    supportsImages: false,
    supportsThinking: false,
    supportsWebSearch: false,
    enabled: false,
    sortOrder: 100
  },
  {
    id: 'mimo-v2.5-asr',
    label: 'MiMo V2.5 ASR',
    icon: MIMO_ICON,
    supportsImages: false,
    supportsThinking: false,
    supportsWebSearch: false,
    enabled: false,
    sortOrder: 110
  },
  {
    id: 'mimo-v2-omni',
    label: 'MiMo V2 Omni',
    icon: MIMO_ICON,
    supportsImages: true,
    supportsThinking: false,
    supportsWebSearch: false,
    enabled: false,
    sortOrder: 120
  },
  {
    id: 'mimo-v2-omni-pro',
    label: 'MiMo V2 Omni Pro',
    icon: MIMO_ICON,
    supportsImages: false,
    supportsThinking: false,
    supportsWebSearch: false,
    enabled: false,
    sortOrder: 130
  },
  {
    id: 'mimo-v2-omni-flash',
    label: 'MiMo V2 Omni Flash',
    icon: MIMO_ICON,
    supportsImages: false,
    supportsThinking: false,
    supportsWebSearch: false,
    enabled: false,
    sortOrder: 140
  }
]

console.log(`[seed-models] Seeding ${seedData.length} catalog rows (DO UPDATE on conflict)...`)

for (const model of seedData) {
  const now = new Date()
  await db
    .insert(schema.models)
    .values({
      ...model,
      createdAt: now,
      updatedAt: now
    })
    .onConflictDoUpdate({
      target: schema.models.id,
      set: {
        label: model.label,
        icon: model.icon,
        supportsImages: model.supportsImages,
        supportsThinking: model.supportsThinking,
        supportsWebSearch: model.supportsWebSearch,
        enabled: model.enabled,
        sortOrder: model.sortOrder,
        updatedAt: now
      }
    })
}

// 清单外孤儿行关闭，避免 /api/models 冒出空白 label
const catalogIds = seedData.map(m => m.id)
await db
  .update(schema.models)
  .set({ enabled: false, updatedAt: new Date() })
  .where(notInArray(schema.models.id, catalogIds))

console.log('[seed-models] ✅ Seed complete')
process.exit(0)
