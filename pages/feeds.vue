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

            <section class="infl0-panel p-6">
                <h2 class="mb-4 text-sm font-medium text-[var(--infl0-panel-text)]">{{
                    $t('feeds.addSection')
                }}</h2>
                <form class="flex flex-col gap-4" @submit.prevent="addFeed">
                    <label class="flex flex-col gap-1 text-sm text-[var(--infl0-panel-text)]">
                        <span class="infl0-panel-muted">{{ $t('feeds.feedUrl') }}</span>
                        <input
                            v-model="newFeedUrl"
                            type="url"
                            required
                            :placeholder="$t('feeds.feedUrlPlaceholder')"
                            class="input input-bordered infl0-field w-full"
                        >
                    </label>
                    <label class="flex flex-col gap-1 text-sm text-[var(--infl0-panel-text)]">
                        <span class="infl0-panel-muted">{{ $t('feeds.displayNameOptional') }}</span>
                        <input
                            v-model="newDisplayTitle"
                            type="text"
                            class="input input-bordered infl0-field w-full"
                        >
                    </label>
                    <p v-if="addError" class="text-sm text-red-400">{{ addError }}</p>
                    <button type="submit" class="btn btn-primary w-full" :disabled="addPending">
                        {{ addPending ? $t('common.loading') : $t('feeds.saveSource') }}
                    </button>
                </form>
            </section>

            <section v-if="feedList.length > 0" class="infl0-panel p-6">
                <h2 class="mb-4 text-sm font-medium text-[var(--infl0-panel-text)]">{{
                    $t('feeds.listSection')
                }}</h2>
                <ul class="space-y-3 text-sm">
                    <li
                        v-for="f in feedList"
                        :key="f.id"
                        class="flex items-start justify-between gap-3 border-b border-[var(--infl0-panel-border)]/80 pb-3 last:border-0 last:pb-0"
                    >
                        <div class="min-w-0 flex-1 break-all">
                            <div class="font-medium text-[var(--infl0-panel-text)]">
                                {{ f.displayTitle || f.feedUrl }}
                            </div>
                            <div
                                v-if="f.displayTitle"
                                class="infl0-panel-muted mt-0.5 break-all font-mono text-xs"
                            >
                                {{ f.feedUrl }}
                            </div>
                        </div>
                        <button
                            type="button"
                            class="btn btn-ghost btn-xs shrink-0 text-red-400 hover:bg-red-950/40 hover:text-red-300"
                            :disabled="removingId === f.id"
                            @click="removeFeed(f.id)"
                        >
                            {{ removingId === f.id ? $t('common.loading') : $t('feeds.remove') }}
                        </button>
                    </li>
                </ul>
            </section>

            <p v-else class="infl0-canvas-muted text-center text-sm">
                {{ $t('feeds.emptyList') }}
            </p>
        </div>
    </div>
</template>
