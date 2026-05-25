import { randomBytes } from 'node:crypto'
import { crawlerIngest } from '../../crawler-fixtures.js'
import { OnboardingJourney } from '../../onboarding-journey.js'
import { ReaderTimeline } from '../../reader-timeline.js'
import { SourcesPage } from '../../sources-page.js'
import { UserMenu } from '../../user-menu.js'
import { BrowseTheWeb } from '../abilities/browse-the-web.js'
export { RegisterForInfl0, StartAsSignedOutVisitor } from './access.js'

function uniqueSuffix() {
  return `${Date.now().toString(36)}-${randomBytes(4).toString('hex')}`
}

function actorSlug(actor) {
  return actor.name.toLowerCase().replace(/[^a-z0-9]+/gu, '-').replace(/^-|-$/gu, '') || 'reader'
}

export const LearnOnboardingBasics = {
  async performAs(actor) {
    const page = BrowseTheWeb.as(actor)
    await new OnboardingJourney(page).flipTopic('intro')
  },
}

export function FocusOnboardingCard(topic) {
  return {
    async performAs(actor) {
      const page = BrowseTheWeb.as(actor)
      await new OnboardingJourney(page).focusTopic(topic)
      actor.remember('currentOnboardingTopic', topic)
    },
  }
}

export function FlipOnboardingCard(topic) {
  return {
    async performAs(actor) {
      const page = BrowseTheWeb.as(actor)
      await new OnboardingJourney(page).flipTopic(topic)
      actor.remember('currentOnboardingTopic', topic)
    },
  }
}

export function OpenOnboardingFullText(topic) {
  return {
    async performAs(actor) {
      const page = BrowseTheWeb.as(actor)
      await new OnboardingJourney(page).openFullText(topic)
      actor.remember('currentOnboardingTopic', topic)
    },
  }
}

export const ReloadInfl0 = {
  async performAs(actor) {
    const page = BrowseTheWeb.as(actor)
    const topic = actor.recall('currentOnboardingTopic')
    if (!topic) throw new Error(`${actor.name} has no remembered onboarding topic.`)
    await new OnboardingJourney(page).reloadKeepingTopic(topic)
  },
}

export function FinishOnboardingFromCard(topic) {
  return {
    async performAs(actor) {
      const page = BrowseTheWeb.as(actor)
      await new OnboardingJourney(page).finishFromTopic(topic)
    },
  }
}

export const AddFirstSource = {
  async performAs(actor) {
    const page = BrowseTheWeb.as(actor)
    const suffix = uniqueSuffix()
    const slug = actorSlug(actor)
    const feedUrl = `https://example.com/bdd-persona-${slug}/${suffix}.xml`
    const displayName = `${actor.name} First Source`
    await new SourcesPage(page).open()
    await new SourcesPage(page).addSource(actor.world, feedUrl, displayName)
    actor.remember('firstSource', { feedUrl, displayName, crawlKey: actor.world.lastCrawlKey })
  },
}

export const ReceiveContentForFirstSource = {
  async performAs(actor) {
    const page = BrowseTheWeb.as(actor)
    const source = actor.recall('firstSource')
    if (!source?.crawlKey) throw new Error(`${actor.name} has no source crawl key.`)
    const suffix = uniqueSuffix()
    const slug = actorSlug(actor)
    const article = {
      id: `bdd-persona-${slug}-${suffix}-01`,
      title: `${actor.name} first current article`,
      teaser: 'A calm first article for a new infl0 reader.',
      summary: `${actor.name} can recognize this article after starting and returning.`,
      publishedAt: new Date().toISOString(),
    }
    await crawlerIngest(page, {
      crawlKey: source.crawlKey,
      id: article.id,
      link: `https://example.com/bdd-persona/${article.id}`,
      title: article.title,
      author: 'BDD Persona Author',
      publishedAt: article.publishedAt,
      content_hash: `${article.id}-hash`,
      content_md: `# ${article.title}\n\nFull text for ${actor.name}'s first reading session.`,
      source_type: 'rss',
      tld: 'example.com',
      categories: ['bdd', 'persona'],
      teaser: article.teaser,
      summary_long: article.summary,
      category: ['bdd', 'persona'],
      tags: ['new-user'],
      seriousness_rating: 'low',
    })
    actor.remember('firstArticle', article)
  },
}

export const StartFirstReadingSession = {
  async performAs(actor) {
    const page = BrowseTheWeb.as(actor)
    const timeline = new ReaderTimeline(page)
    const article = actor.recall('firstArticle')
    if (!article?.id) throw new Error(`${actor.name} has no first article.`)
    await timeline.open()
    await timeline.startReading()
    const card = timeline.articleCard(article.id)
    await timeline.focusCard(card)
    actor.remember('currentArticle', article)
  },
}

export const ReturnFromHelpToInfl0 = {
  async performAs(actor) {
    const page = BrowseTheWeb.as(actor)
    await new UserMenu(page).goToHelp()
    await page.goto('/')
  },
}
