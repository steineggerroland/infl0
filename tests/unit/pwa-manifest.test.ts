import { describe, expect, it } from 'vitest'
import deLocale from '../../i18n/locales/de.json'
import enLocale from '../../i18n/locales/en.json'
import {
  PWA_BACKGROUND_COLOR,
  PWA_MASK_ICON_COLOR,
  PWA_THEME_COLOR,
  pwaDescriptionLocalized,
  pwaWebManifest,
} from '../../utils/pwa-manifest'

describe('pwaWebManifest', () => {
  it('meets installable PWA manifest minimums', () => {
    expect(pwaWebManifest.id).toBe('/')
    expect(pwaWebManifest.name).toBeTruthy()
    expect(pwaWebManifest.short_name).toBeTruthy()
    expect(pwaWebManifest.description).toBeTruthy()
    expect(pwaWebManifest.display).toBe('standalone')
    expect(pwaWebManifest.orientation).toBe('any')
    expect(pwaWebManifest.theme_color).toBe(PWA_THEME_COLOR)
    expect(pwaWebManifest.background_color).toBe(PWA_BACKGROUND_COLOR)
    expect(PWA_MASK_ICON_COLOR).toBe('#0F2940')

    const sizes = pwaWebManifest.icons.map((icon) => icon.sizes)
    expect(sizes).toContain('192x192')
    expect(sizes).toContain('512x512')
    expect(pwaWebManifest.icons.some((icon) => icon.purpose === 'maskable' && icon.sizes === '192x192')).toBe(true)
    expect(pwaWebManifest.icons.some((icon) => icon.purpose === 'maskable' && icon.sizes === '512x512')).toBe(true)
  })

  it('exposes German install description via description_localized', () => {
    expect(pwaWebManifest.description).toBe(enLocale.pwa.description)
    expect(pwaDescriptionLocalized.de).toBe(deLocale.pwa.description)
    expect(pwaDescriptionLocalized['de-DE']).toBe(deLocale.pwa.description)
    expect(pwaWebManifest.description_localized).toEqual(pwaDescriptionLocalized)
  })

  it('declares localized home-screen shortcuts', () => {
    expect(pwaWebManifest.shortcuts).toHaveLength(3)
    const urls = pwaWebManifest.shortcuts!.map((s) => s.url)
    expect(urls).toEqual(['/', '/feeds', '/settings'])

    const feeds = pwaWebManifest.shortcuts!.find((s) => s.url === '/feeds')!
    expect(feeds.name).toBe(enLocale.pwa.shortcuts.feeds.name)
    expect(feeds.name_localized?.de).toBe(deLocale.pwa.shortcuts.feeds.name)
    expect(feeds.short_name_localized?.de).toBe(deLocale.pwa.shortcuts.feeds.shortName)
  })
})
