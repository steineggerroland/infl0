import { TKC_SOURCE_HEALTH_STATUSES } from '../utils/source-health-display'
import { seedSourceStatusFeedUrl } from '../utils/source-status-seed-urls'
import { createScriptPrismaClient } from './prisma-client'
import { seedDevPodcastEpisodes } from './seed-podcast-episodes'

const prisma = createScriptPrismaClient()

async function upsertSrpUser(opts: {
  username: string
  recoveryEmail?: string | null
  name: string
  saltEnv: string
  verifierEnv: string
  label: string
}) {
  const salt = process.env[opts.saltEnv]?.trim()
  const verifier = process.env[opts.verifierEnv]?.trim()

  if (!salt || !verifier) {
    console.warn(
      `${opts.saltEnv} / ${opts.verifierEnv} missing — SRP login will not work for ${opts.username} until set.`,
    )
    console.warn(
      `Generate locally: SRP_GEN_PASSWORD=… npx tsx scripts/generate-srp-env.ts ${opts.username}`,
    )
  }

  await prisma.user.upsert({
    where: { username: opts.username },
    create: {
      username: opts.username,
      email: opts.recoveryEmail ?? null,
      name: opts.name,
      srpSalt: salt ?? null,
      srpVerifier: verifier ?? null,
      passwordHash: null,
    },
    update: {
      name: opts.name,
      email: opts.recoveryEmail ?? null,
      ...(salt && verifier ? { srpSalt: salt, srpVerifier: verifier, passwordHash: null } : {}),
    },
  })

  console.info(
    `Seed OK: ${opts.label} ${opts.username}${salt && verifier ? ' (SRP credentials)' : ''}`,
  )
}

/**
 * `dev`: one subscribed feed per TKC `sourceHealthStatus`, plus matching
 * `source_statuses` rows so /feeds shows each health badge (local dev only).
 */
async function seedDevSourceStatusMatrix(devUsername: string) {
  const user = await prisma.user.findUnique({ where: { username: devUsername } })
  if (!user) {
    console.warn(`seed: skip TKC feed matrix — user ${devUsername} not found`)
    return
  }

  const keys = TKC_SOURCE_HEALTH_STATUSES.map((h) => seedSourceStatusFeedUrl(h))

  await prisma.userFeed.deleteMany({
    where: { userId: user.id, crawlKey: { in: keys } },
  })
  await prisma.sourceStatus.deleteMany({
    where: { crawlKey: { in: keys } },
  })

  const friendlyTitle: Record<(typeof TKC_SOURCE_HEALTH_STATUSES)[number], string> = {
    pending: 'Beispielquelle · wartet auf ersten Abruf',
    needs_setup: 'Beispielquelle · braucht Einrichtung',
    healthy: 'Beispielquelle · läuft sauber',
    quiet: 'Beispielquelle · gerade ruhig',
    degraded: 'Beispielquelle · mit kleinen Problemen',
    failing: 'Beispielquelle · funktioniert nicht',
    blocked: 'Beispielquelle · vom Anbieter blockiert',
    paused: 'Beispielquelle · pausiert',
  }

  await prisma.userFeed.createMany({
    data: TKC_SOURCE_HEALTH_STATUSES.map((health) => ({
      userId: user.id,
      feedUrl: seedSourceStatusFeedUrl(health),
      crawlKey: seedSourceStatusFeedUrl(health),
      displayTitle: friendlyTitle[health],
      active: health !== 'paused',
    })),
  })

  for (const health of TKC_SOURCE_HEALTH_STATUSES) {
    const crawlKey = seedSourceStatusFeedUrl(health)
    await prisma.sourceStatus.upsert({
      where: { crawlKey },
      create: {
        crawlKey,
        sourceStatus: 'ready',
        sourceHealthStatus: health,
        sourceHealthReason: null,
        lastCrawlStatus: 'success',
      },
      update: {
        sourceStatus: 'ready',
        sourceHealthStatus: health,
        sourceHealthReason: null,
        lastCrawlStatus: 'success',
      },
    })
  }

  console.info(
    `Seed OK: ${devUsername} feed list + source_status (${TKC_SOURCE_HEALTH_STATUSES.length} TKC variants at example.com/seed/source-status/…)`,
  )
}

async function main() {
  const devUsername = (process.env.DEV_SEED_USERNAME ?? 'dev').toLowerCase()
  const devName = process.env.DEV_SEED_NAME ?? 'Dev'

  await upsertSrpUser({
    username: devUsername,
    name: devName,
    saltEnv: 'DEV_SRP_SALT_HEX',
    verifierEnv: 'DEV_SRP_VERIFIER_HEX',
    label: 'dev user',
  })

  const operatorUsername = (process.env.OPERATOR_SEED_USERNAME ?? 'operator').toLowerCase()
  const operatorName = process.env.OPERATOR_SEED_NAME ?? 'Operator'
  await upsertSrpUser({
    username: operatorUsername,
    name: operatorName,
    saltEnv: 'OPERATOR_SRP_SALT_HEX',
    verifierEnv: 'OPERATOR_SRP_VERIFIER_HEX',
    label: 'operator user',
  })

  await seedDevSourceStatusMatrix(devUsername)
  await seedDevPodcastEpisodes(prisma, devUsername)
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
