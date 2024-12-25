<script setup lang="ts">
// Props for determining direction and tooltip text
defineProps({
    direction: {
        type: String as () => 'front' | 'back',
        required: true,
    },
})
</script>

<template>
    <div class="flip-arrow">
        <!-- Tooltip -->
        <div class="arrow-tooltip" v-if="direction === 'front'">Flip card</div>
        <div class="arrow-tooltip" v-if="direction === 'back'">Flip back</div>
        <!-- SVG Arrow -->
        <div class="arrow-icon"></div>
    </div>
</template>

<style scoped>
.flip-arrow {
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: pulse 10s infinite;
}

/* Tooltip styling */
.arrow-tooltip {
    position: absolute;
    bottom: 150%;
    /* Place above the arrow */
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.75rem;
    color: #cbd5e1;
    background: rgba(0, 0, 0, 0.75);
    padding: 0.5rem;
    border-radius: 4px;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease-in-out;
}

.flip-arrow:hover .arrow-tooltip {
    opacity: 1;
}

/* Arrow icon (SVG) */
.arrow-icon {
    width: 20px;
    height: 20px;
    background: center no-repeat url('data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22%20standalone%3D%22no%22%3F%3E%0A%3C%21--%20Public%20Domain%20--%3E%0A%0A%3Csvg%0A%20%20%20width%3D%22179.59058mm%22%0A%20%20%20height%3D%22173.12192mm%22%0A%20%20%20viewBox%3D%220%200%20179.59058%20173.12192%22%0A%20%20%20version%3D%221.1%22%0A%20%20%20id%3D%22svg8828%22%0A%20%20%20inkscape%3Aversion%3D%221.2.2%20%28b0a8486%2C%202022-12-01%29%22%0A%20%20%20sodipodi%3Adocname%3D%22turn_arrow_white.svg%22%0A%20%20%20xmlns%3Ainkscape%3D%22http%3A%2F%2Fwww.inkscape.org%2Fnamespaces%2Finkscape%22%0A%20%20%20xmlns%3Asodipodi%3D%22http%3A%2F%2Fsodipodi.sourceforge.net%2FDTD%2Fsodipodi-0.dtd%22%0A%20%20%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%0A%20%20%20xmlns%3Asvg%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%0A%20%20%3Csodipodi%3Anamedview%0A%20%20%20%20%20id%3D%22namedview8830%22%0A%20%20%20%20%20pagecolor%3D%22%23ffffff%22%0A%20%20%20%20%20bordercolor%3D%22%23000000%22%0A%20%20%20%20%20borderopacity%3D%220.25%22%0A%20%20%20%20%20inkscape%3Ashowpageshadow%3D%222%22%0A%20%20%20%20%20inkscape%3Apageopacity%3D%220.0%22%0A%20%20%20%20%20inkscape%3Apagecheckerboard%3D%220%22%0A%20%20%20%20%20inkscape%3Adeskcolor%3D%22%23d1d1d1%22%0A%20%20%20%20%20inkscape%3Adocument-units%3D%22mm%22%0A%20%20%20%20%20showgrid%3D%22false%22%0A%20%20%20%20%20inkscape%3Azoom%3D%220.71591639%22%0A%20%20%20%20%20inkscape%3Acx%3D%22778.02381%22%0A%20%20%20%20%20inkscape%3Acy%3D%22261.90209%22%0A%20%20%20%20%20inkscape%3Awindow-width%3D%221728%22%0A%20%20%20%20%20inkscape%3Awindow-height%3D%221051%22%0A%20%20%20%20%20inkscape%3Awindow-x%3D%220%22%0A%20%20%20%20%20inkscape%3Awindow-y%3D%2238%22%0A%20%20%20%20%20inkscape%3Awindow-maximized%3D%221%22%0A%20%20%20%20%20inkscape%3Acurrent-layer%3D%22layer1%22%20%2F%3E%0A%20%20%3Cdefs%0A%20%20%20%20%20id%3D%22defs8825%22%20%2F%3E%0A%20%20%3Cg%0A%20%20%20%20%20inkscape%3Alabel%3D%22Ebene%201%22%0A%20%20%20%20%20inkscape%3Agroupmode%3D%22layer%22%0A%20%20%20%20%20id%3D%22layer1%22%0A%20%20%20%20%20transform%3D%22translate%28193.24923%2C-42.66909%29%22%3E%0A%20%20%20%20%3Ctext%0A%20%20%20%20%20%20%20xml%3Aspace%3D%22preserve%22%0A%20%20%20%20%20%20%20style%3D%22font-size%3A348.627px%3Bfont-family%3ANadeem%3B-inkscape-font-specification%3ANadeem%3Bfill%3A%23000000%3Bstroke%3A%23fefefe%3Bstroke-width%3A0%3Bstroke-linecap%3Asquare%3Bstroke-linejoin%3Around%3Bstroke-dasharray%3Anone%3Bstroke-dashoffset%3A0%3Bpaint-order%3Amarkers%20fill%20stroke%22%0A%20%20%20%20%20%20%20x%3D%22-208.39952%22%0A%20%20%20%20%20%20%20y%3D%22215.791%22%0A%20%20%20%20%20%20%20id%3D%22text9003%22%3E%3Ctspan%0A%20%20%20%20%20%20%20%20%20sodipodi%3Arole%3D%22line%22%0A%20%20%20%20%20%20%20%20%20id%3D%22tspan9001%22%0A%20%20%20%20%20%20%20%20%20style%3D%22font-style%3Anormal%3Bfont-variant%3Anormal%3Bfont-weight%3Anormal%3Bfont-stretch%3Anormal%3Bfont-size%3A348.627px%3Bfont-family%3AMenlo%3B-inkscape-font-specification%3AMenlo%3Bfill%3A%23ffffff%3Bfill-opacity%3A1%3Bstroke%3A%23fcfcfc%3Bstroke-width%3A0%3Bstroke-dasharray%3Anone%3Bstroke-dashoffset%3A0%3Bstroke-opacity%3A1%22%0A%20%20%20%20%20%20%20%20%20x%3D%22-208.39952%22%0A%20%20%20%20%20%20%20%20%20y%3D%22215.791%22%3E%E2%86%BB%3C%2Ftspan%3E%3C%2Ftext%3E%0A%20%20%3C%2Fg%3E%0A%3C%2Fsvg%3E%0A');
    background-size: contain;
}

.flip-arrow--front .arrow-icon {
    transform: rotateY(180deg);
}

@keyframes pulse {
    0% {
        transform: scale(1);
    }

    80% {
        transform: scale(1);
    }

    85% {
        transform: scale(1.1);
    }

    90% {
        transform: scale(1);
    }

    95% {
        transform: scale(1.1);
    }

    100% {
        transform: scale(1);
    }
}
</style>