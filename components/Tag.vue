<script setup lang="ts">
// Define the props for the component
defineProps({
    tag: String
})
</script>
<template>
    <div class="bg-gray-300 text-black rounded py-1 px-2 w-min h-min text-center">{{ tag }}</div>
</template>