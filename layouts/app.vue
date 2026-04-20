<script setup lang="ts">
const { t } = useI18n()
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
          `tabindex="-1"` is not about the tab order – it exists so the
          skip link above actually moves screen-reader / keyboard focus
          here; without it, browsers only scroll. The regression test
          in `tests/unit/landmarks-and-skip-link.test.ts` locks this
          down.

          Pages that use this layout must therefore NOT render their
          own top-level `<main>` (double landmarks confuse assistive
          tech); the same test also forbids that.
        -->
        <main id="main" tabindex="-1" class="outline-none">
            <slot />
        </main>

        <!--
          Avoid `position:fixed` inside transformed ancestors (e.g. ArticleView flip).
          Teleport keeps the control in viewport stacking order.
        -->
        <Teleport to="body">
            <div class="pointer-events-none fixed end-3 top-3 z-[500] flex justify-end">
                <div class="pointer-events-auto">
                    <AppUserMenu />
                </div>
            </div>
        </Teleport>
    </div>
</template>
