# 侧边栏聊天操作菜单（重命名 / 置顶 / 删除）

## 概述

侧边栏每条聊天记录右侧的 "…" 按钮目前无功能。新增下拉菜单实现三个操作：重命名、置顶/取消置顶、删除。

## Schema 变更

`server/db/schema.ts` — `chats` 表新增 `pinned` 字段：

```ts
pinned: boolean('pinned').notNull().default(false)
```

新增索引：

```ts
index('chats_user_id_pinned_idx').on(table.userId, table.pinned.desc(), table.createdAt.desc())
```

迁移命令：`npx drizzle-kit generate` → `npx drizzle-kit push`

## API

### `PATCH /api/chats/[id].patch.ts`（新增）

认证：`requireUserSession(event)`，校验当前用户是聊天所有者。

请求体：

```ts
type Action = 'rename' | 'pin' | 'delete'
interface PatchBody {
  action: Action
  title?: string    // rename 时必填
  pinned?: boolean  // pin 时必填
}
```

响应：

- `200` — 操作成功，返回更新后的 chat 对象（delete 返回 `{ deleted: true }`）
- `400` — 缺少必要参数
- `404` — 聊天不存在或不属于当前用户
- `500` — 数据库错误

## UI

### 菜单

将 `app/layouts/chat.vue` 中 `#chat-trailing` 插槽的 `<UButton icon="i-lucide-ellipsis">` 替换为 `<UDropdownMenu>`：

| 项 | 图标 | 颜色 | 操作 |
|----|------|------|------|
| 重命名 | `i-lucide-pencil` | 默认 | 打开重命名弹窗 |
| 置顶 | `i-lucide-pin` | 默认 | 调用 `action: 'pin', pinned: true` |
| 取消置顶 | `i-lucide-pin-off` | 默认 | 调用 `action: 'pin', pinned: false` |
| 删除 | `i-lucide-trash-2` | `error` | 打开删除确认弹窗 |

置顶/取消置顶根据当前聊天 `pinned` 状态显示其中一个，互斥。

菜单项使用 `onSelect` 触发对应操作，操作调用 `useAPI` 发起 `PATCH` 请求，成功后 `refreshNuxtData('sidebar-chats')` 刷新列表。

### 重命名弹窗

使用 `UModal` + `UInput`，默认值为当前标题，Enter 提交。提交后 PATCH `{ action: 'rename', title }`。

### 删除确认弹窗

使用 `UModal`，展示 "确定删除「xxx」？此操作不可撤销"，确认按钮红色。确认后 PATCH `{ action: 'delete' }`。若当前正在被删除的聊天页面，导航到 `/chat`。

### 排序

`server/api/chats.get.ts` 查询时 `orderBy` 优先 `pinned DESC`，再 `createdAt DESC`：

```ts
orderBy: () => [desc(schema.chats.pinned), desc(schema.chats.createdAt)]
```

### 置顶 UI 标记

置顶聊天在侧边栏显示 pin 小图标（`i-lucide-pin`），通过 `UNavigationMenu` item 的 icon 字段实现——置顶 item 的 icon 设为 pin 图标，非置顶为空。

## 任务清单

1. Schema：`chats` 加 `pinned` 字段 + 索引
2. 迁移：`drizzle-kit generate` + `drizzle-kit push`
3. API：新增 `server/api/chats/[id].patch.ts`
4. UI：`chat.vue` — DropdownMenu + 重命名弹窗 + 删除确认弹窗
5. 排序：`chats.get.ts` 置顶优先排序
6. 测试：补充 API 测试（正常路径 + 所有权校验 + 边界）
7. Lint + typecheck 通过

## 风险

- 置顶字段需要数据库迁移，开发环境直接 push，生产环境需确认迁移策略
- 乐观更新可提升体验但增加复杂度，本次采用等待响应后刷新
