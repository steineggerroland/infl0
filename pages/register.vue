<script setup lang="ts">
import { createVerifierAndSalt, SRPParameters, SRPRoutines } from 'tssrp6a'

definePageMeta({
  layout: false,
})

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
    const err = e as { data?: { statusMessage?: string }; statusMessage?: string }
    errorMsg.value =
      err?.data?.statusMessage ?? err?.statusMessage ?? 'Registration failed'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="min-h-dvh flex items-center justify-center bg-gray-800 text-gray-100 px-4">
    <div class="w-full max-w-sm rounded-xl bg-gray-900/80 p-8 shadow-xl border border-gray-700">
      <h1 class="text-xl font-semibold mb-2 text-center">Create account</h1>
      <p class="text-xs text-gray-500 mb-4 text-center">
        Password stays in your browser; only an SRP verifier is stored on the server.
      </p>
      <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
        <label class="flex flex-col gap-1 text-sm">
          <span class="text-gray-400">Invite code</span>
          <input
            v-model="inviteCode"
            type="password"
            autocomplete="off"
            required
            class="input input-bordered w-full bg-gray-800 border-gray-600"
          />
        </label>
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
          <span class="text-gray-400">Name (optional)</span>
          <input
            v-model="name"
            type="text"
            autocomplete="name"
            class="input input-bordered w-full bg-gray-800 border-gray-600"
          />
        </label>
        <label class="flex flex-col gap-1 text-sm">
          <span class="text-gray-400">Password</span>
          <input
            v-model="password"
            type="password"
            autocomplete="new-password"
            required
            class="input input-bordered w-full bg-gray-800 border-gray-600"
          />
        </label>
        <p v-if="errorMsg" class="text-sm text-red-400">{{ errorMsg }}</p>
        <button type="submit" class="btn btn-primary w-full" :disabled="pending">
          {{ pending ? '…' : 'Register' }}
        </button>
        <NuxtLink
          to="/login"
          class="text-center text-sm text-gray-400 hover:text-gray-200 underline-offset-2 hover:underline"
        >
          Already have an account? Sign in
        </NuxtLink>
      </form>
    </div>
  </div>
</template>
