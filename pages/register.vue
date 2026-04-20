<script setup lang="ts">
import { createVerifierAndSalt, SRPParameters, SRPRoutines } from 'tssrp6a'

definePageMeta({
  layout: false,
  auth: 'entry',
})

const { t } = useI18n()

const email = ref('')
const name = ref('')
const password = ref('')
const inviteCode = ref('')
const errorMsg = ref('')
const pending = ref(false)

async function onSubmit() {
  errorMsg.value = ''
  pending.value = true

  const emailNorm = email.value.trim().toLowerCase()
  const pwd = password.value

  try {
    const routines = new SRPRoutines(new SRPParameters())
    const { s, v } = await createVerifierAndSalt(routines, emailNorm, pwd)
    password.value = ''

    await $fetch('/api/auth/srp/register', {
      method: 'POST',
      body: {
        email: emailNorm,
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
  <div class="min-h-dvh flex flex-col items-center justify-center bg-gray-800 text-gray-100 px-4">
    <div class="mb-4 w-full max-w-sm flex justify-end">
      <LocaleSwitcher />
    </div>
    <div class="w-full max-w-sm rounded-xl bg-gray-900/80 p-8 shadow-xl border border-gray-700">
      <h1 class="text-xl font-semibold mb-1 text-center">{{ $t('register.title') }}</h1>
      <p class="mb-5 text-center text-sm text-gray-400">{{ $t('register.tagline') }}</p>
      <div class="mb-4 flex justify-center">
        <SecurityBadge align="center" />
      </div>
      <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
        <label class="flex flex-col gap-1 text-sm">
          <span class="text-gray-400">{{ $t('register.inviteCode') }}</span>
          <input
            v-model="inviteCode"
            type="password"
            autocomplete="off"
            required
            class="input input-bordered w-full bg-gray-800 border-gray-600"
          >
        </label>
        <label class="flex flex-col gap-1 text-sm">
          <span class="text-gray-400">{{ $t('register.email') }}</span>
          <input
            v-model="email"
            type="email"
            autocomplete="username"
            required
            class="input input-bordered w-full bg-gray-800 border-gray-600"
          >
        </label>
        <label class="flex flex-col gap-1 text-sm">
          <span class="text-gray-400">{{ $t('register.nameOptional') }}</span>
          <input
            v-model="name"
            type="text"
            autocomplete="name"
            class="input input-bordered w-full bg-gray-800 border-gray-600"
          >
        </label>
        <label class="flex flex-col gap-1 text-sm">
          <span class="text-gray-400">{{ $t('register.password') }}</span>
          <input
            v-model="password"
            type="password"
            autocomplete="new-password"
            required
            class="input input-bordered w-full bg-gray-800 border-gray-600"
          >
        </label>
        <p v-if="errorMsg" class="text-sm text-red-400">{{ errorMsg }}</p>
        <button type="submit" class="btn btn-primary w-full" :disabled="pending">
          {{ pending ? $t('common.loading') : $t('register.submit') }}
        </button>
        <NuxtLink
          to="/login"
          class="text-center text-sm text-gray-400 hover:text-gray-200 underline-offset-2 hover:underline"
        >
          {{ $t('register.signInLink') }}
        </NuxtLink>
      </form>
    </div>
  </div>
</template>
