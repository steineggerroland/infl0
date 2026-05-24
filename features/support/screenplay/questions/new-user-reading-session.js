import { expect } from '@playwright/test'
import { OnboardingJourney } from '../../onboarding-journey.js'
import { ReaderTimeline } from '../../reader-timeline.js'
import { BrowseTheWeb } from '../abilities/browse-the-web.js'

export const OnboardingCards = {
  async answeredBy(actor) {
    const page = BrowseTheWeb.as(actor)
    await new OnboardingJourney(page).expectCardsVisible()
  },
}

export const OnboardingCardsBeforeArticles = {
  async answeredBy(actor) {
    await new OnboardingJourney(BrowseTheWeb.as(actor)).expectCardsBeforeArticles()
  },
}

export const OnboardingTopicsInOrder = {
  async answeredBy(actor) {
    await new OnboardingJourney(BrowseTheWeb.as(actor)).expectTopicsInOrder()
  },
}

export const IntroCardGuidance = {
  async answeredBy(actor) {
    const onboarding = new OnboardingJourney(BrowseTheWeb.as(actor))
    await onboarding.expectIntroHeadline()
    await onboarding.expectGuidanceToFlip()
  },
}

export const IntroCardBackGuidance = {
  async answeredBy(actor) {
    const onboarding = new OnboardingJourney(BrowseTheWeb.as(actor))
    await onboarding.expectIntroNavigationDetails()
    await onboarding.expectIntroFullTextAffordance()
  },
}

export const IntroFullTextGuidance = {
  async answeredBy(actor) {
    const onboarding = new OnboardingJourney(BrowseTheWeb.as(actor))
    await onboarding.expectIntroFullTextHelpLink()
    await onboarding.expectIntroFullTextContinuation()
  },
}

export function OnboardingCardRestored(topic) {
  return {
    async answeredBy(actor) {
      await new OnboardingJourney(BrowseTheWeb.as(actor)).expectTopicRestored(topic)
    },
  }
}

export function OnboardingUrlPointsTo(topic) {
  return {
    async answeredBy(actor) {
      await new OnboardingJourney(BrowseTheWeb.as(actor)).expectUrlForTopic(topic)
    },
  }
}

export const OnboardingIsFinished = {
  async answeredBy(actor) {
    await expect(BrowseTheWeb.as(actor).getByTestId('onboarding-card')).toHaveCount(0)
  },
}

export const FirstCurrentArticle = {
  async answeredBy(actor) {
    const page = BrowseTheWeb.as(actor)
    const timeline = new ReaderTimeline(page)
    const article = actor.recall('firstArticle')
    if (!article?.id) throw new Error(`${actor.name} has no first article.`)
    const card = timeline.articleCard(article.id)
    await expect(card).toBeVisible({ timeout: 20_000 })
    await expect(card).toHaveAttribute('data-reader-selected', 'true')
    await expect(page).toHaveURL(new RegExp(`/inflow/article/${article.id}$`, 'u'))
    return card
  },
}

export const ReturnedArticlePlace = {
  async answeredBy(actor) {
    const page = BrowseTheWeb.as(actor)
    const timeline = new ReaderTimeline(page)
    const article = actor.recall('currentArticle')
    if (!article?.id) throw new Error(`${actor.name} has no remembered reader article.`)
    const card = timeline.articleCard(article.id)
    await expect(page.getByTestId('reader-start')).toHaveCount(0)
    await expect(card).toBeVisible({ timeout: 20_000 })
    await expect.poll(async () => timeline.visibleRatio(card), { timeout: 15_000 }).toBeGreaterThan(0.5)
    return card
  },
}
