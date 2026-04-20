<script setup lang="ts">
/**
 * Accessible, self-contained popover for short explanations in context.
 *
 * Guidelines (see docs/CONTENT_AND_A11Y.md):
 * - Use for *short* plain-language explanations next to a control.
 * - Pair with a link to the full help entry for users who want more.
 * - Keep the trigger's accessible name descriptive (avoid "info", "?").
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

function toggle() {
    open.value = !open.value
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

function onKeydown(event: KeyboardEvent) {
    if (!open.value) return
    if (event.key === 'Escape') {
        event.preventDefault()
        void close(true)
    }
}

onMounted(() => {
    if (!import.meta.client) return
    document.addEventListener('click', onDocumentClick, { capture: true })
    document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
    if (!import.meta.client) return
    document.removeEventListener('click', onDocumentClick, { capture: true })
    document.removeEventListener('keydown', onKeydown)
})

const alignClass = computed(() => {
    switch (props.align) {
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
                'info-popover__panel absolute top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-gray-600 bg-gray-950 p-4 text-sm text-gray-100 shadow-2xl ring-1 ring-black/50',
                alignClass,
            ]"
        >
            <slot />
            <div class="mt-3 flex justify-end">
                <button
                    type="button"
                    class="rounded-md px-2 py-1 text-xs text-gray-300 hover:bg-gray-800 hover:text-white"
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
