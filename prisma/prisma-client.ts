import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'
import pg from 'pg'

/** Prisma 7 + pg adapter for CLI scripts and seed (outside Nitro). */
export function createScriptPrismaClient() {
  const connectionString = process.env.DATABASE_URL
  if (connectionString == null || connectionString === '') {
    throw new Error('DATABASE_URL is required')
  }
  const pool = new pg.Pool({ connectionString })
  return new PrismaClient({
    adapter: new PrismaPg(pool),
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}
