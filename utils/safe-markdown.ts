import createDOMPurify from 'dompurify'
import { marked } from 'marked'

marked.setOptions({ gfm: true })

export function renderSafeMarkdown(markdown: string | undefined): string {
  if (!markdown?.trim()) return ''
  if (import.meta.server || typeof window === 'undefined') return ''
  try {
    const html = marked.parse(markdown)
    if (typeof html !== 'string') return ''
    const purifier = createDOMPurify(window)
    return purifier.sanitize(html)
  } catch {
    return ''
  }
}
