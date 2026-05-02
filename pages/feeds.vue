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
                <ul class="list rounded-box border border-[var(--infl0-panel-border)]" data-testid="feeds-source-list">
                    <li
                        v-for="f in feedList"
                        :key="f.id"
                        class="list-row items-start gap-3 px-4 py-3"
                        :data-feed-id="f.id"
                    >
                        <div class="list-col-grow min-w-0 break-all">
                            <div class="text-sm font-medium text-[var(--infl0-panel-text)]">
                                {{ f.displayTitle || f.feedUrl }}
                            </div>
                            <div
                                v-if="f.displayTitle"
                                class="infl0-panel-muted mt-0.5 font-mono text-xs leading-snug"
                            >
                                {{ f.feedUrl }}
                            </div>
                        </div>
                        <button
                            type="button"
                            class="btn btn-ghost btn-xs shrink-0 text-[var(--color-error)]"
                            :disabled="removingId === f.id"
                            :data-testid="`feed-remove-${f.id}`"
                            @click="removeFeed(f.id)"
                        >
                            {{ removingId === f.id ? $t('common.loading') : $t('feeds.remove') }}
                        </button>
                    </li>
                </ul>
            </section>

            <div v-else class="alert border-[var(--infl0-panel-border)] bg-[var(--infl0-panel-bg)]" role="status">
                <span class="text-sm text-[var(--infl0-panel-text)]">{{ $t('feeds.emptyList') }}</span>
            </div>
        </div>
    </div>
</template>
