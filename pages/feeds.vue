<script setup lang="ts">
import type { FeedSourceHealthLatest } from '~/types/feed-source-health'
import {
    isAttentionStatus,
    normalizeSourceHealthKey,
    sourceHealthBadgeTone,
    sourceHealthDataAttribute,
    triageRank,
} from '~/utils/source-health-display'

definePageMeta({
    layout: 'app',
    appFooter: { testId: 'feeds-page-footer' },
})

type UserFeedRow = {
    id: string
    feedUrl: string
    crawlKey: string
    displayTitle: string | null
    active: boolean
    createdAt: string
}

const { t } = useI18n()
const toast = useToast()

const {
    data: feedsData,
    refresh: refreshFeeds,
    error: feedsFetchError,
} = await useFetch<{ feeds: UserFeedRow[] }>('/api/feeds', {
    credentials: 'include',
    key: 'user-feeds',
})

type SourceStatusItem = {
    feed: {
        id: string
        feedUrl: string
        crawlKey: string
        displayTitle: string | null
        active: boolean
        userPreferenceWeight: number
    }
    latest: FeedSourceHealthLatest | null
}

const {
    data: sourceStatusData,
    refresh: refreshSourceStatuses,
    error: sourceStatusFetchError,
} = await useFetch<{ items: SourceStatusItem[] }>('/api/source-statuses', {
    credentials: 'include',
    key: 'user-source-statuses',
})

type FeedStatsRow = {
    feedId: string
    crawlKey: string
    inflowCount: number
    readCount: number
    unreadCount: number
    sharePercent: number
    lastReadAt: string | null
}

const {
    data: feedStatsData,
    refresh: refreshFeedStats,
} = await useFetch<{ items: FeedStatsRow[]; totalInflow: number }>('/api/me/feed-stats', {
    credentials: 'include',
    key: 'user-feed-stats',
})

function pushRetryToast(message: string, retry: () => void) {
    toast.push({
        message,
        variant: 'error',
        durationMs: 0,
        actions: [
            {
                label: t('common.retry'),
                onClick: () => {
                    retry()
                },
            },
        ],
    })
}

watch(
    feedsFetchError,
    (err) => {
        if (!import.meta.client || !err) return
        const { message } = parseFetchError(err)
        const text = message.trim() || t('feeds.errorSources')
        pushRetryToast(text, () => {
            void refreshFeeds()
        })
    },
    { flush: 'post', immediate: true },
)

watch(
    sourceStatusFetchError,
    (err) => {
        if (!import.meta.client || !err) return
        const { message } = parseFetchError(err)
        const text = message.trim() || t('feeds.errorHealth')
        pushRetryToast(text, () => {
            void refreshSourceStatuses()
        })
    },
    { flush: 'post', immediate: true },
)

const feedList = computed(() => feedsData.value?.feeds ?? [])

const latestByFeedId = computed((): Record<string, FeedSourceHealthLatest | null> => {
    const r: Record<string, FeedSourceHealthLatest | null> = {}
    for (const row of sourceStatusData.value?.items ?? []) {
        r[row.feed.id] = row.latest
    }
    return r
})

const statsByFeedId = computed((): Record<string, FeedStatsRow> => {
    const r: Record<string, FeedStatsRow> = {}
    for (const row of feedStatsData.value?.items ?? []) {
        r[row.feedId] = row
    }
    return r
})

const preferenceByFeedId = computed((): Record<string, number> => {
    const r: Record<string, number> = {}
    for (const row of sourceStatusData.value?.items ?? []) {
        r[row.feed.id] = row.feed.userPreferenceWeight ?? 0
    }
    return r
})

function applyPreferenceLocally(feedId: string, value: number) {
    if (!sourceStatusData.value) return
    sourceStatusData.value = {
        items: sourceStatusData.value.items.map((row) =>
            row.feed.id === feedId
                ? { ...row, feed: { ...row.feed, userPreferenceWeight: value } }
                : row,
        ),
    }
}

/**
 * Triage-first ordering: failing → blocked → degraded → needs_setup → pending
 * → quiet → paused → healthy → unknown. Tie-break by oldest subscription.
 */
const sortedFeedList = computed(() => {
    return [...feedList.value].sort((a, b) => {
        const ra = triageRank(latestByFeedId.value[a.id] ?? null)
        const rb = triageRank(latestByFeedId.value[b.id] ?? null)
        if (ra !== rb) return ra - rb
        return a.createdAt.localeCompare(b.createdAt)
    })
})

const attentionCount = computed(
    () =>
        sortedFeedList.value.filter((f) => isAttentionStatus(latestByFeedId.value[f.id] ?? null))
            .length,
)

const attentionBannerText = computed(() => {
    const n = attentionCount.value
    if (n <= 0) return ''
    return n === 1
        ? t('feeds.health.attentionBanner.one')
        : t('feeds.health.attentionBanner.many', { count: n })
})

/**
 * Left accent stripe colour per row (DaisyUI semantic vars).
 * Returns `null` for healthy / unknown so we don't draw a stripe at all.
 */
function rowAccentVar(latest: FeedSourceHealthLatest | null): string | null {
    if (!isAttentionStatus(latest)) return null
    const tone = sourceHealthBadgeTone(normalizeSourceHealthKey(latest?.sourceHealthStatus ?? null))
    if (tone === 'error') return 'var(--color-error)'
    if (tone === 'warning') return 'var(--color-warning)'
    return 'var(--infl0-panel-border)'
}

function summaryDataAttr(latest: FeedSourceHealthLatest | null): string {
    return sourceHealthDataAttribute(latest)
}

async function refreshFeedAndHealth() {
    await Promise.all([refreshFeeds(), refreshSourceStatuses(), refreshFeedStats()])
}

const newFeedUrl = ref('')
const newDisplayTitle = ref('')
const addError = ref('')
const addPending = ref(false)
const removingId = ref<string | null>(null)
const togglingId = ref<string | null>(null)
const copiedFeedId = ref<string | null>(null)
let copiedFeedIdResetTimer: ReturnType<typeof setTimeout> | null = null

async function copyFeedUrl(feedId: string, url: string) {
    try {
        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(url)
        } else {
            throw new Error('Clipboard API unavailable')
        }
        copiedFeedId.value = feedId
        if (copiedFeedIdResetTimer) clearTimeout(copiedFeedIdResetTimer)
        // Short flash; matches the muted toast we already use elsewhere.
        copiedFeedIdResetTimer = setTimeout(() => {
            if (copiedFeedId.value === feedId) copiedFeedId.value = null
        }, 2000)
    } catch {
        toast.push({ message: t('feeds.errorCopyUrl'), variant: 'error', durationMs: 6000 })
    }
}

async function addFeed() {
    addError.value = ''
    addPending.value = true
    try {
        const res = await $fetch<{ feed: UserFeedRow }>('/api/feeds', {
            method: 'POST',
            body: {
                feedUrl: newFeedUrl.value.trim(),
                displayTitle: newDisplayTitle.value.trim() || undefined,
            },
            credentials: 'include',
        })
        newFeedUrl.value = ''
        newDisplayTitle.value = ''
        feedsData.value = { feeds: [...feedList.value, res.feed] }
        void refreshFeedAndHealth()
        toast.push({ message: t('feeds.toastSourceSaved'), variant: 'success' })
    } catch (e: unknown) {
        const { statusCode, message } = parseFetchError(e)
        if (statusCode === 401) {
            await navigateTo('/login')
            return
        }
        addError.value = message.trim() || t('feeds.errorSaveSource')
        toast.push({ message: addError.value, variant: 'error', durationMs: 8000 })
    } finally {
        addPending.value = false
    }
}

async function toggleActive(feed: UserFeedRow) {
    togglingId.value = feed.id
    const nextActive = !feed.active
    try {
        const res = await $fetch<{ feed: UserFeedRow }>(`/api/feeds/${feed.id}`, {
            method: 'PATCH',
            body: { active: nextActive },
            credentials: 'include',
        })
        feedsData.value = {
            feeds: feedList.value.map((f) => (f.id === feed.id ? { ...f, ...res.feed } : f)),
        }
        void refreshSourceStatuses()
        toast.push({
            message: nextActive ? t('feeds.toastSourceResumed') : t('feeds.toastSourcePaused'),
            variant: 'success',
        })
    } catch (e: unknown) {
        const { statusCode, message } = parseFetchError(e)
        if (statusCode === 401) {
            await navigateTo('/login')
            return
        }
        const text = message.trim() || t('feeds.errorTogglePause')
        toast.push({ message: text, variant: 'error', durationMs: 8000 })
    } finally {
        togglingId.value = null
    }
}

async function removeFeed(id: string) {
    removingId.value = id
    try {
        await $fetch(`/api/feeds/${id}`, { method: 'DELETE', credentials: 'include' })
        feedsData.value = { feeds: feedList.value.filter((f) => f.id !== id) }
        void refreshFeedAndHealth()
        toast.push({ message: t('feeds.toastSourceRemoved'), variant: 'success' })
    } catch (e: unknown) {
        const { statusCode, message } = parseFetchError(e)
        if (statusCode === 401) {
            await navigateTo('/login')
            return
        }
        const text = message.trim() || t('feeds.errorRemoveSource')
        toast.push({ message: text, variant: 'error', durationMs: 8000 })
    } finally {
        removingId.value = null
    }
}
</script>

<template>
    <div class="infl0-page-shell flex flex-col items-center px-4 pb-12 pt-16">
        <div class="w-full max-w-lg space-y-8">
            <header class="text-center">
                <h1 class="infl0-canvas-fg text-2xl font-semibold">{{ $t('feeds.title') }}</h1>
                <p class="infl0-canvas-muted mt-2 text-sm">
                    {{ $t('feeds.intro') }}
                </p>
            </header>

            <!-- DaisyUI Fieldset ([Fieldset docs](https://daisyui.com/components/fieldset/)). -->
            <section class="infl0-panel p-3 sm:p-6">
                <form class="contents" @submit.prevent="addFeed">
                    <fieldset
                        class="fieldset gap-4 border-0 bg-transparent p-0"
                        data-testid="feeds-add-fieldset"
                    >
                        <legend class="fieldset-legend text-[var(--infl0-panel-text)]">
                            {{ $t('feeds.addSection') }}
                        </legend>

                        <div class="space-y-1">
                            <label class="label w-full pb-0" for="feed-url-input">
                                <span class="label-text text-[var(--infl0-panel-text)]">{{
                                    $t('feeds.feedUrl')
                                }}</span>
                            </label>
                            <input
                                id="feed-url-input"
                                v-model="newFeedUrl"
                                type="url"
                                required
                                autocomplete="off"
                                :placeholder="$t('feeds.feedUrlPlaceholder')"
                                class="input input-bordered infl0-field w-full"
                            >
                        </div>
                        <div class="space-y-1">
                            <label class="label w-full pb-0" for="feed-display-input">
                                <span class="label-text text-[var(--infl0-panel-text)]">{{
                                    $t('feeds.displayNameOptional')
                                }}</span>
                            </label>
                            <input
                                id="feed-display-input"
                                v-model="newDisplayTitle"
                                type="text"
                                autocomplete="off"
                                class="input input-bordered infl0-field w-full"
                            >
                        </div>
                        <div
                            v-if="addError"
                            role="alert"
                            class="alert alert-error py-3 text-sm"
                            data-testid="feeds-add-error"
                        >
                            {{ addError }}
                        </div>
                        <button type="submit" class="btn btn-primary w-full" :disabled="addPending">
                            {{ addPending ? $t('common.loading') : $t('feeds.saveSource') }}
                        </button>
                    </fieldset>
                </form>
            </section>

            <!-- DaisyUI List rows ([List docs](https://daisyui.com/components/list/)). -->
            <section
                v-if="feedList.length > 0"
                class="infl0-panel p-3 sm:p-6"
                aria-labelledby="feeds-list-heading"
            >
                <h2
                    id="feeds-list-heading"
                    class="mb-2 text-sm font-medium text-[var(--infl0-panel-text)]"
                >
                    {{ $t('feeds.listSection') }}
                </h2>
                <p class="mb-3 text-xs leading-relaxed infl0-panel-muted">
                    {{ $t('feeds.health.listNote') }}
                </p>
                <!-- DaisyUI Alert ([Alert docs](https://daisyui.com/components/alert/)). -->
                <div
                    v-if="attentionCount > 0"
                    role="status"
                    class="alert alert-warning alert-soft mb-3 py-2 text-sm"
                    data-testid="feeds-attention-banner"
                    :data-attention-count="attentionCount"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="size-5 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.75"
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                        />
                    </svg>
                    <span>{{ attentionBannerText }}</span>
                </div>
                <!--
                  Layout overrides for this list:
                    * The global prose reset in `assets/css/tailwind.css`
                      applies `list-style: disc` and `space-y-8` to every
                      `<ul>`. We strip the markers with `list-none` and
                      neutralise the inter-item margin with `space-y-0` —
                      Tailwind utilities only override base styles when they
                      are *explicitly* present, otherwise the 2rem from the
                      reset stacks on top of our `gap-4` (≈3rem visual gap).
                    * Vertical breathing room between rows: `gap-4`. We do
                      *not* combine this with `divide-y` — `divide-*` paints
                      a hairline at the joint between siblings, but with
                      `gap-*` the joint is empty space, so the line would
                      hang in mid-air between cards. Each `<li>` therefore
                      carries its own `rounded-box border` and the left
                      accent stripe widens that border on the affected side.
                -->
                <ul
                    class="list list-none flex flex-col gap-4 space-y-0 p-0"
                    data-testid="feeds-source-list"
                >
                    <li
                        v-for="f in sortedFeedList"
                        :key="f.id"
                        class="rounded-box border border-[var(--infl0-panel-border)]"
                        :class="[
                            rowAccentVar(latestByFeedId[f.id] ?? null) ? 'border-l-4' : '',
                            f.active ? '' : 'opacity-70',
                        ]"
                        :style="rowAccentVar(latestByFeedId[f.id] ?? null) ? { borderLeftColor: rowAccentVar(latestByFeedId[f.id] ?? null)! } : undefined"
                        :data-feed-id="f.id"
                        :data-crawl-key="f.crawlKey"
                        :data-active="f.active ? 'true' : 'false'"
                        :data-attention="isAttentionStatus(latestByFeedId[f.id] ?? null) ? 'true' : 'false'"
                    >
                        <!-- The accent stripe on the parent <li> already telegraphs health,
                             so the row body stays compact: the status dot lives only inside
                             the expanded view. The behavior anchor (`data-testid` +
                             `data-source-health`) sits on this <details> so tests can read
                             the status without expanding. -->
                        <details
                            class="group"
                            data-testid="feed-source-health"
                            :data-source-health="summaryDataAttr(latestByFeedId[f.id] ?? null)"
                        >
                            <summary
                                class="flex w-full cursor-pointer list-none items-center gap-2 px-0 py-2 sm:px-3 [&::-webkit-details-marker]:hidden"
                            >
                                <!-- Disclosure chevron -->
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="size-3 shrink-0 text-[var(--infl0-panel-muted-text,var(--infl0-panel-text))] transition-transform group-open:rotate-90"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke-width="2"
                                    stroke="currentColor"
                                    aria-hidden="true"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        d="M8.25 4.5l7.5 7.5-7.5 7.5"
                                    />
                                </svg>
                                <div class="min-w-0 flex-1">
                                    <!-- Identifier inside the disclosure toggle. While
                                         collapsed, the row stays a clean one-line
                                         summary (`truncate`); once expanded, the same
                                         text wraps freely so users can read the full
                                         title and URL on phone widths instead of being
                                         blocked by the truncation. The browser `title`
                                         attribute keeps the desktop hover tooltip as a
                                         backup affordance. -->
                                    <div
                                        class="truncate text-sm font-medium text-[var(--infl0-panel-text)] group-open:whitespace-normal group-open:break-words"
                                        :title="f.displayTitle ?? f.feedUrl"
                                    >
                                        {{ f.displayTitle ?? f.feedUrl }}
                                    </div>
                                    <div
                                        v-if="f.displayTitle"
                                        class="truncate font-mono text-xs leading-normal infl0-panel-muted group-open:whitespace-normal group-open:break-all"
                                        :title="f.feedUrl"
                                    >
                                        {{ f.feedUrl }}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    class="btn btn-square btn-ghost btn-sm shrink-0"
                                    :title="f.active ? $t('feeds.health.actions.pause') : $t('feeds.health.actions.resume')"
                                    :disabled="togglingId === f.id"
                                    :aria-label="f.active ? $t('feeds.health.actions.pauseAria') : $t('feeds.health.actions.resumeAria')"
                                    :aria-busy="togglingId === f.id"
                                    :aria-pressed="!f.active"
                                    :data-testid="`feed-toggle-${f.id}`"
                                    :data-active="f.active ? 'true' : 'false'"
                                    @click.stop="toggleActive(f)"
                                >
                                    <span
                                        v-if="togglingId === f.id"
                                        class="loading loading-spinner loading-sm"
                                        aria-hidden="true"
                                    />
                                    <svg
                                        v-else-if="f.active"
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="size-[1.1em]"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke-width="1.75"
                                        stroke="currentColor"
                                        aria-hidden="true"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            d="M15.75 5.25v13.5m-7.5-13.5v13.5"
                                        />
                                    </svg>
                                    <svg
                                        v-else
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="size-[1.1em]"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke-width="1.75"
                                        stroke="currentColor"
                                        aria-hidden="true"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z"
                                        />
                                    </svg>
                                </button>
                                <button
                                    type="button"
                                    class="btn btn-square btn-ghost btn-sm shrink-0 text-[var(--color-error)] hover:bg-[color-mix(in_srgb,var(--color-error)_14%,transparent)]"
                                    :title="$t('feeds.remove')"
                                    :disabled="removingId === f.id"
                                    :aria-label="$t('feeds.remove')"
                                    :aria-busy="removingId === f.id"
                                    :data-testid="`feed-remove-${f.id}`"
                                    @click.stop="removeFeed(f.id)"
                                >
                                    <span
                                        v-if="removingId === f.id"
                                        class="loading loading-spinner loading-sm text-[var(--color-error)]"
                                        aria-hidden="true"
                                    />
                                    <svg
                                        v-else
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="size-[1.1em]"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke-width="1.75"
                                        stroke="currentColor"
                                        aria-hidden="true"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                    </svg>
                                </button>
                            </summary>
                            <div class="space-y-3 px-2 pb-3 pt-1 sm:px-3">
                                <!-- Source actions: the disclosure toggle in the
                                     <summary> can never be a real link, so we keep
                                     the URL identifier up there and put the actual
                                     "open the source" + "copy URL" affordances in
                                     the body. These elements live outside the
                                     <summary>, so tapping them never toggles the
                                     disclosure. -->
                                <div
                                    class="flex flex-wrap items-center gap-2 text-xs"
                                    :data-testid="`feed-source-actions-${f.id}`"
                                >
                                    <a
                                        :href="f.feedUrl"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        class="btn btn-ghost btn-xs gap-1"
                                        :data-testid="`feed-source-open-${f.id}`"
                                        :aria-label="$t('feeds.openSourceAria', { url: f.feedUrl })"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            class="size-3.5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke-width="1.75"
                                            stroke="currentColor"
                                            aria-hidden="true"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                                            />
                                        </svg>
                                        {{ $t('feeds.openSource') }}
                                    </a>
                                    <button
                                        type="button"
                                        class="btn btn-ghost btn-xs gap-1"
                                        :data-testid="`feed-source-copy-${f.id}`"
                                        :aria-label="$t('feeds.copySourceAria')"
                                        :data-copied="copiedFeedId === f.id ? 'true' : 'false'"
                                        @click="copyFeedUrl(f.id, f.feedUrl)"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            class="size-3.5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke-width="1.75"
                                            stroke="currentColor"
                                            aria-hidden="true"
                                        >
                                            <path
                                                v-if="copiedFeedId === f.id"
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                d="M4.5 12.75l6 6 9-13.5"
                                            />
                                            <path
                                                v-else
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                d="M9 12h6m-6 3h6m-6 3h4.5M16.5 3.75H18a2.25 2.25 0 012.25 2.25v12.75A2.25 2.25 0 0118 21H6a2.25 2.25 0 01-2.25-2.25V6A2.25 2.25 0 016 3.75h1.5m9 0v.75A1.5 1.5 0 0115 6h-6a1.5 1.5 0 01-1.5-1.5v-.75m9 0a1.5 1.5 0 00-1.5-1.5h-6a1.5 1.5 0 00-1.5 1.5"
                                            />
                                        </svg>
                                        {{ copiedFeedId === f.id ? $t('feeds.copySourceDone') : $t('feeds.copySource') }}
                                    </button>
                                    <NuxtLink
                                        :to="{ path: '/', query: { source: f.crawlKey } }"
                                        class="btn btn-ghost btn-xs gap-1"
                                        :data-testid="`feed-source-focus-${f.id}`"
                                        :aria-label="$t('feeds.focusSourceAria', { name: f.displayTitle || f.feedUrl })"
                                    >
                                        {{ $t('feeds.focusSource') }}
                                    </NuxtLink>
                                </div>
                                <FeedSourceHealthSummary
                                    :latest="latestByFeedId[f.id] ?? null"
                                />
                                <FeedSourceStatsRow
                                    :stats="statsByFeedId[f.id] ?? null"
                                />
                                <FeedSourceWeighting
                                    :feed-id="f.id"
                                    :value="preferenceByFeedId[f.id] ?? 0"
                                    @update="(v) => applyPreferenceLocally(f.id, v)"
                                />
                            </div>
                        </details>
                    </li>
                </ul>
            </section>

            <div
                v-else
                class="alert alert-info alert-soft shadow-sm"
                role="status"
                data-testid="feeds-empty-alert"
            >
                <span class="text-center text-sm text-[var(--color-base-content)]">{{ $t('feeds.emptyList') }}</span>
            </div>
        </div>
    </div>
</template>
