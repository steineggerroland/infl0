import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
const fontsCss = join(root, 'assets/css/fonts.css')

describe('self-hosted font assets (review: local WOFF2 + @font-face)', () => {
  it('exposes @font-face rules in assets/css/fonts.css and points at public woff2 files', () => {
    const src = readFileSync(fontsCss, 'utf8')
    expect(src).toMatch(/@font-face\s*\{/u)
    expect(src).toMatch(/Inter-Variable\.woff2/u)
    expect(src).toMatch(/font-display:\s*swap/u)
    const urls = [...src.matchAll(/url\(\s*['"]?(\/assets\/fonts\/[^'")\s]+)['"]?\s*\)/g)].map(
      (m) => m[1] as string,
    )
    expect(urls.length).toBeGreaterThanOrEqual(1)
    for (const u of urls) {
      const rel = u.replace(/^\//, '')
      const abs = join(root, 'public', rel)
      expect(existsSync(abs), `missing: ${abs}`).toBe(true)
    }
  })
})
