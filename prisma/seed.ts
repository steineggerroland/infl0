import { createScriptPrismaClient } from './prisma-client'

const prisma = createScriptPrismaClient()

async function upsertSrpUser(opts: {
  email: string
  name: string
  saltEnv: string
  verifierEnv: string
  label: string
}) {
  const salt = process.env[opts.saltEnv]?.trim()
  const verifier = process.env[opts.verifierEnv]?.trim()

  if (!salt || !verifier) {
    console.warn(
      `${opts.saltEnv} / ${opts.verifierEnv} missing — SRP login will not work for ${opts.email} until set.`,
    )
    console.warn('Generate locally: SRP_GEN_PASSWORD=… npx tsx scripts/generate-srp-env.ts [email]')
  }

  await prisma.user.upsert({
    where: { email: opts.email },
    create: {
      email: opts.email,
      name: opts.name,
      srpSalt: salt ?? null,
      srpVerifier: verifier ?? null,
      passwordHash: null,
    },
    update: {
      name: opts.name,
      ...(salt && verifier ? { srpSalt: salt, srpVerifier: verifier, passwordHash: null } : {}),
    },
  })

  console.info(`Seed OK: ${opts.label} ${opts.email}${salt && verifier ? ' (SRP credentials)' : ''}`)
}

async function main() {
  const betaEmail = (process.env.BETA_SEED_EMAIL ?? 'beta@localhost').toLowerCase()
  const betaName = process.env.BETA_SEED_NAME ?? 'Beta'

  await upsertSrpUser({
    email: betaEmail,
    name: betaName,
    saltEnv: 'BETA_SRP_SALT_HEX',
    verifierEnv: 'BETA_SRP_VERIFIER_HEX',
    label: 'beta user',
  })

  const devEmail = (process.env.DEV_SEED_EMAIL ?? 'dev@localhost').toLowerCase()
  const devName = process.env.DEV_SEED_NAME ?? 'Dev'

  await upsertSrpUser({
    email: devEmail,
    name: devName,
    saltEnv: 'DEV_SRP_SALT_HEX',
    verifierEnv: 'DEV_SRP_VERIFIER_HEX',
    label: 'dev user',
  })
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
