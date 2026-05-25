import { Given } from '@cucumber/cucumber'

Given('the crawler API key is configured', function () {
  if (!process.env.NUXT_CRAWLER_API_KEY?.trim()) {
    throw new Error(
      'NUXT_CRAWLER_API_KEY is required for crawler BDD steps (merge .env.e2e into env for test:bdd).',
    )
  }
})
