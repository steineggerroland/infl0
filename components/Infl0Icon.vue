<script setup lang="ts">
import { infl0IconMarkup, type Infl0IconName } from '~/utils/icons/registry'

const props = withDefaults(
  defineProps<{
    /** Semantic icon id from `utils/icons/registry.ts`. */
    name: Infl0IconName
    /** Accessible name; omit when decorative (parent has visible text or `aria-label`). */
    label?: string
    /** Visual size; defaults to one line of text (`1em`). */
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { label: undefined, size: 'md' },
)

const sizeClass = computed(() => {
  if (props.size === 'sm') return 'h-3 w-3'
  if (props.size === 'lg') return 'h-5 w-5'
  return 'h-[1em] w-[1em]'
})

const markup = computed(() => infl0IconMarkup(props.name))

defineOptions({ inheritAttrs: false })
</script>

<template>
  <span
    class="infl0-icon inline-flex shrink-0 items-center justify-center align-middle text-current"
    :class="[$attrs.class, sizeClass]"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : true"
  >
    <!-- Trusted static assets from `assets/icons/` only -->
    <!-- eslint-disable-next-line vue/no-v-html -->
    <span class="infl0-icon__glyph inline-flex h-full w-full [&>svg]:h-full [&>svg]:w-full" v-html="markup" />
  </span>
</template>
