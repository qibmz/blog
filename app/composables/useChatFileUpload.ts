import type { FileUIPart } from 'ai'
import { compressImageFile } from '~/utils/compressImage'

export interface FileItem {
  id: string
  file: File
  previewPart: FileUIPart
  part: FileUIPart | null
  status: 'compressing' | 'ready' | 'error'
  error?: string
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp']
const MAX_FILE_SIZE = 5 * 1024 * 1024
const MAX_FILES = 3

export function useChatFileUpload() {
  const items = ref<FileItem[]>([])

  /** 供 ChatFileList 使用的逐项状态 */
  const statuses = computed(() => {
    const map: Record<number, 'uploading' | 'uploaded' | 'error'> = {}
    items.value.forEach((item, i) => {
      if (item.status === 'compressing') map[i] = 'uploading'
      else if (item.status === 'error') map[i] = 'error'
      else map[i] = 'uploaded'
    })
    return map
  })

  const errors = computed(() => {
    const map: Record<number, string> = {}
    items.value.forEach((item, i) => {
      if (item.error) map[i] = item.error
    })
    return map
  })

  /** 供渲染用的预览 parts（始终有 blob URL 或最终 URL） */
  const previewParts = computed<FileUIPart[]>(() =>
    items.value.map(i => i.previewPart)
  )

  /** 已完成压缩、可以发送的 parts */
  const readyParts = computed<FileUIPart[]>(() =>
    items.value.filter(i => i.status === 'ready').map(i => i.part!)
  )

  const toast = useToast()

  /** 创建本地预览 part（blob URL，即刻可用） */
  function makePreviewPart(file: File): FileUIPart {
    return {
      type: 'file',
      url: URL.createObjectURL(file),
      mediaType: file.type,
      filename: file.name
    }
  }

  /**
   * 压缩单个文件并更新状态。
   * 必须通过 index 访问 items.value[index] 拿到 Vue Proxy 对象再修改，
   * 否则修改 raw plain object 不会触发响应式更新。
   */
  async function compressOne(index: number) {
    const item = items.value[index]
    if (!item) return

    try {
      const compressed = await compressImageFile(item.file)
      // compressed 可能是原文件（跳过压缩）或新的 File
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('读取文件失败'))
        reader.readAsDataURL(compressed)
      })
      item.part = {
        type: 'file',
        url: dataUrl,
        mediaType: compressed.type || item.file.type,
        filename: compressed.name || item.file.name
      }
      item.status = 'ready'
    } catch (e) {
      item.status = 'error'
      item.error = e instanceof Error ? e.message : '图片处理失败，请重试'
      // 不释放 blob URL —— 预览仍可用原图
    }
  }

  async function addFiles(incoming: File[]) {
    const list = Array.from(incoming)

    // 数量上限
    if (items.value.length + list.length > MAX_FILES) {
      toast.add({
        title: `最多上传 ${MAX_FILES} 张图片`,
        color: 'warning',
        icon: 'i-lucide-alert-triangle',
        duration: 3000
      })
      return
    }

    // 类型 + 大小校验
    const valid: File[] = []
    for (const f of list) {
      if (!ALLOWED_TYPES.includes(f.type)) {
        toast.add({ title: `"${f.name}" 格式不支持`, description: '支持 JPEG、PNG、GIF、WebP、BMP', color: 'warning', icon: 'i-lucide-image', duration: 3000 })
        continue
      }
      if (f.size > MAX_FILE_SIZE) {
        toast.add({ title: `"${f.name}" 过大`, description: `最大 5MB，当前 ${(f.size / 1024 / 1024).toFixed(1)}MB`, color: 'warning', icon: 'i-lucide-alert-triangle', duration: 3000 })
        continue
      }
      valid.push(f)
    }

    if (valid.length === 0) return

    // 立即创建 entries（blob URL 预览即刻可用）
    const startIndex = items.value.length
    const newItems: FileItem[] = valid.map(file => ({
      id: crypto.randomUUID(),
      file,
      previewPart: makePreviewPart(file),
      part: null,
      status: 'compressing' as const
    }))
    items.value = [...items.value, ...newItems]

    // 并行压缩 —— 传 index，通过 items.value[index] 拿 Proxy 对象
    await Promise.allSettled(
      newItems.map((_, i) => compressOne(startIndex + i))
    )
  }

  function removeFile(index: number) {
    const item = items.value[index]
    if (!item) return
    // 释放 blob URL
    if (item.previewPart.url?.startsWith('blob:')) {
      URL.revokeObjectURL(item.previewPart.url)
    }
    items.value.splice(index, 1)
  }

  function clearFiles() {
    for (const item of items.value) {
      if (item.previewPart.url?.startsWith('blob:')) {
        URL.revokeObjectURL(item.previewPart.url)
      }
    }
    items.value = []
  }

  /** 是否有文件仍在压缩中 */
  const isCompressing = computed(() =>
    items.value.some(i => i.status === 'compressing')
  )

  return {
    items,
    statuses,
    errors,
    previewParts,
    readyParts,
    isCompressing,
    addFiles,
    removeFile,
    clearFiles
  }
}
