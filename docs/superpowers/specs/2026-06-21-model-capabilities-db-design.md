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
- 仅存储能力元数据，不存储模型名称/图标/provider 等（这些由 `PROVIDER_REGISTRY` 管理）
- 无外键依赖，与现有表（`chats`、`messages`）完全独立
- 未来扩展新能力字段只需 `ALTER TABLE ADD COLUMN`

### 查询流程

```
Provider /models API → 模型 ID 列表
                           ↓
              SELECT * FROM models WHERE id IN (...)
                           ↓
           DB 有记录 → 使用 DB 的 supports_images
           DB 无记录 → 回退 provider.supportsImages(id)
                           ↓
                    合并为 ModelOption[] 返回前端
```

DB 查询失败时 catch 住，走 fallback 逻辑，不阻塞模型列表返回。

### Seed 脚本

`server/db/seed-models.ts` — 初始化模型能力数据，使用 `INSERT ... ON CONFLICT (id) DO NOTHING` 保证幂等。

初次运行包含的数据来源于当前硬编码规则：
- 所有 DeepSeek 模型：`supports_images = false`
- MiMo v2.5 系列（不含 pro/flash）：`supports_images = true`
- MiMo v2-omni 系列（不含 pro/flash）：`supports_images = true`
- 其余：`supports_images = false`

### 文件变更

| 文件 | 变更 |
|------|------|
| `server/db/schema.ts` | 新增 `models` 表定义 |
| `server/db/migrations/` | `drizzle-kit generate` 生成迁移 SQL |
| `server/db/seed-models.ts` | 新增，幂等初始化脚本 |
| `server/utils/models.ts` | `supportsImages` 保留作为 fallback，行为不变 |
| `server/api/models.get.ts` | 在 `fetchAvailableModels()` 中插入 DB 查询 |

### 迁移与上线

1. 修改 schema → `drizzle-kit generate` 生成迁移文件
2. 部署到 preview — Vercel prebuild 脚本自动执行 `drizzle-kit push --force`，创建 `models` 表
3. 手动运行 `seed-models.ts` 填充初始数据
4. Production 环境手动执行 `drizzle-kit push` + seed

### 日常运维

新增/修改模型能力时，直接连接数据库执行 SQL：

```sql
-- 标记某模型支持图片
INSERT INTO models (id, supports_images) VALUES ('new-vision-model', true)
ON CONFLICT (id) DO UPDATE SET supports_images = true, updated_at = NOW();

-- 移除某模型的图片支持
UPDATE models SET supports_images = false, updated_at = NOW() WHERE id = 'some-model';
```

无需重新部署代码。

### 错误处理

- DB 查询失败 → 打印 warn 日志，回退到 provider 级别 `supportsImages` 函数
- 单个 provider API 失败 → 该 provider 不出现在列表中（与现有行为一致）
- 所有 provider API 失败 → 使用 `FALLBACK_MODELS` 兜底（与现有行为一致）
