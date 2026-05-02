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
 *
 * Two content blocks live on this page:
 *
 * 1. **Keyboard shortcuts reference** (anchor `#shortcuts-reference`):
 *    structured table sourced from `utils/app-shortcuts.ts` so the
 *    visible reference cannot drift out of sync with the actual
 *    `defineShortcuts` call sites. See `docs/planned/shortcuts-help.md`.
 *
 * 2. **FAQ items** (anchor `#<itemId>`): the historical "frequently
 *    asked questions" list, fully driven by the `help.items.*` i18n
 *    block. New questions need no template change.
 */

import { SHORTCUT_GROUPS, tokenizeShortcutKey } from '~/utils/app-shortcuts'

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

/**
 * Stable id used both as the URL anchor (`/help#shortcuts-reference`)
 * and in the table of contents above the FAQ list. Anchors are part of
 * the page contract — security badges and other deep links may rely
 * on them.
 */
const SHORTCUTS_REFERENCE_ANCHOR = 'shortcuts-reference'

/**
 * Static rules describing **when** shortcuts fire. Listed under
 * `help.shortcutsReference.scopeRules.*`; ordering is the order users
 * read them.
 */
const SCOPE_RULES = [
    'noEditable',
    'noModalBg',
    'selectedCard',
    'noChords',
] as const

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
    <div class="infl0-page-shell min-h-dvh infl0-canvas-fg" style="background: var(--infl0-app-bg)">
        <a
            href="#main"
            class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[999] focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:text-gray-900 focus:shadow"
        >
            {{ t('common.skipToMain') }}
        </a>
        <header class="infl0-help-header">
            <div class="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3">
                <NuxtLink
                    to="/"
                    class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    style="color: var(--infl0-help-back-link)"
                    data-testid="help-back-link"
                >
                    <span aria-hidden="true">←</span>
                    {{ t('common.back') }}
                </NuxtLink>
                <LocaleSwitcher />
            </div>
        </header>

        <main id="main" tabindex="-1" class="mx-auto w-full max-w-3xl px-4 pb-16 pt-8 outline-none">
            <h1 class="infl0-canvas-fg text-2xl font-semibold">{{ t('help.title') }}</h1>
            <p class="infl0-canvas-muted mt-2 text-sm">{{ t('help.intro') }}</p>

            <nav aria-label="help topics" class="infl0-raised mt-6 p-4">
                <!--
                  Global `@layer base` styles in `assets/css/tailwind.css` add
                  `list-style-type: disc` plus an indent to every `ul`. The
                  table of contents already styles each entry as a full-width
                  link block (focus ring, hover background) — extra bullets
                  next to those blocks read as visual noise, so the TOC opts
                  out of the marker via `list-none` and removes the marker
                  indent via `ps-0`.
                -->
                <ul class="list-none ps-0 space-y-1 text-sm">
                    <li>
                        <a
                            :href="`#${SHORTCUTS_REFERENCE_ANCHOR}`"
                            class="infl0-help-toclink block rounded px-2 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                        >
                            {{ t('help.shortcutsReference.tocLabel') }}
                        </a>
                    </li>
                    <li v-for="item in items" :key="`toc-${item.id}`">
                        <a
                            :href="`#${item.id}`"
                            class="infl0-help-toclink block rounded px-2 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                        >
                            {{ item.title }}
                        </a>
                    </li>
                </ul>
            </nav>

            <section
                :id="SHORTCUTS_REFERENCE_ANCHOR"
                class="infl0-raised-card scroll-mt-24 mt-8"
                :aria-labelledby="`${SHORTCUTS_REFERENCE_ANCHOR}-heading`"
                data-testid="help-shortcuts-reference"
            >
                <h2
                    :id="`${SHORTCUTS_REFERENCE_ANCHOR}-heading`"
                    class="text-lg font-semibold"
                >
                    {{ t('help.shortcutsReference.title') }}
                </h2>
                <p class="mt-2 text-sm leading-relaxed">
                    {{ t('help.shortcutsReference.intro') }}
                </p>

                <h3
                    class="infl0-canvas-muted mt-5 text-xs font-semibold uppercase tracking-wide"
                >
                    {{ t('help.shortcutsReference.scopeHeading') }}
                </h3>
                <p class="mt-1 text-sm leading-relaxed">
                    {{ t('help.shortcutsReference.scopeIntro') }}
                </p>
                <ul class="mt-3 list-disc space-y-1 ps-5 text-sm leading-relaxed">
                    <li v-for="rule in SCOPE_RULES" :key="rule">
                        {{ t(`help.shortcutsReference.scopeRules.${rule}`) }}
                    </li>
                </ul>

                <div
                    v-for="group in SHORTCUT_GROUPS"
                    :key="group.id"
                    class="mt-6"
                    :data-testid="`help-shortcut-group-${group.id}`"
                >
                    <h3 class="text-base font-semibold">
                        {{ t(`help.shortcutsReference.groups.${group.id}.title`) }}
                    </h3>
                    <p class="infl0-canvas-muted mt-1 text-sm">
                        {{ t(`help.shortcutsReference.groups.${group.id}.summary`) }}
                    </p>
                    <ul class="mt-3 space-y-3">
                        <li
                            v-for="entry in group.entries"
                            :key="`${group.id}-${entry.id}`"
                            class="grid gap-1 sm:grid-cols-[minmax(8.5rem,auto)_1fr] sm:items-start sm:gap-x-4"
                            :data-testid="`help-shortcut-${entry.id}`"
                        >
                            <!--
                              Keys cluster has its own stable testid so
                              behavioural tests can assert "this row
                              shows the visible label W" without
                              pinning a specific element (`<kbd>` vs.
                              `<span>` etc.). The row's own testid
                              would be too coarse — single-letter
                              labels like "S" appear in descriptions
                              too.
                            -->
                            <span
                                class="flex flex-wrap items-center gap-1.5"
                                :data-testid="`help-shortcut-${entry.id}-keys`"
                            >
                                <template
                                    v-for="(combo, comboIndex) in entry.keys"
                                    :key="`${entry.id}-${combo}`"
                                >
                                    <span
                                        v-if="comboIndex > 0"
                                        class="infl0-canvas-muted px-0.5 text-xs"
                                    >
                                        {{ t('help.shortcutsReference.keysSeparator') }}
                                    </span>
                                    <span class="inline-flex flex-wrap items-center gap-0.5">
                                        <template
                                            v-for="(token, tokenIndex) in tokenizeShortcutKey(combo)"
                                            :key="`${entry.id}-${combo}-${tokenIndex}`"
                                        >
                                            <span
                                                v-if="tokenIndex > 0"
                                                aria-hidden="true"
                                                class="infl0-canvas-muted text-xs"
                                            >+</span>
                                            <kbd class="kbd kbd-sm infl0-shortcut-kbd">{{ token.label }}</kbd>
                                        </template>
                                    </span>
                                </template>
                            </span>
                            <span class="block">
                                <span class="font-medium">
                                    {{ t(`help.shortcutsReference.entries.${entry.id}.label`) }}
                                </span>
                                <span class="infl0-canvas-muted block text-sm">
                                    {{ t(`help.shortcutsReference.entries.${entry.id}.description`) }}
                                </span>
                            </span>
                        </li>
                    </ul>
                </div>
            </section>

            <ol class="mt-8 space-y-6">
                <li
                    v-for="item in items"
                    :id="item.id"
                    :key="item.id"
                    class="infl0-raised-card scroll-mt-24"
                >
                    <h2 class="text-lg font-semibold">{{ item.title }}</h2>
                    <h3
                        class="infl0-canvas-muted mt-4 text-xs font-semibold uppercase tracking-wide"
                    >
                        {{ t('help.simpleHeading') }}
                    </h3>
                    <p class="mt-1 text-base leading-relaxed">{{ item.simple }}</p>
                    <details v-if="item.details" class="infl0-help-nested">
                        <summary class="cursor-pointer text-sm font-medium">
                            {{ t('help.detailsHeading') }}
                        </summary>
                        <p class="mt-3 text-sm leading-relaxed">{{ item.details }}</p>
                    </details>
                </li>
            </ol>
        </main>
    </div>
</template>

<style scoped>
:global(html[data-theme="light"]) .infl0-shortcut-kbd {
    color: var(--infl0-panel-bg);
}
</style>
