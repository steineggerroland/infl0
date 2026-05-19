import { describe, expect, it } from 'vitest'
import { infl0IconMarkup, infl0Icons } from '../../utils/icons/registry'

describe('infl0 icon registry', () => {
  it('exposes every semantic key with svg markup', () => {
    for (const name of Object.keys(infl0Icons) as Array<keyof typeof infl0Icons>) {
      const svg = infl0IconMarkup(name)
      expect(svg).toContain('<svg')
      expect(svg).toContain('</svg>')
    }
  })

  it('uses currentColor for theme inheritance', () => {
    expect(infl0IconMarkup('episode.play')).toContain('currentColor')
    expect(infl0IconMarkup('episode.external')).toContain('currentColor')
  })
})
