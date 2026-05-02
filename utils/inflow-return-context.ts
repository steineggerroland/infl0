/**
 * Browser-persisted return context for the inflow.
 *
 * The inflow can reorder when new articles arrive or scores change. Persisting
 * the last focused card lets the client restore that anchor after reloads or
 * route returns instead of dropping the user at the top of a changed list.
 */

export const INFLOW_RETURN_CONTEXT_STORAGE_KEY = 'infl0.inflow.returnContext.v1'
export const INFLOW_RETURN_CONTEXT_VERSION = 1

export type InflowReturnAnchor = {
  type: 'article' | 'onboarding'
  id: string
}

export type InflowReturnContext = {
  v: typeof INFLOW_RETURN_CONTEXT_VERSION
  anchor: InflowReturnAnchor
  /**
   * Rendered item index when the anchor was captured. Used only as fallback
   * when the exact anchor is no longer present in the current filtered inflow.
   */
  itemIndex: number
  /**
   * Number of article rows before the focused item. Onboarding cards are
   * ignored so a new/removed onboarding prefix does not skew article fallback.
   */
  articleOffset: number
  capturedAt: string
}

function validAnchor(raw: unknown): InflowReturnAnchor | null {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return null
  const r = raw as Record<string, unknown>
  if (r.type !== 'article' && r.type !== 'onboarding') return null
  if (typeof r.id !== 'string' || r.id.trim() === '') return null
  return { type: r.type, id: r.id.trim() }
}

function nonNegativeInteger(raw: unknown): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return 0
  return Math.max(0, Math.floor(raw))
}

export function parseInflowReturnContext(raw: string | null): InflowReturnContext | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    const r = parsed as Record<string, unknown>
    if (r.v !== INFLOW_RETURN_CONTEXT_VERSION) return null
    const anchor = validAnchor(r.anchor)
    if (!anchor) return null
    const capturedAt = typeof r.capturedAt === 'string' && r.capturedAt.trim() !== ''
      ? r.capturedAt
      : new Date(0).toISOString()
    return {
      v: INFLOW_RETURN_CONTEXT_VERSION,
      anchor,
      itemIndex: nonNegativeInteger(r.itemIndex),
      articleOffset: nonNegativeInteger(r.articleOffset),
      capturedAt,
    }
  } catch {
    return null
  }
}

export function serializeInflowReturnContext(
  anchor: InflowReturnAnchor,
  itemIndex: number,
  articleOffset: number,
  capturedAt = new Date().toISOString(),
): string {
  return JSON.stringify({
    v: INFLOW_RETURN_CONTEXT_VERSION,
    anchor,
    itemIndex: nonNegativeInteger(itemIndex),
    articleOffset: nonNegativeInteger(articleOffset),
    capturedAt,
  } satisfies InflowReturnContext)
}

