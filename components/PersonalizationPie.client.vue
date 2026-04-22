<script setup lang="ts">
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js'
import { computed } from 'vue'
import { Pie } from 'vue-chartjs'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps<{
  title: string
  slices: Array<{ key: string; label: string; weight: number; share: number }>
  labelResolver: (slice: { key: string; label: string }) => string
}>()

const palette = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#64748b',
  '#84cc16',
  '#f97316',
  '#06b6d4',
  '#d946ef',
  '#78716c',
  '#0ea5e9',
]

const chartData = computed(() => ({
  labels: props.slices.map((s) => props.labelResolver(s)),
  datasets: [
    {
      data: props.slices.map((s) => Math.round(s.share * 10000) / 100),
      backgroundColor: props.slices.map((_, i) => palette[i % palette.length]),
      borderWidth: 0,
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
      position: 'bottom' as const,
      labels: {
        color: 'var(--infl0-panel-text-muted)',
        boxWidth: 12,
        font: { size: 11 },
      },
    },
    tooltip: {
      callbacks: {
        label(ctx: { label?: string; parsed: number }) {
          const v = typeof ctx.parsed === 'number' ? ctx.parsed : Number(ctx.parsed)
          return `${ctx.label ?? ''}: ${v.toFixed(1)}%`
        },
      },
    },
  },
}))
</script>

<template>
  <section class="infl0-panel p-4">
    <h2 class="infl0-section-label mb-3 text-sm font-semibold uppercase tracking-wide">
      {{ title }}
    </h2>
    <div v-if="slices.length === 0" class="infl0-panel-muted text-sm">
      —
    </div>
    <div v-else class="mx-auto h-56 w-full max-w-sm">
      <Pie :data="chartData" :options="chartOptions" />
    </div>
    <ul v-if="slices.length" class="infl0-panel-muted mt-3 space-y-1 text-xs">
      <li
        v-for="(slice, idx) in slices"
        :key="slice.key"
        class="flex items-center justify-between gap-3"
      >
        <div class="min-w-0 truncate">
          <span
            class="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle"
            :style="{ backgroundColor: palette[idx % palette.length] }"
          />
          {{ labelResolver(slice) }}
        </div>
        <div class="infl0-section-label shrink-0 font-mono">
          {{ (slice.share * 100).toFixed(1) }}% ({{ slice.weight.toFixed(3) }})
        </div>
      </li>
    </ul>
  </section>
</template>
