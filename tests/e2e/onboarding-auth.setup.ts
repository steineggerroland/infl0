import { mkdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { randomBytes } from 'node:crypto'
import { test as setup } from '@playwright/test'
import { createVerifierAndSalt, SRPParameters, SRPRoutines } from 'tssrp6a'
import { loadE2eMergedEnv } from './load-e2e-env'

/**
 * Per-worker SRP sign-up for the `chromium-onboarding` Playwright project.
 *
 * Why a fresh account per worker:
 *
 * - The onboarding cards live in `User.uiPrefs.onboardingHidden`; a
 *   spec that flips the toggle would otherwise pollute storage state
 *   shared between workers.
 * - Specs that exercise navigation / show-read / scoring need real
 *   inflow content. Onboarding cards are produced server-side from
 *   the catalog, so a brand-new account always has the four cards in
 *   the expected order — no devData seeding required.
 *
 * Email / password choice:
 *
 * - `regression-test-<unique>@neurospicy.icu`: the MX of
 *   `neurospicy.icu` does not need to receive mail (registration is
 *   invite-code-based, not email-confirmation-based). The unique
 *   suffix is a short random hex string so concurrent workers never
 *   collide and a re-run does not hit P2002 ("Email already
 *   registered") on a leftover row.
 * - Random password per run, kept only inside the saved storage
 *   state. Production parity is high (the same SRP register handler
 *   used in production, the same verifier/salt format).
 *
 * Cleanup of accumulated `regression-test-*` rows is tracked as a
 * follow-up in `docs/planned/e2e-strategy.md`, gated on a future
 * user-deletion feature. Acceptable build-up for now.
 */
setup('SRP register fresh onboarding account → storage state', async ({ request }, testInfo) => {
  loadE2eMergedEnv()

  const inviteCode = process.env.NUXT_REGISTRATION_INVITE_CODE
  if (!inviteCode || inviteCode.trim().length === 0) {
    throw new Error(
      'NUXT_REGISTRATION_INVITE_CODE is missing. Add it to `.env.e2e` ' +
        '(see docs/DEVELOPING.md and docs/planned/onboarding-and-inflow-cards.md).',
    )
  }

  const workerIndex = testInfo.workerIndex
  const unique = `${Date.now().toString(36)}-${randomBytes(4).toString('hex')}`
  const email = `regression-test-${unique}-w${workerIndex}@neurospicy.icu`
  const password = randomBytes(16).toString('hex')
  const name = `Regression Test ${workerIndex}`

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
    throw new Error(
      `SRP register failed (${registerRes.status()}): ${body}. ` +
        'Check that NUXT_REGISTRATION_INVITE_CODE matches the running server and that ' +
        'Postgres is reachable for the inflow handler that follows.',
    )
  }

  const outDir = resolve(process.cwd(), 'tests/e2e/.auth')
  mkdirSync(outDir, { recursive: true })
  const authFile = resolve(outDir, `onboarding-${workerIndex}.json`)

  await request.storageState({ path: authFile })
  if (!existsSync(authFile)) {
    throw new Error(`Expected storage state at ${authFile}`)
  }
})
