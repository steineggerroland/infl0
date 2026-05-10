<script setup lang="ts">
import type { FeedSourceHealthLatest } from '~/types/feed-source-health'
import { formatRelativeClock } from '~/utils/relative-time'
import {
    isKnownTkcSourceHealthStatus,
    normalizeSourceHealthKey,
    sourceHealthDataAttribute,
    sourceHealthStatusDotClass,
} from '~/utils/source-health-display'

const props = defineProps<{
    latest: FeedSourceHealthLatest | null
}>()

const { t, locale } = useI18n()

/**
 * Calm, focused source-health summary.
 *
 * The earlier version of this component stacked nine independent text fields
 * (status, pipeline state, reason, help-what, help-action, three timestamps,
 * run outcome, counts, streak, attention) in three different font sizes.
 * It looked busy because we were showing operator-grade telemetry to end
 * users who only need to know:
 *
 *   1. What's going on with this source? (status line)
 *   2. What does that mean for me, and what can I do? (single helper sentence)
 *   3. When was the last/next check? (two muted timestamps)
 *   4. Is there a real error message? (only when present)
 *   5. Did an operator flag this source? (attention banner, only when set)
 *
 * The block uses a single body size (`text-sm`) plus a muted secondary tier
 * (`text-xs`) for low-priority context. Differentiation comes from weight and
 * colour, not from a third or fourth font size.
 */

const healthDataAttr = computed(() => sourceHealthDataAttribute(props.latest))

const statusDotClass = computed(() =>
    sourceHealthStatusDotClass(normalizeSourceHealthKey(props.latest?.sourceHealthStatus ?? null)),
)

const healthKey = computed(() => normalizeSourceHealthKey(props.latest?.sourceHealthStatus ?? null))

const healthLabel = computed(() => {
    if (!props.latest) {
        return t('feeds.health.noSnapshot')
    }
    const raw = props.latest.sourceHealthStatus
    if (raw == null || raw.trim() === '') {
        return t('feeds.health.healthUnknown')
    }
    const k = healthKey.value ?? ''
    if (k && isKnownTkcSourceHealthStatus(k)) {
        return t(`feeds.health.values.${k}`)
    }
    return t('feeds.health.valueRaw', { value: raw.trim() })
})

/**
 * Combine `feeds.health.help.<status>.what` + `.action` into one sentence so
 * the user reads a single calm paragraph instead of two short lines stacked
 * on top of each other. Returns `null` for `healthy` (no help texts) or when
 * the status is unknown.
 */
const helperText = computed(() => {
    const k = healthKey.value
    if (!k) return null
    const whatKey = `feeds.health.help.${k}.what`
    const actionKey = `feeds.health.help.${k}.action`
    const what = t(whatKey)
    const action = t(actionKey)
    const hasWhat = what !== whatKey
    const hasAction = action !== actionKey
    if (!hasWhat && !hasAction) return null
    if (hasWhat && hasAction) return `${what} ${action}`
    return hasWhat ? what : action
})

function rel(iso: string | null | undefined) {
    if (!iso) return null
    return formatRelativeClock(iso, locale.value)
}

type TimestampLine = {
    key: 'last-check' | 'next-check'
    iso: string
    label: string
    title: string
}

const timestampLines = computed<TimestampLine[]>(() => {
    const lines: TimestampLine[] = []
    const last = props.latest?.lastCrawlFinishedAt
    const next = props.latest?.nextAllowedCrawlAt
    const lastRel = rel(last)
    const nextRel = rel(next)
    if (lastRel && last) {
        lines.push({
            key: 'last-check',
            iso: last,
            label: t('feeds.health.lastCheckLine', { when: lastRel.label }),
            title: lastRel.title,
        })
    }
    if (nextRel && next) {
        lines.push({
            key: 'next-check',
            iso: next,
            label: t('feeds.health.nextCheckLine', { when: nextRel.label }),
            title: nextRel.title,
        })
    }
    return lines
})

const errorMessage = computed(() => {
    const raw = props.latest?.lastCrawlError
    if (!raw) return null
    const trimmed = raw.trim()
    return trimmed === '' ? null : trimmed
})

/**
 * Operator attention is a separate signal from the health status: TKC may flag
 * a source for a follow-up that is not user-actionable. We translate known
 * codes from `feeds.health.operatorReasons.*`; unknown / seed / fixture codes
 * fall back to a generic reassurance.
 */
function userFacingAttentionReason(raw: string | null | undefined): string | null {
    if (!raw?.trim()) return t('feeds.health.attentionGeneric')
    const s = raw.trim()
    if (/^(seed_|e2e_|fixture_|contract_)/i.test(s)) return t('feeds.health.attentionGeneric')
    const slug = s.toLowerCase().replace(/\s+/g, '_')
    const key = `feeds.health.operatorReasons.${slug}`
    const msg = t(key)
    if (msg !== key) return msg
    return t('feeds.health.attentionGeneric')
}

const attentionLine = computed(() => {
    if (!props.latest?.operatorAttention) return null
    return userFacingAttentionReason(props.latest.operatorAttentionReason)
})
</script>

<template>
    <div
        class="space-y-2 text-sm"
        data-testid="feed-source-health-detail"
        :data-source-health="healthDataAttr"
    >
        <!--
          Dot + label as a flex row. `my-auto` on the dot consumes the free
          cross-axis space evenly above and below it, so the dot sits in the
          vertical centre of the row regardless of font metrics or the
          baseline-vs-x-height offset that `vertical-align: middle` would
          otherwise leave behind.
        -->
        <p class="flex gap-2">
            <span
                :class="['my-auto', statusDotClass]"
                role="img"
                :aria-label="healthLabel"
                data-testid="feed-source-health-dot"
            />
            <span
                class="font-medium text-[var(--infl0-panel-text)]"
                data-testid="feed-source-health-label"
            >{{ healthLabel }}</span>
        </p>
        <p
            v-if="helperText"
            class="text-[var(--infl0-panel-text)]"
            data-testid="feed-source-health-help"
        >
            {{ helperText }}
        </p>
        <div
            v-if="timestampLines.length"
            class="infl0-panel-muted space-y-0.5 text-xs leading-snug"
        >
            <p
                v-for="ts in timestampLines"
                :key="ts.key"
                :data-testid="`feed-source-health-${ts.key}`"
            >
                <time
                    :datetime="ts.iso"
                    :title="ts.title"
                    class="tooltip tooltip-bottom"
                    :data-tip="ts.title"
                >{{ ts.label }}</time>
            </p>
        </div>
        <div
            v-if="errorMessage"
            class="infl0-panel-muted space-y-1 rounded border border-[color-mix(in_srgb,var(--color-error)_30%,var(--infl0-panel-border))] bg-[color-mix(in_srgb,var(--color-error)_8%,transparent)] px-2 py-1.5 text-xs"
            data-testid="feed-source-health-error"
        >
            <p class="font-medium text-[var(--infl0-panel-text)]">
                {{ $t('feeds.health.errorIntro') }}
            </p>
            <p class="font-mono whitespace-pre-wrap break-all text-[var(--infl0-panel-text)]">
                {{ errorMessage }}
            </p>
        </div>
        <p
            v-if="attentionLine"
            role="status"
            class="rounded-lg border border-[color-mix(in_srgb,var(--color-warning)_45%,var(--infl0-panel-border))] bg-[color-mix(in_srgb,var(--color-warning)_12%,transparent)] px-2 py-1.5"
            data-testid="feed-source-health-attention"
        >
            {{ attentionLine }}
        </p>
    </div>
</template>
