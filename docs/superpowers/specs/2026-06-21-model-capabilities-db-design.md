# 模型能力元数据 DB 化设计

**日期：** 2026-06-21
**状态：** 待实现

## 背景

当前后端获取模型列表的流程：

1. 从各 Provider 的 `/models` API 动态获取模型 ID 列表（5 分钟缓存）
2. 模型的能力标记（目前仅 `supportsImages`）通过 `server/utils/models.ts` 中 `ProviderConfig.supportsImages` 函数硬编码判断

**痛点：** 每次 Provider 新增/调整视觉模型支持，都需要改代码并重新部署。

## 目标

将模型能力元数据（`supportsImages`）从硬编码逻辑迁移到数据库，使能力更新无需重新部署。

## 设计

### 职责分离

| 数据来源 | 负责内容 | 说明 |
|----------|----------|------|
| Provider `/models` API | 模型 ID 列表 | 动态获取，5 分钟缓存（不变） |
| DB `models` 表 | 模型能力元数据 | 权威来源 |
| `ProviderConfig.supportsImages` 函数 | Fallback | DB 无记录时回退 |

### 数据库表

```sql
CREATE TABLE models (
  id              TEXT PRIMARY KEY,          -- 模型 ID，如 'mimo-v2.5-pro'
  supports_images BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
```

- 主键为模型 ID 字符串，与 provider API 返回的 ID 直接对应
- 不需要复合主键 `(provider, id)`：`PROVIDER_REGISTRY` 已通过 `prefixes`（如 `deepseek-`、`mimo-`）做了命名空间隔离，不同 Provider 的模型 ID 天然不会冲突
- 仅存储能力元数据，不存储模型名称/图标/provider 等（这些由 `PROVIDER_REGISTRY` 管理）
- 无外键依赖，与现有表（`chats`、`messages`）完全独立
- 未来扩展新能力字段只需 `ALTER TABLE ADD COLUMN`

### 查询流程

DB 查询在 `fetchAvailableModels()` 内部执行，复用现有的 5 分钟内存缓存（`_cachedModels` + `_cacheExpiry`），**每 5 分钟最多查一次 DB**，不会每个请求都打 DB。

```
Provider /models API → 模型 ID 列表（5min 缓存）
                           ↓
              SELECT * FROM models WHERE id IN (...)
                           ↓
              ┌─ DB 有记录，supports_images 为 true → true
              ├─ DB 有记录，supports_images 为 false → false
              ├─ DB 无该模型记录 → fallback provider.supportsImages(id)
              └─ DB 查询失败（连接超时等）→ fallback provider.supportsImages(id)
                           ↓
                    合并为 ModelOption[] 返回前端
```

**三层优先级（高 → 低）：**

1. DB 中有记录 → 以 DB 值为准（无论 true/false，这是权威来源）
2. DB 中无该模型记录 → 回退 `provider.supportsImages(id)` 函数（全量 Seed 下此为异常情况，应打印 warn 日志）
3. DB 查询失败（网络/连接异常）→ 回退 `provider.supportsImages(id)` 函数

实现伪代码：

```typescript
// 在 fetchAvailableModels() 内部，matched models 映射阶段
let supportsImages: boolean
try {
  const dbRecord = dbRecords.find(r => r.id === modelId)
  if (dbRecord) {
    supportsImages = dbRecord.supportsImages  // 优先级 1
    logger.debug(`DB hit for ${modelId}: supportsImages=${supportsImages}`)
  } else {
    supportsImages = provider.supportsImages?.(modelId) ?? false  // 优先级 2
    logger.warn(`DB miss for ${modelId}, fallback to provider function — model should be seeded`)
  }
} catch (err) {
  supportsImages = provider.supportsImages?.(modelId) ?? false  // 优先级 3
  logger.warn(`DB query failed, fallback to provider function: ${err}`)
}
```

注意：全量 Seed 下，DB 无记录属于异常（说明有新模型未同步到 Seed），与 DB 查询失败同为 warn 级别，便于及时发现。

### Seed 脚本

`server/db/seed-models.ts` — 初始化模型能力数据，使用 `INSERT ... ON CONFLICT (id) DO NOTHING` 保证幂等。

**Seed 策略（全量 Seed）：**

- 所有模型的能力值都显式写入 DB，DB 是完整的能力清单
- 新模型出现时 DB 必然 miss → warn 日志 → 提醒需要补充 seed
- 模型总数很小（DeepSeek chat 模型 3-5 个，MiMo 5-10 个），全量写入无压力
- 好处：DB 是真正的权威来源，不会出现 fallback 函数错误兜底导致的能力误判

初次运行包含全量数据，来源于当前硬编码规则：

| 模型 ID | `supports_images` | 说明 |
|---------|-------------------|------|
| `deepseek-v4-pro` | `false` | DeepSeek 无视觉模型 |
| `deepseek-v4-flash` | `false` | |
| `mimo-v2.5-pro` | `false` | pro/flash 不支持视觉 |
| `mimo-v2.5-flash` | `false` | |
| `mimo-v2.5` | `true` | 支持视觉 |
| `mimo-v2-omni` | `true` | 支持视觉 |
| `mimo-v2-omni-pro` | `false` | |
| `mimo-v2-omni-flash` | `false` | |

> 注：上表为当前实际情况，具体以 Provider `/models` API 实际返回的模型列表为准。Seed 脚本执行时从 API 获取全量模型列表，然后根据硬编码规则为每个模型 INSERT 对应的能力值。

**生产环境安全保护：** seed 脚本检测到连接生产库时，打印警告并延迟 3 秒，防止误操作：

```typescript
if (process.env.NODE_ENV === 'production') {
  console.warn('⚠️  About to seed PRODUCTION database in 3s... Press Ctrl+C to cancel.')
  await new Promise(resolve => setTimeout(resolve, 3000))
}
```

### 文件变更

| 文件 | 变更 |
|------|------|
| `server/db/schema.ts` | 新增 `models` 表定义 |
| `server/db/migrations/` | `drizzle-kit generate` 生成迁移 SQL |
| `server/db/seed-models.ts` | 新增，幂等全量初始化脚本 |
| `scripts/prebuild-migrate.js` | 在 `drizzle-kit push` 后追加执行 seed |
| `server/utils/models.ts` | `supportsImages` 保留作为 fallback，行为不变 |
| `server/api/models.get.ts` | 在 `fetchAvailableModels()` 中插入 DB 查询 |

### 迁移与上线

#### Preview（测试服）

Prebuild 自动完成全部操作，无需手动干预：

1. `scripts/prebuild-migrate.js` 自动执行 `drizzle-kit push --force` → 创建 `models` 表
2. seed 脚本接在 prebuild 流程中执行（幂等，多次执行无副作用）→ 填充全量模型能力数据

改造 `scripts/prebuild-migrate.js`，在 `drizzle-kit push` 成功后追加执行 seed。

#### Production（正式服）

Prebuild 跳过 production，需手动操作一次。使用 Neon 提供的方式执行：

**建表：** 在 Neon SQL Editor（Web 控制台）粘贴 `drizzle-kit generate` 生成的 migration SQL 执行，或使用 CLI：

```bash
npx neonctl sql --sql "$(cat server/db/migrations/XXXX_xxx.sql)"
```

**填充数据：** 本地跑一次 seed 脚本（`DATABASE_URL` 指向正式服）。

之后日常运维只需在 Neon SQL Editor 中执行 SQL（见下方），无需再跑 seed。

### 日常运维

新增/修改模型能力时，在 **Neon SQL Editor** 中执行：

```sql
-- 标记某模型支持图片
INSERT INTO models (id, supports_images) VALUES ('new-vision-model', true)
ON CONFLICT (id) DO UPDATE SET supports_images = true, updated_at = NOW();

-- 移除某模型的图片支持
UPDATE models SET supports_images = false, updated_at = NOW() WHERE id = 'some-model';
```

无需进入 Neon SQL Editor 的也可以用 CLI：

```bash
npx neonctl sql --sql "INSERT INTO models ... ON CONFLICT ..."
```

无需重新部署代码。

### 错误处理

- DB 查询失败 → 打印 warn 日志，回退到 provider 级别 `supportsImages` 函数
- 单个 provider API 失败 → 该 provider 不出现在列表中（与现有行为一致）
- 所有 provider API 失败 → 使用 `FALLBACK_MODELS` 兜底（与现有行为一致）
