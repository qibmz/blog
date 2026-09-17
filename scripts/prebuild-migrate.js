// Vercel Preview Branching: 仅在 preview 环境自动同步数据库 schema
// production 跳过，手动执行以保证迁移安全
// 预览环境使用 drizzle-kit push（天然幂等，预览库是临时的无需迁移审计）
import { execSync } from 'node:child_process'

if (process.env.VERCEL_ENV !== 'preview') {
  process.exit(0)
}

const dbUrl = process.env.DATABASE_URL
if (!dbUrl) {
  console.warn('[prebuild-migrate] ⚠️  DATABASE_URL 未设置，跳过数据库同步')
  process.exit(0)
}

console.log('[prebuild-migrate] DATABASE_URL 已就绪，执行 drizzle-kit push...')

try {
  execSync('npx drizzle-kit push --force', {
    stdio: 'pipe',
    encoding: 'utf-8',
    timeout: 30_000
  })
  console.log('[prebuild-migrate] ✅ Schema 同步成功')
} catch (err) {
  const raw = err?.stderr || err?.stdout || err?.message || String(err)
  const sanitized = raw.replaceAll(dbUrl, '[REDACTED]')

  console.error('[prebuild-migrate] ❌ Schema 同步失败:')
  console.error(sanitized)
  process.exit(1)
}

// ─── Seed 模型能力数据 ──────────────────────────────────────────────────────
console.log('[prebuild-migrate] Running seed-models...')
try {
  execSync('npx tsx server/db/seed-models.ts', {
    stdio: 'pipe',
    encoding: 'utf-8',
    timeout: 30_000
  })
  console.log('[prebuild-migrate] ✅ Seed complete')
} catch (err) {
  const raw = err?.stderr || err?.stdout || err?.message || String(err)
  const sanitized = raw.replaceAll(dbUrl, '[REDACTED]')
  console.error('[prebuild-migrate] ❌ Seed 失败:')
  console.error(sanitized)
  // Seed 失败不阻塞部署；列表空时 /api/models 依赖上次成功缓存或返回空
  console.warn('[prebuild-migrate] ⚠️  继续部署（models 目录未写入，列表可能为空）')
}
