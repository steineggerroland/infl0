<script setup lang="ts">
import { SRPClientSession, SRPParameters, SRPRoutines } from 'tssrp6a'

definePageMeta({
  layout: false,
})

const route = useRoute()
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
    const err = e as { data?: { statusMessage?: string }; statusMessage?: string }
    errorMsg.value =
      err?.data?.statusMessage ?? err?.statusMessage ?? 'Login failed'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="min-h-dvh flex items-center justify-center bg-gray-800 text-gray-100 px-4">
    <div class="w-full max-w-sm rounded-xl bg-gray-900/80 p-8 shadow-xl border border-gray-700">
      <h1 class="text-xl font-semibold mb-6 text-center">infl0</h1>
      <p class="text-xs text-gray-500 mb-4 text-center">
        Sign-in uses SRP-6a: your password is not sent to the server (use HTTPS in production).
      </p>
      <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
        <label class="flex flex-col gap-1 text-sm">
          <span class="text-gray-400">Email</span>
          <input
            v-model="email"
            type="email"
            autocomplete="username"
            required
            class="input input-bordered w-full bg-gray-800 border-gray-600"
          />
        </label>
        <label class="flex flex-col gap-1 text-sm">
          <span class="text-gray-400">Password</span>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            class="input input-bordered w-full bg-gray-800 border-gray-600"
          />
        </label>
        <p v-if="errorMsg" class="text-sm text-red-400">{{ errorMsg }}</p>
        <button type="submit" class="btn btn-primary w-full" :disabled="pending">
          {{ pending ? '…' : 'Sign in' }}
        </button>
      </form>
    </div>
  </div>
</template>
