import { onMounted, onUnmounted } from 'vue'

type ShortcutHandler = () => void

interface ShortcutDefinition {
  [key: string]: ShortcutHandler
}

/**
 * Defines keyboard shortcuts for the application.
 * @param shortcuts An object mapping keys to handler functions
 */
export function defineShortcuts (shortcuts: ShortcutDefinition) {
  function handleKeyPress (event: KeyboardEvent) {
    const key = event.key.toLowerCase() // Normalize the key to lowercase
    if (shortcuts[key]) {
      shortcuts[key]() // Trigger the corresponding handler
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeyPress)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyPress)
  })
}
