<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const { logout } = useAuthLogout()
const { showRead } = useTimelinePreferences()

const menuRoot = ref<HTMLDetailsElement | null>(null)
const isOpen = ref(false)

function closeMenu() {
    if (menuRoot.value) menuRoot.value.open = false
    isOpen.value = false
}

function syncOpenState() {
    isOpen.value = Boolean(menuRoot.value?.open)
}

async function onLogout() {
    closeMenu()
    await logout()
}

const linkClass =
    'infl0-menu-link no-underline visited:[color:inherit]'
</script>

<template>
    <details ref="menuRoot" class="dropdown dropdown-end relative z-40" @toggle="syncOpenState">
        <summary
            class="btn btn-sm btn-square swap swap-rotate h-10 min-h-0 list-none rounded-xl shadow-lg ring-1 ring-black/30 infl0-chrome-button [&::-webkit-details-marker]:hidden"
            :class="{ 'swap-active': isOpen }"
            :aria-label="isOpen ? t('menu.close') : t('menu.open')"
        >
            <span class="swap-off text-xl leading-none" aria-hidden="true">☰</span>
            <span class="swap-on text-xl leading-none" aria-hidden="true">✕</span>
        </summary>
        <div
            class="app-user-menu__panel dropdown-content infl0-chrome-panel absolute end-0 z-50 m-0 mt-2 min-w-[15rem] max-w-[calc(100vw-1.5rem)] rounded-box border p-2 shadow-2xl ring-1 ring-black/30"
        >
            <nav :aria-label="t('menu.navLandmark')">
                <ul class="menu menu-sm app-user-menu__list m-0 w-full list-none gap-1 p-0">
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
                    <!--
                        Settings is the one-click destination for visual +
                        sorting + data-consent preferences. "Why at the top?"
                        stays as its own entry because it is an explanatory
                        read, not a setting, and "Privacy" stays
                        because it carries the storage philosophy (and
                        eventually the legal privacy statement), not a
                        toggle — the toggle lives inside Settings.
                    -->
                    <li v-if="route.path !== '/settings'">
                        <NuxtLink to="/settings" :class="linkClass" @click="closeMenu">
                            {{ t('menu.settings') }}
                        </NuxtLink>
                    </li>
                    <li v-if="route.path !== '/settings/personalization'">
                        <NuxtLink to="/settings/personalization" :class="linkClass" @click="closeMenu">
                            {{ t('menu.personalization') }}
                        </NuxtLink>
                    </li>
                    <li v-if="route.path !== '/settings/privacy'">
                        <NuxtLink to="/settings/privacy" :class="linkClass" @click="closeMenu">
                            {{ t('menu.privacy') }}
                        </NuxtLink>
                    </li>
                    <li v-if="route.path !== '/help'">
                        <NuxtLink to="/help" :class="linkClass" @click="closeMenu">
                            {{ t('menu.help') }}
                        </NuxtLink>
                    </li>
                </ul>
            </nav>

            <ul class="menu menu-sm app-user-menu__list m-0 w-full list-none gap-0 p-0">
            <li class="menu-title mt-1 border-t border-[var(--infl0-chrome-border)] px-3 pb-1 pt-3">
                <span>{{ t('menu.view') }}</span>
            </li>
            <li>
                <label
                    class="infl0-menu-row"
                    data-testid="menu-show-read-toggle"
                >
                    <span class="leading-snug">{{ t('index.showReadLabel') }}</span>
                    <input
                        v-model="showRead"
                        type="checkbox"
                        role="switch"
                        class="toggle toggle-primary toggle-sm shrink-0"
                        :aria-label="t('index.showReadLabel')"
                    >
                </label>
            </li>
            <li class="menu-title mt-1 border-t border-[var(--infl0-chrome-border)] px-3 pb-1 pt-3">
                <span>{{ t('menu.language') }}</span>
            </li>
            <li class="px-2 pb-2">
                <LocaleSwitcher menu />
            </li>
            <li class="mt-1 border-t border-[var(--infl0-chrome-border)] pt-2">
                <button
                    type="button"
                    class="app-user-menu__logout w-full text-left font-medium"
                    @click="onLogout"
                >
                    {{ t('menu.logOut') }}
                </button>
            </li>
            </ul>
        </div>
    </details>
</template>

<style scoped>
/* Safari / some UAs still paint ::marker even with list-style:none on the parent */
.app-user-menu__list > li {
    list-style-type: none;
    margin-block: 0;
}

.app-user-menu__list > li::marker {
    content: none;
}

.app-user-menu__list :deep(li > :where(a, button, label, span)) {
    margin-block: 0;
}

.app-user-menu__panel :deep(.menu-title) {
    color: var(--infl0-chrome-fg-subtle);
}

.app-user-menu__logout {
    color: var(--color-error);
}

.app-user-menu__logout:hover,
.app-user-menu__logout:focus-visible {
    background-color: color-mix(in srgb, var(--color-error) 14%, transparent);
    color: var(--color-error);
}
</style>
