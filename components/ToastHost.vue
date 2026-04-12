<script setup lang="ts">
const { toasts, dismiss } = useToast()

function alertClass(variant: string) {
  if (variant === 'success') return 'alert-success'
  if (variant === 'error') return 'alert-error'
  return 'alert-info'
}
</script>

<template>
  <div
    class="toast toast-top toast-end z-[600] flex w-auto max-w-none flex-col items-end gap-2 p-4 pointer-events-none"
  >
    <TransitionGroup name="toast">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="pointer-events-auto alert shadow-lg w-[min(100vw-2rem,26rem)] flex-nowrap"
        :class="alertClass(t.variant)"
        role="alert"
      >
        <span class="grow break-words text-start">{{ t.message }}</span>
        <div v-if="t.actions?.length" class="flex shrink-0 flex-wrap gap-1">
          <button
            v-for="(a, i) in t.actions"
            :key="i"
            type="button"
            class="btn btn-sm"
            @click="a.onClick(); dismiss(t.id)"
          >
            {{ a.label }}
          </button>
        </div>
        <button
          type="button"
          class="btn btn-sm btn-circle btn-ghost shrink-0"
          :aria-label="$t('common.dismiss')"
          @click="dismiss(t.id)"
        >
          ✕
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(0.5rem);
}
</style>
