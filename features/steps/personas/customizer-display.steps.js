import { Given, Then, When } from '@cucumber/cucumber'
import { actorCalled, currentActor } from '../../support/screenplay/actor.js'
import { StartSignedInToInfl0 } from '../../support/screenplay/tasks/access.js'
import {
  ChooseCustomCardFrontBackground,
  ChooseLowStimulationDisplayPreferences,
  PrepareDisplaySettings,
} from '../../support/screenplay/tasks/display-preferences.js'
import {
  CardFrontBackgroundPersists,
  DisplayPreferencesPersist,
} from '../../support/screenplay/questions/display-preferences.js'

Given('{word} is preparing display settings', async function (name) {
  await actorCalled(this, name).attemptsTo(StartSignedInToInfl0, PrepareDisplaySettings)
})

When('{word} chooses calmer display preferences', async function (name) {
  await currentActor(this, name).attemptsTo(ChooseLowStimulationDisplayPreferences)
})

When('{word} chooses custom card-front colours', async function (name) {
  await currentActor(this, name).attemptsTo(ChooseCustomCardFrontBackground('#123456'))
})

Then("{word}'s display preferences should stay saved", async function (name) {
  await currentActor(this, name).asksFor(DisplayPreferencesPersist)
})

Then("{word}'s custom card-front colours should stay available", async function (name) {
  await currentActor(this, name).asksFor(CardFrontBackgroundPersists)
})
