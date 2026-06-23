// @vitest-environment happy-dom
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n, useI18n as vueUseI18n } from 'vue-i18n'
import { defineComponent, nextTick, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.stubGlobal('definePageMeta', () => {})
vi.stubGlobal('useI18n', () => vueUseI18n())
vi.stubGlobal('useRoute', () => ({ params: { id: 'article-a11y' } }))

const article = {
  id: 'article-a11y',
  title: 'Understanding AI Safety',
  link: 'https://example.test/articles/ai-safety',
  author: 'Alice Chen',
  publishedAt: '2026-05-18T10:00:00.000Z',
  fetchedAt: '2026-05-31T10:00:00.000Z',
  sourceType: 'blog',
  sourceTitle: 'Tech Blog',
  tld: 'example.test',
  teaser: 'Quick orientation before text work.',
  summaryLong: 'Background material that belongs to the article overview.',
  category: ['technology'],
  tags: ['ai', 'safety'],
  rawMarkdown: 'A deep dive into the core challenges of AI safety research.',
  crawlKey: 'article-a11y',
  readAt: null,
  saved: { id: 'saved-a11y', capturedAt: '2026-05-31T10:00:00.000Z' },
}

vi.stubGlobal('useRequestFetch', () => vi.fn().mockResolvedValue(article))
vi.stubGlobal('useAsyncData', async (_key: unknown, handler: () => Promise<typeof article>) => ({
  data: ref(await handler()),
  error: ref(null),
}))

const ArticleDetail = (await import('../../pages/articles/[id].vue')).default
const scrollIntoView = vi.fn()
const scrollBy = vi.fn()

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: scrollIntoView,
  })
  Object.defineProperty(window, 'scrollBy', {
    configurable: true,
    value: scrollBy,
  })
  scrollIntoView.mockClear()
  scrollBy.mockClear()
})

afterEach(() => {
  scrollIntoView.mockClear()
  scrollBy.mockClear()
})

function makeI18n() {
  const messages = {
    articleDetail: {
      backToInbox: 'Back to inbox',
      byline: 'By {author}',
      errorLoad: 'Could not load article',
      openOriginal: 'Open original',
      readAt: 'Read on {date}',
      savedAt: 'Saved on {date}',
    },
    readingNotes: {
      learningFocus: {
        active: 'Learning focus active',
        start: 'Work with text',
        status: '{count} reading notes in this text',
        stop: 'Exit focus',
      },
    },
  }
  return createI18n({ legacy: false, locale: 'en', messages: { en: messages, de: messages } })
}

const AnnotatableTextStub = defineComponent({
  emits: ['countChange'],
  mounted() {
    this.$emit('countChange', 2)
  },
  template: '<section data-testid="annotatable-text">Annotatable article body</section>',
})

function mountArticleDetail() {
  const TestHost = defineComponent({
    components: { ArticleDetail },
    template: '<Suspense><ArticleDetail /></Suspense>',
  })
  return mount(TestHost, {
    global: {
      plugins: [makeI18n()],
      stubs: {
        AnnotatableText: AnnotatableTextStub,
        NuxtLink: {
          props: ['to'],
          template: '<a :href="to"><slot /></a>',
        },
      },
    },
  })
}

describe('ArticleDetail page · learning focus', () => {
  it('keeps the article overview available by default and hides it only in learning focus', async () => {
    const wrapper = mountArticleDetail()
    await flushPromises()
    await nextTick()

    expect(wrapper.get('[data-testid="learning-focus-toggle"]').attributes('aria-pressed')).toBe('false')
    expect(wrapper.text()).toContain('Quick orientation before text work.')
    expect(wrapper.text()).toContain('Background material that belongs to the article overview.')
    expect(wrapper.find('[data-testid="learning-focus-status"]').exists()).toBe(false)

    await wrapper.get('[data-testid="learning-focus-toggle"]').trigger('click')
    await nextTick()

    const status = wrapper.get('[data-testid="learning-focus-status"]')
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'smooth' })
    expect(wrapper.get('[data-testid="learning-focus-toggle"]').attributes('aria-pressed')).toBe('true')
    expect(status.text()).toContain('Learning focus active')
    expect(status.text()).toContain('2 reading notes in this text')
    expect(wrapper.text()).not.toContain('Quick orientation before text work.')
    expect(wrapper.text()).not.toContain('Background material that belongs to the article overview.')

    await status.get('button').trigger('click')
    await flushPromises()
    await nextTick()

    expect(scrollBy).toHaveBeenCalledWith({ top: 0, behavior: 'auto' })
    expect(wrapper.get('[data-testid="learning-focus-toggle"]').attributes('aria-pressed')).toBe('false')
    expect(wrapper.text()).toContain('Quick orientation before text work.')
    expect(wrapper.find('[data-testid="learning-focus-status"]').exists()).toBe(false)
  })
})
