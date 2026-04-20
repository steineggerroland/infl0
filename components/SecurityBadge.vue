<script setup lang="ts">
/**
 * Inline lock + info chip that surfaces a security feature in plain language
 * and links to the matching help entry.
 *
 * Defaults describe the SRP-based password protection used on the login /
 * registration screens. Override via props to reuse for other features.
 *
 * See docs/CONTENT_AND_A11Y.md for the full guideline on when to introduce a
 * new badge (short, unobtrusive, always linked to a help entry).
 */

const { t } = useI18n()

const props = withDefaults(
    defineProps<{
        /** i18n prefix holding `label`, `short`, `details`, `readMore` strings. */
        i18nPrefix?: string
        /** Help page anchor, e.g. `passwordSafety`. */
        helpAnchor?: string
        /** Align the popover panel. */
        align?: 'start' | 'end' | 'center'
    }>(),
    {
        i18nPrefix: 'security.passwordBadge',
        helpAnchor: 'passwordSafety',
        align: 'start',
    },
)

const label = computed(() => t(`${props.i18nPrefix}.label`))
const short = computed(() => t(`${props.i18nPrefix}.short`))
const details = computed(() => t(`${props.i18nPrefix}.details`))
const readMore = computed(() => t(`${props.i18nPrefix}.readMore`))
</script>

<template>
    <div class="security-badge inline-flex items-center gap-2 rounded-full border border-emerald-700/60 bg-emerald-950/40 px-3 py-1.5 text-xs text-emerald-200">
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-4 w-4 shrink-0"
            aria-hidden="true"
        >
            <rect x="4" y="11" width="16" height="9" rx="2"/>
            <path d="M8 11V8a4 4 0 0 1 8 0v3"/>
        </svg>
        <span class="leading-snug">{{ short }}</span>
        <InfoPopover
            :trigger-label="label"
            :align="align"
            trigger-class="text-emerald-300 hover:text-emerald-200"
        >
            <p class="mb-3 leading-relaxed text-gray-100">{{ details }}</p>
            <NuxtLink
                :to="`/help#${helpAnchor}`"
                class="inline-flex items-center gap-1 text-sm text-emerald-300 underline-offset-2 hover:underline"
            >
                {{ readMore }}
                <span aria-hidden="true">→</span>
            </NuxtLink>
        </InfoPopover>
    </div>
</template>
