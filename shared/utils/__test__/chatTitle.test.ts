import { describe, expect, it } from 'vitest'
import { getProvisionalChatTitle } from '#shared/utils/chatTitle'

describe('getProvisionalChatTitle', () => {
  it('uses first 15 chars of text', () => {
    expect(getProvisionalChatTitle([
      { type: 'text', text: '这是一段超过十五个字的标题内容测试' }
    ])).toBe('这是一段超过十五个字的标题内容')
  })

  it('falls back to 图片对话 for file-only parts', () => {
    expect(getProvisionalChatTitle([
      { type: 'file', text: undefined }
    ])).toBe('图片对话')
  })

  it('falls back to 新对话 for empty parts', () => {
    expect(getProvisionalChatTitle([])).toBe('新对话')
    expect(getProvisionalChatTitle(null)).toBe('新对话')
  })
})
