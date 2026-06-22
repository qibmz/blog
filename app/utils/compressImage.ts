import Compressor from 'compressorjs'

/**
 * 使用 compressorjs 压缩图片，最长边 ≤ 1920px，quality 0.8。
 * GIF/BMP 不处理直接返回原文件。
 */
export function compressImageFile(file: File): Promise<File> {
  // GIF / BMP 不压缩
  if (file.type === 'image/gif' || file.type === 'image/bmp') return Promise.resolve(file)

  return new Promise((resolve, reject) => {
    new Compressor(file, {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 0.8,
      convertTypes: ['image/webp', 'image/png'],
      convertSize: 0, // 始终转 JPEG，体积最优
      success: result => resolve(result as File),
      error: err => reject(err) // 压缩失败不静默回退，让上层显示错误
    })
  })
}
