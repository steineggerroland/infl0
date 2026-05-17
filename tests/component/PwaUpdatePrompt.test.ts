// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n, useI18n as vueUseI18n } from 'vue-i18n'
import { ref, nextTick } from 'vue'
import type { ToastAction } from '../../composables/useToast'

const push = vi.fn((_options?: {
  message: string
  variant?: string
  durationMs?: number
  actions?: ToastAction[]
}) => 'toast-1')
const needRefresh = ref(false)
const updateServiceWorker = vi.fn()

vi.stubGlobal('useToast', () => ({ push, dismiss: vi.fn(), toasts: ref([]) }))
vi.stubGlobal('useI18n', () => vueUseI18n())
vi.stubGlobal('useNuxtApp', () => ({
  $pwa: { needRefresh, updateServiceWorker },
}))

const PwaUpdatePrompt = (await import('../../components/PwaUpdatePrompt.client.vue')).default

function makeI18n() {
  const messages = {
    pwa: {
      updateReady: 'Update ready',
      updateReload: 'Reload',
    },
  }
  return createI18n({ legacy: false, locale: 'en', messages: { en: messages, de: messages } })
}

describe('PwaUpdatePrompt', () => {
  it('shows a reload toast when the service worker reports an update', async () => {
    push.mockClear()
    needRefresh.value = false

    mount(PwaUpdatePrompt, {
      global: { plugins: [makeI18n()] },
    })

    needRefresh.value = true
    await nextTick()

    expect(push).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Update ready',
        variant: 'info',
        durationMs: 0,
        actions: [expect.objectContaining({ label: 'Reload' })],
      }),
    )

    const firstCall = push.mock.calls.at(0)?.[0]
    expect(firstCall?.actions?.[0]).toBeDefined()
    firstCall!.actions![0]!.onClick()
    expect(updateServiceWorker).toHaveBeenCalledWith(true)
  })
})
