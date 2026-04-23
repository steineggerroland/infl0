<script setup lang="ts">
/**
 * Hell/Dunkel + Farbpalette; die Gesamtvorschau erscheint nur, solange
 * Fokus/Tastatur in diesem Block bleibt (Vorschau unten eingeblendet).
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
