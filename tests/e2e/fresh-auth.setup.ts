import { mkdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { randomBytes } from 'node:crypto'
import { test as setup } from '@playwright/test'
import { createVerifierAndSalt, SRPParameters, SRPRoutines } from 'tssrp6a'
import { loadE2eMergedEnv } from './load-e2e-env'

const authFile = resolve(process.cwd(), 'tests/e2e/.auth/fresh-user.json')

setup('SRP register fresh E2E account → storage state', async ({ request }) => {
  loadE2eMergedEnv()

  const inviteCode = process.env.NUXT_REGISTRATION_INVITE_CODE
  if (!inviteCode || inviteCode.trim().length === 0) {
    throw new Error('NUXT_REGISTRATION_INVITE_CODE is required for fresh E2E auth setup.')
  }

  const unique = `${Date.now().toString(36)}-${randomBytes(4).toString('hex')}`
  const email = `e2e-authed-${unique}@neurospicy.icu`
  const password = randomBytes(16).toString('hex')
  const name = 'E2E Authed User'

  const routines = new SRPRoutines(new SRPParameters())
  const { s, v } = await createVerifierAndSalt(routines, email, password)

  const registerRes = await request.post('/api/auth/srp/register', {
    data: {
      email,
      name,
      saltHex: s.toString(16),
      verifierHex: v.toString(16),
      inviteCode,
    },
  })
  if (!registerRes.ok()) {
    const body = await registerRes.text()
    throw new Error(`SRP register failed (${registerRes.status()}): ${body}`)
  }

  const outDir = resolve(process.cwd(), 'tests/e2e/.auth')
  mkdirSync(outDir, { recursive: true })

  await request.storageState({ path: authFile })
  if (!existsSync(authFile)) {
    throw new Error(`Expected storage state at ${authFile}`)
  }
})
