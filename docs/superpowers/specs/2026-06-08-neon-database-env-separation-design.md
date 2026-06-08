# Neon 数据库环境分离 & 自动迁移方案

**日期:** 2026-06-08
**范围:** `server/db/`、`server/plugins/`、`nuxt.config.ts`、Neon Console、Vercel Dashboard
**依赖:** Vercel-Neon 集成、Drizzle ORM

---

## 问题

当前 develop 和 main 分支的 Vercel 部署共用同一个 Neon 主库。develop 上修改 `schema.ts` 后直接 `drizzle-kit push` 到生产数据库，没有隔离，有安全隐患。

## 目标

- develop 分支的 Preview 部署连接 Neon `develop` 分支数据库
- main 分支的 Production 部署连接 Neon 主库（生产）
- 本地开发连接独立的本地开发数据库
- 每次部署时自动同步数据库 schema（Nitro 插件执行 `drizzle-kit push`）
- 合并 develop → main 时，schema 变更能安全同步到生产

---

## 整体流向

```
develop push → Vercel Preview → DATABASE_URL → Neon develop 分支 → Nitro 启动时自动 push
main push    → Vercel Production → DATABASE_URL → Neon 主库        → Nitro 启动时自动 push
本地 dev      → 本地 .env → DATABASE_URL → Neon dev 或其他开发库
```

---

## 第一步：Neon Console 操作（手动一次）

1. 打开 [Neon Console](https://console.neon.tech) → 对应项目
2. 进入 **Branches** 标签
3. 点击 **Create Branch**
4. 分支名：`develop`，基于主库创建
5. 创建后复制 develop 分支的连接字符串（`DATABASE_URL`）

---

## 第二步：Vercel Dashboard 操作（手动一次）

1. 打开 Vercel → 项目 → **Settings → Environment Variables**
2. 取消 "All Environments" 勾选，选择 **Preview** 环境
3. Key: `DATABASE_URL`，Value: 上一步复制的 Neon develop 分支连接字符串
4. 确认 **Production** 环境的 `DATABASE_URL` 仍是 Neon 主库连接字符串
5. **重要：** 两个环境都确保 `DATABASE_URL` 已设置，不要留空

完成后效果：
- Preview 部署（develop push）= Neon develop 分支
- Production 部署（main push）= Neon 主库

---

## 第三步：代码改动

### 3.1 新增 `.env.example`

```env
# 本地开发用（自建 Neon 分支或其他本地 Postgres）
DATABASE_URL=postgresql://...
```

### 3.2 新增 `server/plugins/migrate.ts`

Nitro 启动时自动执行 `drizzle-kit push` 同步 schema。

**设计决策：**
- `drizzle-kit` 已在 `dependencies` 中（不在 devDependencies），Vercel 生产部署时会被安装，`execSync` 方案可用
- 迁移失败不阻塞应用启动（打日志即可），避免数据库临时问题导致服务不可用
- 每次冷启动都会跑一次 schema 对比，schema 无变化时 `push` 近乎空操作，额外耗时约几百毫秒，可接受

```ts
import { execSync } from 'node:child_process'

export default defineNitroPlugin(() => {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.warn('[migrate] DATABASE_URL 未设置，跳过数据库迁移')
    return
  }

  try {
    console.log('[migrate] 开始同步数据库 schema...')
    execSync('npx drizzle-kit push', {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'inherit'
    })
    console.log('[migrate] 数据库 schema 同步完成')
  } catch (error) {
    console.error('[migrate] 数据库迁移失败（应用继续运行）:', error)
  }
})
```

### 3.3 `nuxt.config.ts` / `drizzle.config.ts`

**无需改动。** 两个文件都已从 `process.env.DATABASE_URL` 读取连接，Vercel-Neon 集成已按环境注入正确的值。

---

## 合并到正式分支时的注意项

当 `schema.ts` 在 develop 上有修改，合并到 main 时：

1. **确认迁移已测试** —— develop Preview 环境运行正常，说明新 schema 在 develop 数据库上没问题
2. **合并代码** —— `git checkout main && git merge develop`
3. **Vercel Production 自动部署** —— main push 触发
4. **Nitro 插件自动执行 `drizzle-kit push`** —— 将新 schema 同步到 Neon 主库
5. **如果 push 失败会打日志但不阻塞启动** —— 检查 Vercel 日志确认迁移是否成功

### 合并前检查清单

- [ ] develop Preview 部署正常，schema 变更已验证
- [ ] migration 文件（如有）已提交到 git
- [ ] 确认没有破坏性变更（如删表、删列改名）——这类操作 `drizzle-kit push` 会警告

---

## 风险

| 风险 | 缓解 |
|------|------|
| `drizzle-kit push` 在生产环境直接修改表结构 | 表结构简单、个人博客项目，风险可控；push 会显示变更摘要 |
| Vercel 部署时 `node_modules` 不含 `drizzle-kit` | 确认后用编程式 API 替代 shell 调用 |
| Neon develop 分支过期（主库有数据变更后分支落后） | 需要时在 Neon Console 手动 reset develop 分支 |
