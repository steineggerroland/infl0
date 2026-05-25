import { When } from '@cucumber/cucumber'

When('I reload the timeline', async function () {
  await this.page.reload({ waitUntil: 'networkidle' })
})
