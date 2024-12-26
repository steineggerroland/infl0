<script setup lang="ts">
// Props for tooltip text
defineProps({
    tooltip: {
        type: String,
        default: 'Click to flip',
    },
    position: {
        type: String,
        default: 'top-left',
    },
})
</script>

<template>
    <div :class="['corner-fold', position]" :title="tooltip">
        <div class="fold"></div>
    </div>
</template>

<style scoped>
/* Container for the corner fold */
.corner-fold {
    position: absolute;
    width: 40px;
    height: 40px;
    overflow: hidden;
    cursor: pointer;
}

.corner-fold.top-right {
    top: 0;
    right: 0;
    transform: rotateY(180deg);
}

.corner-fold.top-left {
    top: 0;
    left: 0;
}

.corner-fold.bottom-right {
    bottom: 0;
    right: 0;
    transform: rotateY(180deg) rotateX(180deg);
}

.corner-fold.bottom-left {
    bottom: 0;
    left: 0;
    transform: rotateX(180deg);
}

/* Fold itself */
.fold {
    position: absolute;
    width: 60%;
    height: 60%;
    transition: all 0.3s ease-in-out;
    background: linear-gradient(135deg, rgb(156 163 175 / var(--tw-bg-opacity, 1)), 45%, #1a202c, 55%, #1a202c);
    border-radius: 0.75rem 0;
}

.corner-fold:hover .fold {
    width: 100%;
    height: 100%;
}
</style>