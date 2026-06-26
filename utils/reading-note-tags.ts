export function normalizeReadingNoteTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return []

  return Array.from(
    new Set(
      tags
        .filter((tag): tag is string => typeof tag === 'string')
        .map(tag => tag.trim().toLowerCase())
        .filter(Boolean),
    ),
  )
}
