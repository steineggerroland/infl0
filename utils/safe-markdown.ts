import DOMPurify from 'dompurify'
import { marked } from 'marked'

marked.setOptions({ gfm: true })

export function renderSafeMarkdown(markdown: string | undefined): string {
  if (!markdown?.trim()) return ''
  if (import.meta.server) return ''
  try {
    return DOMPurify.sanitize(marked.parse(markdown) as string)
  } catch {
    return ''
  }
}
