import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '~/generated/prisma/client'
import pg from 'pg'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL
  if (connectionString == null || connectionString === '') {
    throw new Error('DATABASE_URL is required for PrismaClient')
  }
  const pool = new pg.Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

function getClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }
  const client = createPrismaClient()
  // Always cache on globalThis (including production). The lazy Proxy calls
  // getClient() on every root property access (`prisma.user`, `prisma.x`, …);
  // without caching in production, each access opened a new pg Pool → "too many clients".
  globalForPrisma.prisma = client
  return client
}

/**
 * Lazy singleton so `nuxt build` / Nitro prerender can bundle server code
 * without `DATABASE_URL` until a handler actually touches the client.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getClient()
    const value = Reflect.get(client, prop, receiver) as unknown
    if (typeof value === 'function') {
      return (value as (...args: unknown[]) => unknown).bind(client)
    }
    return value
  },
})
