<script setup lang="ts">
import { differenceInCalendarDays, isToday, isYesterday, isThisWeek } from 'date-fns'

const { t } = useI18n()

const props = defineProps({
    publishedAt: {
        type: String,
        required: true,
    },
})

const freshness = computed(() => {
    try {
        const date = new Date(props.publishedAt)
        if (Number.isNaN(date.getTime())) {
            return { label: t('freshness.unknown'), color: 'text-gray-400' }
        }
        if (isToday(date)) {
            return { label: t('freshness.today'), color: 'text-green-500' }
        }
        if (isYesterday(date)) {
            return { label: t('freshness.yesterday'), color: 'text-green-400' }
        }
        if (isThisWeek(date)) {
            return { label: t('freshness.thisWeek'), color: 'text-blue-400' }
        }
        const daysAgo = differenceInCalendarDays(new Date(), date)
        if (daysAgo >= 7 && daysAgo < 14) {
            return { label: t('freshness.lastWeek'), color: 'text-gray-300' }
        }
        return { label: t('freshness.older'), color: 'text-gray-400' }
    } catch {
        console.error(typeof props.publishedAt)
        return { label: t('freshness.unknown'), color: 'text-gray-400' }
    }
})
</script>

<template>
    <span :class="freshness.color">
        {{ freshness.label }}
    </span>
</template>
