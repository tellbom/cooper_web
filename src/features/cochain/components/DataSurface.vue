<template>
    <section class="data-surface" :aria-label="label">
        <slot />
    </section>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ label?: string }>(), { label: '数据区域' })
</script>

<style scoped>
.data-surface {
    overflow: hidden;
    border: 1px solid var(--co-hairline);
    border-radius: var(--co-radius-card);
    background: var(--co-canvas);
}
</style>
