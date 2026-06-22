<script setup lang="ts">
const route = useRoute()
await navigateTo({
  path: '/knowledge/reading-notes',
  query: route.query,
}, { redirectCode: 301 })
</script>
