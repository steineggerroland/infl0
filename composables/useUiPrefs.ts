import { getCurrentInstance, onBeforeUnmount, onMounted } from 'vue'
import {
  UI_PREFS_STORAGE_KEY,
  applyUiPrefsPatch,
  defaultUiPrefs,
  parseUiPrefsFromJson,
  toStoredUiPrefs,
  uiPrefsEffectiveCustomization,
  type UiPrefs,
  type UiPrefsPatch,
  type UiPrefsStored,
} from '~/utils/ui-prefs'

/** PATCH debounce (merged patches); same for Settings and Lesbarkeits-Tastatur. */
const SYNC_DEBOUNCE_MS = 500

/**
 * Non-reactive bookkeeping for the singleton. Lives behind the same
 * `useState` contract as `prefs` so it is shared between concurrent
 * callers (multiple components mounting `useUiPrefs()` must not produce
 * duplicate hydration requests or competing PATCH queues) while staying
 * isolated per SSR request and per Vitest test.
 *
 * Fields that are timers or in-flight promises are intentionally plain
 * values on a reactive object — Vue's reactivity layer does not observe
 * them in any template, so there is no reactivity cost and no surprising
 * re-render when the timer id changes.
 */
interface UiPrefsControl {
  hydrated: boolean
  hydrationPromise: Promise<void> | null
  syncTimer: ReturnType<typeof setTimeout> | null
  pendingPatch: UiPrefsPatch | null
  flushPromise: Promise<void> | null
  /** Active component instances — the last one leaving flushes pending edits. */
  mountCount: number
  /** `pagehide` flush registered while at least one consumer is mounted. */
  pagehideListenerBound: boolean
}

function createControl(): UiPrefsControl {
  return {
    hydrated: false,
    hydrationPromise: null,
    syncTimer: null,
    pendingPatch: null,
    flushPromise: null,
    mountCount: 0,
    pagehideListenerBound: false,
  }
}

/**
 * Client-side access to UI preferences (readability / theme / motion).
 *
 * Source-of-truth order:
 *   1. Server (`GET /api/me/ui-prefs`) when signed in — unless the response
 *      is still the all-default snapshot while `localStorage` holds a
 *      customized copy (then local wins once and a full PATCH resyncs the DB).
 *   2. `localStorage` fallback — same shape — for first paint and offline.
 *   3. `defaultUiPrefs()` when nothing is stored anywhere yet.
 *
 * Writes are optimistic: `update(...)` mutates the reactive state immediately
 * (so the UI / CSS variables react within the same tick), then debounces a
 * `PATCH /api/me/ui-prefs`. If the server rejects or the browser is offline,
 * the localStorage copy keeps the latest desired state.
 *
 * Multiple consumers are expected (Settings page, Reader, app-shell live
 * preview) and share the same reactive state plus the same hydration /
 * debounce queue. Hydration fires at most once per app instance; concurrent
 * first-mount callers await the same in-flight request.
 *
 * SSR-safety: a plain `typeof window` check keeps the composable framework-
 * neutral (Nuxt prod, Vitest + happy-dom, and pure Node). Using
 * `import.meta.client` would make the composable untestable outside Nuxt.
 */
export function useUiPrefs() {
  const prefs = useState<UiPrefs>('ui-prefs', () => defaultUiPrefs())
  const control = useState<UiPrefsControl>('ui-prefs:control', createControl)
  const isClient = typeof window !== 'undefined'

  function persistLocal() {
    if (!isClient) return
    try {
      const payload: UiPrefsStored = toStoredUiPrefs(prefs.value)
      window.localStorage.setItem(UI_PREFS_STORAGE_KEY, JSON.stringify(payload))
    } catch {
      /* quota / private mode — ignore, the next login reconciles with the server */
    }
  }

  function readLocal(): UiPrefs | null {
    if (!isClient) return null
    try {
      const raw = window.localStorage.getItem(UI_PREFS_STORAGE_KEY)
      if (!raw) return null
      return parseUiPrefsFromJson(JSON.parse(raw) as unknown)
    } catch {
      return null
    }
  }

  async function sendPatch(patch: UiPrefsPatch): Promise<void> {
    const returned = await $fetch<UiPrefsStored>('/api/me/ui-prefs', {
      method: 'PATCH',
      body: patch,
      credentials: 'include',
    })
    const resolved = parseUiPrefsFromJson(returned)
    if (resolved) {
      prefs.value = resolved
      persistLocal()
    }
  }

  /** Full patch so a stale server row can be overwritten after we prefer localStorage. */
  function prefsToFullResyncPatch(p: UiPrefs): UiPrefsPatch {
    return {
      theme: p.theme,
      motion: p.motion,
      appearance: p.appearance,
      surfaces: {
        'card-front': { ...p.surfaces['card-front'] },
        'card-back': { ...p.surfaces['card-back'] },
        reader: { ...p.surfaces.reader },
      },
      seenFeatureAnnouncements: [...p.seenFeatureAnnouncements],
      onboardingHidden: p.onboardingHidden,
    }
  }

  /**
   * Best-effort PATCH when the tab may be killed before `sendPatch` runs
   * (debounce timer or in-flight `$fetch`). Uses `fetch(..., { keepalive })`
   * so the browser is more likely to deliver the body during unload.
   */
  function flushPendingPatchSync() {
    if (!isClient) return
    const c = control.value
    if (c.syncTimer != null) {
      clearTimeout(c.syncTimer)
      c.syncTimer = null
    }
    const payload = c.pendingPatch
    c.pendingPatch = null
    if (!payload) return
    try {
      void fetch('/api/me/ui-prefs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
        keepalive: true,
      })
    } catch {
      /* ignore */
    }
  }

  function schedulePatch(patch: UiPrefsPatch) {
    if (!isClient) return
    const c = control.value
    c.pendingPatch = c.pendingPatch ? mergePatches(c.pendingPatch, patch) : patch
    if (c.syncTimer != null) clearTimeout(c.syncTimer)
    c.syncTimer = setTimeout(() => {
      c.syncTimer = null
      const payload = c.pendingPatch
      c.pendingPatch = null
      if (!payload) return
      c.flushPromise = sendPatch(payload)
        .catch(() => {
          /* offline / 401 — local state is already optimistic; retry on next mutation. */
        })
        .finally(() => {
          c.flushPromise = null
        })
    }, SYNC_DEBOUNCE_MS)
  }

  function hydrate(): Promise<void> {
    const c = control.value
    if (!isClient) return Promise.resolve()
    if (c.hydrated) return Promise.resolve()
    if (c.hydrationPromise) return c.hydrationPromise

    const requestFetch = useRequestFetch()
    const p = (async () => {
      try {
        const fromServer = await requestFetch<UiPrefsStored>('/api/me/ui-prefs')
        const resolved = parseUiPrefsFromJson(fromServer)
        if (resolved) {
          const fromLocal = readLocal()
          const preferLocal =
            fromLocal != null &&
            uiPrefsEffectiveCustomization(fromLocal) &&
            !uiPrefsEffectiveCustomization(resolved)
          if (preferLocal) {
            prefs.value = fromLocal
            persistLocal()
            schedulePatch(prefsToFullResyncPatch(fromLocal))
          } else {
            prefs.value = resolved
            persistLocal()
          }
          return
        }
      } catch {
        /* offline / 401 — try localStorage. */
      }
      const fromLocal = readLocal()
      if (fromLocal) {
        prefs.value = fromLocal
      }
    })().finally(() => {
      c.hydrated = true
      c.hydrationPromise = null
    })
    c.hydrationPromise = p
    return p
  }

  function update(patch: UiPrefsPatch) {
    prefs.value = applyUiPrefsPatch(prefs.value, patch)
    if (isClient) {
      persistLocal()
      schedulePatch(patch)
    }
  }

  async function reset() {
    const c = control.value
    await c.flushPromise
    if (c.syncTimer != null) {
      clearTimeout(c.syncTimer)
      c.syncTimer = null
    }
    c.pendingPatch = null
    prefs.value = defaultUiPrefs()
    if (!isClient) return
    persistLocal()
    try {
      const returned = await $fetch<UiPrefsStored>('/api/me/ui-prefs', {
        method: 'PATCH',
        body: { reset: true },
        credentials: 'include',
      })
      const resolved = parseUiPrefsFromJson(returned)
      if (resolved) {
        prefs.value = resolved
        persistLocal()
      }
    } catch {
      /* offline / 401 — keep optimistic default */
    }
  }

  function markAnnouncementSeen(id: string) {
    const trimmed = id.trim()
    if (!trimmed) return
    if (prefs.value.seenFeatureAnnouncements.includes(trimmed)) return
    update({
      seenFeatureAnnouncements: [...prefs.value.seenFeatureAnnouncements, trimmed],
    })
  }

  function onPageHide() {
    flushPendingPatchSync()
  }

  if (isClient && getCurrentInstance()) {
    onMounted(() => {
      const c = control.value
      c.mountCount += 1
      if (!c.pagehideListenerBound) {
        window.addEventListener('pagehide', onPageHide)
        c.pagehideListenerBound = true
      }
      void hydrate()
    })
    onBeforeUnmount(async () => {
      const c = control.value
      c.mountCount = Math.max(0, c.mountCount - 1)
      // Only the last consumer leaving should flush the debounced patch —
      // otherwise a transient unmount (tab switch, partial re-render) would
      // kill the debounce while another component is still editing.
      if (c.mountCount === 0) {
        if (c.pagehideListenerBound) {
          window.removeEventListener('pagehide', onPageHide)
          c.pagehideListenerBound = false
        }
        if (c.syncTimer != null) {
          clearTimeout(c.syncTimer)
          c.syncTimer = null
          const payload = c.pendingPatch
          c.pendingPatch = null
          if (payload) {
            c.flushPromise = sendPatch(payload)
              .catch(() => {
                /* offline / 401 */
              })
              .finally(() => {
                c.flushPromise = null
              })
            await c.flushPromise
          }
        }
      }
    })
  } else if (isClient) {
    void hydrate()
  }

  return { prefs, update, reset, markAnnouncementSeen }
}

/** Merge two partial patches; last write wins per leaf. */
function mergePatches(a: UiPrefsPatch, b: UiPrefsPatch): UiPrefsPatch {
  const out: UiPrefsPatch = { ...a, ...b }
  if (a.surfaces || b.surfaces) {
    out.surfaces = {
      ...(a.surfaces ?? {}),
      ...(b.surfaces ?? {}),
    }
    if (a.surfaces && b.surfaces) {
      for (const id of Object.keys(b.surfaces) as (keyof NonNullable<UiPrefsPatch['surfaces']>)[]) {
        out.surfaces[id] = { ...(a.surfaces[id] ?? {}), ...(b.surfaces[id] ?? {}) }
      }
    }
  }
  if (b.seenFeatureAnnouncements) {
    out.seenFeatureAnnouncements = b.seenFeatureAnnouncements
  }
  // `out` already inherits `onboardingHidden` via the spread above when only
  // one of the patches sets it. The spread keeps b's value when both set it.
  return out
}
