<script setup lang="ts">
import { SRPClientSession, SRPParameters, SRPRoutines } from 'tssrp6a'

definePageMeta({
  layout: false,
  auth: 'entry',
})

const route = useRoute()
const { t } = useI18n()
const email = ref('')
const password = ref('')
const errorMsg = ref('')
const pending = ref(false)

async function onSubmit() {
  errorMsg.value = ''
  pending.value = true

  const emailNorm = email.value.trim().toLowerCase()
  const pwd = password.value

  try {
    const challenge = await $fetch<{
      challengeId: string
      saltHex: string
      BHex: string
    }>('/api/auth/srp/challenge', {
      method: 'POST',
      body: { email: emailNorm },
    })

    password.value = ''

    const routines = new SRPRoutines(new SRPParameters())
    const client = new SRPClientSession(routines)
    const clientStep1 = await client.step1(emailNorm, pwd)

    const salt = BigInt(`0x${challenge.saltHex}`)
    const B = BigInt(`0x${challenge.BHex}`)
    const clientStep2 = await clientStep1.step2(salt, B)

    const verify = await $fetch<{ M2Hex: string }>('/api/auth/srp/verify', {
      method: 'POST',
      body: {
        challengeId: challenge.challengeId,
        AHex: clientStep2.A.toString(16),
        M1Hex: clientStep2.M1.toString(16),
      },
      credentials: 'include',
    })

    await clientStep2.step3(BigInt(`0x${verify.M2Hex}`))

    const r = route.query.redirect
    const target = typeof r === 'string' && r.startsWith('/') ? r : '/'
    await navigateTo(target)
  } catch (e: unknown) {
    const { message } = parseFetchError(e)
    errorMsg.value = message.trim() || t('login.failed')
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="infl0-auth-shell">
    <!--
      Skip link + <main> landmark. Matches the contract enforced by
      `tests/unit/landmarks-and-skip-link.test.ts`. On a single-form
      page the user benefit is small (one locale switcher to skip past),
      but consistency with the rest of the app matters more than
      saving those bytes.
    -->
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[999] focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:text-gray-900 focus:shadow"
    >
      {{ $t('common.skipToMain') }}
    </a>
    <div class="mb-4 w-full max-w-sm flex justify-end">
      <LocaleSwitcher />
    </div>
    <main id="main" tabindex="-1" class="infl0-panel w-full max-w-sm p-8 outline-none">
      <h1 class="text-center text-xl font-semibold mb-1 text-[var(--infl0-panel-text)]">{{ $t('login.title') }}</h1>
      <p class="infl0-panel-muted mb-5 text-center text-sm">{{ $t('login.tagline') }}</p>
      <div class="mb-4 flex justify-center">
        <SecurityBadge align="center" />
      </div>
      <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
        <label class="flex flex-col gap-1 text-sm text-[var(--infl0-panel-text)]">
          <span class="infl0-panel-muted">{{ $t('login.email') }}</span>
          <input
            v-model="email"
            type="email"
            autocomplete="username"
            required
            class="input input-bordered infl0-field w-full"
          >
        </label>
        <label class="flex flex-col gap-1 text-sm text-[var(--infl0-panel-text)]">
          <span class="infl0-panel-muted">{{ $t('login.password') }}</span>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            class="input input-bordered infl0-field w-full"
          >
        </label>
        <p v-if="errorMsg" class="text-sm text-red-400">{{ errorMsg }}</p>
        <button type="submit" class="btn btn-primary w-full" :disabled="pending">
          {{ pending ? $t('common.loading') : $t('login.signIn') }}
        </button>
        <NuxtLink
          to="/register"
          class="infl0-panel-muted text-center text-sm underline-offset-2 hover:underline hover:text-[var(--infl0-panel-text)]"
        >
          {{ $t('login.createAccount') }}
        </NuxtLink>
      </form>
    </main>
  </div>
</template>
