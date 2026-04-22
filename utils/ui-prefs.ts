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
 * Font sizes are stored as integer **pixels**, per surface.
 *
 * A numeric value (instead of a `xs/sm/md/lg/xl` scale) keeps the live-
 * preview honest: the user sees the exact size they configure, and the
 * `+ / - / 0` shortcuts can nudge by one pixel at a time when a card's
 * content just barely doesn't fit.
 *
 * The bounds are an accessibility guardrail: at the low end text remains
 * legible on dense UI surfaces, at the high end the reader does not break
 * timeline cards or touch targets. Values outside the range are clamped
 * during parse and patch so the DB never holds an unsafe size.
 *
 * `pt` → `px` conversion is trivial (1pt ≈ 1.333px at 96dpi), so we pick
 * one canonical unit and leave unit conversion to the UI label.
 */
export const MIN_FONT_SIZE_PX = 10
export const MAX_FONT_SIZE_PX = 32

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
  /** Integer pixels, clamped to `[MIN_FONT_SIZE_PX, MAX_FONT_SIZE_PX]`. */
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
 * Normalize a candidate font size to an integer pixel value in the allowed
 * range. Returns `null` for non-finite values so callers can fall back to
 * the current / default size instead of storing a clamped but unintended
 * number (e.g. accidental `'xl'` string).
 */
export function clampFontSizePx(v: unknown): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null
  const rounded = Math.round(v)
  if (rounded < MIN_FONT_SIZE_PX) return MIN_FONT_SIZE_PX
  if (rounded > MAX_FONT_SIZE_PX) return MAX_FONT_SIZE_PX
  return rounded
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
  if (surface === 'reader') {
    return {
      backgroundColor: null,
      textColor: null,
      fontFamily: 'system-serif',
      fontSize: 18,
      lineHeight: 'relaxed',
    }
  }
  return {
    backgroundColor: null,
    textColor: null,
    fontFamily: 'system-sans',
    fontSize: 16,
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
  const fontSize = clampFontSizePx(r.fontSize)
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
  const surfaces: Record<SurfaceId, SurfacePrefs> = {
    'card-front': parseSurface(surfacesRaw['card-front'], 'card-front'),
    'card-back': parseSurface(surfacesRaw['card-back'], 'card-back'),
    reader: parseSurface(surfacesRaw.reader, 'reader'),
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
        const clamped = clampFontSizePx(s.fontSize)
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
