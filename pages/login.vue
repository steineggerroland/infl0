<script setup lang="ts">
import { createVerifierAndSalt, SRPClientSession, SRPParameters, SRPRoutines } from 'tssrp6a'

definePageMeta({
  layout: false,
  auth: 'entry',
})

const route = useRoute()
const { t } = useI18n()
const toast = useToast()
const username = ref('')
const password = ref('')
const errorMsg = ref('')
const pending = ref(false)
const recoveryMode = ref(false)
const recoveryStep = ref<'email' | 'code'>('email')
const recoveryEmail = ref('')
const recoveryCode = ref('')
const recoveryPassword = ref('')
const recoveryUsername = ref('')
const recoveryError = ref('')
const recoveryMessage = ref('')
const recoveryPending = ref(false)

const runtimeConfig = useRuntimeConfig()
const resendCooldownSeconds = runtimeConfig.public.emailOtpResendCooldownSeconds
const { canResend, secondsLeft, startCooldown } = useOtpResendCooldown(resendCooldownSeconds)

const resendLabel = computed(() =>
  canResend.value
    ? t('login.recoveryResendCode')
    : t('login.recoveryResendIn', { seconds: secondsLeft.value }),
)

async function onSubmit() {
  errorMsg.value = ''
  pending.value = true

  const usernameNorm = username.value.trim().toLowerCase()
  const pwd = password.value

  try {
    const challenge = await $fetch<{
      challengeId: string
      saltHex: string
      BHex: string
    }>('/api/auth/srp/challenge', {
      method: 'POST',
      body: { username: usernameNorm },
    })

    password.value = ''

    const routines = new SRPRoutines(new SRPParameters())
    const client = new SRPClientSession(routines)
    const clientStep1 = await client.step1(usernameNorm, pwd)

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

async function requestPasswordReset() {
  recoveryPending.value = true
  recoveryError.value = ''
  recoveryMessage.value = ''
  try {
    const res = await $fetch<{ username: string }>('/api/auth/password-reset/request', {
      method: 'POST',
      body: { email: recoveryEmail.value },
    })
    recoveryUsername.value = res.username
    recoveryStep.value = 'code'
    recoveryMessage.value = t('login.recoveryCodeSentTo', { email: recoveryEmail.value.trim() })
    recoveryCode.value = ''
    startCooldown()
    toast.push({ message: recoveryMessage.value, variant: 'success' })
  } catch (e: unknown) {
    const { statusCode, message } = parseFetchError(e)
    recoveryError.value = message.trim() || t('login.recoveryRequestFailed')
    if (statusCode === 429) startCooldown()
  } finally {
    recoveryPending.value = false
  }
}

async function confirmPasswordReset() {
  recoveryPending.value = true
  recoveryError.value = ''
  recoveryMessage.value = ''
  try {
    const emailNorm = recoveryEmail.value.trim().toLowerCase()
    const pwd = recoveryPassword.value
    const routines = new SRPRoutines(new SRPParameters())
    const { s, v } = await createVerifierAndSalt(routines, recoveryUsername.value, pwd)
    recoveryPassword.value = ''
    await $fetch('/api/auth/password-reset/confirm', {
      method: 'POST',
      body: {
        email: emailNorm,
        code: recoveryCode.value,
        saltHex: s.toString(16),
        verifierHex: v.toString(16),
      },
      credentials: 'include',
    })
    toast.push({ message: t('login.recoverySuccess'), variant: 'success' })
    await navigateTo('/')
  } catch (e: unknown) {
    const { message } = parseFetchError(e)
    recoveryError.value = message.trim() || t('login.recoveryConfirmFailed')
  } finally {
    recoveryPending.value = false
  }
}

async function resendPasswordResetCode() {
  if (!canResend.value || recoveryPending.value || recoveryStep.value !== 'code') return
  await requestPasswordReset()
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
      <form v-if="!recoveryMode" class="contents" @submit.prevent="onSubmit">
        <!-- DaisyUI Fieldset + labels: https://daisyui.com/components/fieldset/ -->
        <fieldset class="fieldset mt-1 gap-4 border-0 bg-transparent p-0">
          <legend class="fieldset-legend sr-only">
            {{ $t('login.fieldsetLegend') }}
          </legend>

          <div class="space-y-1">
            <label class="label w-full pb-0" for="login-username">
              <span class="label-text text-[var(--infl0-panel-text)]">{{ $t('login.username') }}</span>
            </label>
            <input
              id="login-username"
              v-model="username"
              type="text"
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
        <button
          type="button"
          class="infl0-panel-muted mt-3 block w-full text-center text-sm underline-offset-2 hover:underline hover:text-[var(--infl0-panel-text)]"
          data-testid="open-password-recovery"
          @click="recoveryMode = true"
        >
          {{ $t('login.forgotPassword') }}
        </button>
      </form>

      <form
        v-else
        class="contents"
        @submit.prevent="recoveryStep === 'email' ? requestPasswordReset() : confirmPasswordReset()"
      >
        <fieldset class="fieldset mt-1 gap-4 border-0 bg-transparent p-0">
          <legend class="fieldset-legend sr-only">
            {{ $t('login.recoveryLegend') }}
          </legend>

          <div v-if="recoveryStep === 'email'" class="space-y-1">
            <label class="label w-full pb-0" for="password-reset-email">
              <span class="label-text text-[var(--infl0-panel-text)]">{{ $t('login.recoveryEmail') }}</span>
            </label>
            <input
              id="password-reset-email"
              v-model="recoveryEmail"
              type="email"
              autocomplete="email"
              required
              class="input input-bordered infl0-field w-full"
              data-testid="password-reset-email"
            >
          </div>

          <template v-else>
            <p
              class="infl0-panel-muted text-sm leading-snug"
              data-testid="password-reset-email-sent"
            >
              {{ recoveryMessage }}
            </p>
            <p class="infl0-panel-muted text-xs leading-snug" data-testid="password-reset-spam-hint">
              {{ $t('common.checkSpamFolder') }}
            </p>

            <EmailOtpInput
              id="password-reset-code"
              v-model="recoveryCode"
              :label="$t('login.recoveryCode')"
              test-id="password-reset-code"
              :pending="recoveryPending"
            />

            <div class="space-y-1">
              <label class="label w-full pb-0" for="password-reset-password">
                <span class="label-text text-[var(--infl0-panel-text)]">{{ $t('login.newPassword') }}</span>
              </label>
              <input
                id="password-reset-password"
                v-model="recoveryPassword"
                type="password"
                autocomplete="new-password"
                required
                class="input input-bordered infl0-field w-full"
                data-testid="password-reset-password"
              >
            </div>

            <button
              type="button"
              class="btn btn-ghost btn-sm w-full"
              :disabled="!canResend || recoveryPending"
              data-testid="resend-password-reset-code"
              @click="resendPasswordResetCode"
            >
              <span v-if="recoveryPending" class="loading loading-spinner loading-xs" aria-hidden="true" />
              {{ resendLabel }}
            </button>
          </template>

          <div
            v-if="recoveryError"
            role="alert"
            class="alert alert-error py-3 text-sm"
            data-testid="password-reset-error"
          >
            {{ recoveryError }}
          </div>
          <button type="submit" class="btn btn-primary w-full" :disabled="recoveryPending">
            <span v-if="recoveryPending" class="loading loading-spinner loading-sm" aria-hidden="true" />
            {{
              recoveryPending
                ? $t('common.loading')
                : recoveryStep === 'email'
                  ? $t('login.sendRecoveryCode')
                  : $t('login.resetPassword')
            }}
          </button>
          <button
            type="button"
            class="btn btn-ghost w-full"
            @click="
              recoveryMode = false;
              recoveryStep = 'email';
              recoveryError = '';
              recoveryMessage = '';
            "
          >
            {{ $t('common.back') }}
          </button>
        </fieldset>
      </form>
    </main>
  </div>
</template>
