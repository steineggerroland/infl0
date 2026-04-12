<script setup lang="ts">
import { SRPClientSession, SRPParameters, SRPRoutines } from 'tssrp6a'

definePageMeta({
  layout: false,
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
  <div class="min-h-dvh flex flex-col items-center justify-center bg-gray-800 text-gray-100 px-4">
    <div class="mb-4 w-full max-w-sm flex justify-end">
      <LocaleSwitcher />
    </div>
    <div class="w-full max-w-sm rounded-xl bg-gray-900/80 p-8 shadow-xl border border-gray-700">
      <h1 class="text-xl font-semibold mb-6 text-center">{{ $t('login.title') }}</h1>
      <p class="text-xs text-gray-500 mb-4 text-center">
        {{ $t('login.srpHint') }}
      </p>
      <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
        <label class="flex flex-col gap-1 text-sm">
          <span class="text-gray-400">{{ $t('login.email') }}</span>
          <input
            v-model="email"
            type="email"
            autocomplete="username"
            required
            class="input input-bordered w-full bg-gray-800 border-gray-600"
          >
        </label>
        <label class="flex flex-col gap-1 text-sm">
          <span class="text-gray-400">{{ $t('login.password') }}</span>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            class="input input-bordered w-full bg-gray-800 border-gray-600"
          >
        </label>
        <p v-if="errorMsg" class="text-sm text-red-400">{{ errorMsg }}</p>
        <button type="submit" class="btn btn-primary w-full" :disabled="pending">
          {{ pending ? $t('common.loading') : $t('login.signIn') }}
        </button>
        <NuxtLink
          to="/register"
          class="text-center text-sm text-gray-400 hover:text-gray-200 underline-offset-2 hover:underline"
        >
          {{ $t('login.createAccount') }}
        </NuxtLink>
      </form>
    </div>
  </div>
</template>
