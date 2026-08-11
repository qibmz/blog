/** 浏览器端下载 JSON 文件 */
export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  // 延迟 revoke，避免 Firefox 等浏览器取消尚未开始的下载
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
