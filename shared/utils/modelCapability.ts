/**
 * 将用户开关偏好解析为请求 options。
 * - 尚无当前模型元数据：保留 preference（避免 /api/models 未就绪时误关）
 * - 已有元数据：仅当 DB 声明支持时才透传 preference
 */
export function resolveCapabilityOption(
  preference: boolean,
  supported: boolean | undefined,
  hasModelMeta: boolean
): boolean {
  if (!hasModelMeta) return preference
  return Boolean(supported) && preference
}
