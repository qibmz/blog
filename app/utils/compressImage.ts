import Compressor from 'compressorjs'

const COMPRESS_TIMEOUT_MS = 15_000

/**
 * 使用 compressorjs 压缩图片，最长边 ≤ 1920px，quality 0.8。
 * GIF/BMP 不处理直接返回原文件。
 * 超时 15 秒未完成则抛出错误，避免 Compressor Web Worker 加载失败导致 promise 永不落定。
 */
export function compressImageFile(file: File): Promise<File> {
  // GIF / BMP 不压缩
  if (file.type === 'image/gif' || file.type === 'image/bmp') return Promise.resolve(file)

  // JPEG 且体积已很小，跳过压缩（重编码反而可能变大 + 浪费时间）
  if (file.type === 'image/jpeg' && file.size < 500 * 1024) return Promise.resolve(file)

  return new Promise((resolve, reject) => {
    let settled = false

    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      reject(new Error('图片压缩超时，请重试'))
    }, COMPRESS_TIMEOUT_MS)

    new Compressor(file, {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 0.8,
      convertTypes: ['image/webp', 'image/png'],
      convertSize: 0, // 始终转 JPEG，体积最优
      success: (result) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        resolve(result as File)
      },
      error: (err) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        reject(err instanceof Error ? err : new Error('图片压缩失败，请重试'))
      }
    })
  })
}
