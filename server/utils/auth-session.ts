import { SignJWT, jwtVerify } from 'jose'
import { createError, deleteCookie, getCookie, setCookie, type H3Event } from 'h3'

const COOKIE = 'infl0_auth'
const MAX_AGE_SEC = 60 * 60 * 24 * 7 // 7 days

function getSecretBytes(): Uint8Array | null {
  const s = process.env.AUTH_JWT_SECRET
  if (!s || s.length < 16) return null
  return new TextEncoder().encode(s)
}

export async function createSessionToken(userId: string): Promise<string> {
  const secret = getSecretBytes()
  if (!secret) {
    throw createError({
      statusCode: 503,
      statusMessage: 'AUTH_JWT_SECRET is missing or too short (min 16 characters)',
    })
  }
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SEC}s`)
    .sign(secret)
}

export async function getSessionUserId(event: H3Event): Promise<string | null> {
  const token = getCookie(event, COOKIE)
  if (!token) return null
  const secret = getSecretBytes()
  if (!secret) return null
  try {
    const { payload } = await jwtVerify(token, secret)
    const sub = payload.sub
    return typeof sub === 'string' ? sub : null
  } catch {
    return null
  }
}

export function setAuthCookie(event: H3Event, token: string) {
  setCookie(event, COOKIE, token, {
    httpOnly: true,
    path: '/',
    maxAge: MAX_AGE_SEC,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  })
}

export function clearAuthCookie(event: H3Event) {
  deleteCookie(event, COOKIE, { path: '/' })
}
