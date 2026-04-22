import type { SurfaceId, ThemePresetId, UiPrefs } from './ui-prefs'
import { applyUiPrefsPatch, defaultUiPrefs, isHexColor, isThemePresetId } from './ui-prefs'

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
 * Fixed source palettes for built-in themes — one calm / warm / high-contrast
 * look each, expressed only as primary / secondary / reader (bg + text).
 * All app chrome is computed in {@link deriveInfl0TokensFromSource}.
 */
export const PRESET_SOURCE: Record<ThemePresetId, ThemeSource> = {
  'calm-light': {
    cardFront: { bg: '#e0f2fe', text: '#0f172a' },
    cardBack: { bg: '#e2e8f0', text: '#1e293b' },
    reader: { bg: '#ffffff', text: '#1f2937' },
  },
  'warm-dark': {
    cardFront: { bg: '#0f172a', text: '#f3f4f6' },
    cardBack: { bg: '#1a202c', text: '#d1d5db' },
    reader: { bg: '#1a202c', text: '#d1d5db' },
  },
  'high-contrast': {
    cardFront: { bg: '#ffffff', text: '#000000' },
    cardBack: { bg: '#000000', text: '#ffffff' },
    reader: { bg: '#ffffff', text: '#000000' },
  },
}

/** Defaults for custom pickers and null `surfaces` fields — same as calm-light. */
export const CALM_LIGHT_PICKER_DEFAULTS: Record<SurfaceId, { bg: string; text: string }> = {
  'card-front': {
    bg: PRESET_SOURCE['calm-light'].cardFront.bg,
    text: PRESET_SOURCE['calm-light'].cardFront.text,
  },
  'card-back': {
    bg: PRESET_SOURCE['calm-light'].cardBack.bg,
    text: PRESET_SOURCE['calm-light'].cardBack.text,
  },
  reader: {
    bg: PRESET_SOURCE['calm-light'].reader.bg,
    text: PRESET_SOURCE['calm-light'].reader.text,
  },
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

/**
 * Resolves the six source colours for any theme. Presets use {@link PRESET_SOURCE};
 * custom merges stored surfaces with {@link CALM_LIGHT_PICKER_DEFAULTS} for nulls.
 */
export function resolveThemeSource(prefs: UiPrefs): ThemeSource {
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
    return PRESET_SOURCE[prefs.theme]
  }
  return PRESET_SOURCE['calm-light']
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
  const gradB = light ? mixHex(mixHex(Pbg, '#60a5fa', 0.28), '#bfdbfe', 0.4) : mixHex(Pbg, '#000000', 0.25)

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

  const controlSelBorder = mixHex(mixHex(Pbg, panelBg, 0.2), mixHex(Pt, '#3b82f6', 0.2), 0.5)
  const controlSelBg = light ? mixHex(panelBg, '#3b82f6', 0.14) : mixHex(panelBg, '#3b82f6', 0.22)

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
  const readerLink = lightReader ? mixHex(Rt, '#1d4ed8', 0.28) : mixHex(Rt, '#93c5fd', 0.22)
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

/**
 * Full inline `style` for `<html>`. Always emitted so SSR and every preset
 * share the same pipeline (six sources → all tokens).
 */
export function buildThemeHtmlStyle(prefs: UiPrefs): string {
  const source = resolveThemeSource(prefs)
  const tokens = deriveInfl0TokensFromSource(source)
  return themeSourceToStyleAttr(tokens)
}
