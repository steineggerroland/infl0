import type { SurfaceId, ThemeHueId, ThemePresetId, UiPrefs } from './ui-prefs'
import {
  applyUiPrefsPatch,
  defaultUiPrefs,
  isHexColor,
  isThemeHueId,
  isThemePresetId,
} from './ui-prefs'

/**
 * The three user-facing color groups. Every UI token is derived from these
 * six hex values (per preset, or from custom surfaces + fallbacks).
 */
export type ThemeSource = {
  cardFront: { bg: string; text: string }
  cardBack: { bg: string; text: string }
  reader: { bg: string; text: string }
}

/**
 * Pastell hell — feste Hex-Sets (keine globale Hue-Rotation), angelehnt an gängige Referenzen:
 * z. B. „Water“ #CBF6F8 / „Blizzard Blue“ #A8E4EF (schemecolor.com), Pastellgelb #FCFC99,
 * Mint #CFF5E7 / #BCEAD5 (media.io „Mint Macaron“), weiche Rot-/Violett-Hintergründe.
 */
const PASTEL_LIGHT_BY_HUE: Readonly<Record<ThemeHueId, ThemeSource>> = {
  yellow: {
    cardFront: { bg: '#FFF9C4', text: '#4A4314' },
    cardBack: { bg: '#FFF59D', text: '#5C4F0A' },
    reader: { bg: '#FFFEF5', text: '#3D3810' },
  },
  green: {
    cardFront: { bg: '#CFF5E7', text: '#13402C' },
    cardBack: { bg: '#B8EBD4', text: '#164A35' },
    reader: { bg: '#F8FEFB', text: '#1E3328' },
  },
  blue: {
    cardFront: { bg: '#CBF6F8', text: '#0F2940' },
    cardBack: { bg: '#A8E4EF', text: '#153A48' },
    reader: { bg: '#F5FCFF', text: '#1A2C36' },
  },
  red: {
    cardFront: { bg: '#FFD6DC', text: '#4A1520' },
    cardBack: { bg: '#FFC2CB', text: '#5E1A24' },
    reader: { bg: '#FFFBFC', text: '#3D1818' },
  },
  purple: {
    cardFront: { bg: '#E9E3FF', text: '#31224A' },
    cardBack: { bg: '#DDD4FC', text: '#3A2856' },
    reader: { bg: '#FAF8FF', text: '#2D2240' },
  },
}

/**
 * Warm hell — satter als Pastell, angelehnt an warme UI-Paletten (Cream/Wheat/Terracotta/Sage),
 * z. B. colormagic „Sunkissed Terracotta“, „Warm Amber“ (Maize/Cream-Töne).
 */
const WARM_LIGHT_BY_HUE: Readonly<Record<ThemeHueId, ThemeSource>> = {
  yellow: {
    cardFront: { bg: '#FFE9A8', text: '#5C3D06' },
    cardBack: { bg: '#FFD978', text: '#6B4700' },
    reader: { bg: '#FFFAF0', text: '#422508' },
  },
  green: {
    cardFront: { bg: '#DCE8D6', text: '#2A3D24' },
    cardBack: { bg: '#C5D6B8', text: '#253320' },
    reader: { bg: '#F5F8F2', text: '#1E2A18' },
  },
  blue: {
    cardFront: { bg: '#C3DAE8', text: '#162F3D' },
    cardBack: { bg: '#A7C8DC', text: '#183544' },
    reader: { bg: '#EEF6FA', text: '#142A36' },
  },
  red: {
    cardFront: { bg: '#EFC4B2', text: '#4A2318' },
    cardBack: { bg: '#E0A890', text: '#542818' },
    reader: { bg: '#FDF7F4', text: '#3D1F16' },
  },
  purple: {
    cardFront: { bg: '#DEC4DA', text: '#3A2136' },
    cardBack: { bg: '#CEA8C8', text: '#42243C' },
    reader: { bg: '#FAF5F9', text: '#341C30' },
  },
}

/** Hoher Kontrast — ein gemeinsames Sechser-Set (Hell/Dunkel-Modus egal). */
export const PRESET_HIGH_CONTRAST: ThemeSource = {
  cardFront: { bg: '#ffffff', text: '#000000' },
  cardBack: { bg: '#000000', text: '#ffffff' },
  reader: { bg: '#ffffff', text: '#000000' },
}

/** Defaults für „Eigene Farben“ — Pastell · Blau hell. */
export const CALM_LIGHT_PICKER_DEFAULTS: Record<SurfaceId, { bg: string; text: string }> = {
  'card-front': { bg: PASTEL_LIGHT_BY_HUE.blue.cardFront.bg, text: PASTEL_LIGHT_BY_HUE.blue.cardFront.text },
  'card-back': { bg: PASTEL_LIGHT_BY_HUE.blue.cardBack.bg, text: PASTEL_LIGHT_BY_HUE.blue.cardBack.text },
  reader: { bg: PASTEL_LIGHT_BY_HUE.blue.reader.bg, text: PASTEL_LIGHT_BY_HUE.blue.reader.text },
}

function rgbToHsl(r255: number, g255: number, b255: number): [number, number, number] {
  const r = r255 / 255
  const g = g255 / 255
  const b = b255 / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max - min < 1e-9) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max - min)
  let h = 0
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6
      break
    case g:
      h = ((b - r) / d + 2) / 6
      break
    default:
      h = ((r - g) / d + 4) / 6
      break
  }
  return [h, s, l]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t
    if (tt < 0) tt += 1
    if (tt > 1) tt -= 1
    if (tt < 1 / 6) return p + (q - p) * 6 * tt
    if (tt < 1 / 2) return q
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6
    return p
  }
  let r: number
  let g: number
  let b: number
  if (s < 1e-9) {
    r = g = b = l
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  return [r * 255, g * 255, b * 255]
}

function parseHex6(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) throw new Error(`invalid hex: ${hex}`)
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function toHex6(r: number, g: number, b: number): string {
  const c = (n: number) =>
    Math.min(255, Math.max(0, Math.round(n)))
      .toString(16)
      .padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

/** Dominanter Farbton eines Hex-Werts in Grad (0–360), u. a. für Tests. */
export function hexHueDegrees(hex: string): number {
  const [r, g, b] = parseHex6(hex)
  const [h] = rgbToHsl(r, g, b)
  return h * 360
}

/** Etwas kräftigerer Ton auf derselben Hue — für Verläufe und Links ohne festes Blau. */
function tonalAccent(
  hex: string,
  opts: { satBump: number; lightBump: number; satCap?: number; lightCap?: number },
): string {
  const [r, g, b] = parseHex6(hex)
  const [h, s, l] = rgbToHsl(r, g, b)
  const satCap = opts.satCap ?? 0.68
  const lightCap = opts.lightCap ?? 0.58
  const sn = Math.min(satCap, Math.max(0, s + opts.satBump))
  const ln = Math.min(lightCap, Math.max(0, Math.min(1, l + opts.lightBump)))
  return toHex6(...hslToRgb(h, sn, ln))
}

/** Dunkles Pastell aus dem hellen Sechser-Set (weiche Sättigung). */
function pastelDarkFromLight(light: ThemeSource): ThemeSource {
  const deep = (hex: string, floorL: number) => {
    const [r, g, b] = parseHex6(hex)
    const [h, s, l] = rgbToHsl(r, g, b)
    const lNew = Math.max(0.1, Math.min(0.26, floorL + l * 0.07))
    const sNew = Math.max(0.08, Math.min(0.3, s * 0.72 + 0.07))
    return toHex6(...hslToRgb(h, sNew, lNew))
  }
  const fg = (tintHex: string) => {
    const [r, g, b] = parseHex6(tintHex)
    const [h] = rgbToHsl(r, g, b)
    return toHex6(...hslToRgb(h, 0.04, 0.92))
  }
  return {
    cardFront: { bg: deep(light.cardFront.bg, 0.14), text: fg(light.cardFront.bg) },
    cardBack: { bg: deep(light.cardBack.bg, 0.16), text: fg(light.cardBack.bg) },
    reader: { bg: deep(light.reader.bg, 0.12), text: fg(light.reader.bg) },
  }
}

/** Dunkles Warm-Preset aus dem hellen Sechser-Set. */
function warmDarkThemeFromLight(light: ThemeSource): ThemeSource {
  const deep = (hex: string, floorL: number) => {
    const [r, g, b] = parseHex6(hex)
    const [h, s, l] = rgbToHsl(r, g, b)
    const lNew = Math.max(0.08, Math.min(0.24, floorL + l * 0.06))
    const sNew = Math.max(0.12, Math.min(0.42, s * 0.9 + 0.14))
    return toHex6(...hslToRgb(h, sNew, lNew))
  }
  const fg = (tintHex: string) => {
    const [r, g, b] = parseHex6(tintHex)
    const [h] = rgbToHsl(r, g, b)
    return toHex6(...hslToRgb(h, 0.05, 0.91))
  }
  return {
    cardFront: { bg: deep(light.cardFront.bg, 0.13), text: fg(light.cardFront.bg) },
    cardBack: { bg: deep(light.cardBack.bg, 0.15), text: fg(light.cardBack.bg) },
    reader: { bg: deep(light.reader.bg, 0.11), text: fg(light.reader.bg) },
  }
}

/** t=0 -> a, t=1 -> b */
export function mixHex(a: string, b: string, t: number): string {
  const tClamped = Math.min(1, Math.max(0, t))
  const [ar, ag, ab] = parseHex6(a)
  const [br, bg, bb] = parseHex6(b)
  return toHex6(
    ar + (br - ar) * tClamped,
    ag + (bg - ag) * tClamped,
    ab + (bb - ab) * tClamped,
  )
}

/** WCAG 2.1 relative luminance (sRGB). */
export function relativeLuminance(hex: string): number {
  const [r255, g255, b255] = parseHex6(hex)
  const lin = (c: number) => {
    const x = c / 255
    return x <= 0.039_290_71 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
  }
  const R = lin(r255)
  const G = lin(g255)
  const B = lin(b255)
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

function isLightBackground(hex: string): boolean {
  return relativeLuminance(hex) > 0.4
}

/**
 * Global light vs dark for chrome/panels: blends primary, secondary, and reader
 * backgrounds so mixed custom themes are not decided by card-front alone.
 */
function isGlobalLightTheme(s: ThemeSource): boolean {
  const blend = mixHex(mixHex(s.cardFront.bg, s.cardBack.bg, 0.45), s.reader.bg, 0.35)
  return isLightBackground(blend)
}

export function presetSourceFor(preset: ThemePresetId, mode: 'light' | 'dark'): ThemeSource {
  if (preset === 'high-contrast') return PRESET_HIGH_CONTRAST

  const colon = preset.indexOf(':')
  if (colon === -1) {
    return PASTEL_LIGHT_BY_HUE.blue
  }
  const family = preset.slice(0, colon)
  const hueId = preset.slice(colon + 1)
  if (!isThemeHueId(hueId)) {
    return PASTEL_LIGHT_BY_HUE.blue
  }

  if (family === 'pastel') {
    const light = PASTEL_LIGHT_BY_HUE[hueId]
    return mode === 'light' ? light : pastelDarkFromLight(light)
  }
  if (family === 'warm') {
    const light = WARM_LIGHT_BY_HUE[hueId]
    return mode === 'light' ? light : warmDarkThemeFromLight(light)
  }
  return PASTEL_LIGHT_BY_HUE.blue
}

/**
 * Resolves the six source colours. Built-in presets use Pastell/Warm (hell
 * oder dunkel je `mode`) bzw. High Contrast; `custom` nutzt nur gespeicherte
 * Surfaces (`mode` wird ignoriert).
 */
export function resolveThemeSource(prefs: UiPrefs, mode: 'light' | 'dark' = 'light'): ThemeSource {
  if (prefs.theme === 'custom') {
    const patchSurfaces =
      prefs.surfaces && typeof prefs.surfaces === 'object' && !Array.isArray(prefs.surfaces)
        ? prefs.surfaces
        : {}
    const merged = applyUiPrefsPatch(defaultUiPrefs(), { surfaces: patchSurfaces })
    const s = merged.surfaces
    return {
      cardFront: {
        bg: s['card-front'].backgroundColor && isHexColor(s['card-front'].backgroundColor)
          ? s['card-front'].backgroundColor
          : CALM_LIGHT_PICKER_DEFAULTS['card-front'].bg,
        text:
          s['card-front'].textColor && isHexColor(s['card-front'].textColor)
            ? s['card-front'].textColor
            : CALM_LIGHT_PICKER_DEFAULTS['card-front'].text,
      },
      cardBack: {
        bg:
          s['card-back'].backgroundColor && isHexColor(s['card-back'].backgroundColor)
            ? s['card-back'].backgroundColor
            : CALM_LIGHT_PICKER_DEFAULTS['card-back'].bg,
        text:
          s['card-back'].textColor && isHexColor(s['card-back'].textColor)
            ? s['card-back'].textColor
            : CALM_LIGHT_PICKER_DEFAULTS['card-back'].text,
      },
      reader: {
        bg: s.reader.backgroundColor && isHexColor(s.reader.backgroundColor)
          ? s.reader.backgroundColor
          : CALM_LIGHT_PICKER_DEFAULTS.reader.bg,
        text:
          s.reader.textColor && isHexColor(s.reader.textColor)
            ? s.reader.textColor
            : CALM_LIGHT_PICKER_DEFAULTS.reader.text,
      },
    }
  }
  if (isThemePresetId(prefs.theme)) {
    return presetSourceFor(prefs.theme, mode)
  }
  return presetSourceFor('pastel:blue', mode)
}

/**
 * Full `--infl0-*` map from the six source colours. Panels, menu chrome, canvas
 * and help surfaces are all mixed from primary / secondary / reader — no
 * independent ad-hoc colours.
 */
export function deriveInfl0TokensFromSource(s: ThemeSource): Record<string, string> {
  const Pbg = s.cardFront.bg
  const Pt = s.cardFront.text
  const Sbg = s.cardBack.bg
  const St = s.cardBack.text
  const Rbg = s.reader.bg
  const Rt = s.reader.text

  const light = isGlobalLightTheme(s)
  const appBg = light ? mixHex(Pbg, '#e5e7eb', 0.42) : mixHex(Pbg, '#050505', 0.38)
  const canvasFg = mixHex(Pt, appBg, 0.04)
  const canvasFgMuted = mixHex(Pt, appBg, 0.32)

  const gradA = Pbg
  const gradAccent = tonalAccent(Pbg, { satBump: 0.2, lightBump: 0.08, lightCap: 0.55 })
  const gradB = light
    ? mixHex(mixHex(Pbg, gradAccent, 0.52), mixHex(Pbg, '#ffffff', 0.45), 0.38)
    : mixHex(Pbg, '#000000', 0.25)

  const surfaceFrontBg = light ? mixHex(Pbg, '#ffffff', 0.32) : mixHex(Pbg, Sbg, 0.2)
  const surfaceFrontText = Pt
  const surfaceFrontBorder = mixHex(Pbg, Pt, 0.22)

  const surfaceBackBg = Sbg
  const surfaceBackText = St
  const surfaceBackBorder = mixHex(Sbg, St, 0.18)

  const surfaceReaderBg = Rbg
  const surfaceReaderText = Rt
  const surfaceReaderBorder = mixHex(Rbg, Rt, 0.14)

  const articleFrontFg = Pt
  const articleFrontFgDim = mixHex(Pt, Pbg, 0.24)
  const articleFrontFgMute = mixHex(Pt, Pbg, 0.5)

  const articleBackFg = St
  const articleBackFgDim = mixHex(St, Sbg, 0.22)
  const articleBackFgMute = mixHex(St, Sbg, 0.45)

  const panelBg = light ? mixHex('#ffffff', Pbg, 0.06) : mixHex(Sbg, appBg, 0.45)
  const panelText = light ? mixHex(Pt, '#0f172a', 0.12) : mixHex(St, '#f3f4f6', 0.08)
  const panelBorder = mixHex(panelBg, panelText, 0.12)
  const panelTextMuted = mixHex(panelText, panelBg, 0.28)
  const sectionLabel = mixHex(panelText, panelBg, 0.18)
  const nestedSurface = mixHex(panelBg, Sbg, 0.2)

  const formulaPreFg = light ? mixHex(Rt, '#047857', 0.45) : mixHex(Rt, '#34d399', 0.4)

  const footerSeparator = mixHex(canvasFg, appBg, 0.25)
  const footerFg = mixHex(canvasFg, appBg, 0.08)
  const footerLink = light ? mixHex(Pt, '#0f172a', 0.15) : mixHex(Pt, '#f9fafb', 0.1)
  const footerLinkHoverBg = light ? mixHex(appBg, panelText, 0.2) : mixHex(appBg, St, 0.22)

  const fieldBg = panelBg
  const fieldBorder = mixHex(panelBg, panelText, 0.18)
  const surfaceDim = mixHex(panelBg, appBg, 0.25)

  const controlAccent = tonalAccent(Pbg, {
    satBump: light ? 0.32 : 0.22,
    lightBump: light ? -0.12 : 0.08,
    satCap: 0.72,
    lightCap: light ? 0.48 : 0.55,
  })
  const controlSelBorder = mixHex(mixHex(Pbg, panelBg, 0.2), mixHex(Pt, controlAccent, 0.22), 0.5)
  const controlSelBg = light ? mixHex(panelBg, controlAccent, 0.14) : mixHex(panelBg, controlAccent, 0.22)

  const chromeSurface = light ? mixHex('#ffffff', Pbg, 0.04) : mixHex(Sbg, Pbg, 0.3)
  const chromeBorder = mixHex(chromeSurface, isLightBackground(chromeSurface) ? Pbg : St, 0.14)
  const chromeFg = light ? mixHex(Pt, surfaceFrontBg, 0.1) : St
  const chromeFgSubtle = mixHex(chromeFg, chromeSurface, 0.3)
  const chromeLinkHover = mixHex(chromeSurface, Pbg, 0.12)
  const chromeFieldBg = mixHex(chromeSurface, Rbg, 0.1)
  const chromeFieldBorder = mixHex(chromeFieldBg, chromeFg, 0.2)

  const raisedBg = mixHex(panelBg, Rbg, 0.12)
  const raisedFg = mixHex(panelText, raisedBg, 0.04)
  const raisedFgMuted = mixHex(panelText, raisedBg, 0.3)
  const raisedBorder = mixHex(raisedBg, Pbg, 0.1)

  const helpHeaderBg = mixHex(appBg, panelBg, 0.2)
  const helpHeaderBorder = mixHex(helpHeaderBg, panelText, 0.1)
  const helpNestedBg = mixHex(raisedBg, appBg, 0.15)
  const helpBackLink = mixHex(panelText, Rbg, 0.2)

  const radioAccent = panelText

  const lightPanel = isLightBackground(panelBg)
  // Blends keep green/amber hue but tie into `panelText` so deltas stay visible
  // on user-tinted themes (e.g. emerald primaries).
  const deltaPositiveFg = lightPanel
    ? mixHex('#15803d', panelText, 0.22)
    : mixHex('#4ade80', panelText, 0.25)
  const deltaNegativeFg = lightPanel
    ? mixHex('#c2410c', panelText, 0.22)
    : mixHex('#fb923c', panelText, 0.25)

  const trustBg = mixHex(panelBg, '#059669', 0.12)
  const trustBorder = mixHex(panelBorder, '#10b981', 0.32)
  const trustFg = mixHex(panelText, '#34d399', 0.26)
  const trustLink = mixHex(panelText, '#6ee7b7', 0.32)
  const trustLinkHover = mixHex(trustLink, trustFg, 0.15)

  const lightReader = isLightBackground(Rbg)
  const readerLinkAccent = tonalAccent(mixHex(Rbg, Pbg, 0.35), {
    satBump: lightReader ? 0.28 : 0.12,
    lightBump: lightReader ? -0.38 : 0.18,
    satCap: 0.75,
    lightCap: lightReader ? 0.42 : 0.72,
  })
  const readerLink = lightReader
    ? mixHex(Rt, readerLinkAccent, 0.3)
    : mixHex(Rt, readerLinkAccent, 0.24)
  const readerCodeBg = mixHex(Rbg, Rt, 0.1)
  const readerCodeFg = mixHex(Rt, Rbg, 0.06)
  const readerProseMuted = mixHex(Rt, Rbg, 0.38)

  // `--infl0-*` uses both short steps (`-dim`/`-mute` on article fg) and prose
  // (`-muted` on panel/raised); names are stable for existing CSS consumers.

  return {
    '--infl0-app-bg': appBg,
    '--infl0-surface-front-bg': surfaceFrontBg,
    '--infl0-surface-front-text': surfaceFrontText,
    '--infl0-surface-front-border': surfaceFrontBorder,
    '--infl0-surface-back-bg': surfaceBackBg,
    '--infl0-surface-back-text': surfaceBackText,
    '--infl0-surface-back-border': surfaceBackBorder,
    '--infl0-surface-reader-bg': surfaceReaderBg,
    '--infl0-surface-reader-text': surfaceReaderText,
    '--infl0-surface-reader-border': surfaceReaderBorder,
    '--infl0-canvas-fg': canvasFg,
    '--infl0-canvas-fg-muted': canvasFgMuted,
    '--infl0-card-grad-a': gradA,
    '--infl0-card-grad-b': gradB,
    '--infl0-card-back': Sbg,
    '--infl0-article-front-fg': articleFrontFg,
    '--infl0-article-front-fg-dim': articleFrontFgDim,
    '--infl0-article-front-fg-mute': articleFrontFgMute,
    '--infl0-article-back-fg': articleBackFg,
    '--infl0-article-back-fg-dim': articleBackFgDim,
    '--infl0-article-back-fg-mute': articleBackFgMute,
    '--infl0-panel-bg': panelBg,
    '--infl0-panel-border': panelBorder,
    '--infl0-panel-text': panelText,
    '--infl0-panel-text-muted': panelTextMuted,
    '--infl0-section-label': sectionLabel,
    '--infl0-nested-surface': nestedSurface,
    '--infl0-formula-pre-fg': formulaPreFg,
    '--infl0-footer-separator': footerSeparator,
    '--infl0-footer-fg': footerFg,
    '--infl0-footer-link': footerLink,
    '--infl0-footer-link-hover-bg': footerLinkHoverBg,
    '--infl0-field-bg': fieldBg,
    '--infl0-field-border': fieldBorder,
    '--infl0-surface-dim': surfaceDim,
    '--infl0-control-sel-border': controlSelBorder,
    '--infl0-control-sel-bg': controlSelBg,
    '--infl0-chrome-surface': chromeSurface,
    '--infl0-chrome-border': chromeBorder,
    '--infl0-chrome-fg': chromeFg,
    '--infl0-chrome-fg-subtle': chromeFgSubtle,
    '--infl0-chrome-link-hover': chromeLinkHover,
    '--infl0-chrome-field-bg': chromeFieldBg,
    '--infl0-chrome-field-border': chromeFieldBorder,
    '--infl0-raised-bg': raisedBg,
    '--infl0-raised-fg': raisedFg,
    '--infl0-raised-fg-muted': raisedFgMuted,
    '--infl0-raised-border': raisedBorder,
    '--infl0-help-nested-bg': helpNestedBg,
    '--infl0-help-header-bg': helpHeaderBg,
    '--infl0-help-header-border': helpHeaderBorder,
    '--infl0-help-back-link': helpBackLink,
    '--infl0-radio-accent': radioAccent,
    '--infl0-delta-positive-fg': deltaPositiveFg,
    '--infl0-delta-negative-fg': deltaNegativeFg,
    '--infl0-semantic-trust-bg': trustBg,
    '--infl0-semantic-trust-border': trustBorder,
    '--infl0-semantic-trust-fg': trustFg,
    '--infl0-semantic-trust-link': trustLink,
    '--infl0-semantic-trust-link-hover': trustLinkHover,
    '--infl0-reader-link': readerLink,
    '--infl0-reader-code-bg': readerCodeBg,
    '--infl0-reader-code-fg': readerCodeFg,
    '--infl0-reader-prose-muted': readerProseMuted,
  }
}

export function themeSourceToStyleAttr(tokens: Readonly<Record<string, string>>): string {
  return Object.entries(tokens)
    .map(([k, v]) => `${k}: ${v}`)
    .join('; ')
}

/** Light vs dark for HTML chrome only (not persisted as a theme id). */
export type UiChromeAppearance = 'light' | 'dark'

export type BuildThemeHtmlStyleOptions = {
  /**
   * Hell/dunkel: steuert `color-scheme`, Daisy `data-theme` und (bei Presets)
   * welches helle/dunkle Farbpaar in die Token-Pipeline geht. `custom` ignoriert
   * die Paarwahl für die Sechs Farben.
   */
  effectiveAppearance?: UiChromeAppearance
}

/**
 * Full inline `style` for `<html>`. Always emitted so SSR and every preset
 * share the same pipeline (six sources → all tokens).
 */
export function buildThemeHtmlStyle(
  prefs: UiPrefs,
  options?: BuildThemeHtmlStyleOptions,
): string {
  const chrome: UiChromeAppearance = options?.effectiveAppearance ?? 'light'
  const pairMode: 'light' | 'dark' = chrome === 'dark' ? 'dark' : 'light'
  const source = resolveThemeSource(prefs, pairMode)
  const tokens = deriveInfl0TokensFromSource(source)
  const base = themeSourceToStyleAttr(tokens)
  const cs = chrome === 'dark' ? 'dark' : 'light'
  return `${base}; color-scheme: ${cs}`
}
