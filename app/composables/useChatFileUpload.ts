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

interface PresignResponse {
  uploadUrl: string
  publicUrl: string
  key: string
  filename?: string
}

export function useChatFileUpload() {
  const items = ref<FileItem[]>([])

  const toast = useToast()

  const presignBody = ref<{ contentType: string, filename?: string }>({
    contentType: 'image/jpeg'
  })
  const { execute: executePresign, data: presignData } = useAPI<PresignResponse>(
    '/api/uploads/presign',
    {
      method: 'POST',
      body: presignBody,
      immediate: false,
      watch: false
    }
  )

  /** 串行化 presign + PUT，避免共用 body/execute 被并发覆盖 */
  let uploadQueue: Promise<void> = Promise.resolve()
  function enqueueUpload(task: () => Promise<void>) {
    uploadQueue = uploadQueue.then(task, task)
    return uploadQueue
  }

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

  /** 已完成压缩并上传、可以发送的 parts */
  const readyParts = computed<FileUIPart[]>(() =>
    items.value.filter(i => i.status === 'ready').map(i => i.part!)
  )

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
   * 压缩并上传到 R2。
   * 必须通过 index 访问 items.value[index] 拿到 Vue Proxy 对象再修改，
   * 否则修改 raw plain object 不会触发响应式更新。
   */
  async function compressAndUploadOne(index: number) {
    await enqueueUpload(async () => {
      const item = items.value[index]
      if (!item || item.status === 'ready') return

      try {
        const compressed = await compressImageFile(item.file)
        const mediaType = compressed.type || item.file.type
        const filename = compressed.name || item.file.name

        presignBody.value = { contentType: mediaType, filename }
        await executePresign()
        const signed = presignData.value
        if (!signed?.uploadUrl || !signed.publicUrl) {
          throw new Error('获取上传地址失败')
        }

        const putRes = await fetch(signed.uploadUrl, {
          method: 'PUT',
          body: compressed,
          headers: { 'Content-Type': mediaType }
        })
        if (!putRes.ok) {
          throw new Error(`上传失败（${putRes.status}）`)
        }

        item.part = {
          type: 'file',
          url: signed.publicUrl,
          mediaType,
          filename
        }
        item.status = 'ready'
      } catch (e) {
        item.status = 'error'
        item.error = e instanceof Error ? e.message : '图片处理失败，请重试'
        // 不释放 blob URL —— 预览仍可用原图
      }
    })
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

    // 并行排队（队列内部串行执行，保证 presign 状态安全）
    await Promise.all(
      newItems.map((_, i) => compressAndUploadOne(startIndex + i))
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

  onScopeDispose(() => {
    clearFiles()
  })

  /** 是否有文件仍在压缩/上传中 */
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
