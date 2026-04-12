export const ARTICLE_ENGAGEMENT_SEGMENTS = ['teaser', 'summary', 'body'] as const

export type ArticleEngagementSegment = (typeof ARTICLE_ENGAGEMENT_SEGMENTS)[number]

export function isArticleEngagementSegment(s: string): s is ArticleEngagementSegment {
  return (ARTICLE_ENGAGEMENT_SEGMENTS as readonly string[]).includes(s)
}

/** Seconds of dwell on this article (all segments) before we set read_at. */
export const ARTICLE_READ_ENGAGED_SECONDS_THRESHOLD = 2

/** Ignore accidental focus blips shorter than this (ms). */
export const ARTICLE_ENGAGEMENT_MIN_DWELL_MS = 50

/** Cap a single reported session to limit abuse / runaway tabs. */
export const ARTICLE_ENGAGEMENT_MAX_DURATION_SEC = 4 * 60 * 60
