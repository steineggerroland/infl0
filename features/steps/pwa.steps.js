import { createRequire } from 'node:module'
import { When, Then } from '@cucumber/cucumber'
import { expect, request } from '@playwright/test'

const require = createRequire(import.meta.url)
const enLocale = require('../../i18n/locales/en.json')
const deLocale = require('../../i18n/locales/de.json')

async function fetchInstallListing(baseURL) {
  const api = await request.newContext({ baseURL })
  const manifestRes = await api.get('/manifest.webmanifest')
  expect(manifestRes.ok(), `manifest fetch failed: ${manifestRes.status()}`).toBeTruthy()
  const manifest = await manifestRes.json()
  await api.dispose()
  return manifest
}

async function assertReachable(baseURL, path) {
  const api = await request.newContext({ baseURL })
  const res = await api.get(path)
  expect(res.ok(), `${path} returned ${res.status()}`).toBeTruthy()
  await api.dispose()
}

When('I look up how infl0 presents itself for installation', async function () {
  this.installListing = await fetchInstallListing(this.baseURL)
})

Then('the install listing should name the app {string}', async function (appName) {
  const listing = this.installListing
  expect(listing?.name).toBe(appName)
  expect(listing?.short_name).toBe(appName)
})

Then(
  'readers should see an English description of calm, private reading from personal sources',
  async function () {
    expect(this.installListing?.description).toBe(enLocale.pwa.description)
  },
)

Then('German readers should see the same message in German', async function () {
  const localized = this.installListing?.description_localized
  expect(localized?.de).toBe(deLocale.pwa.description)
  expect(localized?.['de-DE']).toBe(deLocale.pwa.description)
})

Then('infl0 should open in its own window without browser toolbars', async function () {
  expect(this.installListing?.display).toBe('standalone')
})

Then('infl0 should work in portrait and landscape', async function () {
  expect(this.installListing?.orientation).toBe('any')
})

Then('I should be able to jump to the timeline from the home screen', async function () {
  const shortcuts = this.installListing?.shortcuts ?? []
  const timeline = shortcuts.find((s) => s.url === '/')
  expect(timeline?.name).toBe(enLocale.pwa.shortcuts.timeline.name)
})

Then('I should be able to jump to managing sources from the home screen', async function () {
  const shortcuts = this.installListing?.shortcuts ?? []
  const feeds = shortcuts.find((s) => s.url === '/feeds')
  expect(feeds?.name).toBe(enLocale.pwa.shortcuts.feeds.name)
})

Then('I should be able to jump to settings from the home screen', async function () {
  const shortcuts = this.installListing?.shortcuts ?? []
  const settings = shortcuts.find((s) => s.url === '/settings')
  expect(settings?.name).toBe(enLocale.pwa.shortcuts.settings.name)
})

Then("the install listing should include infl0's app icons", async function () {
  const icons = this.installListing?.icons ?? []
  const sizes = icons.map((icon) => icon.sizes)
  expect(sizes).toContain('192x192')
  expect(sizes).toContain('512x512')
  for (const icon of icons) {
    await assertReachable(this.baseURL, icon.src)
  }
})

Then('installed infl0 should be able to receive updates without a store', async function () {
  await assertReachable(this.baseURL, '/sw.js')
})

Then('the page should tell the browser how to install infl0', async function () {
  const manifestLink = this.page.locator('link[rel="manifest"]')
  await expect(manifestLink).toHaveAttribute('href', /manifest\.webmanifest/u)
  await expect(this.page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1)
})

Then('the page should be laid out for a phone-sized screen', async function () {
  const viewport = this.page.locator('meta[name="viewport"]')
  await expect(viewport).toHaveAttribute('content', /width=device-width/u)
  await expect(this.page.locator('meta[name="theme-color"]')).toHaveCount(1)
})
