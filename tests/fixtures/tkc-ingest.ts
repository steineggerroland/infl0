/**
 * TKC crawler ingest contract fixtures (`article.json`, `episode.json`, `section.json`).
 *
 * These files are **manual copies** of TopicKnowledgeCrawler
 * `docs/examples/ingest/*.json` — not synced automatically. After TKC changes the
 * examples, refresh the copies here and adjust ingest/tests if the contract moved.
 *
 * @see https://github.com/steineggerroland/TopicKnowledgeCrawler/blob/main/docs/examples/ingest/README.md
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

export type TkcIngestExample = Record<string, unknown>

function loadExample(name: 'article' | 'episode' | 'section'): TkcIngestExample {
  const path = fileURLToPath(new URL(`./tkc-ingest/${name}.json`, import.meta.url))
  return JSON.parse(readFileSync(path, 'utf8')) as TkcIngestExample
}

export function tkcArticleExample(): TkcIngestExample {
  return loadExample('article')
}

export function tkcEpisodeExample(): TkcIngestExample {
  return loadExample('episode')
}

export function tkcSectionExample(): TkcIngestExample {
  return loadExample('section')
}
