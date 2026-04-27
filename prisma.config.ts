import 'dotenv/config'
import { defineConfig } from 'prisma/config'

/**
 * Prisma ORM 7: datasource URL for CLI (migrate, generate metadata).
 * A placeholder is enough for `prisma generate` when no DB is available (CI).
 */
const url =
  process.env.DATABASE_URL?.trim() ||
  'postgresql://postgres:postgres@127.0.0.1:5432/postgres?schema=public'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url,
  },
})
