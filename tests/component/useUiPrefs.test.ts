// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { resetNuxtTestState } from '../_helpers/nuxt-globals'

/**
 * Shim Nuxt auto-imports that `useUiPrefs` relies on but Vitest does not boot.
 * Done once for the whole file; individual tests install fresh spies on
 * `$fetch` and `useRequestFetch`. The shim must live before the composable
 * is imported so the module resolves against our stubs.
 */
// Relaxed shim for Nuxt auto-imports used by the composable. The real
// types (`$Fetch<…>`, `NitroFetchRequest`, `RequestFetch`) are too specific
// for test stubs; we only care about the call contract (URL + options,
// returned payload). We go through an `unknown` bag on globalThis to avoid
// colliding with Nuxt's ambient declarations.
type RelaxedFetch = (
  url: string,
  init?: { method?: string; body?: unknown; credentials?: string },
) => Promise<unknown>
const globalBag = globalThis as unknown as Record<string, unknown>
function installFetch(fn: RelaxedFetch | undefined) {
  globalBag.$fetch = fn
}
function installRequestFetch(fn: (() => RelaxedFetch) | undefined) {
  globalBag.useRequestFetch = fn
}

const { useUiPrefs } = await import('../../composables/useUiPrefs')
const { UI_PREFS_STORAGE_KEY, defaultUiPrefs } = await import('../../utils/ui-prefs')

function mountHarness() {
  const Harness = defineComponent({
    setup() {
      return useUiPrefs()
    },
    render() {
      return h('div')
    },
  })
  return mount(Harness)
}

describe('useUiPrefs', () => {
  beforeEach(() => {
    resetNuxtTestState()
    window.localStorage.clear()
    vi.useRealTimers()
  })

  afterEach(() => {
    window.localStorage.clear()
    installFetch(undefined)
    installRequestFetch(undefined)
    vi.useRealTimers()
  })

  type ExposedVm = {
    prefs: ReturnType<typeof defaultUiPrefs>
    update: (patch: Parameters<ReturnType<typeof useUiPrefs>['update']>[0]) => void
    reset: () => Promise<void>
    markAnnouncementSeen: (id: string) => void
  }

  it('starts with defaults when nothing is stored', () => {
    installRequestFetch(() => () => Promise.reject(new Error('no server')))
    installFetch(vi.fn())
    const wrapper = mountHarness()
    const vm = wrapper.vm as unknown as ExposedVm
    expect(vm.prefs).toEqual(defaultUiPrefs())
    wrapper.unmount()
  })

  it('hydrates from the server on mount and mirrors to localStorage', async () => {
    const serverPrefs = {
      v: 1,
      theme: 'warm:blue',
      motion: 'reduced',
      appearance: 'auto',
      surfaces: {
        'card-front': {
          backgroundColor: '#112233',
          textColor: '#eeeeee',
          fontFamily: 'system-sans',
          fontSize: 40,
          lineHeight: 'normal',
        },
        'card-back': {
          backgroundColor: null,
          textColor: null,
          fontFamily: 'system-sans',
          fontSize: 16,
          lineHeight: 'normal',
        },
        reader: {
          backgroundColor: null,
          textColor: null,
          fontFamily: 'system-serif',
          fontSize: 19,
          lineHeight: 'relaxed',
        },
      },
      seenFeatureAnnouncements: ['reader-colors'],
    }
    const fetchSpy = vi.fn().mockResolvedValue(serverPrefs)
    installRequestFetch(() => fetchSpy as unknown as RelaxedFetch)
    installFetch(vi.fn())

    const wrapper = mountHarness()
    await nextTick()
    await Promise.resolve()

    const vm = wrapper.vm as unknown as ExposedVm
    expect(vm.prefs.theme).toBe('warm:blue')
    expect(vm.prefs.motion).toBe('reduced')
    expect(vm.prefs.appearance).toBe('auto')
    expect(vm.prefs.surfaces['card-front'].backgroundColor).toBe('#112233')
    const mirrored = JSON.parse(window.localStorage.getItem(UI_PREFS_STORAGE_KEY) ?? 'null')
    expect(mirrored?.motion).toBe('reduced')
    wrapper.unmount()
  })

  it('falls back to localStorage when the server rejects', async () => {
    window.localStorage.setItem(
      UI_PREFS_STORAGE_KEY,
      JSON.stringify({
        v: 1,
        theme: 'high-contrast',
        motion: 'standard',
        appearance: 'light',
        surfaces: {
          'card-front': {
            backgroundColor: '#000000',
            textColor: '#ffffff',
            fontFamily: 'system-sans',
            fontSize: 16,
            lineHeight: 'normal',
          },
          'card-back': {
            backgroundColor: null,
            textColor: null,
            fontFamily: 'system-sans',
            fontSize: 16,
            lineHeight: 'normal',
          },
          reader: {
            backgroundColor: null,
            textColor: null,
            fontFamily: 'system-serif',
            fontSize: 18,
            lineHeight: 'relaxed',
          },
        },
        seenFeatureAnnouncements: [],
      }),
    )
    installRequestFetch(() => () => Promise.reject(new Error('401')))
    installFetch(vi.fn())

    const wrapper = mountHarness()
    await nextTick()
    await Promise.resolve()
    await Promise.resolve()

    const vm = wrapper.vm as unknown as ExposedVm
    expect(vm.prefs.theme).toBe('high-contrast')
    expect(vm.prefs.surfaces['card-front'].backgroundColor).toBe('#000000')
    wrapper.unmount()
  })

  it('update() applies optimistically, mirrors localStorage and debounces PATCH', async () => {
    vi.useFakeTimers()
    installRequestFetch(() => () => Promise.reject(new Error('unused')))
    const patchSpy = vi.fn(
      async (_url: string, init?: { body?: unknown }): Promise<unknown> => {
        // Server echoes the merged state back, like the real endpoint does.
        const body = (init?.body ?? {}) as {
          surfaces?: Record<string, { backgroundColor?: string | null }>
        }
        const fronts = body.surfaces?.['card-front'] ?? {}
        const base = defaultUiPrefs()
        return {
          v: 1,
          theme: base.theme,
          motion: 'reduced',
          appearance: base.appearance,
          surfaces: {
            ...base.surfaces,
            'card-front': { ...base.surfaces['card-front'], backgroundColor: fronts.backgroundColor ?? null },
          },
          seenFeatureAnnouncements: [],
        }
      },
    )
    installFetch(patchSpy as unknown as RelaxedFetch)

    const wrapper = mountHarness()
    await vi.advanceTimersByTimeAsync(0)
    const vm = wrapper.vm as unknown as ExposedVm

    vm.update({ motion: 'reduced' })
    expect(vm.prefs.motion).toBe('reduced')
    expect(patchSpy).not.toHaveBeenCalled()

    vm.update({ surfaces: { 'card-front': { backgroundColor: '#111111' } } })
    // Optimistic: localStorage already reflects the change before the debounce fires.
    const mirroredOptimistic = JSON.parse(window.localStorage.getItem(UI_PREFS_STORAGE_KEY) ?? 'null')
    expect(mirroredOptimistic?.surfaces['card-front'].backgroundColor).toBe('#111111')
    expect(patchSpy).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(500)
    await Promise.resolve()
    await Promise.resolve()

    expect(patchSpy).toHaveBeenCalledOnce()
    const [url, opts] = patchSpy.mock.calls[0] as [string, { body: unknown; method: string }]
    expect(url).toBe('/api/me/ui-prefs')
    expect(opts.method).toBe('PATCH')
    expect(opts.body).toMatchObject({
      motion: 'reduced',
      surfaces: { 'card-front': { backgroundColor: '#111111' } },
    })
    expect(vm.prefs.motion).toBe('reduced')
    expect(vm.prefs.surfaces['card-front'].backgroundColor).toBe('#111111')
    wrapper.unmount()
  })

  it('shares hydration and the PATCH queue across concurrent consumers', async () => {
    // Two components calling useUiPrefs() at the same time must not
    // produce two hydration requests or two competing debounce timers.
    vi.useFakeTimers()
    const hydrateSpy = vi.fn().mockResolvedValue({
      v: 1,
      theme: 'warm:blue',
      motion: 'system',
      appearance: defaultUiPrefs().appearance,
      surfaces: defaultUiPrefs().surfaces,
      seenFeatureAnnouncements: [],
    })
    installRequestFetch(() => hydrateSpy as unknown as RelaxedFetch)
    const patchSpy = vi.fn(async () => ({
      v: 1,
      theme: 'warm:blue',
      motion: 'reduced',
      appearance: defaultUiPrefs().appearance,
      surfaces: defaultUiPrefs().surfaces,
      seenFeatureAnnouncements: [],
    }))
    installFetch(patchSpy as unknown as RelaxedFetch)

    const a = mountHarness()
    const b = mountHarness()
    await vi.advanceTimersByTimeAsync(0)
    await Promise.resolve()

    expect(hydrateSpy).toHaveBeenCalledOnce()
    const vmA = a.vm as unknown as ExposedVm
    const vmB = b.vm as unknown as ExposedVm
    expect(vmA.prefs.theme).toBe('warm:blue')
    expect(vmB.prefs.theme).toBe('warm:blue')

    // Two updates from two consumers collapse into a single debounced PATCH.
    vmA.update({ motion: 'reduced' })
    vmB.update({ surfaces: { 'card-front': { backgroundColor: '#112233' } } })
    expect(patchSpy).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(500)
    await Promise.resolve()
    await Promise.resolve()

    expect(patchSpy).toHaveBeenCalledOnce()
    const firstCall = patchSpy.mock.calls[0] as unknown as [string, { body: unknown }]
    const [, opts] = firstCall
    expect(opts.body).toMatchObject({
      motion: 'reduced',
      surfaces: { 'card-front': { backgroundColor: '#112233' } },
    })

    a.unmount()
    b.unmount()
  })

  it('reset() clears state and sends { reset: true } without waiting for debounce', async () => {
    installRequestFetch(() => () => Promise.reject(new Error('unused')))
    const patchSpy = vi.fn().mockResolvedValue({
      v: 1,
      theme: defaultUiPrefs().theme,
      motion: defaultUiPrefs().motion,
      appearance: defaultUiPrefs().appearance,
      surfaces: defaultUiPrefs().surfaces,
      seenFeatureAnnouncements: [],
    })
    installFetch(patchSpy as unknown as RelaxedFetch)

    const wrapper = mountHarness()
    await nextTick()
    const vm = wrapper.vm as unknown as ExposedVm

    vm.update({ motion: 'reduced' })
    await vm.reset()

    expect(vm.prefs).toEqual(defaultUiPrefs())
    expect(patchSpy).toHaveBeenCalled()
    const resetCall = patchSpy.mock.calls.find(
      ([, opts]) => (opts as { body?: { reset?: boolean } }).body?.reset === true,
    )
    expect(resetCall).toBeDefined()
    wrapper.unmount()
  })
})
