<template>
    <div class="relative min-h-dvh">
        <slot />
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
