import { Given, Then, When } from '@cucumber/cucumber'
import { actorCalled, currentActor } from '../../support/screenplay/actor.js'
import {
  OpenIntegratorDashboard,
  OpenLatestIngestRequest,
  OpenRejectedIngestRequest,
  SendInvalidStructureIngestRequest,
  SendMixedSuccessfulIngestRequests,
  SendRecentSuccessfulIngestRequests,
  SendUnsupportedSectionIngestRequest,
  SendWrongKeyIngestRequest,
  SignInAsIntegratorOperator,
} from '../../support/screenplay/tasks/integrator-observability.js'
import {
  CrawlerKeyIsHidden,
  IngestAcceptedCountsAreVisible,
  IntegratorDashboardShowsRecentRequests,
  InvalidStructureDetailsAreVisible,
  LatestTenRequestsAreGreen,
  RejectedAuthRequestIsVisible,
  UnsupportedContentDetailsAreVisible,
  UnsupportedContentReachedInfl0,
} from '../../support/screenplay/questions/integrator-observability.js'

Given('{word} is allowed to inspect integrator observability', async function (name) {
  await actorCalled(this, name).attemptsTo(SignInAsIntegratorOperator)
})

Given('the crawler has sent recent successful ingest requests', async function () {
  await currentActor(this).attemptsTo(SendRecentSuccessfulIngestRequests)
})

Given('{word} is inspecting recent crawler delivery', async function (name) {
  await actorCalled(this, name).attemptsTo(SignInAsIntegratorOperator, SendMixedSuccessfulIngestRequests)
})

Given('the crawler sent an ingest request with a wrong API key', async function () {
  await actorCalled(this, 'Ingo').attemptsTo(SignInAsIntegratorOperator, SendWrongKeyIngestRequest)
})

Given('the crawler sent an ingest request with invalid structure', async function () {
  await actorCalled(this, 'Ingo').attemptsTo(SignInAsIntegratorOperator, SendInvalidStructureIngestRequest)
})

Given('the crawler sent a section payload that infl0 does not support yet', async function () {
  await actorCalled(this, 'Ingo').attemptsTo(SignInAsIntegratorOperator, SendUnsupportedSectionIngestRequest)
})

When('{word} opens the integrator dashboard', async function (name) {
  await currentActor(this, name).attemptsTo(OpenIntegratorDashboard)
})

When('{word} opens an ingest request', async function (name) {
  await currentActor(this, name).attemptsTo(OpenLatestIngestRequest)
})

When('{word} opens the rejected request details', async function (name) {
  const actor = currentActor(this, name)
  await actor.attemptsTo(OpenRejectedIngestRequest(actor.recall('ingoRejectedCategory') ?? 'invalid_structure'))
})

Then('{word} should see the latest ingest requests', async function (name) {
  await currentActor(this, name).asksFor(IntegratorDashboardShowsRecentRequests)
})

Then('{word} should see that the last 10 requests are green', async function (name) {
  await currentActor(this, name).asksFor(LatestTenRequestsAreGreen)
})

Then('{word} should see how many articles were accepted', async function (name) {
  await currentActor(this, name).asksFor(IngestAcceptedCountsAreVisible)
})

Then('{word} should see how many episodes were accepted', async function (name) {
  await currentActor(this, name).asksFor(IngestAcceptedCountsAreVisible)
})

Then('{word} should see how many subscribers were affected', async function (name) {
  await currentActor(this, name).asksFor(IngestAcceptedCountsAreVisible)
})

Then('{word} should see a rejected request', async function (name) {
  await currentActor(this, name).asksFor(RejectedAuthRequestIsVisible)
})

Then('{word} should see that authentication failed', async function (name) {
  await currentActor(this, name).asksFor(RejectedAuthRequestIsVisible)
})

Then('the crawler key itself should not be exposed', async function () {
  await currentActor(this).asksFor(CrawlerKeyIsHidden)
})

Then('{word} should see which validation failed', async function (name) {
  await currentActor(this, name).asksFor(InvalidStructureDetailsAreVisible)
})

Then('{word} should see what infl0 received in a bounded request preview', async function (name) {
  await currentActor(this, name).asksFor(InvalidStructureDetailsAreVisible)
})

Then('{word} should see that the request reached infl0', async function (name) {
  await currentActor(this, name).asksFor(UnsupportedContentReachedInfl0)
})

Then('{word} should see that the content kind is unsupported rather than lost', async function (name) {
  await currentActor(this, name).asksFor(UnsupportedContentDetailsAreVisible)
})
