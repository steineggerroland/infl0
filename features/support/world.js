import { setWorldConstructor, Before, After, setDefaultTimeout } from '@cucumber/cucumber'
import { chromium, request } from '@playwright/test'
import { createVerifierAndSalt, SRPParameters, SRPRoutines } from 'tssrp6a'
import { randomBytes } from 'node:crypto'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { config as loadEnv } from 'dotenv'

function loadE2eMergedEnv(root = process.cwd()) {
  const envFile = resolve(root, '.env')
  const e2eFile = resolve(root, '.env.e2e')
  if (existsSync(envFile)) loadEnv({ path: envFile, quiet: true })
  if (existsSync(e2eFile)) loadEnv({ path: e2eFile, quiet: true })
}

async function createFreshOnboardingStorageState(baseURL) {
  const api = await request.newContext({ baseURL })
  const inviteCode = process.env.NUXT_REGISTRATION_INVITE_CODE
  if (!inviteCode || inviteCode.trim().length === 0) {
    throw new Error('NUXT_REGISTRATION_INVITE_CODE is required for BDD onboarding tests.')
  }

  const unique = `${Date.now().toString(36)}-${randomBytes(4).toString('hex')}`
  const username = `regression-test-${unique}`.toLowerCase()
  const recoveryEmail = `regression-test-${unique}@neurospicy.icu`
  const password = randomBytes(16).toString('hex')
  const name = 'BDD Onboarding User'

  const routines = new SRPRoutines(new SRPParameters())
  const { s, v } = await createVerifierAndSalt(routines, username, password)
  const registerRes = await api.post('/api/auth/srp/register', {
    data: {
      username,
      recoveryEmail,
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

  const storageState = await api.storageState()
  await api.dispose()
  return storageState
}

class BddWorld {
  constructor() {
    this.baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:4275'
    this.browser = null
    this.context = null
    this.page = null
    this.currentTopic = null
    this.currentSurface = 'front'
    this.lastShortcut = null
    this.fontSizeBefore = null
    this.fontSizeAfter = null
    this.fontFamilyBefore = null
    this.fontFamilyAfter = null
  }
}

setWorldConstructor(BddWorld)
// Feed-add / PATCH flows wait on Playwright with caps up to 45–60s (cold DB,
// first SSR). Cucumber’s step timeout must exceed those inner waits or the
// runner kills the step first — seen as flaky failures on `POST /api/feeds`.
setDefaultTimeout(90_000)

Before({ tags: '@http-only' }, async function () {
  loadE2eMergedEnv()
})

Before({ tags: '@email' }, function () {
  loadE2eMergedEnv()
  const required = [
    'NUXT_TEST_EMAIL_DOMAIN',
    'NUXT_TEST_IMAP_HOST',
    'NUXT_TEST_IMAP_USER',
    'NUXT_TEST_IMAP_PASS',
    'NUXT_SMTP_HOST',
    'NUXT_SMTP_USER',
    'NUXT_SMTP_PASS',
  ]
  for (const name of required) {
    if (!process.env[name]?.trim()) {
      return 'skipped'
    }
  }
})

Before({ tags: '@screenplay and not @http-only' }, async function () {
  loadE2eMergedEnv()
  this.browser = await chromium.launch({ headless: true })
})

Before({ tags: 'not @http-only and not @screenplay' }, async function () {
  loadE2eMergedEnv()
  this.browser = await chromium.launch({ headless: true })
  const storageState = await createFreshOnboardingStorageState(this.baseURL)
  this.context = await this.browser.newContext({
    baseURL: this.baseURL,
    storageState,
    locale: 'en-US',
    reducedMotion: 'reduce',
    // BDD asserts UI/API behaviour on the live server — not offline PWA caching.
    serviceWorkers: 'block',
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
  })
  this.page = await this.context.newPage()
})

After(async function () {
  if (this.page) await this.page.close()
  if (this.context) await this.context.close()
  if (this.browser) await this.browser.close()
})
