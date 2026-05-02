// @vitest-environment happy-dom
import { resetNuxtTestState } from '../_helpers/nuxt-globals'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n, useI18n as vueUseI18n } from 'vue-i18n'
import { defineShortcuts } from '../../composables/useShortcuts'
import {
  useModalStack,
  useModalStackRegistration,
} from '../../composables/useModalStack'
import { defaultUiPrefs } from '../../utils/ui-prefs'

vi.stubGlobal('defineShortcuts', defineShortcuts)
vi.stubGlobal('useModalStack', useModalStack)
vi.stubGlobal('useModalStackRegistration', useModalStackRegistration)
vi.stubGlobal('useI18n', () => vueUseI18n())

vi.stubGlobal('useEngagementTrackingPrefs', () => ({
  enabled: ref(false),
  loaded: ref(true),
  ensureLoaded: vi.fn().mockResolvedValue(undefined),
  reportDwell: vi.fn(),
}))

const setReadState = vi.fn()
vi.stubGlobal('useArticleReadState', () => ({
  setReadState,
}))

vi.stubGlobal('useUiPrefs', () => ({
  prefs: ref(defaultUiPrefs()),
  update: vi.fn(),
}))

const ArticleView = (await import('../../components/ArticleView.vue')).default

function makeI18n() {
  const messages = {
    article: {
      cornerFold: 'Flip',
      originalArticle: 'Original',
      readStatus: 'Read',
      markRead: 'Mark as read',
      markUnread: 'Mark as unread',
      closeModal: 'Close',
      modalKeyboardHint: 'Esc',
    },
  }
  return createI18n({ legacy: false, locale: 'en', messages: { en: messages, de: messages } })
}

const baseArticle = {
  id: 'a1',
  title: 'T',
  teaser: 'teaser',
  summary_long: 'long',
  link: 'https://example.com/article',
  publishedAt: '2020-01-01T00:00:00.000Z',
  source_type: 'rss',
}

describe('ArticleView reader modal + modal stack', () => {
  beforeEach(() => {
    resetNuxtTestState()
    setReadState.mockReset()
    setReadState.mockResolvedValue({ ok: true, readAt: '2026-05-02T10:00:00.000Z' })
    document.body.innerHTML = ''
  })
  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('does not pin the modal stack when Q is pressed without rawMarkdown (Bugbot PR #4)', async () => {
    const i18n = makeI18n()
    const { anyOpen } = useModalStack()

    const wrapper = mount(ArticleView, {
      props: {
        article: { ...baseArticle },
        isSelected: true,
      },
      global: { plugins: [i18n] },
      attachTo: document.body,
    })
    await flushPromises()

    expect(anyOpen.value).toBe(false)

    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'q', bubbles: true }),
    )
    await flushPromises()

    expect(anyOpen.value).toBe(false)
    wrapper.unmount()
  })

  it('registers the modal stack when Q opens the reader with rawMarkdown', async () => {
    const i18n = makeI18n()
    const { anyOpen } = useModalStack()

    const wrapper = mount(ArticleView, {
      props: {
        article: { ...baseArticle, rawMarkdown: '# Hello' },
        isSelected: true,
      },
      global: { plugins: [i18n] },
      attachTo: document.body,
    })
    await flushPromises()

    expect(anyOpen.value).toBe(false)

    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'q', bubbles: true }),
    )
    await flushPromises()

    expect(anyOpen.value).toBe(true)

    const dlg = wrapper.find('dialog').element as HTMLDialogElement
    dlg.dispatchEvent(new Event('close'))
    await flushPromises()

    expect(anyOpen.value).toBe(false)
    wrapper.unmount()
  })

  it('clears modalVisible when rawMarkdown is cleared while the reader was open', async () => {
    const i18n = makeI18n()
    const { anyOpen } = useModalStack()

    const wrapper = mount(ArticleView, {
      props: {
        article: { ...baseArticle, rawMarkdown: '# Hello' },
        isSelected: true,
      },
      global: { plugins: [i18n] },
      attachTo: document.body,
    })
    await flushPromises()

    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'q', bubbles: true }),
    )
    await flushPromises()
    expect(anyOpen.value).toBe(true)

    await wrapper.setProps({
      article: { ...baseArticle },
      isSelected: true,
    })
    await flushPromises()

    expect(anyOpen.value).toBe(false)
    wrapper.unmount()
  })

  it('shows a read-status control when the article is already read', async () => {
    const i18n = makeI18n()

    const wrapper = mount(ArticleView, {
      props: {
        article: { ...baseArticle, readAt: '2026-05-01T10:00:00.000Z' },
        isSelected: true,
      },
      global: { plugins: [i18n] },
      attachTo: document.body,
    })
    await flushPromises()

    const hints = wrapper.findAll('[data-testid="article-read-status"]')
    expect(hints.length).toBeGreaterThan(0)
    expect(hints[0]?.attributes('aria-label')).toBe('Mark as unread')
    expect(hints[0]?.attributes('aria-pressed')).toBe('true')
    wrapper.unmount()
  })

  it('marks the selected article read after the visibility threshold without tracking', async () => {
    vi.useFakeTimers()
    const i18n = makeI18n()

    const wrapper = mount(ArticleView, {
      props: {
        article: { ...baseArticle },
        isSelected: true,
      },
      global: { plugins: [i18n] },
      attachTo: document.body,
    })
    await flushPromises()

    expect(setReadState).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(2000)
    await flushPromises()

    expect(setReadState).toHaveBeenCalledWith('a1', true)
    expect(wrapper.find('[data-testid="article-read-status"]').attributes('aria-pressed')).toBe(
      'true',
    )
    wrapper.unmount()
  })

  it('lets users mark a read article unread from the status control', async () => {
    const i18n = makeI18n()
    setReadState.mockResolvedValueOnce({ ok: true, readAt: null })

    const wrapper = mount(ArticleView, {
      props: {
        article: { ...baseArticle, readAt: '2026-05-01T10:00:00.000Z' },
        isSelected: true,
      },
      global: { plugins: [i18n] },
      attachTo: document.body,
    })
    await flushPromises()

    await wrapper.find('[data-testid="article-read-status"]').trigger('click')
    await flushPromises()

    expect(setReadState).toHaveBeenCalledWith('a1', false)
    expect(wrapper.find('[data-testid="article-read-status"]').attributes('aria-pressed')).toBe(
      'false',
    )
    wrapper.unmount()
  })

  it('lets users mark the selected article unread with the read-state shortcut', async () => {
    const i18n = makeI18n()
    setReadState.mockResolvedValueOnce({ ok: true, readAt: null })

    const wrapper = mount(ArticleView, {
      props: {
        article: { ...baseArticle, readAt: '2026-05-01T10:00:00.000Z' },
        isSelected: true,
      },
      global: { plugins: [i18n] },
      attachTo: document.body,
    })
    await flushPromises()

    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'm', bubbles: true }))
    await flushPromises()

    expect(setReadState).toHaveBeenCalledWith('a1', false)
    expect(wrapper.find('[data-testid="article-read-status"]').attributes('aria-pressed')).toBe(
      'false',
    )
    wrapper.unmount()
  })
})
