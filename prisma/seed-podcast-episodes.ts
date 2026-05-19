import type { PrismaClient } from '../generated/prisma/client'
import {
  PODCAST_SEED_CRAWL_KEY,
  PODCAST_SEED_EPISODE_MINIMAL_ID,
  PODCAST_SEED_EPISODE_RICH_ID,
} from '../utils/episode-seed'

const published = new Date('2026-05-10T08:00:00.000Z')

export async function seedDevPodcastEpisodes(prisma: PrismaClient, devEmail: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email: devEmail } })
  if (!user) {
    console.warn(`seed: skip podcast episodes — user ${devEmail} not found`)
    return
  }

  const existingFeed = await prisma.userFeed.findFirst({
    where: { userId: user.id, crawlKey: PODCAST_SEED_CRAWL_KEY },
  })
  if (existingFeed) {
    await prisma.userFeed.update({
      where: { id: existingFeed.id },
      data: { displayTitle: 'Demo-Podcast (Seed)', active: true },
    })
  } else {
    await prisma.userFeed.create({
      data: {
        userId: user.id,
        feedUrl: PODCAST_SEED_CRAWL_KEY,
        crawlKey: PODCAST_SEED_CRAWL_KEY,
        displayTitle: 'Demo-Podcast (Seed)',
        active: true,
      },
    })
  }

  await prisma.episode.upsert({
    where: { id: PODCAST_SEED_EPISODE_RICH_ID },
    create: {
      id: PODCAST_SEED_EPISODE_RICH_ID,
      crawlKey: PODCAST_SEED_CRAWL_KEY,
      link: 'https://example.com/seed/podcast/rich-episode',
      title: 'Seed · Rich episode (all fields)',
      author: 'Demo Hosts',
      publishedAt: published,
      updatedAt: published,
      sourceType: 'rss+podcast',
      tld: 'example.com',
      contentMd:
        '# Rich seed episode\n\nFull **content_md** for the details tab — episode description from the feed.',
      shownotesMd:
        '## Shownotes (seed)\n\n- [DDD article](https://example.com/ddd)\n- Mentioned tool: Example Tool',
      transcriptMd: 'Welcome to the rich seed episode.\n\nWe discuss bounded contexts and team boundaries.',
      transcriptUrl: 'https://example.com/seed/podcast/rich-episode.txt',
      transcriptType: 'text/plain',
      mediaUrl: 'https://cdn.example.com/seed/podcast/rich-episode.mp3',
      mediaType: 'audio/mpeg',
      mediaLengthBytes: 42_133_776,
      durationSeconds: 3723,
      episodeNumber: 42,
      seasonNumber: 3,
      episodeType: 'full',
      explicit: true,
      subtitle: 'A rich fixture for local UI development',
      imageUrl: 'https://example.com/seed/podcast/rich-cover.jpg',
      chapters: [
        { start_seconds: 0, title: 'Intro' },
        { start_seconds: 312, title: 'Finding context boundaries' },
        { start_seconds: 1810, title: 'Integration trade-offs' },
      ],
    },
    update: {
      crawlKey: PODCAST_SEED_CRAWL_KEY,
      title: 'Seed · Rich episode (all fields)',
      explicit: true,
      durationSeconds: 3723,
      fetchedAt: new Date(),
    },
  })

  await prisma.episodeEnrichment.upsert({
    where: { episodeId: PODCAST_SEED_EPISODE_RICH_ID },
    create: {
      episodeId: PODCAST_SEED_EPISODE_RICH_ID,
      teaser: 'Rich seed: cover, chapters, shownotes, transcript, explicit flag, and play links.',
      summaryLong:
        'This seeded episode exercises every podcast field infl0 supports: metadata card, collapsible chapters and shownotes, browser playback, and content/transcript tabs in Details.',
      category: ['expert opinions', 'debates and discussions'],
      tags: ['domain-driven design', 'seed'],
      seriousnessRating: 'medium',
    },
    update: {
      teaser: 'Rich seed: cover, chapters, shownotes, transcript, explicit flag, and play links.',
      summaryLong:
        'This seeded episode exercises every podcast field infl0 supports: metadata card, collapsible chapters and shownotes, browser playback, and content/transcript tabs in Details.',
      lastUpdated: new Date(),
    },
  })

  await prisma.episode.upsert({
    where: { id: PODCAST_SEED_EPISODE_MINIMAL_ID },
    create: {
      id: PODCAST_SEED_EPISODE_MINIMAL_ID,
      crawlKey: PODCAST_SEED_CRAWL_KEY,
      link: 'https://example.com/seed/podcast/minimal-episode',
      title: 'Seed · Minimal episode',
      publishedAt: published,
      sourceType: 'rss+podcast',
      tld: 'example.com',
      mediaUrl: 'https://cdn.example.com/seed/podcast/minimal.mp3',
      durationSeconds: 480,
    },
    update: {
      crawlKey: PODCAST_SEED_CRAWL_KEY,
      title: 'Seed · Minimal episode',
      mediaUrl: 'https://cdn.example.com/seed/podcast/minimal.mp3',
      durationSeconds: 480,
      fetchedAt: new Date(),
    },
  })

  await prisma.episodeEnrichment.upsert({
    where: { episodeId: PODCAST_SEED_EPISODE_MINIMAL_ID },
    create: {
      episodeId: PODCAST_SEED_EPISODE_MINIMAL_ID,
      teaser: 'Minimal seed: title, date, short teaser, and .mp3 without media_type.',
      summaryLong: 'Sparse episode row to verify empty states and optional UI blocks stay calm.',
    },
    update: {
      teaser: 'Minimal seed: title, date, short teaser, and .mp3 without media_type.',
      summaryLong: 'Sparse episode row to verify empty states and optional UI blocks stay calm.',
      lastUpdated: new Date(),
    },
  })

  await prisma.userTimelineItem.deleteMany({
    where: {
      userId: user.id,
      episodeId: { in: [PODCAST_SEED_EPISODE_RICH_ID, PODCAST_SEED_EPISODE_MINIMAL_ID] },
    },
  })

  await prisma.userTimelineItem.createMany({
    data: [
      { userId: user.id, contentKind: 'episode', episodeId: PODCAST_SEED_EPISODE_RICH_ID },
      { userId: user.id, contentKind: 'episode', episodeId: PODCAST_SEED_EPISODE_MINIMAL_ID },
    ],
  })

  console.info('Seed OK: dev@localhost podcast episodes (rich + minimal) on Demo-Podcast feed')
}
