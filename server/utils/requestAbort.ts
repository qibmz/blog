import type { H3Event } from 'h3'

/**
 * 获取随客户端断开/取消而触发的 AbortSignal。
 * Web 适配器优先用 Request.signal；Node 下监听响应提前关闭。
 */
export function getRequestAbortSignal(event: H3Event): AbortSignal {
  const webSignal = event.web?.request?.signal
  if (webSignal) return webSignal

  const controller = new AbortController()
  const req = event.node?.req
  const res = event.node?.res

  if (!req && !res) return controller.signal

  const abort = () => {
    if (!controller.signal.aborted) controller.abort()
  }

  // 响应在未正常写完时关闭，通常表示客户端断开或取消
  res?.once?.('close', () => {
    if (res.writableEnded) return
    abort()
  })

  if (req && 'aborted' in req && req.aborted) {
    abort()
  } else {
    req?.once?.('aborted', abort)
  }

  return controller.signal
}
