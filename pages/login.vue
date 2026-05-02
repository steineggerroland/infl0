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
      <form class="contents" @submit.prevent="onSubmit">
        <!-- DaisyUI Fieldset + labels: https://daisyui.com/components/fieldset/ -->
        <fieldset class="fieldset mt-1 gap-4 border-0 bg-transparent p-0">
          <legend class="fieldset-legend sr-only">
            {{ $t('login.fieldsetLegend') }}
          </legend>

          <div class="space-y-1">
            <label class="label w-full pb-0" for="login-email">
              <span class="label-text text-[var(--infl0-panel-text)]">{{ $t('login.email') }}</span>
            </label>
            <input
              id="login-email"
              v-model="email"
              type="email"
              autocomplete="username"
              required
              class="input input-bordered infl0-field w-full"
            >
          </div>
          <div class="space-y-1">
            <label class="label w-full pb-0" for="login-password">
              <span class="label-text text-[var(--infl0-panel-text)]">{{ $t('login.password') }}</span>
            </label>
            <input
              id="login-password"
              v-model="password"
              type="password"
              autocomplete="current-password"
              required
              class="input input-bordered infl0-field w-full"
            >
          </div>
          <div
            v-if="errorMsg"
            role="alert"
            class="alert alert-error py-3 text-sm"
            data-testid="login-error"
          >
            {{ errorMsg }}
          </div>
          <button type="submit" class="btn btn-primary w-full" :disabled="pending">
            {{ pending ? $t('common.loading') : $t('login.signIn') }}
          </button>
        </fieldset>
        <NuxtLink
          to="/register"
          class="infl0-panel-muted mt-4 block text-center text-sm underline-offset-2 hover:underline hover:text-[var(--infl0-panel-text)]"
        >
          {{ $t('login.createAccount') }}
        </NuxtLink>
      </form>
    </main>
  </div>
</template>
