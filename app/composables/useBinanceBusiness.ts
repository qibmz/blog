import { useWebSocket } from '@vueuse/core'

/**
 * 币安 K 线数据格式 (内层 k 对象)
 */
export interface BinanceKlineData {
  t: number // K线起始时间
  T: number // K线结束时间
  s: string // 交易对
  i: string // K线间隔
  f: number // 这根K线期间第一笔成交ID
  L: number // 这根K线期间末一笔成交ID
  o: string // 这根K线期间第一笔成交价
  c: string // 这根K线期间末一笔成交价
  h: string // 这根K线期间最高成交价
  l: string // 这根K线期间最低成交价
  v: string // 这根K线期间成交量
  n: number // 这根K线期间成交数量
  x: boolean // 这根K线是否完结
  q: string // 这根K线期间成交额
  V: string // 主动买入的成交量
  Q: string // 主动买入的成交额
  B: string // 忽略此参数
}

/**
 * 币安实时成交数据格式
 */
export interface BinanceTradeData {
  e: string // 事件类型 (trade)
  E: number // 事件时间
  s: string // 交易对
  t: number // 交易ID
  p: string // 成交价格
  q: string // 成交数量
  b: number // 买单ID
  a: number // 卖单ID
  T: number // 成交时间
  m: boolean // 买方是否是做市方 (true=主动卖出, false=主动买入)
  M: boolean // 忽略此参数
}

/**
 * Binance K线事件数据包装格式
 */
interface BinanceKlineEvent {
  k: BinanceKlineData
  [key: string]: unknown
}

/**
 * WebSocket 组合流消息封装格式
 */
interface BinanceCombinedMessage<T> {
  stream: string
  data: T
}

/**
 * 币安市场数据 Composable
 * 支持 K 线实时更新和逐笔交易推送
 */
export function useBinanceBusiness(symbol: MaybeRefOrGetter<string>, interval: MaybeRefOrGetter<string>) {
  const runtimeConfig = useRuntimeConfig()
  const wsBaseUrl = runtimeConfig.public.binanceWs || 'wss://stream.binance.com:9443'

  // 格式化 Symbol (WS 需要小写，例如 btcusdt)
  const formattedSymbol = computed(() => toValue(symbol).toLowerCase().replace('/', ''))

  // 组合 Stream URL
  const url = computed(() => {
    const s = formattedSymbol.value
    const i = toValue(interval)
    return `${wsBaseUrl}/stream?streams=${s}@kline_${i}/${s}@trade`
  })

  // 响应式数据
  const klineData = ref<BinanceKlineData | null>(null)
  const latestTrade = ref<BinanceTradeData | null>(null)

  const { status, open, close, send } = useWebSocket(url, {
    autoReconnect: true,
    onMessage: (_, event) => {
      const raw = event.data
      if (typeof raw === 'string') {
        const trimmed = raw.trim()
        if (trimmed.toLowerCase() === 'ping') {
          send('PONG')
          return
        }
      }

      try {
        const msg = JSON.parse(raw) as Record<string, unknown>

        if (msg?.method === 'PING') {
          const payload: Record<string, unknown> = { method: 'PONG' }
          if ('id' in msg) payload.id = msg.id
          if ('params' in msg) payload.params = msg.params
          if ('payload' in msg) payload.payload = msg.payload
          send(JSON.stringify(payload))
          return
        }

        if ('ping' in msg) {
          send(JSON.stringify({ pong: msg.ping }))
          return
        }

        if (msg?.op === 'ping') {
          const payload = { ...msg, op: 'pong' }
          send(JSON.stringify(payload))
          return
        }

        if ('stream' in msg && 'data' in msg) {
          const combined = msg as unknown as BinanceCombinedMessage<BinanceKlineEvent | BinanceTradeData>
          const streamType = combined.stream.split('@')[1]
          if (streamType && streamType.startsWith('kline')) {
            klineData.value = (combined.data as BinanceKlineEvent).k
          } else if (streamType === 'trade') {
            latestTrade.value = combined.data as BinanceTradeData
          }
        }
      } catch (e) {
        console.error('WS Parse Error:', e)
      }
    }
  })

  return {
    status,
    klineData,
    latestTrade,
    close,
    open
  }
}
