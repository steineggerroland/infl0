function safeSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function buildKnowledgeInboxArticlePayload(crawlKey, suffix, title, options = {}) {
  const id = `bdd-kb-${safeSlug(title)}-${suffix}`
  const defaultContent = `# ${title}\n\nBody for ${title}.`
  return {
    crawlKey,
    id,
    item_kind: 'article',
    title,
    link: `https://example.com/bdd/kb/${suffix}/${id}`,
    publishedAt: options.publishedAt || new Date().toISOString(),
    content_hash: `${id}-hash`,
    content_md: options.contentMd ?? defaultContent,
    source_type: 'rss',
    tld: 'example.com',
    teaser: options.teaser || `${title} teaser for the knowledge inbox.`,
    seriousness_rating: 'low',
  }
}

export function buildKnowledgeInboxEpisodePayload(crawlKey, suffix, title, options = {}) {
  const id = `bdd-kb-ep-${safeSlug(title)}-${suffix}`
  const defaultContent = `# ${title}\n\nBody for ${title}.`
  return {
    crawlKey,
    id,
    item_kind: 'episode',
    title,
    link: `https://example.com/bdd/kb/${suffix}/${id}`,
    publishedAt: options.publishedAt || new Date().toISOString(),
    content_hash: `${id}-hash`,
    content_md: options.contentMd ?? defaultContent,
    source_type: 'podcast',
    tld: 'example.com',
    teaser: options.teaser || `${title} teaser for the knowledge inbox.`,
    seriousness_rating: 'low',
    duration_seconds: options.durationSeconds ?? 1800,
    shownotes_md: options.shownotesMd,
    transcript_md: options.transcriptMd,
    transcript_url: options.transcriptUrl,
    transcript_type: options.transcriptType,
    chapters: options.chapters,
  }
}
