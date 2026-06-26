// @vitest-environment happy-dom
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n, useI18n as vueUseI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'

vi.stubGlobal('definePageMeta', () => {})
vi.stubGlobal('useI18n', () => vueUseI18n())
vi.stubGlobal('useRoute', () => ({ params: { id: 'episode-a11y' } }))

const episode = {
  id: 'episode-a11y',
  title: 'Rich seed',
  link: 'https://example.test/podcast/rich-seed',
  author: 'Demo Podcast',
  publishedAt: '2026-05-18T10:00:00.000Z',
  fetchedAt: '2026-05-31T10:00:00.000Z',
  sourceType: 'podcast',
  sourceTitle: 'Demo Podcast',
  feedUrl: 'https://example.test/feed.xml',
  tld: 'example.test',
  teaser: 'Episode teaser before text work.',
  summaryLong: 'Episode overview that should not appear in learning focus.',
  category: ['expert opinions'],
  tags: ['seed'],
  rawMarkdown: 'Episode body',
  crawlKey: 'episode-a11y',
  readAt: null,
  saved: { id: 'saved-episode-a11y', capturedAt: '2026-05-31T10:00:00.000Z' },
  shownotesMd: 'Shownotes body',
  transcriptMd: 'Transcript body',
  transcriptUrl: 'https://example.test/transcript',
  mediaUrl: 'https://cdn.example.test/rich-seed.mp3',
  mediaType: 'audio/mpeg',
  durationSeconds: 2220,
  episodeNumber: 4,
  seasonNumber: 1,
  episodeType: 'full',
  explicit: false,
  subtitle: 'Episode subtitle',
  imageUrl: 'https://example.test/cover.jpg',
  chapters: [
    { start_seconds: 0, title: 'Intro' },
    { start_seconds: 312, title: 'Finding context boundaries' },
  ],
}

vi.stubGlobal('useRequestFetch', () => vi.fn().mockResolvedValue(episode))
vi.stubGlobal('useAsyncData', async (_key: unknown, handler: () => Promise<typeof episode>) => ({
  data: ref(await handler()),
  error: ref(null),
}))

const EpisodeDetail = (await import('../../pages/episodes/[id].vue')).default
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
    episode: {
      chapters: 'Chapters',
      coverAlt: 'Cover: {title}',
      duration: 'Length',
      episodeNumber: 'Episode {episode}',
      explicit: 'Explicit',
      openEpisodePage: 'Episode page',
      openPodcastFeed: 'Podcast feed',
      seasonEpisode: 'Season {season} · Episode {episode}',
      shownotes: 'Shownotes',
      tabContent: 'Content',
      tabTranscript: 'Transcript',
      transcriptExternal: 'Open transcript online',
      typeTooltip: {
        bonus: 'Bonus episode',
        trailer: 'Trailer',
      },
    },
    episodeDetail: {
      backToInbox: 'Back to inbox',
      errorLoad: 'Could not load episode',
      metadata: 'Episode metadata',
      openMedia: 'Open audio',
      openMediaTooltip: 'Open episode audio',
      readAt: 'Read on {date}',
      savedAt: 'Saved on {date}',
    },
    readingNotes: {
      learningFocus: {
        active: 'Learning focus active',
        start: 'Work with text',
        status: '{count} reading notes in this episode',
        stop: 'Exit focus',
      },
    },
  }
  return createI18n({ legacy: false, locale: 'en', messages: { en: messages, de: messages } })
}

const AnnotatableTextStub = defineComponent({
  props: {
    contentSource: {
      type: String,
      default: 'body',
    },
  },
  emits: ['countChange'],
  mounted() {
    const counts: Record<string, number> = { body: 2, shownotes: 3, transcript: 4 }
    this.$emit('countChange', counts[this.contentSource] ?? 0)
  },
  template: '<section data-testid="annotatable-text" :data-source="contentSource">Annotatable episode text</section>',
})

function mountEpisodeDetail() {
  const TestHost = defineComponent({
    components: { EpisodeDetail },
    template: '<Suspense><EpisodeDetail /></Suspense>',
  })
  return mount(TestHost, {
    global: {
      plugins: [makeI18n()],
      stubs: {
        AnnotatableText: AnnotatableTextStub,
        Infl0Icon: { template: '<span data-testid="icon-stub" />' },
        NuxtLink: {
          props: ['to'],
          template: '<a :href="to"><slot /></a>',
        },
      },
    },
  })
}

describe('EpisodeDetail page · text work', () => {
  it('renders chapter numbering inside the panel without native list markers', async () => {
    const wrapper = mountEpisodeDetail()
    await flushPromises()
    await nextTick()

    const chapters = wrapper.get('[data-testid="episode-chapters-list"]')
    expect(chapters.classes()).toContain('list-none')
    expect(chapters.classes()).toContain('p-0')

    const links = wrapper.findAll('[data-testid="episode-chapter-link"]')
    expect(links).toHaveLength(2)
    expect(links[0]!.get('[data-testid="episode-chapter-number"]').text()).toBe('1.')
    expect(links[0]!.get('[data-testid="episode-chapter-time"]').text()).toBe('0:00')
    expect(links[0]!.get('[data-testid="episode-chapter-title"]').text()).toBe('Intro')
    expect(links[1]!.get('[data-testid="episode-chapter-number"]').text()).toBe('2.')
    expect(links[1]!.get('[data-testid="episode-chapter-time"]').text()).toBe('5:12')
    expect(links[1]!.get('[data-testid="episode-chapter-title"]').text()).toBe('Finding context boundaries')
  })

  it('moves episodes into learning focus and keeps the text-work position stable on exit', async () => {
    const wrapper = mountEpisodeDetail()
    await flushPromises()
    await nextTick()

    expect(wrapper.get('[data-testid="learning-focus-toggle"]').attributes('aria-pressed')).toBe('false')
    expect(wrapper.text()).toContain('Episode teaser before text work.')
    expect(wrapper.find('[data-testid="episode-chapters"]').exists()).toBe(true)

    await wrapper.get('[data-testid="learning-focus-toggle"]').trigger('click')
    await flushPromises()
    await nextTick()

    const status = wrapper.get('[data-testid="learning-focus-status"]')
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'smooth' })
    expect(wrapper.get('[data-testid="learning-focus-toggle"]').attributes('aria-pressed')).toBe('true')
    expect(status.text()).toContain('Learning focus active')
    expect(status.text()).toContain('9 reading notes in this episode')
    expect(wrapper.text()).not.toContain('Episode teaser before text work.')
    expect(wrapper.find('[data-testid="episode-chapters"]').exists()).toBe(false)

    await status.get('button').trigger('click')
    await flushPromises()
    await nextTick()

    expect(scrollBy).toHaveBeenCalledWith({ top: 0, behavior: 'auto' })
    expect(wrapper.get('[data-testid="learning-focus-toggle"]').attributes('aria-pressed')).toBe('false')
    expect(wrapper.text()).toContain('Episode teaser before text work.')
    expect(wrapper.find('[data-testid="episode-chapters"]').exists()).toBe(true)
  })
})
