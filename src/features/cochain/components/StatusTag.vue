<template>
    <span class="status-tag" :data-tone="tone"><span class="status-tag__dot" aria-hidden="true" />{{ label }}</span>
</template>
<script setup lang="ts">
withDefaults(defineProps<{ label: string; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }>(), { tone: 'neutral' })
</script>
<style scoped>
.status-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 28px;
    padding: 3px 10px;
    border: 1px solid var(--co-hairline);
    border-radius: 6px;
    color: var(--co-ink-secondary);
    background: var(--co-canvas-subtle);
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
}
.status-tag__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--co-ink-muted);
}
.status-tag[data-tone='success'] .status-tag__dot {
    background: var(--co-success);
}
.status-tag[data-tone='success'] {
    border-color: #b7ebc0;
    color: #1a7f3c;
    background: #f0faf0;
}
.status-tag[data-tone='warning'] .status-tag__dot {
    background: var(--co-warning);
}
.status-tag[data-tone='warning'] {
    border-color: #f5c77e;
    color: #b54708;
    background: #fff3e0;
}
.status-tag[data-tone='danger'] .status-tag__dot {
    background: var(--co-danger);
}
.status-tag[data-tone='danger'] {
    border-color: #f5b7b7;
    color: #c0392b;
    background: #fff5f5;
}
.status-tag[data-tone='info'] .status-tag__dot {
    background: var(--co-primary);
}
.status-tag[data-tone='info'] {
    border-color: var(--co-primary-border);
    color: #0055aa;
    background: var(--co-primary-soft);
}
</style>
