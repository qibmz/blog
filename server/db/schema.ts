import { pgTable, text, jsonb, timestamp, index, boolean } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const chats = pgTable('chats', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id'),
  title: text('title'),
  model: text('model'),
  pinned: boolean('pinned').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow()
}, table => [
  index('chats_user_id_idx').on(table.userId),
  index('chats_user_id_pinned_idx').on(table.userId, table.pinned, table.createdAt)
])

export const messages = pgTable('messages', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  chatId: text('chat_id').notNull().references(() => chats.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['user', 'assistant', 'system'] }).notNull(),
  parts: jsonb('parts').$type<Record<string, unknown>[]>(),
  createdAt: timestamp('created_at').notNull().defaultNow()
}, table => [
  index('messages_chat_id_idx').on(table.chatId)
])

export const chatsRelations = relations(chats, ({ many }) => ({
  messages: many(messages)
}))

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, { fields: [messages.chatId], references: [chats.id] })
}))

export const models = pgTable('models', {
  id: text('id').primaryKey(),
  supportsImages: boolean('supports_images').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})
