import { Given, Then, When } from '@cucumber/cucumber'
import { actorCalled, currentActor } from '../../support/screenplay/actor.js'
import { StartSignedInToInfl0 } from '../../support/screenplay/tasks/access.js'
import {
  FollowSettingsSection,
  OpenSettingsSection,
  PrepareSettingsExploration,
} from '../../support/screenplay/tasks/settings-navigation.js'
import { SettingsSectionVisible } from '../../support/screenplay/questions/settings-navigation.js'

Given('{word} is exploring settings', async function (name) {
  await actorCalled(this, name).attemptsTo(StartSignedInToInfl0, PrepareSettingsExploration)
})

When('{word} opens settings section {string}', async function (name, path) {
  await currentActor(this, name).attemptsTo(OpenSettingsSection(path))
})

When('{word} follows the settings section {string}', async function (name, slug) {
  await currentActor(this, name).attemptsTo(FollowSettingsSection(slug))
})

Then('{word} should see the {string} settings section', async function (name, section) {
  await currentActor(this, name).asksFor(SettingsSectionVisible(section))
})
