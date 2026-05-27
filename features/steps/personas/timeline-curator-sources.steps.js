import { Given, Then, When } from '@cucumber/cucumber'
import { actorCalled, currentActor } from '../../support/screenplay/actor.js'
import { StartSignedInToInfl0 } from '../../support/screenplay/tasks/access.js'
import {
  AddRememberedSource,
  HaveMultipleActiveSources,
  IncreaseRememberedSourceWeight,
  PauseRememberedSource,
  PrepareSourceCuration,
  ReceiveCrawlerHealth,
  RemoveRememberedSource,
  RequireCrawlerStatusReporting,
  ResumeRememberedSource,
} from '../../support/screenplay/tasks/source-curation.js'
import {
  RememberedSourceHasHealth,
  RememberedSourceHealthExplains,
  RememberedSourceIsActive,
  RememberedSourceIsListed,
  RememberedSourceIsPaused,
  RememberedSourcePreferenceIsSaved,
  SourceListIsEmpty,
  WeightedSourceLeadsFutureTimeline,
} from '../../support/screenplay/questions/source-curation.js'

Given('{word} is ready to curate timeline sources', async function (name) {
  await actorCalled(this, name).attemptsTo(StartSignedInToInfl0, PrepareSourceCuration())
})

Given('{word} is ready to curate a source without crawler status', async function (name) {
  await actorCalled(this, name).attemptsTo(StartSignedInToInfl0, PrepareSourceCuration('noSnapshot'))
})

Given('{word} is ready to pause and resume a source', async function (name) {
  await actorCalled(this, name).attemptsTo(StartSignedInToInfl0, PrepareSourceCuration('pausable'))
})

Given('{word} is ready to inspect crawler health {string}', async function (name, status) {
  const profile = status === 'healthy' ? 'healthy' : 'needsSetup'
  await actorCalled(this, name).attemptsTo(StartSignedInToInfl0, PrepareSourceCuration(profile))
})

Given('{word} has multiple active sources', async function (name) {
  await actorCalled(this, name).attemptsTo(StartSignedInToInfl0, HaveMultipleActiveSources)
})

Given('{word} has crawler status reporting available', async function (name) {
  await currentActor(this, name).attemptsTo(RequireCrawlerStatusReporting())
})

When('{word} adds that source', { timeout: 150_000 }, async function (name) {
  await currentActor(this, name).attemptsTo(AddRememberedSource)
})

When('{word} removes that source', async function (name) {
  await currentActor(this, name).attemptsTo(RemoveRememberedSource)
})

When('{word} pauses that source', async function (name) {
  await currentActor(this, name).attemptsTo(PauseRememberedSource)
})

When('{word} resumes that source', async function (name) {
  await currentActor(this, name).attemptsTo(ResumeRememberedSource)
})

When('{word} receives crawler health {string} for that source', async function (name, status) {
  await currentActor(this, name).attemptsTo(ReceiveCrawlerHealth(status))
})

When("{word} increases one source's weight", async function (name) {
  await currentActor(this, name).attemptsTo(IncreaseRememberedSourceWeight)
})

Then('{word} should see an empty source list', async function (name) {
  await currentActor(this, name).asksFor(SourceListIsEmpty)
})

Then('{word} should see that source in their source list', async function (name) {
  await currentActor(this, name).asksFor(RememberedSourceIsListed)
})

Then('{word} should see that source as active', async function (name) {
  await currentActor(this, name).asksFor(RememberedSourceIsActive)
})

Then('{word} should see that source as paused', async function (name) {
  await currentActor(this, name).asksFor(RememberedSourceIsPaused)
})

Then('{word} should see source health {string}', async function (name, status) {
  await currentActor(this, name).asksFor(RememberedSourceHasHealth(status))
})

Then('{word} should see source health explained as {string}', async function (name, label) {
  await currentActor(this, name).asksFor(RememberedSourceHealthExplains(label))
})

Then('{word} should see that the source preference was saved', async function (name) {
  await currentActor(this, name).asksFor(RememberedSourcePreferenceIsSaved)
})

Then('future timeline ranking should respect that preference', async function () {
  await currentActor(this).asksFor(WeightedSourceLeadsFutureTimeline)
})
