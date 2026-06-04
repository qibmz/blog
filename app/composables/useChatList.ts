export function groupChatsByDate<T extends { createdAt: string }>(
  chats: T[]
): { label: string, items: T[] }[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const lastWeek = new Date(today)
  lastWeek.setDate(today.getDate() - 7)

  const buckets = [
    { label: '今天', filter: (d: Date) => d >= today },
    { label: '昨天', filter: (d: Date) => d >= yesterday && d < today },
    { label: '前 7 天', filter: (d: Date) => d >= lastWeek && d < yesterday },
    { label: '更早', filter: (d: Date) => d < lastWeek }
  ]

  return buckets
    .filter(({ filter }) => chats.some(c => filter(new Date(c.createdAt))))
    .map(({ label, filter }) => ({
      label,
      items: chats.filter(c => filter(new Date(c.createdAt)))
    }))
}
