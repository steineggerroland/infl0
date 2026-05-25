<script setup lang="ts">
import { createVerifierAndSalt, SRPParameters, SRPRoutines } from 'tssrp6a'

definePageMeta({
  layout: false,
  auth: 'entry',
})

const { t } = useI18n()

const username = ref('')
const recoveryEmail = ref('')
const name = ref('')
const password = ref('')
const inviteCode = ref('')
const errorMsg = ref('')
const pending = ref(false)

async function onSubmit() {
  errorMsg.value = ''
  pending.value = true

  const usernameNorm = username.value.trim().toLowerCase()
  const recoveryEmailNorm = recoveryEmail.value.trim().toLowerCase()
  const pwd = password.value

  try {
    const routines = new SRPRoutines(new SRPParameters())
    const { s, v } = await createVerifierAndSalt(routines, usernameNorm, pwd)
    password.value = ''

    await $fetch('/api/auth/srp/register', {
      method: 'POST',
      body: {
        username: usernameNorm,
        recoveryEmail: recoveryEmailNorm || undefined,
        name: name.value.trim() || undefined,
        saltHex: s.toString(16),
        verifierHex: v.toString(16),
        inviteCode: inviteCode.value,
      },
      credentials: 'include',
    })

    inviteCode.value = ''
    await navigateTo('/')
  } catch (e: unknown) {
    const { message } = parseFetchError(e)
    errorMsg.value = message.trim() || t('register.failed')
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="infl0-auth-shell">
    <!--
      Skip link + <main> landmark. Kept in sync with pages/login.vue
      and layouts/app.vue; see
      `tests/unit/landmarks-and-skip-link.test.ts` for the contract.
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
      <h1 class="text-center text-xl font-semibold mb-1 text-[var(--infl0-panel-text)]">{{ $t('register.title') }}</h1>
      <p class="infl0-panel-muted mb-5 text-center text-sm">{{ $t('register.tagline') }}</p>
      <div class="mb-4 flex justify-center">
        <SecurityBadge align="center" />
      </div>
      <form class="contents" @submit.prevent="onSubmit">
        <fieldset class="fieldset mt-1 gap-4 border-0 bg-transparent p-0">
          <legend class="fieldset-legend sr-only">
            {{ $t('register.fieldsetLegend') }}
          </legend>

          <div class="space-y-1">
            <label class="label w-full pb-0" for="register-invite">
              <span class="label-text text-[var(--infl0-panel-text)]">{{ $t('register.inviteCode') }}</span>
            </label>
            <input
              id="register-invite"
              v-model="inviteCode"
              type="password"
              autocomplete="off"
              required
              class="input input-bordered infl0-field w-full"
            >
          </div>
          <div class="space-y-1">
            <label class="label w-full pb-0" for="register-username">
              <span class="label-text text-[var(--infl0-panel-text)]">{{ $t('register.username') }}</span>
            </label>
            <input
              id="register-username"
              v-model="username"
              type="text"
              autocomplete="username"
              required
              class="input input-bordered infl0-field w-full"
            >
          </div>
          <div class="space-y-1">
            <label class="label w-full pb-0" for="register-recovery-email">
              <span class="label-text text-[var(--infl0-panel-text)]">{{ $t('register.recoveryEmailOptional') }}</span>
            </label>
            <input
              id="register-recovery-email"
              v-model="recoveryEmail"
              type="email"
              autocomplete="email"
              class="input input-bordered infl0-field w-full"
            >
            <p class="infl0-panel-muted text-xs leading-snug">
              {{ $t('register.recoveryEmailHint') }}
            </p>
          </div>
          <div class="space-y-1">
            <label class="label w-full pb-0" for="register-name">
              <span class="label-text text-[var(--infl0-panel-text)]">{{ $t('register.nameOptional') }}</span>
            </label>
            <input
              id="register-name"
              v-model="name"
              type="text"
              autocomplete="name"
              class="input input-bordered infl0-field w-full"
            >
          </div>
          <div class="space-y-1">
            <label class="label w-full pb-0" for="register-password">
              <span class="label-text text-[var(--infl0-panel-text)]">{{ $t('register.password') }}</span>
            </label>
            <input
              id="register-password"
              v-model="password"
              type="password"
              autocomplete="new-password"
              required
              class="input input-bordered infl0-field w-full"
            >
          </div>
          <div
            v-if="errorMsg"
            role="alert"
            class="alert alert-error py-3 text-sm"
            data-testid="register-error"
          >
            {{ errorMsg }}
          </div>
          <button type="submit" class="btn btn-primary w-full" :disabled="pending">
            {{ pending ? $t('common.loading') : $t('register.submit') }}
          </button>
        </fieldset>
        <NuxtLink
          to="/login"
          class="infl0-panel-muted mt-4 block text-center text-sm underline-offset-2 hover:underline hover:text-[var(--infl0-panel-text)]"
        >
          {{ $t('register.signInLink') }}
        </NuxtLink>
      </form>
    </main>
  </div>
</template>
