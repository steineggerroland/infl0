/**
 * Remote Vercel previews can serve HTML before Nuxt has bound Vue event handlers.
 * BDD steps interact with forms and custom controls, so wait for the app root to
 * be mounted before clicking.
 */
export async function waitForNuxtAppReady(page) {
  await page.waitForFunction(() => {
    const root = document.querySelector('#__nuxt')
    return Boolean(root && root.__vue_app__)
  }, { timeout: 20_000 })
  await page.waitForTimeout(0)
}
