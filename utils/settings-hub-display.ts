import type { SurfaceId } from '~/utils/ui-prefs'

/** Card front / back / reader — order matches `/settings` typography block. */
export const SETTINGS_DISPLAY_SURFACE_ORDER: readonly SurfaceId[] = [
    'card-front',
    'card-back',
    'reader',
] as const

export function displaySurfaceScrollId(sid: SurfaceId): string {
    return `display-surface-${sid}`
}

/** i18n path for sidebar + in-page headings (card front / back / reader). */
export const SETTINGS_DISPLAY_SURFACE_HEADING_KEYS: Record<SurfaceId, string> = {
    'card-front': 'settingsDisplay.surfaces.cardFront.heading',
    'card-back': 'settingsDisplay.surfaces.cardBack.heading',
    reader: 'settingsDisplay.surfaces.reader.heading',
}

/** Ids for `/settings` sidebar + scroll-spy (subset of `display-*` anchors). */
export const SETTINGS_HUB_DISPLAY_SURFACE_SCROLL_IDS: string[] =
    SETTINGS_DISPLAY_SURFACE_ORDER.map(displaySurfaceScrollId)

export const SETTINGS_DISPLAY_NESTED_NAV_HASHES: ReadonlySet<string> = new Set([
    'display-appearance',
    'display-palette',
    ...SETTINGS_HUB_DISPLAY_SURFACE_SCROLL_IDS,
    'display-motion',
])
