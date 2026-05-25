import { Given, Then, When } from '@cucumber/cucumber'
import { actorCalled, currentActor } from '../../support/screenplay/actor.js'
import { StartSignedInToInfl0 } from '../../support/screenplay/tasks/access.js'
import {
  BackdateLastReaderSession,
  FocusReaderArticle,
  GoToHelpFromReader,
  HaveFirstReaderArticleRead,
  HaveReaderArticles,
  HideReadReaderArticles,
  JumpToLastReaderArticle,
  LeaveBeforeReaderStart,
  MarkCurrentReaderArticleRead,
  OpenReaderTimeline,
  PressReadStateShortcut,
  ReloadReaderTimeline,
  ReturnHome,
  SetReadingBehaviourTracking,
  StartReaderSession,
} from '../../support/screenplay/tasks/active-reader.js'
import {
  CurrentReaderArticleBecomesRead,
  CurrentReaderArticleBecomesUnread,
  CurrentReaderArticleHasNoBehaviourEvent,
  CurrentReaderArticleIsRead,
  FirstReaderArticleIsUnread,
  ReaderArticleCardsAreHidden,
  ReaderArticleIsCurrent,
  ReaderStartIsNotVisible,
  ReaderStartIsVisible,
  ReaderStartShowsNewArticleCount,
  ReaderUrlPointsTo,
  ResumeReaderActionIsHidden,
} from '../../support/screenplay/questions/active-reader.js'

Given('{word} has reader articles', async function (name) {
  await actorCalled(this, name).attemptsTo(StartSignedInToInfl0, HaveReaderArticles)
})

Given("{word}'s first reader article is already read", async function (name) {
  await currentActor(this, name).attemptsTo(HaveFirstReaderArticleRead)
})

Given('{word} has reading behaviour tracking enabled', async function (name) {
  await currentActor(this, name).attemptsTo(SetReadingBehaviourTracking(true))
})

Given('{word} has reading behaviour tracking disabled', async function (name) {
  await currentActor(this, name).attemptsTo(SetReadingBehaviourTracking(false))
})

Given("{word}'s last reader session started before these articles arrived", async function (name) {
  await currentActor(this, name).attemptsTo(BackdateLastReaderSession)
})

Given('{word} hides read articles in their timeline', async function (name) {
  await currentActor(this, name).attemptsTo(HideReadReaderArticles)
})

When('{word} opens the timeline', async function (name) {
  await currentActor(this, name).attemptsTo(OpenReaderTimeline)
})

When('{word} starts reading', async function (name) {
  await currentActor(this, name).attemptsTo(StartReaderSession)
})

When('{word} focuses the {word} reader article', async function (name, ordinal) {
  await currentActor(this, name).attemptsTo(FocusReaderArticle(ordinal))
})

When('{word} reloads the timeline', async function (name) {
  await currentActor(this, name).attemptsTo(ReloadReaderTimeline)
})

When('{word} jumps to the last reader article', async function (name) {
  await currentActor(this, name).attemptsTo(JumpToLastReaderArticle)
})

When('{word} leaves infl0 without starting the reader', async function (name) {
  await currentActor(this, name).attemptsTo(LeaveBeforeReaderStart)
})

When('{word} opens Help from the floating menu', async function (name) {
  await currentActor(this, name).attemptsTo(GoToHelpFromReader)
})

When('{word} returns to the timeline by opening home', async function (name) {
  await currentActor(this, name).attemptsTo(ReturnHome)
})

When('{word} marks the current reader article as read', async function (name) {
  await currentActor(this, name).attemptsTo(MarkCurrentReaderArticleRead)
})

When('{word} presses the read-state shortcut', async function (name) {
  await currentActor(this, name).attemptsTo(PressReadStateShortcut)
})

Then("{word}'s URL should point to the {word} reader article", async function (name, ordinal) {
  await currentActor(this, name).asksFor(ReaderUrlPointsTo(ordinal))
})

Then('{word} should see the reader start screen', async function (name) {
  await currentActor(this, name).asksFor(ReaderStartIsVisible)
})

Then('{word} should not see the reader start screen', async function (name) {
  await currentActor(this, name).asksFor(ReaderStartIsNotVisible)
})

Then('{word} should not see reader article cards', async function (name) {
  await currentActor(this, name).asksFor(ReaderArticleCardsAreHidden)
})

Then('{word} should not see the resume reader action', async function (name) {
  await currentActor(this, name).asksFor(ResumeReaderActionIsHidden)
})

Then('{word} should see {int} new reader articles on the reader start screen', async function (name, count) {
  await currentActor(this, name).asksFor(ReaderStartShowsNewArticleCount(count))
})

Then('{word} should return to the {word} reader article', async function (name, ordinal) {
  await currentActor(this, name).asksFor(ReaderArticleIsCurrent(ordinal))
})

Then("{word}'s current reader article should show that it is read", async function (name) {
  await currentActor(this, name).asksFor(CurrentReaderArticleIsRead)
})

Then("{word}'s current reader article should become read", async function (name) {
  await currentActor(this, name).asksFor(CurrentReaderArticleBecomesRead)
})

Then("{word}'s current reader article should become unread", async function (name) {
  await currentActor(this, name).asksFor(CurrentReaderArticleBecomesUnread)
})

Then("{word}'s current reader article should have no reading behaviour event", async function (name) {
  await currentActor(this, name).asksFor(CurrentReaderArticleHasNoBehaviourEvent)
})

Then("{word}'s first reader article should still be unread", async function (name) {
  await currentActor(this, name).asksFor(FirstReaderArticleIsUnread)
})
