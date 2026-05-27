import { createHash, randomInt, timingSafeEqual } from 'node:crypto'
import { createError } from 'h3'
import { prisma } from './prisma'
import { sendTransactionalEmail } from './transactional-email'

export const RECOVERY_EMAIL_VERIFY_PURPOSE = 'verify_recovery'
export const PASSWORD_RESET_PURPOSE = 'reset_password'
const MAX_ATTEMPTS = 5

export type EmailOtpPurpose =
  | typeof RECOVERY_EMAIL_VERIFY_PURPOSE
  | typeof PASSWORD_RESET_PURPOSE

function ttlMs(): number {
  const seconds = Number(process.env.NUXT_EMAIL_OTP_TTL_SECONDS || 600)
  return Math.max(60, Math.min(3600, Number.isFinite(seconds) ? seconds : 600)) * 1000
}

function cooldownMs(): number {
  const seconds = Number(process.env.NUXT_EMAIL_OTP_RESEND_COOLDOWN_SECONDS || 60)
  return Math.max(10, Math.min(600, Number.isFinite(seconds) ? seconds : 60)) * 1000
}

function secret(): string {
  const value = process.env.AUTH_JWT_SECRET
  if (!value || value.length < 16) {
    throw createError({
      statusCode: 503,
      statusMessage: 'AUTH_JWT_SECRET is missing or too short (min 16 characters)',
    })
  }
  return value
}

export function generateOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

export function hashOtpCode(email: string, purpose: EmailOtpPurpose, code: string): string {
  return createHash('sha256')
    .update(`${secret()}:${purpose}:${email}:${code}`)
    .digest('hex')
}

function matchesHash(left: string, right: string): boolean {
  const a = Buffer.from(left, 'hex')
  const b = Buffer.from(right, 'hex')
  return a.length === b.length && timingSafeEqual(a, b)
}

async function assertCooldown(email: string, purpose: EmailOtpPurpose) {
  const latest = await prisma.emailOtp.findFirst({
    where: { email, purpose },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  })
  if (latest && latest.createdAt.getTime() > Date.now() - cooldownMs()) {
    throw createError({ statusCode: 429, statusMessage: 'Please wait before requesting another code' })
  }
}

function messageFor(purpose: EmailOtpPurpose, code: string): { subject: string; text: string } {
  if (purpose === RECOVERY_EMAIL_VERIFY_PURPOSE) {
    return {
      subject: 'Verify your infl0 recovery email',
      text: `Your infl0 recovery email verification code is: ${code}\n\nEnter this code in infl0 Settings to verify your recovery email. It expires soon.`,
    }
  }
  return {
    subject: 'Reset your infl0 password',
    text: `Your infl0 password recovery code is: ${code}\n\nEnter this code in infl0 to set a new password. It expires soon.`,
  }
}

export async function requestEmailOtp(opts: {
  userId?: string | null
  email: string
  purpose: EmailOtpPurpose
}): Promise<void> {
  await assertCooldown(opts.email, opts.purpose)
  const code = generateOtpCode()
  const { subject, text } = messageFor(opts.purpose, code)
  await prisma.emailOtp.create({
    data: {
      userId: opts.userId ?? null,
      email: opts.email,
      purpose: opts.purpose,
      codeHash: hashOtpCode(opts.email, opts.purpose, code),
      expiresAt: new Date(Date.now() + ttlMs()),
    },
  })
  try {
    await sendTransactionalEmail({ to: opts.email, subject, text })
  } catch (error) {
    await prisma.emailOtp.deleteMany({
      where: {
        email: opts.email,
        purpose: opts.purpose,
        consumedAt: null,
        codeHash: hashOtpCode(opts.email, opts.purpose, code),
      },
    })
    throw error
  }
}

export async function consumeEmailOtp(opts: {
  userId?: string | null
  email: string
  purpose: EmailOtpPurpose
  code: string
}): Promise<void> {
  const row = await prisma.emailOtp.findFirst({
    where: {
      email: opts.email,
      purpose: opts.purpose,
      userId: opts.userId ?? undefined,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })
  if (!row) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid or expired code' })
  }
  if (row.attemptCount >= MAX_ATTEMPTS) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid or expired code' })
  }

  const expected = hashOtpCode(opts.email, opts.purpose, opts.code.trim())
  if (!matchesHash(row.codeHash, expected)) {
    await prisma.emailOtp.update({
      where: { id: row.id },
      data: { attemptCount: { increment: 1 } },
    })
    throw createError({ statusCode: 400, statusMessage: 'Invalid or expired code' })
  }

  await prisma.emailOtp.update({
    where: { id: row.id },
    data: { consumedAt: new Date() },
  })
}
