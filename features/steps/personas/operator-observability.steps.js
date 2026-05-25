import { Given, Then, When } from '@cucumber/cucumber'
import { actorCalled, currentActor } from '../../support/screenplay/actor.js'
import { StartSignedInToInfl0 } from '../../support/screenplay/tasks/access.js'
import {
  FilterOperatorSources,
  OpenOperatorSourceObservability,
  ReportOperatorSourceHealth,
  SignInAsSeededOperator,
} from '../../support/screenplay/tasks/operator-observability.js'
import {
  OperatorAccessIsDenied,
  OperatorAttentionSourcesAreFirst,
  OperatorHealthSummaryIsVisible,
  OperatorSourcesHaveRows,
  OperatorTableExcludesSource,
  OperatorTableIncludesSource,
} from '../../support/screenplay/questions/operator-observability.js'

Given('{word} is an operator', async function (name) {
  await actorCalled(this, name).attemptsTo(SignInAsSeededOperator)
})

Given('{word} is reviewing operator source observability', async function (name) {
  await actorCalled(this, name).attemptsTo(SignInAsSeededOperator, ReportOperatorSourceHealth)
})

Given('crawler source health has been reported for {word}', async function (name) {
  await currentActor(this, name).attemptsTo(ReportOperatorSourceHealth)
})

Given('a regular reader tries to open operator observability', async function () {
  await actorCalled(this, 'Reader').attemptsTo(StartSignedInToInfl0, OpenOperatorSourceObservability)
})

When('{word} opens operator source observability', async function (name) {
  await currentActor(this, name).attemptsTo(OpenOperatorSourceObservability)
})

When('{word} filters operator sources to {string}', async function (name, label) {
  await currentActor(this, name).attemptsTo(FilterOperatorSources(label))
})

Then('{word} should see the health summary', async function (name) {
  await currentActor(this, name).asksFor(OperatorHealthSummaryIsVisible)
})

Then('sources needing attention should be listed first for {word}', async function (name) {
  await currentActor(this, name).asksFor(OperatorAttentionSourcesAreFirst)
})

Then('{word} should see operator source rows', async function (name) {
  await currentActor(this, name).asksFor(OperatorSourcesHaveRows)
})

Then('{word} should see blocked sources', async function (name) {
  await currentActor(this, name).asksFor(
    OperatorTableIncludesSource('https://example.com/operator-blocked.xml'),
  )
})

Then('{word} should not see healthy sources in that filtered view', async function (name) {
  await currentActor(this, name).asksFor(
    OperatorTableExcludesSource('https://example.com/operator-healthy.xml'),
  )
})

Then('{word} should see quiet sources', async function (name) {
  await currentActor(this, name).asksFor(
    OperatorTableIncludesSource('https://example.com/operator-quiet.xml'),
  )
})

Then('{word} should not see blocked sources in that filtered view', async function (name) {
  await currentActor(this, name).asksFor(
    OperatorTableExcludesSource('https://example.com/operator-blocked.xml'),
  )
})

Then('the reader should be denied access', async function () {
  await currentActor(this, 'Reader').asksFor(OperatorAccessIsDenied)
})
