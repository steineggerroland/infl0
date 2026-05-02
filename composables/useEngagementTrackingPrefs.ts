import type { ArticleEngagementSegment } from '~/utils/article-engagement'
import { ARTICLE_ENGAGEMENT_MIN_DWELL_MS } from '~/utils/article-engagement'

/**
 * Server-backed engagement (dwell) opt-in. Shared across ArticleView instances.
 */
export function useEngagementTrackingPrefs() {
  const enabled = useState('engagement-tracking-enabled', () => false)
  const loaded = useState('engagement-tracking-loaded', () => false)
  const initPromise = useState<Promise<void> | null>('engagement-tracking-init-promise', () => null)

  function ensureLoaded(): Promise<void> {
    if (import.meta.server) {
      loaded.value = true
      return Promise.resolve()
    }
    if (loaded.value) return Promise.resolve()
    if (!initPromise.value) {
      initPromise.value = $fetch<{ enabled: boolean }>('/api/me/engagement-tracking', {
        credentials: 'include',
      })
        .then((d) => {
          enabled.value = d.enabled
          loaded.value = true
        })
        .catch(() => {
          loaded.value = true
        })
    }
    return initPromise.value
  }

  async function setEnabled(v: boolean) {
    const d = await $fetch<{ enabled: boolean }>('/api/me/engagement-tracking', {
      method: 'PATCH',
      body: { enabled: v },
      credentials: 'include',
    })
    enabled.value = d.enabled
  }

  async function reportDwell(
    articleId: string,
    segment: ArticleEngagementSegment,
    durationMs: number,
  ): Promise<{ readMarked: boolean } | null> {
    if (!loaded.value || !enabled.value) return null
    if (durationMs < ARTICLE_ENGAGEMENT_MIN_DWELL_MS) return null
    const durationSec = Math.round((durationMs / 1000) * 100) / 100
    try {
      const res = await $fetch<{ readMarked?: boolean }>('/api/me/article-engagement', {
        method: 'POST',
        body: { articleId, segment, durationSec },
        credentials: 'include',
      })
      return { readMarked: res.readMarked === true }
    } catch {
      /* offline / 401 */
      return null
    }
  }

  return { enabled, loaded, ensureLoaded, setEnabled, reportDwell }
}
