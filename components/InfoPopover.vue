<script setup lang="ts">
import { defineShortcuts } from '~/composables/useShortcuts'
import { useModalStackRegistration } from '~/composables/useModalStack'

/**
 * Accessible, self-contained popover for short explanations in context.
 *
 * Guidelines (see docs/CONTENT_AND_A11Y.md):
 * - Use for *short* plain-language explanations next to a control.
 * - Pair with a link to the full help entry for users who want more.
 * - Keep the trigger's accessible name descriptive (avoid "info", "?").
 *
 * The `Escape` dismissal is routed through `defineShortcuts` so the
 * popover obeys the same modifier-key invariant as the rest of the app
 * (chords like `Cmd+Escape` are the browser/OS's business, not ours).
 * While the popover is open it registers with `useModalStack` so
 * background shortcuts – timeline `w`/`s` navigation in particular –
 * stay silent and do not mutate content behind the overlay.
 */

const props = defineProps<{
    /** Accessible label for the trigger button (visually hidden unless no icon slot is given). */
    triggerLabel: string
    /** Optional extra class for the trigger, e.g. to match surrounding UI. */
    triggerClass?: string
    /** Optional id for the popover content (useful for aria-describedby on related controls). */
    panelId?: string
    /**
     * Controls how the popover aligns horizontally relative to the trigger.
     * Defaults to "start" (logical start edge).
     */
    align?: 'start' | 'end' | 'center'
}>()

const open = ref(false)
const root = ref<HTMLDivElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)

const internalPanelId = useId()
const panelIdValue = computed(() => props.panelId ?? internalPanelId)

/**
 * Resolved alignment used at render time. We start from the consumer-provided
 * preference and may flip it on `open` if the trigger is too close to the
 * viewport edge for the panel to fit (e.g. a trigger near the right edge of
 * a phone viewport with a default `start` alignment would render the panel
 * off-screen, forcing horizontal scrolling).
 */
const resolvedAlign = ref<'start' | 'end' | 'center'>(props.align ?? 'start')

watch(
    () => props.align,
    (next) => {
        // Keep the resolved value in sync with prop changes from the consumer
        // while the popover is closed. While it's open we leave the chosen
        // alignment in place to avoid the panel jumping mid-interaction.
        if (!open.value) {
            resolvedAlign.value = next ?? 'start'
        }
    },
)

/**
 * Pick the alignment that keeps the panel within the viewport, preferring
 * the consumer's choice when it fits. Falls back to the preferred side as a
 * last resort if neither side has enough room (the width clamp on the panel
 * already protects against overflow in that case).
 */
function pickFittingAlignment(preferred: 'start' | 'end' | 'center'): 'start' | 'end' | 'center' {
    if (preferred === 'center') return 'center'
    const triggerEl = trigger.value
    if (!triggerEl || typeof window === 'undefined') return preferred
    const rect = triggerEl.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    // Mirrors the panel's Tailwind clamp: `w-[min(20rem, calc(100vw - 2rem))]`.
    const panelMaxPx = Math.min(20 * 16, viewportWidth - 32)
    const safeGutter = 16
    // `start-0` aligns panel.left to trigger.left → fits if it doesn't overflow the right edge.
    const startFits = rect.left + panelMaxPx <= viewportWidth - safeGutter
    // `end-0` aligns panel.right to trigger.right → fits if it doesn't overflow the left edge.
    const endFits = rect.right - panelMaxPx >= safeGutter

    if (preferred === 'end') {
        if (endFits) return 'end'
        return startFits ? 'start' : 'end'
    }
    if (startFits) return 'start'
    return endFits ? 'end' : 'start'
}

async function toggle() {
    if (open.value) {
        void close(true)
        return
    }
    open.value = true
    // Wait for the panel to render so getBoundingClientRect() reflects the
    // current trigger placement, then choose the alignment that fits.
    await nextTick()
    resolvedAlign.value = pickFittingAlignment(props.align ?? 'start')
}

async function close(returnFocus = true) {
    if (!open.value) return
    open.value = false
    if (returnFocus) {
        await nextTick()
        trigger.value?.focus()
    }
}

function onDocumentClick(event: MouseEvent) {
    if (!open.value) return
    const target = event.target as Node | null
    if (target && root.value && !root.value.contains(target)) {
        void close(false)
    }
}

// `onMounted` / `onBeforeUnmount` only run on the client, so no SSR guard
// is needed. This also lets the component be mounted directly in Vitest.
onMounted(() => {
    document.addEventListener('click', onDocumentClick, { capture: true })
})

onBeforeUnmount(() => {
    document.removeEventListener('click', onDocumentClick, { capture: true })
})

defineShortcuts(
    {
        escape: (event) => {
            event.preventDefault()
            void close(true)
        },
    },
    {
        // Only active while the popover is open; otherwise `Escape`
        // presses belong to whoever owns the current surface.
        when: () => open.value,
        // A dismissal key must still work when the focus is inside an
        // `<input>` or `<textarea>` within the popover content.
        skipEditableTarget: true,
    },
)

useModalStackRegistration(open)

const alignClass = computed(() => {
    switch (resolvedAlign.value) {
        case 'end':
            return 'end-0'
        case 'center':
            return 'start-1/2 -translate-x-1/2'
        case 'start':
        default:
            return 'start-0'
    }
})
</script>

<template>
    <div ref="root" class="relative inline-flex">
        <button
            ref="trigger"
            type="button"
            :class="['info-popover__trigger', triggerClass]"
            :aria-expanded="open"
            :aria-controls="panelIdValue"
            :aria-label="triggerLabel"
            aria-haspopup="dialog"
            @click="toggle"
        >
            <slot name="trigger">
                <span aria-hidden="true" class="inline-flex items-center gap-1">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="h-4 w-4"
                    >
                        <circle cx="12" cy="12" r="9"/>
                        <path d="M12 8h.01"/>
                        <path d="M11 12h1v5h1"/>
                    </svg>
                </span>
            </slot>
        </button>
        <div
            v-show="open"
            :id="panelIdValue"
            role="dialog"
            aria-modal="false"
            :aria-label="triggerLabel"
            :class="[
                'info-popover__panel infl0-chrome-panel absolute top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-xl border p-4 text-sm shadow-2xl ring-1 ring-black/50',
                alignClass,
            ]"
        >
            <slot />
            <div class="mt-3 flex justify-end">
                <button
                    type="button"
                    class="infl0-menu-link rounded-md px-2 py-1 text-xs"
                    @click="close(true)"
                >
                    {{ $t('common.close') }}
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.info-popover__trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    padding: 0.125rem;
    color: inherit;
}

.info-popover__trigger:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
}
</style>
