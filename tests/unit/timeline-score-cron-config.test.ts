import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const root = new URL('../..', import.meta.url)

function readRepoFile(path: string) {
  return readFileSync(new URL(path, root), 'utf8')
}

describe('timeline score cron configuration', () => {
  it('uses the shared crawler API key instead of a separate runtime secret', () => {
    const nuxtConfig = readRepoFile('nuxt.config.ts')
    const envExample = readRepoFile('.env.example')
    const deployWorkflow = readRepoFile('.github/workflows/deploy-vercel.yml')
    const deployDocs = readRepoFile('docs/DEPLOYING.md')
    const cronRoute = readRepoFile('server/api/cron/recompute-timeline-scores.post.ts')

    expect(cronRoute).toContain('requireCrawlerAuth')
    expect(nuxtConfig).toContain('crawlerApiKey')
    expect(envExample).toContain('NUXT_CRAWLER_API_KEY=')
    expect(deployDocs).toContain('/api/cron/recompute-timeline-scores')
    expect(deployWorkflow).toContain(
      'NUXT_CRAWLER_API_KEY: ${{ secrets.NUXT_CRAWLER_API_KEY }}',
    )
    expect(deployWorkflow).toContain(
      '--env "NUXT_CRAWLER_API_KEY=$NUXT_CRAWLER_API_KEY"',
    )
    expect(nuxtConfig).not.toContain('timelineScoreCronSecret')
    expect(envExample).not.toContain('NUXT_TIMELINE_SCORE_CRON_SECRET')
    expect(deployWorkflow).not.toContain('NUXT_TIMELINE_SCORE_CRON_SECRET')
    expect(deployDocs).not.toContain('NUXT_TIMELINE_SCORE_CRON_SECRET')
  })
})
