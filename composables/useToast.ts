export type ToastVariant = 'info' | 'success' | 'error'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastItem {
  id: string
  message: string
  variant: ToastVariant
  actions?: ToastAction[]
  /** 0 = until dismissed */
  durationMs: number
}

export function useToast() {
  const toasts = useState<ToastItem[]>('app-toasts', () => [])

  function dismiss(id: string) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function push(options: {
    message: string
    variant?: ToastVariant
    durationMs?: number
    actions?: ToastAction[]
  }) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const item: ToastItem = {
      id,
      message: options.message,
      variant: options.variant ?? 'info',
      durationMs: options.durationMs ?? 6000,
      actions: options.actions,
    }
    toasts.value = [...toasts.value, item]
    if (item.durationMs > 0) {
      setTimeout(() => dismiss(id), item.durationMs)
    }
    return id
  }

  return { toasts, push, dismiss }
}
