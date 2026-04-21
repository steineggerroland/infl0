import { mkdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { test as setup } from '@playwright/test'
import { SRPClientSession, SRPParameters, SRPRoutines } from 'tssrp6a'
import { loadE2eMergedEnv } from './load-e2e-env'

const authFile = resolve(process.cwd(), 'tests/e2e/.auth/dev.json')

setup('SRP login dev@localhost → storage state', async ({ request }) => {
  loadE2eMergedEnv()

  const email = (process.env.E2E_LOGIN_EMAIL ?? 'dev@localhost').trim().toLowerCase()
  const password = process.env.E2E_LOGIN_PASSWORD
  if (!password) {
    throw new Error(
      'E2E_LOGIN_PASSWORD is missing. Copy `.env.e2e` from the repo or set E2E_LOGIN_PASSWORD (see docs/DEVELOPING.md).',
    )
  }

  const outDir = resolve(process.cwd(), 'tests/e2e/.auth')
  mkdirSync(outDir, { recursive: true })

  const challengeRes = await request.post('/api/auth/srp/challenge', {
    data: { email },
  })
  if (!challengeRes.ok()) {
    const body = await challengeRes.text()
    throw new Error(
      `SRP challenge failed (${challengeRes.status()}): ${body}. ` +
        `Check Postgres matches \`DATABASE_URL\` in \`.env\` (that value wins over \`.env.e2e\` when both set), ` +
        `and \`npx prisma migrate deploy\` + seed with \`DEV_SRP_*\` visible (e.g. \`dotenv -e .env -e .env.e2e -- npx prisma db seed\`).`,
    )
  }
  const challenge = (await challengeRes.json()) as {
    challengeId: string
    saltHex: string
    BHex: string
  }

  const routines = new SRPRoutines(new SRPParameters())
  const client = new SRPClientSession(routines)
  const clientStep1 = await client.step1(email, password)
  const salt = BigInt(`0x${challenge.saltHex}`)
  const B = BigInt(`0x${challenge.BHex}`)
  const clientStep2 = await clientStep1.step2(salt, B)

  const verifyRes = await request.post('/api/auth/srp/verify', {
    data: {
      challengeId: challenge.challengeId,
      AHex: clientStep2.A.toString(16),
      M1Hex: clientStep2.M1.toString(16),
    },
  })
  if (!verifyRes.ok()) {
    const body = await verifyRes.text()
    throw new Error(`SRP verify failed (${verifyRes.status()}): ${body}`)
  }
  const verify = (await verifyRes.json()) as { M2Hex: string }
  await clientStep2.step3(BigInt(`0x${verify.M2Hex}`))

  await request.storageState({ path: authFile })
  if (!existsSync(authFile)) {
    throw new Error(`Expected storage state at ${authFile}`)
  }
})
