import type { PrismaClient } from '../generated/prisma/client'

const TECH_CRAWL_KEY = 'seed:tech-blog-rss.xml'
const NEWS_CRAWL_KEY = 'seed:news-wire-rss.xml'

const FEEDS = [
  { crawlKey: TECH_CRAWL_KEY, title: 'Tech Blog (Seed)' },
  { crawlKey: NEWS_CRAWL_KEY, title: 'News Wire (Seed)' },
]

const ARTICLES: Array<{
  id: string
  crawlKey: string
  title: string
  author: string
  teaser: string
  summaryLong: string
  publishedAt: Date
}> = [
  {
    id: 'seed:tech-ai-safety',
    crawlKey: TECH_CRAWL_KEY,
    title: 'Understanding AI Safety',
    author: 'Alice Chen',
    teaser: 'Key concepts in AI alignment, interpretability, and the principal-agent problem.',
    summaryLong: 'A deep dive into the core challenges of AI safety research, including scalable oversight, reward hacking, and the alignment tax.',
    publishedAt: new Date('2026-05-18T08:00:00.000Z'),
  },
  {
    id: 'seed:tech-wasm',
    crawlKey: TECH_CRAWL_KEY,
    title: 'WebAssembly Beyond the Browser',
    author: 'Bob Martinez',
    teaser: 'How WASM is transforming serverless, plugins, and edge computing.',
    summaryLong: 'WebAssembly is breaking out of the browser. New runtimes like Wasmtime and Wasmer enable portable, sandboxed execution across cloud and edge environments.',
    publishedAt: new Date('2026-05-16T10:30:00.000Z'),
  },
  {
    id: 'seed:tech-rust-ddd',
    crawlKey: TECH_CRAWL_KEY,
    title: 'Domain-Driven Design in Rust',
    author: 'Alice Chen',
    teaser: 'Modelling bounded contexts with Rust enums, traits, and type safety.',
    summaryLong: 'Rust\'s type system makes it an excellent fit for DDD. This article explores how to represent aggregates, value objects, and domain events with compile-time guarantees.',
    publishedAt: new Date('2026-05-14T14:00:00.000Z'),
  },
  {
    id: 'seed:news-climate',
    crawlKey: NEWS_CRAWL_KEY,
    title: 'Global Climate Policy Update',
    author: 'News Desk',
    teaser: 'Latest carbon pricing developments across major economies.',
    summaryLong: 'The EU, US, and China announce new carbon border adjustment mechanisms. Analysts weigh the impact on international trade and emissions targets.',
    publishedAt: new Date('2026-05-17T06:00:00.000Z'),
  },
  {
    id: 'seed:news-space',
    crawlKey: NEWS_CRAWL_KEY,
    title: 'New Lunar Mission Announced',
    author: 'News Desk',
    teaser: 'International collaboration aims for a permanent Moon base by 2032.',
    summaryLong: 'The Artemis Accords signatories have unveiled plans for a modular lunar habitat. The mission leverages Starship and Blue Moon landers for cargo and crew delivery.',
    publishedAt: new Date('2026-05-15T12:00:00.000Z'),
  },
]

export async function seedDevArticles(prisma: PrismaClient, devUsername: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { username: devUsername } })
  if (!user) {
    console.warn(`seed: skip articles — user ${devUsername} not found`)
    return
  }

  for (const feed of FEEDS) {
    const existingFeed = await prisma.userFeed.findFirst({
      where: { userId: user.id, crawlKey: feed.crawlKey },
    })
    if (existingFeed) {
      await prisma.userFeed.update({
        where: { id: existingFeed.id },
        data: { displayTitle: feed.title, active: true },
      })
    } else {
      await prisma.userFeed.create({
        data: {
          userId: user.id,
          feedUrl: feed.crawlKey,
          crawlKey: feed.crawlKey,
          displayTitle: feed.title,
          active: true,
        },
      })
    }
  }

  for (const article of ARTICLES) {
    await prisma.article.upsert({
      where: { id: article.id },
      create: {
        id: article.id,
        crawlKey: article.crawlKey,
        link: `https://example.com/seed/${article.id}`,
        title: article.title,
        author: article.author,
        publishedAt: article.publishedAt,
        sourceType: 'rss',
        tld: 'example.com',
        contentHash: `${article.id}-hash`,
        contentMd: `# ${article.title}\n\n${article.summaryLong}`,
      },
      update: {
        title: article.title,
        sourceType: 'rss',
        fetchedAt: new Date(),
      },
    })

    await prisma.articleEnrichment.upsert({
      where: { articleId: article.id },
      create: {
        articleId: article.id,
        teaser: article.teaser,
        summaryLong: article.summaryLong,
        category: article.crawlKey === TECH_CRAWL_KEY ? ['technology'] : ['news'],
        tags: article.crawlKey === TECH_CRAWL_KEY ? ['seed', 'tech'] : ['seed', 'news'],
        seriousnessRating: 'medium',
      },
      update: {
        teaser: article.teaser,
        summaryLong: article.summaryLong,
        lastUpdated: new Date(),
      },
    })
  }

  const articleIds = ARTICLES.map((a) => a.id)

  await prisma.userTimelineItem.deleteMany({
    where: { userId: user.id, articleId: { in: articleIds } },
  })

  await prisma.userTimelineItem.createMany({
    data: ARTICLES.map((a) => ({
      userId: user.id,
      contentKind: 'article',
      articleId: a.id,
    })),
  })

  console.info(`Seed OK: ${devUsername} articles (3 tech + 2 news, 2 sources)`)
}
