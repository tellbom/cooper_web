<template>
    <div class="data-state" role="status">
        <Icon :name="icon" size="28" aria-hidden="true" />
        <strong>{{ title }}</strong>
        <p v-if="description">{{ description }}</p>
        <el-button v-if="actionLabel" @click="$emit('action')">{{ actionLabel }}</el-button>
    </div>
</template>
<script setup lang="ts">
withDefaults(defineProps<{ title: string; description?: string; actionLabel?: string; icon?: string }>(), { icon: 'fa fa-inbox' })
defineEmits<{ action: [] }>()
</script>
<style scoped>
.data-state {
    display: grid;
    justify-items: center;
    gap: 8px;
    min-height: 240px;
    padding: 56px 24px;
    color: var(--co-ink-muted);
    text-align: center;
}
.data-state strong {
    color: var(--co-ink);
    font-size: 14px;
    font-weight: 600;
}
.data-state p {
    max-width: 460px;
    margin: 0;
    font-size: 12px;
    line-height: 1.5;
}
</style>
