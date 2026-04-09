import {
  SRPServerSession,
  SRPServerSessionStep1,
  type SRPServerSessionStep1State,
  SRPParameters,
  SRPRoutines,
} from 'tssrp6a'

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

type ChallengeEntry = { serialized: string; expiresAt: number }

function challengeMap(): Map<string, ChallengeEntry> {
  const g = globalThis as unknown as { __infl0SrpChallenges?: Map<string, ChallengeEntry> }
  if (!g.__infl0SrpChallenges) {
    g.__infl0SrpChallenges = new Map()
  }
  return g.__infl0SrpChallenges
}

function pruneChallenges() {
  const m = challengeMap()
  const now = Date.now()
  for (const [k, v] of m) {
    if (v.expiresAt <= now) m.delete(k)
  }
}

export function storeSrpChallenge(serializedStep1Json: string): string {
  pruneChallenges()
  const id = crypto.randomUUID()
  challengeMap().set(id, {
    serialized: serializedStep1Json,
    expiresAt: Date.now() + CHALLENGE_TTL_MS,
  })
  return id
}

export function takeSrpChallenge(id: string): SRPServerSessionStep1State | null {
  pruneChallenges()
  const m = challengeMap()
  const row = m.get(id)
  m.delete(id)
  if (!row || row.expiresAt <= Date.now()) return null
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
