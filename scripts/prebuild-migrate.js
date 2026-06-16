// Vercel Preview Branching: 仅在 preview 环境自动执行数据库迁移
// production 跳过，手动执行以保证迁移安全
import { execSync } from 'node:child_process'

if (process.env.VERCEL_ENV !== 'preview') {
  process.exit(0)
}

if (!process.env.DATABASE_URL) {
  console.warn('[prebuild-migrate] ⚠️  DATABASE_URL 未设置，跳过数据库迁移')
  process.exit(0)
}

console.log('[prebuild-migrate] DATABASE_URL 已就绪，执行 drizzle-kit migrate...')

try {
  execSync('npx drizzle-kit migrate', {
    stdio: 'pipe',
    encoding: 'utf-8',
    timeout: 30_000
  })
  console.log('[prebuild-migrate] ✅ 迁移执行成功')
} catch (err) {
  const message = err?.stderr || err?.stdout || err?.message || String(err)
  console.error('[prebuild-migrate] ❌ 迁移执行失败:')
  console.error(message)

  // 如果是"已存在"类错误（幂等保护未覆盖的情况），不阻塞构建
  if (message.includes('already exists') || message.includes('duplicate')) {
    console.warn('[prebuild-migrate] ⚠️  检测到对象已存在（可能来自 push 或 Neon 分支 fork），继续构建')
  } else {
    console.error('[prebuild-migrate] ❌ 未知错误，终止构建')
    process.exit(1)
  }
}
