import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = (process.env.BETA_SEED_EMAIL ?? 'beta@localhost').toLowerCase()
  const name = process.env.BETA_SEED_NAME ?? 'Beta'
  const srpSalt = process.env.BETA_SRP_SALT_HEX?.trim()
  const srpVerifier = process.env.BETA_SRP_VERIFIER_HEX?.trim()

  if (!srpSalt || !srpVerifier) {
    console.warn(
      'BETA_SRP_SALT_HEX / BETA_SRP_VERIFIER_HEX missing — SRP login will not work until set.',
    )
    console.warn('Generate locally: SRP_GEN_PASSWORD=… npx tsx scripts/generate-srp-env.ts')
  }

  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name,
      srpSalt: srpSalt ?? null,
      srpVerifier: srpVerifier ?? null,
      passwordHash: null,
    },
    update: {
      name,
      ...(srpSalt && srpVerifier
        ? { srpSalt, srpVerifier, passwordHash: null }
        : {}),
    },
  })

  console.info(`Seed OK: user ${email}${srpSalt && srpVerifier ? ' (SRP credentials)' : ''}`)
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
