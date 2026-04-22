<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()

/**
 * Pages opt into the shared "Timeline/Hilfe" footer via page meta:
 *
 *   definePageMeta({
 *     layout: 'app',
 *     appFooter: true,                                      // sensible defaults
 *     // or: { containerMax: '4xl', testId: 'feeds-page-footer' }
 *   })
 *
 * Rendering the footer HERE (as a sibling of `<main>`) — instead of
 * teleporting it from inside the page — keeps the `<footer>` out of
 * the main landmark AND avoids Vue 3's SSR teleport-to-body placement,
 * which put the footer above the page content on reload.
 */
type FooterMeta = true | { containerMax?: 'lg' | '4xl'; testId?: string }

const footerMeta = computed<FooterMeta | undefined>(() => {
  const raw = route.meta.appFooter as unknown
  if (raw === true) return true
  if (raw && typeof raw === 'object') return raw as FooterMeta
  return undefined
})

const footerContainerMax = computed<'lg' | '4xl'>(() => {
  const m = footerMeta.value
  if (m && typeof m === 'object' && m.containerMax) return m.containerMax
  return 'lg'
})

const footerTestId = computed<string>(() => {
  const m = footerMeta.value
  if (m && typeof m === 'object' && m.testId) return m.testId
  return 'app-footer-shortcuts'
})
</script>

<template>
    <div class="relative min-h-dvh">
        <!--
          Skip link: invisible until focused. Lets keyboard and
          screen-reader users jump past the floating user menu and any
          future header straight into the page's primary content. The
          landing target is the shared `<main id="main">` below. The
          label lives in the `common.skipToMain` i18n key so translators
          can see it alongside the other shared UI strings.
        -->
        <a
            href="#main"
            class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[999] focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:text-gray-900 focus:shadow"
        >
            {{ t('common.skipToMain') }}
        </a>

        <!--
          `<main id="main" tabindex="-1">` is the single primary
          landmark for every page that opts into this layout. The
          `tabindex="-1"` is not about tab order; it ensures the skip
          link above can move keyboard/screen-reader focus to `main`
          instead of only scrolling.

          This contract is verified by Playwright in
          `tests/e2e/a11y-layout-smoke.spec.ts`.
        -->
        <main id="main" tabindex="-1" class="outline-none">
            <slot />
        </main>

        <!--
          Page-level `<footer>` landmark. Rendered OUTSIDE `<main>` so
          assistive tech treats it as `contentinfo`, not as part of the
          page's main region. Opt-in via `definePageMeta({ appFooter })`.
        -->
        <AppFooterShortcuts
            v-if="footerMeta"
            :container-max="footerContainerMax"
            :test-id="footerTestId"
        />

        <!--
          Avoid `position:fixed` inside transformed ancestors (e.g. ArticleView flip).
          Teleport keeps the control in viewport stacking order.
        -->
        <Teleport to="body">
            <header class="pointer-events-none fixed end-3 top-3 z-[500] flex justify-end">
                <div class="pointer-events-auto">
                    <AppUserMenu />
                </div>
            </header>
        </Teleport>
    </div>
</template>
