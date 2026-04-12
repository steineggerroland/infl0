import {
  TIMELINE_SCORE_FACTOR_DEFS,
  TIMELINE_SCORE_VERSION,
  defaultContentLengthPreference,
  defaultTimelineScoreWeights,
  type TimelineScoreFactorId,
} from '~/utils/timeline-score-factors'
import { parseTimelineScorePrefsFromJson } from '~/utils/timeline-score-prefs-merge'

const STORAGE_KEY = 'infl0.timelineScoreWeights.v3'

const SYNC_DEBOUNCE_MS = 600

function parseStoredLocal(raw: string | null) {
  if (raw == null) return null
  try {
    const j = JSON.parse(raw) as unknown
    return parseTimelineScorePrefsFromJson(j)
  } catch {
    return null
  }
}

export function useTimelineScoreWeights() {
  const weights = useState<Record<TimelineScoreFactorId, number>>('timeline-score-weights', () =>
    defaultTimelineScoreWeights(),
  )
  const contentLengthPreference = useState(
    'timeline-score-content-length-pref',
    () => defaultContentLengthPreference(),
  )

  let syncTimer: ReturnType<typeof setTimeout> | null = null
  let flushPromise: Promise<void> | null = null

  function persistLocal() {
    if (!import.meta.client) return
    const payload = {
      v: TIMELINE_SCORE_VERSION,
      weights: weights.value,
      contentLengthPreference: contentLengthPreference.value,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }

  async function syncToServer() {
    await $fetch('/api/me/timeline-score-prefs', {
      method: 'PATCH',
      body: {
        weights: weights.value,
        contentLengthPreference: contentLengthPreference.value,
      },
      credentials: 'include',
    })
  }

  function scheduleSync() {
    if (!import.meta.client) return
    if (syncTimer != null) clearTimeout(syncTimer)
    syncTimer = setTimeout(() => {
      syncTimer = null
      flushPromise = syncToServer()
        .catch(() => {})
        .finally(() => {
          flushPromise = null
        })
    }, SYNC_DEBOUNCE_MS)
  }

  async function drainInFlightSync() {
    if (!import.meta.client) return
    if (syncTimer != null) {
      clearTimeout(syncTimer)
      syncTimer = null
    }
    if (flushPromise) await flushPromise
  }

  async function flushSync() {
    await drainInFlightSync()
    if (!import.meta.client) return
    try {
      await syncToServer()
    } catch {
      /* offline / 401 */
    }
  }

  if (import.meta.client) {
    onMounted(async () => {
      const requestFetch = useRequestFetch()
      try {
        const data = await requestFetch<{
          version: number
          weights: Record<TimelineScoreFactorId, number>
          contentLengthPreference: number
        }>('/api/me/timeline-score-prefs')
        if (data?.weights) {
          weights.value = data.weights
          contentLengthPreference.value = data.contentLengthPreference
        }
      } catch {
        const tryKeys = [
          STORAGE_KEY,
          'infl0.timelineScoreWeights.v2',
          'infl0.timelineScoreWeights.v1',
        ]
        let parsed: ReturnType<typeof parseStoredLocal> = null
        for (const key of tryKeys) {
          parsed = parseStoredLocal(localStorage.getItem(key))
          if (parsed) break
        }
        if (parsed) {
          weights.value = parsed.weights
          contentLengthPreference.value = parsed.contentLengthPreference
        }
      }
      persistLocal()
      await nextTick()

      watch(
        [weights, contentLengthPreference],
        () => {
          persistLocal()
          scheduleSync()
        },
        { deep: true },
      )
    })

    onBeforeUnmount(() => {
      void flushSync()
    })
  }

  async function resetWeights() {
    await drainInFlightSync()
    const data = await $fetch<{
      weights: Record<TimelineScoreFactorId, number>
      contentLengthPreference: number
    }>('/api/me/timeline-score-prefs', {
      method: 'PATCH',
      body: { reset: true },
      credentials: 'include',
    })
    weights.value = data.weights
    contentLengthPreference.value = data.contentLengthPreference
    if (import.meta.client) {
      persistLocal()
    }
  }

  const formulaLines = computed(() => {
    const parts: string[] = []
    for (const d of TIMELINE_SCORE_FACTOR_DEFS) {
      const w = weights.value[d.id]
      if (w <= 0) continue
      if (d.id === 'content_length') {
        parts.push(
          `content_length(preference=${contentLengthPreference.value}) × (${w} / 100)`,
        )
      } else {
        parts.push(`${d.id} × (${w} / 100)`)
      }
    }
    if (parts.length === 0) return 'score = 0'
    return `score = ${parts.join(' + ')}`
  })

  return { weights, contentLengthPreference, resetWeights, formulaLines }
}
