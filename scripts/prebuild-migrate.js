// Vercel Preview Branching: 仅在 preview 环境自动执行数据库迁移
// production 跳过，手动执行以保证迁移安全
if (process.env.VERCEL_ENV === 'preview') {
  const { execSync } = require('child_process')
  execSync('npx drizzle-kit migrate', { stdio: 'inherit' })
}
