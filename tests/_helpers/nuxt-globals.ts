import { ref, type Ref } from 'vue'

/**
 * Minimal Nuxt compatibility shim for Vitest.
 *
 * Vitest does not boot Nuxt, so the auto-imported `useState` is absent
 * when we mount components or run composables. This helper injects a
 * framework-agnostic replacement onto `globalThis` that mimics Nuxt's
 * contract: same key -> same reactive `Ref`.
 *
 * Tests that touch composables using `useState` should import this
 * file **before** the composable. Call `resetNuxtTestState()` in
 * `beforeEach` to keep tests isolated.
 *
 * We deliberately avoid a `declare global` block here so this helper
 * does not leak into the production typechecker (Nuxt has its own
 * `useState` typings, and augmenting them breaks the whole project).
 */

type Store = Map<string, Ref<unknown>>

type GlobalWithStore = typeof globalThis & {
    __nuxtTestState?: Store
    useState?: <T>(key: string, init?: () => T) => Ref<T>
}

function globalObject(): GlobalWithStore {
    return globalThis as GlobalWithStore
}

function ensureStore(): Store {
    const g = globalObject()
    if (!g.__nuxtTestState) g.__nuxtTestState = new Map()
    return g.__nuxtTestState
}

globalObject().useState = <T>(key: string, init?: () => T): Ref<T> => {
    const store = ensureStore()
    if (!store.has(key)) {
        store.set(key, ref(init ? init() : undefined) as Ref<unknown>)
    }
    return store.get(key) as Ref<T>
}

export function resetNuxtTestState(): void {
    globalObject().__nuxtTestState = new Map()
}
