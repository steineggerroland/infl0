import {
  SRPServerSession,
  SRPServerSessionStep1,
  type SRPServerSessionStep1State,
  SRPParameters,
  SRPRoutines,
} from 'tssrp6a'
import { prisma } from './prisma'

const CHALLENGE_TTL_MS = 120_000

export function getSrpRoutines() {
  return new SRPRoutines(new SRPParameters())
}

export function hexToBigint(hex: string): bigint {
  const h = hex.trim().replace(/^0x/i, '')
  if (!/^[0-9a-fA-F]+$/u.test(h) || h.length === 0) {
    throw new Error('Invalid hex')
  }
  return BigInt(`0x${h}`)
}

export function bigintToHex(n: bigint): string {
  return n.toString(16)
}

async function pruneChallenges() {
  const now = Date.now()
  await prisma.srpChallenge.deleteMany({ where: { expiresAt: { lte: new Date(now) } } })
}

export async function storeSrpChallenge(serializedStep1Json: string): Promise<string> {
  await pruneChallenges()
  const id = crypto.randomUUID()
  await prisma.srpChallenge.create({
    data: {
      id,
      serialized: serializedStep1Json,
      expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
    },
  })
  return id
}

export async function takeSrpChallenge(id: string): Promise<SRPServerSessionStep1State | null> {
  await pruneChallenges()
  const row = await prisma.srpChallenge.findUnique({ where: { id } })
  if (!row) return null
  await prisma.srpChallenge.delete({ where: { id } }).catch(() => null)
  if (row.expiresAt <= new Date()) return null
  try {
    return JSON.parse(row.serialized) as SRPServerSessionStep1State
  } catch {
    return null
  }
}

export async function srpServerStep1(
  identifier: string,
  saltHex: string,
  verifierHex: string,
): Promise<{ step1: SRPServerSessionStep1; BHex: string }> {
  const routines = getSrpRoutines()
  const salt = hexToBigint(saltHex)
  const verifier = hexToBigint(verifierHex)
  const server = new SRPServerSession(routines)
  const step1 = await server.step1(identifier, salt, verifier)
  return { step1, BHex: bigintToHex(step1.B) }
}

export function srpStep1FromState(state: SRPServerSessionStep1State) {
  return SRPServerSessionStep1.fromState(getSrpRoutines(), state)
}
