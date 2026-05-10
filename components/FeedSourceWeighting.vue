<script setup lang="ts">
import {
    SOURCE_PREFERENCE_MAX,
    SOURCE_PREFERENCE_MIN,
    SOURCE_PREFERENCE_STEP,
    SOURCE_PREFERENCE_STEPS,
    quantizeSourcePreference,
} from '~/utils/timeline-score-factors'

const props = defineProps<{
    feedId: string
    value: number
}>()

const emit = defineEmits<{
    update: [value: number]
}>()

const { t } = useI18n()
const toast = useToast()

const localValue = ref(quantizeSourcePreference(props.value) ?? 0)
const pending = ref(false)

watch(
    () => props.value,
    (next) => {
        const q = quantizeSourcePreference(next) ?? 0
        if (q !== localValue.value) localValue.value = q
    },
)

const labelText = computed(() => {
    const v = localValue.value
    if (v === 0) return t('feeds.health.weighting.currentBadge.fits')
    const amount = Math.abs(v).toFixed(2).replace(/\.?0+$/, '')
    return v > 0
        ? t('feeds.health.weighting.currentBadge.more', { amount })
        : t('feeds.health.weighting.currentBadge.less', { amount })
})

const labelTone = computed(() => {
    const v = localValue.value
    if (v === 0) return 'badge-ghost'
    return v > 0 ? 'badge-success' : 'badge-warning'
})

const ariaText = computed(() =>
    t('feeds.health.weighting.valueAria', { value: localValue.value.toFixed(2) }),
)

async function handleInput(e: Event) {
    const target = e.target as HTMLInputElement
    const raw = Number(target.value)
    const next = quantizeSourcePreference(raw)
    if (next === null) return
    if (next === localValue.value) return
    const previous = localValue.value
    localValue.value = next
    pending.value = true
    try {
        await $fetch(`/api/feeds/${props.feedId}/preference`, {
            method: 'PATCH',
            body: { value: next },
            credentials: 'include',
        })
        emit('update', next)
        toast.push({
            message: t('feeds.health.weighting.savedToast'),
            variant: 'success',
        })
    } catch {
        localValue.value = previous
        toast.push({
            message: t('feeds.health.weighting.errorToast'),
            variant: 'error',
            durationMs: 8000,
        })
    } finally {
        pending.value = false
    }
}
</script>

<template>
    <fieldset
        class="space-y-1.5"
        :data-testid="`feed-weighting-${feedId}`"
        :data-pref-value="localValue"
    >
        <legend class="flex items-center gap-1 text-xs font-medium text-[var(--infl0-panel-text)]">
            <span>{{ t('feeds.health.weighting.label') }}</span>
            <!--
              The hint is delivered differently per breakpoint:

              * On `md` and up the popover stays — it keeps the form
                compact on desktop where vertical space is at a premium.
              * On phone widths the popover trigger is hidden because a
                ~20 rem wide panel anchored to a trigger that sits in the
                middle of a 414 px viewport never has enough room on
                either side without overflowing the visible area. The
                same explanation is shown directly under the slider as a
                muted inline paragraph instead, which costs almost
                nothing because the disclosure body is already expanded
                and mobile users scroll vertically anyway.
            -->
            <InfoPopover
                class="hidden md:inline-flex"
                :trigger-label="t('feeds.health.weighting.hintTriggerAria')"
                trigger-class="text-[var(--infl0-panel-muted-text,inherit)] hover:text-[var(--infl0-panel-text)]"
                align="start"
            >
                <p class="leading-relaxed text-[var(--infl0-panel-text)]">
                    {{ t('feeds.health.weighting.hint') }}
                </p>
            </InfoPopover>
            <span class="badge badge-sm ml-1 align-middle" :class="labelTone">{{ labelText }}</span>
        </legend>
        <div class="flex items-center gap-2 text-[0.7rem] infl0-panel-muted">
            <span aria-hidden="true">{{ t('feeds.health.weighting.lessLabel') }}</span>
            <input
                :value="localValue"
                type="range"
                :min="SOURCE_PREFERENCE_MIN"
                :max="SOURCE_PREFERENCE_MAX"
                :step="SOURCE_PREFERENCE_STEP"
                :list="`feed-weighting-ticks-${feedId}`"
                class="range range-xs flex-1"
                :class="localValue > 0 ? 'range-success' : localValue < 0 ? 'range-warning' : 'range-neutral'"
                :aria-label="ariaText"
                :disabled="pending"
                @change="handleInput"
            >
            <span aria-hidden="true">{{ t('feeds.health.weighting.moreLabel') }}</span>
        </div>
        <datalist :id="`feed-weighting-ticks-${feedId}`">
            <option
                v-for="step in SOURCE_PREFERENCE_STEPS"
                :key="step"
                :value="step"
            />
        </datalist>
        <p
            class="infl0-panel-muted text-xs leading-snug md:hidden"
            data-testid="feed-weighting-hint-mobile"
        >
            {{ t('feeds.health.weighting.hint') }}
        </p>
    </fieldset>
</template>
