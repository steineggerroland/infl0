<script setup lang="ts">
definePageMeta({
    layout: 'app',
    appFooter: { testId: 'feeds-page-footer' },
})

type UserFeedRow = {
    id: string
    feedUrl: string
    displayTitle: string | null
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

watch(
    feedsFetchError,
    (err) => {
        if (!import.meta.client || !err) return
        const { message } = parseFetchError(err)
        const text = message.trim() || t('feeds.errorSources')
        toast.push({
            message: text,
            variant: 'error',
            durationMs: 0,
            actions: [
                {
                    label: t('common.retry'),
                    onClick: () => {
                        void refreshFeeds()
                    },
                },
            ],
        })
    },
    { flush: 'post', immediate: true },
)

const feedList = computed(() => feedsData.value?.feeds ?? [])

const newFeedUrl = ref('')
const newDisplayTitle = ref('')
const addError = ref('')
const addPending = ref(false)
const removingId = ref<string | null>(null)

async function addFeed() {
    addError.value = ''
    addPending.value = true
    try {
        await $fetch('/api/feeds', {
            method: 'POST',
            body: {
                feedUrl: newFeedUrl.value.trim(),
                displayTitle: newDisplayTitle.value.trim() || undefined,
            },
            credentials: 'include',
        })
        newFeedUrl.value = ''
        newDisplayTitle.value = ''
        await refreshFeeds()
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

async function removeFeed(id: string) {
    removingId.value = id
    try {
        await $fetch(`/api/feeds/${id}`, { method: 'DELETE', credentials: 'include' })
        await refreshFeeds()
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
            <section class="infl0-panel p-6">
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
                class="infl0-panel p-6"
                aria-labelledby="feeds-list-heading"
            >
                <h2
                    id="feeds-list-heading"
                    class="mb-3 text-sm font-medium text-[var(--infl0-panel-text)]"
                >
                    {{ $t('feeds.listSection') }}
                </h2>
                <ul
                    class="list divide-y divide-[var(--infl0-panel-border)] rounded-box border border-[var(--infl0-panel-border)] p-0"
                    data-testid="feeds-source-list"
                >
                    <li
                        v-for="f in feedList"
                        :key="f.id"
                        class="flex gap-3 px-4 py-3"
                        :data-feed-id="f.id"
                    >
                        <div class="min-w-0 flex-1 space-y-1">
                            <div
                                v-if="f.displayTitle"
                                class="text-sm font-medium text-[var(--infl0-panel-text)] hyphens-none [overflow-wrap:anywhere]"
                            >
                                {{ f.displayTitle }}
                            </div>
                            <!-- One line + horizontal scroll avoids breaking URLs mid-token -->
                            <div class="-mx-0.5 max-w-full px-0.5">
                                <div
                                    class="max-w-full overflow-x-auto overscroll-x-contain whitespace-nowrap font-mono text-xs leading-normal [scrollbar-width:thin]"
                                    :class="f.displayTitle ? 'infl0-panel-muted' : 'text-sm font-medium text-[var(--infl0-panel-text)]'"
                                    :title="f.feedUrl"
                                >
                                    {{ f.feedUrl }}
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            class="btn btn-square btn-ghost btn-sm tooltip tooltip-left shrink-0 text-[var(--color-error)] hover:bg-[color-mix(in_srgb,var(--color-error)_14%,transparent)]"
                            :data-tip="$t('feeds.remove')"
                            :disabled="removingId === f.id"
                            :aria-label="$t('feeds.remove')"
                            :aria-busy="removingId === f.id"
                            :data-testid="`feed-remove-${f.id}`"
                            @click="removeFeed(f.id)"
                        >
                            <span
                                v-if="removingId === f.id"
                                class="loading loading-spinner loading-md text-[var(--color-error)]"
                                aria-hidden="true"
                            />
                            <svg
                                v-else
                                xmlns="http://www.w3.org/2000/svg"
                                class="size-[1.2em]"
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
