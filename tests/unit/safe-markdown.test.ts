// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { renderSafeMarkdown } from '../../utils/safe-markdown'

describe('renderSafeMarkdown', () => {
  it('renders common Markdown', () => {
    const html = renderSafeMarkdown('# Title\n\nA [link](https://example.com).')

    expect(html).toContain('<h1>Title</h1>')
    expect(html).toContain('<a href="https://example.com">link</a>')
  })

  it('strips unsafe HTML from crawler-provided Markdown', () => {
    const html = renderSafeMarkdown('Safe <img src=x onerror="alert(1)"> <script>alert(2)</script>')

    expect(html).toContain('Safe')
    expect(html).not.toContain('onerror')
    expect(html).not.toContain('<script')
  })
})
