<script setup lang="ts">
import { isToday, isYesterday, isThisWeek, formatDistanceToNow, parseISO } from 'date-fns'

// Props: Datum des Artikels
const props = defineProps({
    publishedAt: {
        type: String,
        required: true,
    },
})

// Berechnung des Aktualitätsindikators
const freshness = computed(() => {
    try {
        const date = new Date(props.publishedAt)
        if (isToday(date)) {
            return { label: 'Today', color: 'text-green-500' }
        } else if (isYesterday(date)) {
            return { label: 'Yesterday', color: 'text-green-400' }
        } else if (isThisWeek(date)) {
            return { label: 'This Week', color: 'text-blue-400' }
        } else {
            const weeksAgo = formatDistanceToNow(date, { addSuffix: false })
            return weeksAgo.includes('week')
                ? { label: 'Last Week', color: 'text-gray-300' }
                : { label: 'Older', color: 'text-gray-400' }
        }
    } catch {
        console.error(typeof props.publishedAt);

        return ''
    }
})
</script>

<template>
    <span :class="freshness.color">
        {{ freshness.label }}
    </span>
</template>