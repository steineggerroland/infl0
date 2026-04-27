/**
 * Local seed data: user, feeds, articles, and timeline rows.
 *
 * Requires DATABASE_URL and a migrated schema (`npm run db:migrate` or db push).
 *
 * Browser login (dev@localhost):
 *   If `DEV_SRP_SALT_HEX` / `DEV_SRP_VERIFIER_HEX` are set (e.g. from `.env.e2e`),
 *   the password is whatever you generated for that pair.
 *   Otherwise the built-in pair below is used with password **dev** (local default).
 *
 * Run (Node version from .nvmrc):
 *   nvm use && npm run devData
 *
 * Refuses to run in production unless ALLOW_DEV_DATA=1 (not recommended).
 */
import { createHash } from 'node:crypto'
import { normalizeFeedUrl } from '../server/utils/feed-url.js'
import { createScriptPrismaClient } from '../prisma/prisma-client'

const prisma = createScriptPrismaClient()

const DEV_EMAIL = 'dev@localhost'
const DEV_NAME = 'Dev User'

/** Default SRP for dev@localhost / password `dev` (no env): tssrp6a createVerifierAndSalt. */
const DEFAULT_DEV_SRP_SALT_HEX =
  '969225e771337ef56f3e9b0f8f2e6ca8be00f7eb96ff8ce37d5ee460ccb5a2461ee2ca6e959117284023ea879d3bce06bd4cbc4c3723fb85d9834af79d4ccf10500ec56281e23d1d1a4a3f4a76aaa3f3e663ef3c0cee9673df7622f1e25f9620e032b9534c763f5d34aaf1574b10a0f8abf963ba32c65e421cfc5344340b2952'
const DEFAULT_DEV_SRP_VERIFIER_HEX =
  '6565949588e347421f091bd82fa8f0139615ac964e6b63bec31317226cc185910a3540e94e56d2a74ad2fde775daaa9ef6e610ff5fd46940358125a28429ea1879b22fdf18651ca407252a20b669bcb187d91833d15546d9325aba014d2a73c513d1f28e862b8e2e50ecf24f9e091d4e2a5cfc97c0b058dce0738a4bfe5acc06f29f171efd49f17e55515642b4a2ff17e25c5e4773954fb8164494959308d2d5759103229dbf1062b79e73265ef986a3866dbf0f767aa4b19031e3c2a3288c1f547a730d847d5d8e5915a26a8f94d87a940abb13c123b13c35871a81fedaf6c4b18975a0013fd7fd2c903e27deeabd9204501a580b200702deaa3bd64d4c8ddc'

function devSrpSaltFromEnv(): string {
  return (process.env.DEV_SRP_SALT_HEX?.trim() || DEFAULT_DEV_SRP_SALT_HEX).trim()
}

function devSrpVerifierFromEnv(): string {
  return (process.env.DEV_SRP_VERIFIER_HEX?.trim() || DEFAULT_DEV_SRP_VERIFIER_HEX).trim()
}

const FEED_SPECS = [
  { feedUrl: 'https://example.com/dev-feed/tech', displayTitle: 'Dev: Tech (sample)' },
  { feedUrl: 'https://example.com/dev-feed/world', displayTitle: 'Dev: World (sample)' },
] as const

function crawlKeyFor(url: string): string {
  return normalizeFeedUrl(url)
}

const ARTICLE_SPECS = [
  {
    slug: 'devdata-01',
    crawlKeyIndex: 0,
    title: 'Welcome to local infl0',
    link: 'https://example.com/articles/welcome-local',
    author: 'Dev Author',
    teaser: 'Short teaser for the front of the card.',
    summaryLong:
      'This is the **long summary** on the back. It can span several sentences and later include Markdown from the API.',
    category: ['local', 'demo'] as string[],
    tags: ['dev', 'nuxt'] as string[],
    md: `# Welcome

This is **test Markdown** in the full body (\`content_md\`).

- First bullet
- Second bullet

[Example link](https://example.com)
`,
  },
  {
    slug: 'devdata-02',
    crawlKeyIndex: 0,
    title: 'Second demo article (same feed)',
    link: 'https://example.com/articles/second',
    author: 'Dev Author',
    teaser: 'Another teaser from the same feed.',
    summaryLong: 'Shows multiple items per source and ordering by *publishedAt*.',
    category: ['demo'] as string[],
    tags: ['rss'] as string[],
    md: 'Simple **Markdown** body for modal testing.',
  },
  {
    slug: 'devdata-03',
    crawlKeyIndex: 1,
    title: 'Article from the second dev source',
    link: 'https://example.com/world/third',
    author: 'A. N. Other',
    teaser: 'Teaser for feed "World".',
    summaryLong: 'So two **sources** show up in the source list and on the timeline.',
    category: ['world'] as string[],
    tags: ['sample'] as string[],
    md: '## Section\n\nText with *italics*.',
  },
] as const

function contentHashFor(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_DATA !== '1') {
    console.error(
      'devData: refused in NODE_ENV=production (set ALLOW_DEV_DATA=1 only if you are sure).',
    )
    process.exit(1)
  }

  const feedKeys = FEED_SPECS.map((f) => crawlKeyFor(f.feedUrl))

  const srpSalt = devSrpSaltFromEnv()
  const srpVerifier = devSrpVerifierFromEnv()

  const user = await prisma.user.upsert({
    where: { email: DEV_EMAIL },
    create: {
      email: DEV_EMAIL,
      name: DEV_NAME,
      srpSalt,
      srpVerifier,
      passwordHash: null,
    },
    update: {
      name: DEV_NAME,
      srpSalt,
      srpVerifier,
      passwordHash: null,
    },
  })

  const devIds = ARTICLE_SPECS.map((a) => a.slug)

  await prisma.userTimelineItem.deleteMany({
    where: { userId: user.id, articleId: { in: devIds } },
  })
  await prisma.articleEnrichment.deleteMany({
    where: { articleId: { in: devIds } },
  })
  await prisma.article.deleteMany({
    where: { id: { in: devIds } },
  })
  await prisma.userFeed.deleteMany({
    where: { userId: user.id, crawlKey: { in: feedKeys } },
  })

  await prisma.userFeed.createMany({
    data: FEED_SPECS.map((f) => ({
      userId: user.id,
      feedUrl: f.feedUrl,
      crawlKey: crawlKeyFor(f.feedUrl),
      displayTitle: f.displayTitle,
      active: true,
    })),
  })

  const now = new Date()
  for (let i = 0; i < ARTICLE_SPECS.length; i++) {
    const spec = ARTICLE_SPECS[i]!
    const crawlKey = feedKeys[spec.crawlKeyIndex]!
    const publishedAt = new Date(now.getTime() - (ARTICLE_SPECS.length - i) * 86_400_000)
    const hash = contentHashFor(spec.md)

    await prisma.article.create({
      data: {
        id: spec.slug,
        crawlKey,
        link: spec.link,
        title: spec.title,
        author: spec.author,
        publishedAt,
        contentHash: hash,
        contentMd: spec.md,
        sourceType: 'rss',
        tld: 'example.com',
        categories: spec.category,
        enrichment: {
          create: {
            teaser: spec.teaser,
            summaryLong: spec.summaryLong,
            category: spec.category,
            tags: spec.tags,
            seriousnessRating: 'low',
          },
        },
      },
    })

    await prisma.userTimelineItem.create({
      data: {
        userId: user.id,
        articleId: spec.slug,
      },
    })
  }

  console.info('devData OK')
  const usingEnvSrp = Boolean(
    process.env.DEV_SRP_SALT_HEX?.trim() && process.env.DEV_SRP_VERIFIER_HEX?.trim(),
  )
  console.info(
    `  ${DEV_EMAIL} — SRP: ${usingEnvSrp ? 'from DEV_SRP_* (match your password, e.g. E2E_LOGIN_PASSWORD)' : 'built-in / password: dev'}`,
  )
  console.info(`  Feeds: ${FEED_SPECS.length}, articles: ${ARTICLE_SPECS.length}`)
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
