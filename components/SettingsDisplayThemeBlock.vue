<script setup lang="ts">
/**
 * Light/dark + colour palette; the full preview is shown only while
 * focus/keyboard stays in this block (preview below is revealed then).
 */
const { active, onFocusIn, onFocusOut } = useContainedFocusActive()
</script>

<template>
  <div
    class="space-y-6"
    data-testid="display-theme-block"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
  >
    <div id="display-appearance" class="scroll-mt-28 lg:scroll-mt-24">
      <SettingsAppearanceControl />
    </div>
    <div
      id="display-palette"
      class="scroll-mt-28 border-t border-[var(--infl0-panel-border)] pt-5 lg:scroll-mt-24"
    >
      <SettingsThemeControl />
      <div v-show="active" class="pt-5">
        <SettingsThemePreview />
      </div>
    </div>
  </div>
</template>
