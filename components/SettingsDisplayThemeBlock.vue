<script setup lang="ts">
/**
 * Light/dark + colour palette; the full preview is shown only while
 * focus/keyboard stays in this block (preview below is revealed then).
 */
const { active, onFocusIn, onFocusOut } = useContainedFocusActive()
</script>

<template>
  <div
    class="space-y-4"
    data-testid="display-theme-block"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
  >
    <SettingsAppearanceControl />
    <div class="border-t border-[var(--infl0-panel-border)] pt-5">
      <SettingsThemeControl />
    </div>
    <div v-show="active" class="pt-1">
      <SettingsThemePreview />
    </div>
  </div>
</template>
