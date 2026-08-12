/** 模型是否展示联网搜索开关：有元数据时以 supportsWebSearch 为准，否则按已知 MiMo 对话模型 ID 兜底 */
export function modelShowsWebSearch(
  model: { supportsWebSearch?: boolean } | undefined | null,
  selectedId: string
): boolean {
  if (model) return Boolean(model.supportsWebSearch)
  return selectedId === 'mimo-v2.5-pro' || selectedId === 'mimo-v2.5'
}
