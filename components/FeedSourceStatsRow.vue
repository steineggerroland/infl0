<script setup lang="ts">
import { formatRelativeClock } from '~/utils/relative-time'

export type FeedStatsRow = {
    feedId: string
    inflowCount: number
    readCount: number
    unreadCount: number
    sharePercent: number
    lastReadAt: string | null
}

const props = defineProps<{ stats: FeedStatsRow | null }>()

const { t, locale } = useI18n()

const hasStats = computed(() => props.stats != null)
const empty = computed(() => !!props.stats && props.stats.inflowCount === 0)

const sharePercentDisplay = computed(() => {
    if (!props.stats) return '0'
    const v = props.stats.sharePercent
    return Number.isInteger(v) ? String(v) : v.toFixed(1)
})

const lastReadRel = computed(() => {
    const iso = props.stats?.lastReadAt ?? null
    if (!iso) return null
    return formatRelativeClock(iso, locale.value)
})
</script>

<template>
    <template v-if="hasStats">
    <p
        v-if="empty"
        class="infl0-panel-muted text-xs leading-snug"
        data-testid="feed-source-stats-empty"
    >
        {{ $t('feeds.health.stats.noInflow') }}
    </p>
    <dl
        v-else
        class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs"
        data-testid="feed-source-stats"
        :data-feed-id="stats!.feedId"
    >
        <div class="flex items-baseline gap-1">
            <dt class="infl0-panel-muted">{{ t('feeds.health.stats.share') }}:</dt>
            <dd
                class="font-medium text-[var(--infl0-panel-text)] tooltip tooltip-bottom"
                :data-tip="t('feeds.health.stats.shareTooltip')"
                :data-share-percent="stats!.sharePercent"
            >{{ t('feeds.health.stats.shareValue', { percent: sharePercentDisplay }) }}</dd>
        </div>
        <div class="flex items-baseline gap-1">
            <dt class="sr-only">{{ t('feeds.health.stats.readTooltip') }}</dt>
            <dd
                class="font-medium text-[var(--infl0-panel-text)] tooltip tooltip-bottom"
                :data-tip="t('feeds.health.stats.readTooltip')"
            >
                {{
                    t('feeds.health.stats.readOf', {
                        read: stats!.readCount,
                        total: stats!.inflowCount,
                    })
                }}
            </dd>
        </div>
        <p
            v-if="lastReadRel"
            class="infl0-panel-muted basis-full text-[0.7rem] leading-tight"
        >
            <time
                :datetime="stats!.lastReadAt!"
                :title="lastReadRel.title"
            >{{ t('feeds.health.stats.lastRead', { when: lastReadRel.label }) }}</time>
        </p>
    </dl>
    </template>
</template>
