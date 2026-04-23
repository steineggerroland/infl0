import { ref } from 'vue'

/**
 * `true` while focus is inside a container (e.g. a settings field group).
 * Used to show a live preview only while the user is working in that group.
 */
export function useContainedFocusActive() {
  const active = ref(false)

  function onFocusIn() {
    active.value = true
  }

  function reveal() {
    active.value = true
  }

  function onFocusOut(e: FocusEvent) {
    const root = e.currentTarget
    if (!(root instanceof HTMLElement)) return
    const next = e.relatedTarget
    if (next instanceof Node && root.contains(next)) return
    active.value = false
  }

  return { active, onFocusIn, onFocusOut, reveal }
}
