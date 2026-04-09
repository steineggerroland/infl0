<script setup lang="ts">
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
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email: email.value.trim(), password: password.value },
      credentials: 'include',
    })
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
