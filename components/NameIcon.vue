<script setup lang="ts">
const props = defineProps({
    name: String
})
const shortHand = computed(() => {
    const name = (props.name ?? '').replaceAll(/([^a-zA-Z0-9])/g, ' ')
    return name.split(' ').map(word => word.slice(0, 1)).join('').concat(name.slice(1, 2)).slice(0, 2).toUpperCase().replace(/S[S|A]/g, 'SZ').replace(/[A|H]H/g, 'H0')
})
</script>

<template>
    <span class="inline-flex justify-center align-middle h-[1em] w-[1em]">
        <svg class="inline-block h-full w-full" xmlns="http://www.w3.org/2000/svg"
            xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="1080" height="1080" viewBox="0 0 1080 1080"
            xml:space="preserve">
            <g transform="matrix(8.38 0 0 8.38 540 540)" style="" id="089b5f6c-d4b4-4f37-9f72-9a6c5131f81d">
                <text xml:space="preserve" font-family="monospace" font-size="100" font-style="normal" font-weight="900"
                    style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(255,255,255); fill-rule: nonzero; opacity: 1; white-space: pre;">
                    <tspan x="-60" y="35">{{ shortHand }}</tspan>
                </text>
            </g>
        </svg>
    </span>
</template>

<style></style>