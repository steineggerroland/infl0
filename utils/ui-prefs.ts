/**
 * UI preferences (readability, theme, motion) — data layer only.
 *
 * This module is **pure**: no Nuxt, no Prisma, no DOM. The same parse/merge
 * helpers run on the server (`/api/me/ui-prefs`) and in the client composable
 * (`useUiPrefs`), so the stored shape stays in lock-step between DB JSON and
 * localStorage fallback.
 *
 * Concrete visual resolution (CSS variables, `@font-face`, presets) lives in
 * the follow-up CSS/UI steps of `docs/planned/readability-settings.md`. Here
 * we only define the stable persistence contract.
 */

export const UI_PREFS_VERSION = 1

export const SURFACE_IDS = ['card-front', 'card-back', 'reader'] as const
export type SurfaceId = (typeof SURFACE_IDS)[number]

/**
 * Default text sizes (px) per reading surface (content-aware hierarchy, ≈98% fit).
 * User-adjustable bounds are per role — see `fontSizeBoundsForSurface` (not uniform).
 */
export const SURFACE_DEFAULT_FONT_PX: Record<SurfaceId, number> = {
  'card-front': 45,
  'card-back': 22,
  reader: 20,
}

export const LINE_HEIGHT_STEPS = ['tight', 'normal', 'relaxed'] as const
export type LineHeightStep = (typeof LINE_HEIGHT_STEPS)[number]

export const MOTION_MODES = ['system', 'reduced', 'standard'] as const
export type MotionMode = (typeof MOTION_MODES)[number]

/**
 * Hell / Dunkel / wie das Gerät — wählt die helle oder dunkle Variante der
 * eingebauten Paletten (Pastell/Warm) und passt System-UI (z. B. Scrollleisten)
 * daran an. Eigene Farben (`custom`) bleiben eine einzige Palette.
 *
 * - `auto` — folgt der Systemeinstellung (Client; SSR startet hell).
 * - `light` / `dark` — feste Nutzerwahl.
 *
 * Alte gespeicherte Prefs ohne `appearance`: wie bisher `light`,
 * außer Migration von `warm-dark` (siehe `parseUiPrefsFromJson`).
 */
export const APPEARANCE_MODES = ['auto', 'light', 'dark'] as const
export type AppearanceMode = (typeof APPEARANCE_MODES)[number]

/**
 * Registry of selectable font IDs. Today only system stacks are wired;
 * the self-hosted font package adds OFL-licensed entries (e.g. Atkinson
 * Hyperlegible, OpenDyslexic) without a schema migration — we just extend
 * this list and its mapping to CSS variables.
 */
export const FONT_FAMILY_IDS = ['system-sans', 'system-serif', 'system-mono'] as const
export type FontFamilyId = (typeof FONT_FAMILY_IDS)[number]

/**
 * Pastell und Warm je mit fünf festen Farbton-Paletten; hoher Kontrast; `custom` = eigene Sechs-Farben.
 * Jedes Preset (außer `high-contrast` und `custom`) besitzt ein helles und dunkles Paar
 * — die aktive Variante wählt `appearance`.
 */
export const THEME_HUE_IDS = ['yellow', 'green', 'blue', 'red', 'purple'] as const
export type ThemeHueId = (typeof THEME_HUE_IDS)[number]

export const THEME_PRESET_IDS = [
  ...THEME_HUE_IDS.map((h) => `pastel:${h}` as const),
  ...THEME_HUE_IDS.map((h) => `warm:${h}` as const),
  'high-contrast',
] as const
export type ThemePresetId = (typeof THEME_PRESET_IDS)[number]
export type ThemeHuePreset = Exclude<ThemePresetId, 'high-contrast'>
export type ThemeChoice = ThemePresetId | 'custom'

const THEME_PRESET_RE = /^(pastel|warm):(yellow|green|blue|red|purple)$|^high-contrast$/

export type SurfacePrefs = {
  /** `null` means "inherit from preset/theme". */
  backgroundColor: string | null
  /** `null` means "inherit from preset/theme". */
  textColor: string | null
  fontFamily: FontFamilyId
  /** Integer px, clamped per {@link fontSizeBoundsForSurface} (range differs by surface). */
  fontSize: number
  lineHeight: LineHeightStep
}

export type UiPrefs = {
  version: typeof UI_PREFS_VERSION
  theme: ThemeChoice
  motion: MotionMode
  appearance: AppearanceMode
  surfaces: Record<SurfaceId, SurfacePrefs>
  /**
   * Feature-announcement IDs the user has already dismissed. Used for the
   * toast-based "new surface / new color available" notification.
   */
  seenFeatureAnnouncements: string[]
}

/**
 * Shape persisted to DB / localStorage. Matches {@link UiPrefs} but uses
 * `v` (short, consistent with other prefs) instead of `version`.
 */
export type UiPrefsStored = Omit<UiPrefs, 'version'> & { v: typeof UI_PREFS_VERSION }

const MAX_ANNOUNCEMENT_IDS = 64
const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

function isSurfaceId(id: unknown): id is SurfaceId {
  return typeof id === 'string' && (SURFACE_IDS as readonly string[]).includes(id)
}

/**
 * Per-surface px bounds (integers) aligned to layout role: the card front is a
 * curated “hero” block (tight), back is balanced fit, reader allows strong zoom for a11y.
 */
export function fontSizeBoundsForSurface(surface: SurfaceId): { min: number; max: number } {
  const d = SURFACE_DEFAULT_FONT_PX[surface]
  if (surface === 'card-front') {
    const min = Math.max(1, Math.floor(d * 0.6 + 1e-9))
    // +5%: use floor so 45×1.05 does not float to 48
    const max = Math.max(min, Math.floor(d * 1.05 + 1e-9))
    return { min, max }
  }
  if (surface === 'card-back') {
    const min = Math.max(1, Math.floor(d * 0.5 + 1e-9))
    const max = Math.max(min, Math.ceil(d * 1.5 - 1e-9))
    return { min, max }
  }
  const min = Math.max(1, Math.floor(d * 0.5 + 1e-9))
  const max = Math.max(min, Math.ceil(d * 1.8 - 1e-9))
  return { min, max }
}

/**
 * Normalize a candidate font size to an integer in the allowed range for
 * `surface`. Returns `null` for non-finite values.
 */
export function clampFontSizePxForSurface(v: unknown, surface: SurfaceId): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null
  const { min, max } = fontSizeBoundsForSurface(surface)
  const rounded = Math.round(v)
  if (rounded < min) return min
  if (rounded > max) return max
  return rounded
}

/** @deprecated Use `clampFontSizePxForSurface(v, 'card-front')` for bounds semantics. */
export function clampFontSizePx(v: unknown): number | null {
  return clampFontSizePxForSurface(v, 'card-front')
}

function isLineHeight(v: unknown): v is LineHeightStep {
  return typeof v === 'string' && (LINE_HEIGHT_STEPS as readonly string[]).includes(v)
}

function isMotionMode(v: unknown): v is MotionMode {
  return typeof v === 'string' && (MOTION_MODES as readonly string[]).includes(v)
}

function isAppearanceMode(v: unknown): v is AppearanceMode {
  return typeof v === 'string' && (APPEARANCE_MODES as readonly string[]).includes(v)
}

function isFontFamilyId(v: unknown): v is FontFamilyId {
  return typeof v === 'string' && (FONT_FAMILY_IDS as readonly string[]).includes(v)
}

function isThemeChoice(v: unknown): v is ThemeChoice {
  if (v === 'custom') return true
  return isThemePresetId(v)
}

/** `true` for built-in palette ids only (not `'custom'`). */
export function isThemePresetId(v: unknown): v is ThemePresetId {
  return typeof v === 'string' && THEME_PRESET_RE.test(v)
}

export function isThemeHueId(v: unknown): v is ThemeHueId {
  return typeof v === 'string' && (THEME_HUE_IDS as readonly string[]).includes(v)
}

export function isHexColor(v: unknown): v is string {
  return typeof v === 'string' && HEX_COLOR_RE.test(v)
}

export function defaultSurfacePrefs(surface: SurfaceId): SurfacePrefs {
  const fontSize = SURFACE_DEFAULT_FONT_PX[surface]
  if (surface === 'reader') {
    return {
      backgroundColor: null,
      textColor: null,
      fontFamily: 'system-serif',
      fontSize,
      lineHeight: 'relaxed',
    }
  }
  return {
    backgroundColor: null,
    textColor: null,
    fontFamily: 'system-sans',
    fontSize,
    lineHeight: 'normal',
  }
}

export function defaultUiPrefs(): UiPrefs {
  return {
    version: UI_PREFS_VERSION,
    theme: 'pastel:blue',
    motion: 'system',
    appearance: 'auto',
    surfaces: {
      'card-front': defaultSurfacePrefs('card-front'),
      'card-back': defaultSurfacePrefs('card-back'),
      reader: defaultSurfacePrefs('reader'),
    },
    seenFeatureAnnouncements: [],
  }
}

function parseSurface(raw: unknown, surface: SurfaceId): SurfacePrefs {
  const base = defaultSurfacePrefs(surface)
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return base
  const r = raw as Record<string, unknown>
  const fontSize = clampFontSizePxForSurface(r.fontSize, surface)
  return {
    backgroundColor: isHexColor(r.backgroundColor) ? r.backgroundColor : base.backgroundColor,
    textColor: isHexColor(r.textColor) ? r.textColor : base.textColor,
    fontFamily: isFontFamilyId(r.fontFamily) ? r.fontFamily : base.fontFamily,
    fontSize: fontSize ?? base.fontSize,
    lineHeight: isLineHeight(r.lineHeight) ? r.lineHeight : base.lineHeight,
  }
}

function parseAnnouncementIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const out: string[] = []
  for (const id of raw) {
    if (typeof id !== 'string') continue
    const trimmed = id.trim()
    if (trimmed.length === 0 || trimmed.length > 64) continue
    if (out.includes(trimmed)) continue
    out.push(trimmed)
    if (out.length >= MAX_ANNOUNCEMENT_IDS) break
  }
  return out
}

/**
 * Parse an arbitrary JSON blob into {@link UiPrefs}. Unknown / malformed
 * fields fall back to defaults; unknown keys are dropped. Returns `null` if
 * the blob is clearly not a UI-prefs object (non-object, array, missing
 * version), so callers can distinguish "no prefs stored yet" from "user has
 * fully customized defaults".
 */
export function parseUiPrefsFromJson(json: unknown): UiPrefs | null {
  if (json == null || typeof json !== 'object' || Array.isArray(json)) return null
  const j = json as Record<string, unknown>
  if (typeof j.v !== 'number' || j.v < 1) return null
  const base = defaultUiPrefs()
  const motion = isMotionMode(j.motion) ? j.motion : base.motion
  const hasAppearanceKey = 'appearance' in j
  let appearance: AppearanceMode = isAppearanceMode(j.appearance) ? j.appearance : 'light'

  let theme: ThemeChoice = base.theme
  const rawTheme = j.theme
  if (rawTheme === 'calm-light') {
    theme = 'pastel:blue'
    if (!hasAppearanceKey) appearance = 'light'
  } else if (rawTheme === 'warm-dark') {
    theme = 'warm:blue'
    if (!hasAppearanceKey) appearance = 'dark'
  } else if (isThemeChoice(rawTheme)) {
    theme = rawTheme
  }
  const surfacesRaw =
    j.surfaces && typeof j.surfaces === 'object' && !Array.isArray(j.surfaces)
      ? (j.surfaces as Record<string, unknown>)
      : {}

  function rawFontSizeEntry(entry: unknown): number | undefined {
    if (entry == null || typeof entry !== 'object' || Array.isArray(entry)) return undefined
    const fs = (entry as Record<string, unknown>).fontSize
    return typeof fs === 'number' && Number.isFinite(fs) ? fs : undefined
  }

  const rawF = rawFontSizeEntry(surfacesRaw['card-front'])
  const rawB = rawFontSizeEntry(surfacesRaw['card-back'])
  const rawR = rawFontSizeEntry(surfacesRaw.reader)
  const isLegacyDefaultFontTriplet = rawF === 16 && rawB === 16 && rawR === 18

  const surfaces: Record<SurfaceId, SurfacePrefs> = {
    'card-front': parseSurface(surfacesRaw['card-front'], 'card-front'),
    'card-back': parseSurface(surfacesRaw['card-back'], 'card-back'),
    reader: parseSurface(surfacesRaw.reader, 'reader'),
  }

  if (isLegacyDefaultFontTriplet) {
    surfaces['card-front'].fontSize = SURFACE_DEFAULT_FONT_PX['card-front']
    surfaces['card-back'].fontSize = SURFACE_DEFAULT_FONT_PX['card-back']
    surfaces.reader.fontSize = SURFACE_DEFAULT_FONT_PX.reader
  }
  return {
    version: UI_PREFS_VERSION,
    theme,
    motion,
    appearance,
    surfaces,
    seenFeatureAnnouncements: parseAnnouncementIds(j.seenFeatureAnnouncements),
  }
}

/** Resolved prefs for rendering: stored JSON or defaults. */
export function resolveUiPrefs(json: unknown | null | undefined): UiPrefs {
  return parseUiPrefsFromJson(json) ?? defaultUiPrefs()
}

/** Serialize a resolved prefs object into the stored shape (for DB / localStorage). */
export function toStoredUiPrefs(prefs: UiPrefs): UiPrefsStored {
  return {
    v: UI_PREFS_VERSION,
    theme: prefs.theme,
    motion: prefs.motion,
    appearance: prefs.appearance,
    surfaces: prefs.surfaces,
    seenFeatureAnnouncements: prefs.seenFeatureAnnouncements,
  }
}

/**
 * Partial payload accepted by `PATCH /api/me/ui-prefs`. Top-level and
 * surface-level fields are each optional; invalid values are ignored so a
 * forward-compatible client cannot wipe a surface by sending a bad color.
 */
export type UiPrefsPatch = {
  theme?: ThemeChoice
  motion?: MotionMode
  appearance?: AppearanceMode
  surfaces?: Partial<Record<SurfaceId, Partial<SurfacePrefs>>>
  seenFeatureAnnouncements?: string[]
}

/**
 * Apply a partial patch onto a resolved prefs object. Only known keys are
 * merged; hex colors are validated; enums must be in the allowlist.
 */
export function applyUiPrefsPatch(base: UiPrefs, patch: UiPrefsPatch): UiPrefs {
  const next: UiPrefs = {
    ...base,
    surfaces: {
      'card-front': { ...base.surfaces['card-front'] },
      'card-back': { ...base.surfaces['card-back'] },
      reader: { ...base.surfaces.reader },
    },
    seenFeatureAnnouncements: [...base.seenFeatureAnnouncements],
  }
  if (isThemeChoice(patch.theme)) next.theme = patch.theme
  if (isMotionMode(patch.motion)) next.motion = patch.motion
  if (isAppearanceMode(patch.appearance)) next.appearance = patch.appearance
  if (patch.surfaces && typeof patch.surfaces === 'object' && !Array.isArray(patch.surfaces)) {
    for (const [rawId, rawSurface] of Object.entries(patch.surfaces)) {
      if (!isSurfaceId(rawId)) continue
      if (rawSurface == null || typeof rawSurface !== 'object' || Array.isArray(rawSurface)) continue
      const s = rawSurface as Record<string, unknown>
      const target = next.surfaces[rawId]
      if ('backgroundColor' in s) {
        if (s.backgroundColor === null || isHexColor(s.backgroundColor)) {
          target.backgroundColor = s.backgroundColor as string | null
        }
      }
      if ('textColor' in s) {
        if (s.textColor === null || isHexColor(s.textColor)) {
          target.textColor = s.textColor as string | null
        }
      }
      if (isFontFamilyId(s.fontFamily)) target.fontFamily = s.fontFamily
      if ('fontSize' in s) {
        const clamped = clampFontSizePxForSurface(s.fontSize, rawId)
        if (clamped != null) target.fontSize = clamped
      }
      if (isLineHeight(s.lineHeight)) target.lineHeight = s.lineHeight
    }
  }
  if (Array.isArray(patch.seenFeatureAnnouncements)) {
    next.seenFeatureAnnouncements = parseAnnouncementIds(patch.seenFeatureAnnouncements)
  }
  return next
}

export const UI_PREFS_STORAGE_KEY = 'infl0.uiPrefs.v1'
