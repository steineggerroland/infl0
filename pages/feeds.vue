<script setup lang="ts">
definePageMeta({
    layout: 'app',
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
    <div class="min-h-dvh bg-gray-400 text-gray-100 flex flex-col items-center px-4 pb-12 pt-16">
        <div class="w-full max-w-lg space-y-8">
            <header class="text-center text-gray-900">
                <h1 class="text-2xl font-semibold">{{ $t('feeds.title') }}</h1>
                <p class="mt-2 text-sm text-gray-800">
                    {{ $t('feeds.intro') }}
                </p>
            </header>

            <section class="rounded-xl border border-gray-700 bg-gray-900/95 p-6 shadow-xl">
                <h2 class="text-sm font-medium text-gray-300 mb-4">{{ $t('feeds.addSection') }}</h2>
                <form class="flex flex-col gap-4" @submit.prevent="addFeed">
                    <label class="flex flex-col gap-1 text-sm">
                        <span class="text-gray-400">{{ $t('feeds.feedUrl') }}</span>
                        <input
                            v-model="newFeedUrl"
                            type="url"
                            required
                            :placeholder="$t('feeds.feedUrlPlaceholder')"
                            class="input input-bordered w-full bg-gray-800 border-gray-600"
                        >
                    </label>
                    <label class="flex flex-col gap-1 text-sm">
                        <span class="text-gray-400">{{ $t('feeds.displayNameOptional') }}</span>
                        <input
                            v-model="newDisplayTitle"
                            type="text"
                            class="input input-bordered w-full bg-gray-800 border-gray-600"
                        >
                    </label>
                    <p v-if="addError" class="text-sm text-red-400">{{ addError }}</p>
                    <button type="submit" class="btn btn-primary w-full" :disabled="addPending">
                        {{ addPending ? $t('common.loading') : $t('feeds.saveSource') }}
                    </button>
                </form>
            </section>

            <section v-if="feedList.length > 0" class="rounded-xl border border-gray-700 bg-gray-900/95 p-6 shadow-xl">
                <h2 class="text-sm font-medium text-gray-300 mb-4">{{ $t('feeds.listSection') }}</h2>
                <ul class="text-sm space-y-3">
                    <li
                        v-for="f in feedList"
                        :key="f.id"
                        class="flex items-start justify-between gap-3 border-b border-gray-700/80 pb-3 last:border-0 last:pb-0"
                    >
                        <div class="min-w-0 flex-1 break-all">
                            <div class="font-medium text-gray-200">
                                {{ f.displayTitle || f.feedUrl }}
                            </div>
                            <div
                                v-if="f.displayTitle"
                                class="mt-0.5 text-xs text-gray-500 break-all font-mono"
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

            <p v-else class="text-center text-sm text-gray-800">
                {{ $t('feeds.emptyList') }}
            </p>

            <AppFooterShortcuts test-id="feeds-page-footer" />
        </div>
    </div>
</template>
