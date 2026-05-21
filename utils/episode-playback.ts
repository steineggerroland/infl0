/** Whether a media URL is likely playable as audio in the browser. */
export function isLikelyPlayableAudioUrl(url: string | undefined, mediaType?: string): boolean {
  if (!url?.trim()) return false
  const type = mediaType?.trim().toLowerCase()
  if (type?.startsWith('audio/')) return true
  try {
    const path = new URL(url).pathname.toLowerCase()
    return /\.(mp3|m4a|aac|ogg|wav|opus|flac)(\?|$)/i.test(path)
  } catch {
    return /\.(mp3|m4a|aac|ogg|wav|opus|flac)(\?|$)/i.test(url.toLowerCase())
  }
}

export function formatChapterTimestamp(seconds: number): string {
  const total = Math.max(0, Math.trunc(seconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Prefer chapter deep link; fall back to episode page. */
export function chapterJumpHref(
  chapter: { start_seconds: number; url?: string },
  episodeLink: string,
  mediaUrl?: string,
): string {
  if (chapter.url?.trim()) return chapter.url.trim()
  if (mediaUrl?.trim()) {
    try {
      const u = new URL(mediaUrl)
      u.hash = `t=${chapter.start_seconds}`
      return u.toString()
    } catch {
      return mediaUrl
    }
  }
  return episodeLink
}
