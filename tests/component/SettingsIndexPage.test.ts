// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n, useI18n as vueUseI18n } from 'vue-i18n'
import { reactive, ref } from 'vue'

/**
 * `/settings` is the direct-access settings surface and carries the
 * one-click promise of the menu. The page must:
 *   1. render a single `<h1>` ("Einstellungen")
 *   2. expose the Sortierung section with its accessible label
 *   3. expose the Leseverhalten section with its accessible label AND
 *      `id="tracking"` for the deep link coming from the Privacy page
 *   4. render the engagement tracking toggle itself (not a stub)
 *   5. delegate the `<footer>` landmark to the layout (no inline footer)
 *
 * The sorting-section internals (sliders, formula, reset button) are
 * covered by `timeline-score-prefs` unit tests and e2e; here we only
 * confirm the section boundary so later refactors cannot silently
 * delete it.
 */

// Nuxt auto-imports we need to reach real module code in Vitest.
vi.stubGlobal('definePageMeta', () => {})
vi.stubGlobal('useI18n', () => vueUseI18n())

// The page composes two data-layer composables. Both would hit `$fetch`
// without a running Nuxt runtime; stub them to their public shape.
const stubWeights = reactive({
  published_recency: 60,
  inserted_recency: 40,
  content_length: 20,
  crawl_diversity: 0,
  category_diversity: 0,
  tag_diversity: 0,
  engagement_positive: 0,
  engagement_negative: 0,
})
const stubContentLengthPref = ref(0)
const stubFormulaLines = ref('score = 0.6·pub + 0.4·ins')
const resetWeightsSpy = vi.fn()

vi.stubGlobal('useTimelineScoreWeights', () => ({
  weights: stubWeights,
  contentLengthPreference: stubContentLengthPref,
  resetWeights: resetWeightsSpy,
  formulaLines: stubFormulaLines,
}))

const trackingEnabled = ref(false)
const trackingLoaded = ref(true)
const ensureLoadedSpy = vi.fn().mockResolvedValue(undefined)
const setEnabledSpy = vi.fn().mockResolvedValue(undefined)

vi.stubGlobal('useEngagementTrackingPrefs', () => ({
  enabled: trackingEnabled,
  loaded: trackingLoaded,
  ensureLoaded: ensureLoadedSpy,
  setEnabled: setEnabledSpy,
}))

const SettingsIndex = (await import('../../pages/settings/index.vue')).default

function makeI18n() {
  const messages = {
    settingsCommon: { footerNav: 'Page shortcuts' },
    settingsIndex: {
      title: 'Settings',
      intro: 'Change how infl0 looks and sorts.',
      trackingHeading: 'Reading-behaviour analysis',
      trackingIntro: 'Off by default.',
      trackingLabel: 'Use reading behaviour for sorting',
      trackingHint: 'Articles seen for 2s+ count as read.',
    },
    settingsDisplay: {
      heading: 'Display',
      intro: 'How infl0 feels for you.',
    },
    settingsTimeline: {
      title: 'Adjust sorting',
      intro: 'Drag sliders to weigh signals.',
      formulaTitle: 'Formula',
      formulaHint: 'Only signals above 0 show.',
      reset: 'Reset to defaults',
      groups: { time: 'Recency', content: 'Content', mix: 'Mix', feedback: 'Feedback' },
      contentLengthPreference: {
        label: 'Prefer short or long?',
        hint: 'Left short, right long.',
        preferShorter: 'Shorter',
        neutral: 'Either',
        preferLonger: 'Longer',
      },
      factors: {
        published_recency: { label: 'Freshness', hint: '' },
        inserted_recency: { label: 'Timeline freshness', hint: '' },
        content_length: { label: 'Length matters', hint: '' },
        crawl_diversity: { label: 'Source variety', hint: '' },
        category_diversity: { label: 'Category variety', hint: '' },
        tag_diversity: { label: 'Tag variety', hint: '' },
        engagement_positive: { label: 'What you enjoy', hint: '' },
        engagement_negative: { label: 'What you skip', hint: '' },
      },
    },
    menu: { timeline: 'Timeline', help: 'Help' },
  }
  return createI18n({ legacy: false, locale: 'en', messages: { en: messages, de: messages } })
}

function mountPage() {
  return mount(SettingsIndex, {
    global: {
      plugins: [makeI18n()],
      stubs: {
        NuxtLink: {
          props: ['to'],
          template: '<a :href="to"><slot /></a>',
        },
        // The Darstellung children have their own component tests; here
        // we only care that the section renders around mount points for
        // them. Stubbing avoids pulling `useUiPrefs` through the tree.
        SettingsMotionControl: {
          template: '<div data-testid="motion-control-stub" />',
        },
        SettingsThemeControl: {
          template: '<div data-testid="theme-control-stub" />',
        },
        SettingsThemePreview: {
          template: '<div data-testid="theme-preview-stub" />',
        },
        SettingsAppearanceControl: {
          template: '<div data-testid="appearance-control-stub" />',
        },
      },
    },
  })
}

describe('SettingsIndex page', () => {
  it('renders exactly one <h1>, labelled "Einstellungen"', () => {
    const wrapper = mountPage()
    const h1s = wrapper.findAll('h1')
    expect(h1s).toHaveLength(1)
    expect(h1s[0].text()).toBe('Settings')
  })

  it('exposes a Darstellung section with appearance, theme, preview, and motion controls', () => {
    const wrapper = mountPage()
    const heading = wrapper.find('#settings-display-heading')
    expect(heading.exists()).toBe(true)
    expect(heading.element.tagName.toLowerCase()).toBe('h2')
    expect(heading.text()).toBe('Display')
    // Each readability control is its own component (tested in
    // isolation). Locking the mount points here guards the section
    // outline — adding or removing one by accident surfaces loudly.
    expect(wrapper.find('[data-testid="theme-control-stub"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="theme-preview-stub"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="appearance-control-stub"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="motion-control-stub"]').exists()).toBe(true)
  })

  it('exposes a Sortierung section with its section heading', () => {
    const wrapper = mountPage()
    const heading = wrapper.find('#settings-sorting-heading')
    expect(heading.exists()).toBe(true)
    expect(heading.element.tagName.toLowerCase()).toBe('h2')
    expect(heading.text()).toBe('Adjust sorting')
  })

  it('exposes a Leseverhalten section with id="tracking" so /settings/privacy can deep-link to it', () => {
    const wrapper = mountPage()
    const section = wrapper.find('section#tracking')
    expect(section.exists()).toBe(true)
    expect(section.attributes('aria-labelledby')).toBe('settings-tracking-heading')
    const heading = section.find('#settings-tracking-heading')
    expect(heading.exists()).toBe(true)
    expect(heading.element.tagName.toLowerCase()).toBe('h2')
  })

  it('renders the real engagement-tracking toggle (not a placeholder)', () => {
    const wrapper = mountPage()
    const toggle = wrapper.find('[data-testid="tracking-toggle"]')
    expect(toggle.exists()).toBe(true)
    expect((toggle.element as HTMLInputElement).type).toBe('checkbox')
  })

  it('does not render its own footer — the shortcut footer comes from the layout', () => {
    const wrapper = mountPage()
    expect(wrapper.find('footer').exists()).toBe(false)
  })
})
