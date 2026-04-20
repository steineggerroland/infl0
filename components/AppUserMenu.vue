<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const { logout } = useAuthLogout()

const menuRoot = ref<HTMLDetailsElement | null>(null)

function closeMenu() {
    if (menuRoot.value) menuRoot.value.open = false
}

async function onLogout() {
    closeMenu()
    await logout()
}

const linkClass =
    'block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-100 no-underline visited:text-gray-100 transition-colors hover:bg-gray-800 hover:text-white active:bg-gray-800/80'
</script>

<template>
    <details ref="menuRoot" class="relative z-40">
        <summary
            class="btn btn-sm h-10 min-h-0 cursor-pointer list-none rounded-xl border border-gray-600 bg-gray-950 px-3 text-gray-100 shadow-lg ring-1 ring-black/40 hover:bg-gray-900 hover:ring-white/10 [&::-webkit-details-marker]:hidden"
            :aria-label="t('menu.open')"
        >
            <span class="text-base leading-none tracking-tight" aria-hidden="true">☰</span>
        </summary>
        <ul
            class="app-user-menu__panel absolute end-0 z-50 m-0 mt-2 min-w-[15rem] max-w-[calc(100vw-1.5rem)] list-none space-y-0.5 rounded-xl border border-gray-600 bg-gray-950 p-2 py-3 text-gray-100 shadow-2xl ring-1 ring-black/50 [&>li]:list-none"
        >
            <li v-if="route.path !== '/'">
                <NuxtLink to="/" :class="linkClass" @click="closeMenu">
                    {{ t('menu.timeline') }}
                </NuxtLink>
            </li>
            <li v-if="route.path !== '/feeds'">
                <NuxtLink to="/feeds" :class="linkClass" @click="closeMenu">
                    {{ t('menu.feeds') }}
                </NuxtLink>
            </li>
            <li v-if="route.path !== '/settings/timeline-score'">
                <NuxtLink to="/settings/timeline-score" :class="linkClass" @click="closeMenu">
                    {{ t('menu.timelineScore') }}
                </NuxtLink>
            </li>
            <li v-if="route.path !== '/settings/privacy'">
                <NuxtLink to="/settings/privacy" :class="linkClass" @click="closeMenu">
                    {{ t('menu.privacy') }}
                </NuxtLink>
            </li>
            <li v-if="route.path !== '/settings/personalization'">
                <NuxtLink to="/settings/personalization" :class="linkClass" @click="closeMenu">
                    {{ t('menu.personalization') }}
                </NuxtLink>
            </li>
            <li v-if="route.path !== '/help'">
                <NuxtLink to="/help" :class="linkClass" @click="closeMenu">
                    {{ t('menu.help') }}
                </NuxtLink>
            </li>
            <li class="px-3 pb-1 pt-3">
                <span
                    class="text-[0.65rem] font-semibold uppercase tracking-wider text-gray-400"
                >{{ t('menu.language') }}</span>
            </li>
            <li class="px-2 pb-2">
                <LocaleSwitcher menu />
            </li>
            <li class="mt-1 border-t border-gray-700 px-1 pt-2">
                <button
                    type="button"
                    class="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-400 transition-colors hover:bg-red-950/50 hover:text-red-300"
                    @click="onLogout"
                >
                    {{ t('menu.logOut') }}
                </button>
            </li>
        </ul>
    </details>
</template>

<style scoped>
/* Safari / some UAs still paint ::marker even with list-style:none on the parent */
.app-user-menu__panel > li {
    list-style-type: none;
}

.app-user-menu__panel > li::marker {
    content: none;
}
</style>
