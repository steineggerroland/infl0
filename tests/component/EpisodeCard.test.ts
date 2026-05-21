// @vitest-environment happy-dom
import { resetNuxtTestState } from '../_helpers/nuxt-globals'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { defaultUiPrefs } from '../../utils/ui-prefs'
import { createI18n, useI18n as vueUseI18n } from 'vue-i18n'
import { defineShortcuts } from '../../composables/useShortcuts'
import {
  useModalStack,
  useModalStackRegistration,
} from '../../composables/useModalStack'

vi.stubGlobal('defineShortcuts', defineShortcuts)
vi.stubGlobal('useModalStack', useModalStack)
vi.stubGlobal('useModalStackRegistration', useModalStackRegistration)
vi.stubGlobal('useI18n', () => vueUseI18n())

const setReadState = vi.fn()
vi.stubGlobal('useArticleReadState', () => ({ setReadState }))

vi.stubGlobal('useUiPrefs', () => ({
  prefs: ref(defaultUiPrefs()),
  update: vi.fn(),
}))

const EpisodeCard = (await import('../../components/EpisodeCard.vue')).default

function makeI18n() {
  const episode = {
    duration: 'Length',
    podcast: 'Podcast',
    seasonEpisode: 'S{season} · E{episode}',
    episodeNumber: 'Episode {episode}',
    explicit: 'Explicit',
    coverAlt: 'Cover: {title}',
    playInBrowser: 'Play in browser',
    playInBrowserHint: 'Hint',
    openInPodcastApp: 'App',
    openEpisodePage: 'Episode',
    openPodcastFeed: 'Feed',
    chapters: 'Chapters',
    shownotes: 'Shownotes',
    details: 'Details',
    tabContent: 'Content',
    tabTranscript: 'Transcript',
    transcriptExternal: 'External',
    durationTooltip: 'Length: {duration}',
    seasonEpisodeTooltip: 'Season {season}, episode {episode}',
    typeTooltip: { trailer: 'Trailer', bonus: 'Bonus episode' },
  }
  const article = {
    cornerFold: 'Flip',
    markRead: 'Read',
    markUnread: 'Unread',
    closeModal: 'Close',
    modalKeyboardHint: 'Esc',
  }
  const messages = { en: { episode, article }, de: { episode, article } }
  return createI18n({ legacy: false, locale: 'en', messages })
}

const richEpisode = {
  id: 'seed-episode-rich',
  title: 'Rich episode',
  teaser: 'Teaser text',
  summary_long: 'Long summary',
  link: 'https://example.com/ep',
  publishedAt: '2026-05-10T08:00:00.000Z',
  source_type: 'rss+podcast',
  media_url: 'https://cdn.example.com/ep.mp3',
  duration_seconds: 120,
  explicit: true,
  season_number: 1,
  episode_number: 2,
  chapters: [{ start_seconds: 0, title: 'Intro' }],
  shownotes_md: 'Notes here',
  rawMarkdown: '# Body',
  transcript_md: 'Hello transcript',
}

describe('EpisodeCard', () => {
  beforeEach(() => {
    resetNuxtTestState()
    setReadState.mockReset()
    setReadState.mockResolvedValue({ ok: true, readAt: null })
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.open = true
      this.setAttribute('open', '')
    }
    HTMLDialogElement.prototype.close = function close() {
      this.open = false
      this.removeAttribute('open')
      this.dispatchEvent(new Event('close'))
    }
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders front meta and flips to details panel', async () => {
    const wrapper = mount(EpisodeCard, {
      props: {
        episode: richEpisode,
        isSelected: true,
        podcastTitle: 'Demo Podcast',
        feedUrl: 'https://example.com/feed.xml',
      },
      global: {
        plugins: [makeI18n()],
        stubs: {
          CornerFold: true,
          FlipArrow: true,
          TypeIcon: true,
          FreshnessIndicator: true,
        },
      },
    })

    expect(wrapper.find('[data-testid="episode-card"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Rich episode')
    expect(wrapper.text()).toContain('Demo Podcast')

    await wrapper.find('.teaser').trigger('click')
    expect(wrapper.find('[data-testid="episode-details-panel"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="episode-play-browser"]').exists()).toBe(true)
  })

  it('opens details as a labelled dialog with screen-reader tabs', async () => {
    const wrapper = mount(EpisodeCard, {
      attachTo: document.body,
      props: {
        episode: richEpisode,
        isSelected: true,
        podcastTitle: 'Demo Podcast',
        feedUrl: 'https://example.com/feed.xml',
      },
      global: {
        plugins: [makeI18n()],
        stubs: {
          CornerFold: true,
          FlipArrow: true,
          TypeIcon: true,
          FreshnessIndicator: true,
        },
      },
    })

    const trigger = wrapper.get('[data-testid="episode-details-link"]')
    ;(trigger.element as HTMLElement).focus()
    await trigger.trigger('click')
    await nextTick()

    const dialog = wrapper.get('dialog')
    const titleId = dialog.attributes('aria-labelledby')
    expect(titleId).toBeTruthy()
    expect(wrapper.get(`#${titleId}`).text()).toBe('Rich episode')

    const contentTab = wrapper.get('[role="tab"][aria-controls$="panel-content"]')
    const transcriptTab = wrapper.get('[role="tab"][aria-controls$="panel-transcript"]')
    const contentPanel = wrapper.get(`#${contentTab.attributes('aria-controls')}`)
    const transcriptPanel = wrapper.get(`#${transcriptTab.attributes('aria-controls')}`)

    expect(contentTab.attributes('aria-selected')).toBe('true')
    expect(contentTab.attributes('tabindex')).toBe('0')
    expect(contentPanel.attributes('role')).toBe('tabpanel')
    expect(contentPanel.attributes('aria-labelledby')).toBe(contentTab.attributes('id'))
    expect(transcriptTab.attributes('aria-selected')).toBe('false')
    expect(transcriptTab.attributes('tabindex')).toBe('-1')
    expect(transcriptPanel.attributes('aria-labelledby')).toBe(transcriptTab.attributes('id'))
    expect(document.activeElement).toBe(contentTab.element)

    await contentTab.trigger('keydown', { key: 'ArrowRight' })
    await nextTick()
    expect(transcriptTab.attributes('aria-selected')).toBe('true')
    expect(transcriptTab.attributes('tabindex')).toBe('0')
    expect(document.activeElement).toBe(transcriptTab.element)

    await transcriptTab.trigger('keydown', { key: 'Home' })
    await nextTick()
    expect(contentTab.attributes('aria-selected')).toBe('true')
    expect(document.activeElement).toBe(contentTab.element)

    ;(dialog.element as HTMLDialogElement).close()
    await nextTick()
    expect(document.activeElement).toBe(trigger.element)
  })

  it('labels the details close control for assistive tech', async () => {
    const wrapper = mount(EpisodeCard, {
      attachTo: document.body,
      props: {
        episode: richEpisode,
        isSelected: true,
      },
      global: {
        plugins: [makeI18n()],
        stubs: {
          CornerFold: true,
          FlipArrow: true,
          TypeIcon: true,
          FreshnessIndicator: true,
        },
      },
    })

    await wrapper.get('[data-testid="episode-details-link"]').trigger('click')
    expect(wrapper.get('form[method="dialog"] button').attributes('aria-label')).toBe('Close')
  })
})
