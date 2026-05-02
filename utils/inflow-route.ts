import type { InflowReturnAnchor } from './inflow-return-context'

const INFLOW_ARTICLE_PREFIX = '/inflow/article/'
const INFLOW_ONBOARDING_PREFIX = '/inflow/onboarding/'
const ONBOARDING_ID_PREFIX = 'onboarding/'

function safeDecode(segment: string): string | null {
  try {
    const decoded = decodeURIComponent(segment)
    return decoded.trim() === '' ? null : decoded
  } catch {
    return null
  }
}

export function pathForInflowAnchor(anchor: InflowReturnAnchor): string {
  if (anchor.type === 'onboarding') {
    const topic = anchor.id.startsWith(ONBOARDING_ID_PREFIX)
      ? anchor.id.slice(ONBOARDING_ID_PREFIX.length)
      : anchor.id
    return `${INFLOW_ONBOARDING_PREFIX}${encodeURIComponent(topic)}`
  }
  return `${INFLOW_ARTICLE_PREFIX}${encodeURIComponent(anchor.id)}`
}

export function parseInflowAnchorPath(path: string): InflowReturnAnchor | null {
  if (path.startsWith(INFLOW_ARTICLE_PREFIX)) {
    const segment = path.slice(INFLOW_ARTICLE_PREFIX.length).split('/')[0] ?? ''
    const id = safeDecode(segment)
    return id ? { type: 'article', id } : null
  }
  if (path.startsWith(INFLOW_ONBOARDING_PREFIX)) {
    const segment = path.slice(INFLOW_ONBOARDING_PREFIX.length).split('/')[0] ?? ''
    const topic = safeDecode(segment)
    return topic ? { type: 'onboarding', id: `${ONBOARDING_ID_PREFIX}${topic}` } : null
  }
  return null
}

