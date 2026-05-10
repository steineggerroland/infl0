import { beforeEach, describe, expect, it, vi } from 'vitest'
import { recomputeTimelineScoresForUser } from '../../server/utils/recompute-timeline-scores'
import { SOURCE_PREFERENCE_BONUS } from '../../utils/timeline-score-factors'

type Captured = { id: string; rankScore: number }

type PrismaMock = Parameters<typeof recomputeTimelineScoresForUser>[0]

function makePrismaMock(opts: { userPreferenceWeight: number }): {
  prisma: PrismaMock
  captured: Captured[]
} {
  const captured: Captured[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prisma: any = {
    user: {
      findUnique: vi.fn().mockResolvedValue({ timelineScorePrefs: null }),
    },
    userTimelineItem: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: 'item-1',
          insertedAt: new Date('2026-05-09T12:00:00.000Z'),
          article: {
            title: 'Hello',
            crawlKey: 'https://a.com/x.xml',
            publishedAt: new Date('2026-05-09T12:00:00.000Z'),
            fetchedAt: new Date('2026-05-09T12:00:00.000Z'),
            enrichment: { teaser: 't', summaryLong: 's', category: [], tags: [] },
          },
        },
      ]),
      update: vi.fn(({ where, data }: { where: { id: string }; data: { rankScore: number } }) => {
        captured.push({ id: where.id, rankScore: data.rankScore })
        return Promise.resolve()
      }),
    },
    userFeedEngagement: { findMany: vi.fn().mockResolvedValue([]) },
    userCategoryEngagement: { findMany: vi.fn().mockResolvedValue([]) },
    userTagEngagement: { findMany: vi.fn().mockResolvedValue([]) },
    userFeed: {
      findMany: vi.fn().mockResolvedValue([
        { crawlKey: 'https://a.com/x.xml', userPreferenceWeight: opts.userPreferenceWeight },
      ]),
    },
    $transaction: vi.fn(async (calls: Promise<unknown>[]) => {
      await Promise.all(calls)
    }),
  }
  return { prisma: prisma as PrismaMock, captured }
}

describe('recomputeTimelineScoresForUser — SOURCE_PREFERENCE_BONUS integration', () => {
  beforeEach(() => vi.clearAllMocks())

  it('adds the bonus exactly once per article based on the source preference', async () => {
    const neutral = makePrismaMock({ userPreferenceWeight: 0 })
    await recomputeTimelineScoresForUser(neutral.prisma, 'u1')
    expect(neutral.captured).toHaveLength(1)
    const baseScore = neutral.captured[0]!.rankScore

    const plus = makePrismaMock({ userPreferenceWeight: 1 })
    await recomputeTimelineScoresForUser(plus.prisma, 'u1')
    expect(plus.captured[0]!.rankScore).toBeCloseTo(baseScore + SOURCE_PREFERENCE_BONUS, 6)

    const minus = makePrismaMock({ userPreferenceWeight: -1 })
    await recomputeTimelineScoresForUser(minus.prisma, 'u1')
    expect(minus.captured[0]!.rankScore).toBeCloseTo(baseScore - SOURCE_PREFERENCE_BONUS, 6)
  })

  it('intermediate 0.25 steps scale linearly between neutral and ±1', async () => {
    const neutral = makePrismaMock({ userPreferenceWeight: 0 })
    await recomputeTimelineScoresForUser(neutral.prisma, 'u1')
    const baseScore = neutral.captured[0]!.rankScore

    const quarter = makePrismaMock({ userPreferenceWeight: 0.25 })
    await recomputeTimelineScoresForUser(quarter.prisma, 'u1')
    expect(quarter.captured[0]!.rankScore).toBeCloseTo(
      baseScore + 0.25 * SOURCE_PREFERENCE_BONUS,
      6,
    )

    const half = makePrismaMock({ userPreferenceWeight: -0.5 })
    await recomputeTimelineScoresForUser(half.prisma, 'u1')
    expect(half.captured[0]!.rankScore).toBeCloseTo(
      baseScore + -0.5 * SOURCE_PREFERENCE_BONUS,
      6,
    )
  })
})
