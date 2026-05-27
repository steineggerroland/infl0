import { Then, When } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { currentActor } from '../../support/screenplay/actor.js'
import { ReaderTimeline } from '../../support/reader-timeline.js'

When('{word} uses the show-read timeline shortcut', async function (name) {
  currentActor(this, name)
  const page = this.page
  const menu = new ReaderTimeline(page).userMenu
  const input = await menu.openShowReadInput()
  if (!(await input.isChecked())) {
    await input.check()
    await expect.poll(async () => input.isChecked(), { timeout: 15_000 }).toBe(true)
  }
  await menu.close()
  await page.locator('body').click({ position: { x: 8, y: 8 } })
  await page.keyboard.press('r')
  await expect.poll(async () => menu.readShowReadChecked(), { timeout: 15_000 }).toBe(false)
})

Then('{word} should see read articles hidden on the timeline', async function (name) {
  const actor = currentActor(this, name)
  const articles = actor.recall('readerArticles')
  const firstId = articles?.[0]?.id
  if (!firstId) throw new Error(`${name} has no remembered reader articles.`)
  await expect(this.page.locator(`[data-testid="article-card"][data-article-id="${firstId}"]`)).toHaveCount(
    0,
    { timeout: 15_000 },
  )
  await expect(this.page.getByTestId('reader-start')).toHaveCount(0)
})
