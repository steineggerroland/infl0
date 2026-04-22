<script setup lang="ts">
import { sanitizeNameIconInitials } from '~/utils/name-icon-initials'

const props = defineProps<{
  name: string
}>()

const shortHand = computed(() => {
  const name = (props.name ?? '').replaceAll(/([^a-zA-Z0-9])/g, ' ')
  return sanitizeNameIconInitials(
    name
      .split(' ')
      .map((word) => word.slice(0, 1))
      .join('')
      .concat(name.slice(1, 2))
      .slice(0, 2)
      .toUpperCase(),
  )
})
</script>

<template>
  <span
    class="inline-flex h-[1em] w-[1em] items-center justify-center align-middle font-mono text-[0.62em] font-black leading-none text-current"
    aria-hidden="true"
  >{{ shortHand }}</span>
</template>
