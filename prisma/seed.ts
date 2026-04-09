import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.BETA_SEED_EMAIL ?? 'beta@localhost'
  const name = process.env.BETA_SEED_NAME ?? 'Beta'

  await prisma.user.upsert({
    where: { email },
    create: { email, name },
    update: { name },
  })

  console.info(`Seed OK: user ${email}`)
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
