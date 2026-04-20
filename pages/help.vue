<script setup lang="ts">
/**
 * Plain-language help centre. Driven by the `help.*` keys in i18n so new
 * entries can be added without touching this component. Reachable without
 * an account so the security badges on the login / registration screens
 * can link to it.
 *
 * This page intentionally has no knowledge of the auth state. The
 * back-link is a simple, neutral link to the timeline (`/`); if the user
 * is not signed in, the global auth middleware forwards them to `/login`
 * from there. See docs/CONTENT_AND_A11Y.md for the editorial guidelines.
 */

definePageMeta({
    layout: false,
    auth: 'public',
})

const { tm, rt, t } = useI18n()
const route = useRoute()

type HelpItem = {
    id: string
    title: string
    simple: string
    details: string
}

const items = computed<HelpItem[]>(() => {
    const raw = tm('help.items') as Record<string, unknown> | undefined
    if (!raw || typeof raw !== 'object') return []
    return Object.entries(raw).map(([id, value]) => {
        const entry = value as {
            title?: unknown
            simple?: unknown
            details?: unknown
        }
        return {
            id,
            title: entry.title ? rt(entry.title as string) : id,
            simple: entry.simple ? rt(entry.simple as string) : '',
            details: entry.details ? rt(entry.details as string) : '',
        }
    })
})

onMounted(() => {
    const hash = route.hash?.replace('#', '')
    if (!hash) return
    nextTick(() => {
        const el = document.getElementById(hash)
        if (!el) return
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        const details = el.querySelector('details')
        if (details instanceof HTMLDetailsElement) details.open = true
    })
})
</script>

<template>
    <div class="min-h-dvh bg-gray-100 text-gray-900">
        <a
            href="#main"
            class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[999] focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:text-gray-900 focus:shadow"
        >
            {{ t('common.skipToMain') }}
        </a>
        <header class="border-b border-gray-200 bg-white">
            <div class="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3">
                <NuxtLink
                    to="/"
                    class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    data-testid="help-back-link"
                >
                    <span aria-hidden="true">←</span>
                    {{ t('common.back') }}
                </NuxtLink>
                <LocaleSwitcher />
            </div>
        </header>

        <main id="main" tabindex="-1" class="mx-auto w-full max-w-3xl px-4 pb-16 pt-8 outline-none">
            <h1 class="text-2xl font-semibold">{{ t('help.title') }}</h1>
            <p class="mt-2 text-sm text-gray-700">{{ t('help.intro') }}</p>

            <nav aria-label="help topics" class="mt-6 rounded-xl border border-gray-200 bg-white p-4">
                <ul class="space-y-1 text-sm">
                    <li v-for="item in items" :key="`toc-${item.id}`">
                        <a
                            :href="`#${item.id}`"
                            class="block rounded px-2 py-1 text-gray-800 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                        >
                            {{ item.title }}
                        </a>
                    </li>
                </ul>
            </nav>

            <ol class="mt-8 space-y-6">
                <li
                    v-for="item in items"
                    :id="item.id"
                    :key="item.id"
                    class="scroll-mt-24 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                    <h2 class="text-lg font-semibold text-gray-900">{{ item.title }}</h2>
                    <h3 class="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {{ t('help.simpleHeading') }}
                    </h3>
                    <p class="mt-1 text-base leading-relaxed text-gray-800">{{ item.simple }}</p>
                    <details v-if="item.details" class="mt-4 rounded-lg bg-gray-50 p-4">
                        <summary class="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                            {{ t('help.detailsHeading') }}
                        </summary>
                        <p class="mt-3 text-sm leading-relaxed text-gray-700">{{ item.details }}</p>
                    </details>
                </li>
            </ol>
        </main>
    </div>
</template>
