import { Given, Then, When } from '@cucumber/cucumber'
import { actorCalled, currentActor } from '../../support/screenplay/actor.js'
import {
  AddFirstSource,
  FinishOnboardingFromCard,
  FlipOnboardingCard,
  FocusOnboardingCard,
  LearnOnboardingBasics,
  OpenOnboardingFullText,
  ReceiveContentForFirstSource,
  RegisterForInfl0,
  ReloadInfl0,
  ReturnFromHelpToInfl0,
  StartAsSignedOutVisitor,
  StartFirstReadingSession,
} from '../../support/screenplay/tasks/new-user-reading-session.js'
import {
  FirstCurrentArticle,
  IntroCardBackGuidance,
  IntroCardGuidance,
  IntroFullTextGuidance,
  OnboardingCards,
  OnboardingCardsBeforeArticles,
  OnboardingCardRestored,
  OnboardingIsFinished,
  OnboardingTopicsInOrder,
  OnboardingUrlPointsTo,
  ReturnedArticlePlace,
} from '../../support/screenplay/questions/new-user-reading-session.js'

Given('{word} is a new reader', async function (name) {
  await actorCalled(this, name).attemptsTo(StartAsSignedOutVisitor)
})

When('{word} registers for infl0', async function (name) {
  await currentActor(this, name).attemptsTo(RegisterForInfl0)
})

Then('{word} should be welcomed with onboarding cards', async function (name) {
  await currentActor(this, name).asksFor(OnboardingCards)
})

Then("{word}'s onboarding cards should appear before regular articles", async function (name) {
  await currentActor(this, name).asksFor(OnboardingCardsBeforeArticles)
})

Then("{word}'s onboarding topics should be ordered", async function (name) {
  await currentActor(this, name).asksFor(OnboardingTopicsInOrder)
})

When('{word} learns the onboarding basics', async function (name) {
  await currentActor(this, name).attemptsTo(LearnOnboardingBasics)
})

When('{word} focuses the {string} onboarding card', async function (name, topic) {
  await currentActor(this, name).attemptsTo(FocusOnboardingCard(topic))
})

Then('{word} should see intro guidance to flip the card', async function (name) {
  await currentActor(this, name).asksFor(IntroCardGuidance)
})

When('{word} flips the {string} onboarding card', async function (name, topic) {
  await currentActor(this, name).attemptsTo(FlipOnboardingCard(topic))
})

Then('{word} should see intro guidance to keep moving and open full text', async function (name) {
  await currentActor(this, name).asksFor(IntroCardBackGuidance)
})

When('{word} opens full text on the {string} onboarding card', async function (name, topic) {
  await currentActor(this, name).attemptsTo(OpenOnboardingFullText(topic))
})

Then('{word} should see intro full-text guidance', async function (name) {
  await currentActor(this, name).asksFor(IntroFullTextGuidance)
})

Then("{word}'s URL should point to the {string} onboarding card", async function (name, topic) {
  await currentActor(this, name).asksFor(OnboardingUrlPointsTo(topic))
})

When('{word} reloads infl0', async function (name) {
  await currentActor(this, name).attemptsTo(ReloadInfl0)
})

Then('{word} should return to the {string} onboarding card', async function (name, topic) {
  await currentActor(this, name).asksFor(OnboardingCardRestored(topic))
})

When('{word} finishes onboarding from the {string} card', async function (name, topic) {
  await currentActor(this, name).attemptsTo(FinishOnboardingFromCard(topic))
})

Then("{word}'s onboarding should be finished", async function (name) {
  await currentActor(this, name).asksFor(OnboardingIsFinished)
})

When('{word} adds their first source', async function (name) {
  await currentActor(this, name).attemptsTo(AddFirstSource)
})

When("new content arrives for {word}'s source", async function (name) {
  await currentActor(this, name).attemptsTo(ReceiveContentForFirstSource)
})

When('{word} starts their first reading session', async function (name) {
  await currentActor(this, name).attemptsTo(StartFirstReadingSession)
})

Then('{word} should read the first current article deliberately', async function (name) {
  await currentActor(this, name).asksFor(FirstCurrentArticle)
})

When('{word} returns to infl0 from Help', async function (name) {
  await currentActor(this, name).attemptsTo(ReturnFromHelpToInfl0)
})

Then('{word} should continue at that article', async function (name) {
  await currentActor(this, name).asksFor(ReturnedArticlePlace)
})
