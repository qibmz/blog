import Compressor from 'compressorjs'

const COMPRESS_TIMEOUT_MS = 15_000

/**
 * 使用 compressorjs 压缩图片，最长边 ≤ 1920px，quality 0.8。
 * - JPEG：重编码压缩，小文件跳过
 * - PNG：只缩放尺寸，保留格式和透明通道，小文件跳过
 * - WebP：转 JPEG
 * - GIF/BMP：不处理直接返回
 * 超时 15 秒未完成则抛出错误。
 */
export function compressImageFile(file: File): Promise<File> {
  // GIF / BMP 不压缩
  if (file.type === 'image/gif' || file.type === 'image/bmp') return Promise.resolve(file)

  // JPEG / PNG 且体积已很小，跳过压缩
  if (file.size < 500 * 1024 && (file.type === 'image/jpeg' || file.type === 'image/png')) {
    return Promise.resolve(file)
  }

  const isPNG = file.type === 'image/png'

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
      // PNG 不转换格式，只缩放；WebP 转 JPEG
      convertTypes: ['image/webp'],
      convertSize: 0,
      // 转 JPEG 时透明区域填白
      beforeDraw(context, canvas) {
        if (!isPNG) {
          context.fillStyle = '#fff'
          context.fillRect(0, 0, canvas.width, canvas.height)
        }
      },
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
