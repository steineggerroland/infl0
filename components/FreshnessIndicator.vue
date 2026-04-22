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
      return { label: t('freshness.unknown'), tone: 'opacity-70' }
    }
    if (isToday(date)) {
      return { label: t('freshness.today'), tone: 'opacity-100' }
    }
    if (isYesterday(date)) {
      return { label: t('freshness.yesterday'), tone: 'opacity-95' }
    }
    if (isThisWeek(date)) {
      return { label: t('freshness.thisWeek'), tone: 'opacity-85' }
    }
    const daysAgo = differenceInCalendarDays(new Date(), date)
    if (daysAgo >= 7 && daysAgo < 14) {
      return { label: t('freshness.lastWeek'), tone: 'opacity-75' }
    }
    return { label: t('freshness.older'), tone: 'opacity-70' }
  } catch {
    return { label: t('freshness.unknown'), tone: 'opacity-70' }
  }
})
</script>

<template>
  <span class="align-middle text-[0.9em] text-current" :class="freshness.tone">
    {{ freshness.label }}
  </span>
</template>
