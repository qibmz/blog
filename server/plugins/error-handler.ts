/**
 * 全局错误处理管道
 * - 记录完整错误日志供排查
 * - 非预期异常统一脱敏，不向前端暴露内部错误细节
 * - 通过 createError 主动抛出的错误（404/429 等）正常透传
 */
export default defineNitroPlugin((nitroApp) => {
  // ── 日志：完整记录所有未处理异常 ──
  nitroApp.hooks.hook('error', (error, { event }) => {
    console.error('[Server Error]', {
      url: event?.path ?? '-',
      method: event?.method ?? '-',
      error: error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : String(error)
    })
  })

  // ── 脱敏：非预期的 5xx 响应统一替换为通用错误信息 ──
  nitroApp.hooks.hook('render:response', (response) => {
    if (response.statusCode! < 500) return

    // 区分：createError() 主动抛出的错误（已有 statusMessage）→ 透传
    //       原始 Error（无 statusMessage）→ 脱敏
    try {
      const body = typeof response.body === 'string'
        ? JSON.parse(response.body)
        : response.body
      if (body && typeof body === 'object' && body.statusMessage) return
    } catch {
      // body 不是 JSON（比如 HTML 错误页），也脱敏
    }

    response.body = JSON.stringify({
      statusCode: 500,
      statusMessage: '系统异常，请稍后重试'
    })
    response.headers!['Content-Type'] = 'application/json'
  })
})
