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

  const { status, open, close } = useWebSocket(url, {
    autoReconnect: true,
    heartbeat: {
      message: '{"method": "PING", "id": 1}',
      interval: 20000,
      responseMessage: '{"result": null, "id": 1}'
    },
    onMessage: (_, event) => {
      try {
        const msg = JSON.parse(event.data) as BinanceCombinedMessage<BinanceKlineEvent | BinanceTradeData>
        if (msg.stream && msg.data) {
          const streamType = msg.stream.split('@')[1]
          if (streamType && streamType.startsWith('kline')) {
            klineData.value = (msg.data as BinanceKlineEvent).k
          } else if (streamType === 'trade') {
            latestTrade.value = msg.data as BinanceTradeData
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
