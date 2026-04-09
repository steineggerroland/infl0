import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = (process.env.BETA_SEED_EMAIL ?? 'beta@localhost').toLowerCase()
  const name = process.env.BETA_SEED_NAME ?? 'Beta'
  const plain = process.env.BETA_INITIAL_PASSWORD

  if (!plain) {
    console.warn(
      'BETA_INITIAL_PASSWORD is not set — user is created/updated without a password (login will not work until you set passwordHash).',
    )
  }

  const passwordHash = plain ? await bcrypt.hash(plain, 12) : null

  await prisma.user.upsert({
    where: { email },
    create: { email, name, passwordHash },
    update: {
      name,
      ...(passwordHash ? { passwordHash } : {}),
    },
  })

  console.info(`Seed OK: user ${email}${plain ? ' (password from BETA_INITIAL_PASSWORD)' : ''}`)
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
