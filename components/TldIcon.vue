<script setup lang="ts">
import { sanitizeNameIconInitials } from '~/utils/name-icon-initials'

const props = defineProps<{
  tld: string
}>()

const shortHand = computed(() => {
  const domain = props.tld.split('.')[0] ?? ''
  return sanitizeNameIconInitials(
    domain
      .split('-')
      .map((word) => word.slice(0, 1))
      .join('')
      .concat(domain.slice(1, 2))
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
