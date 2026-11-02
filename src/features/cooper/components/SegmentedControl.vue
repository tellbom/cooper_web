<template>
    <el-radio-group :model-value="modelValue" class="portal-segmented" @update:model-value="$emit('update:modelValue', String($event))"
        ><el-radio-button v-for="item in items" :key="item" :label="item" :value="item"
            >{{ item }}<span v-if="counts?.[item] !== undefined" class="segment-count">{{ counts[item] }}</span></el-radio-button
        ></el-radio-group
    >
</template>
<script setup lang="ts">
defineProps<{ modelValue: string; items: string[]; counts?: Record<string, number | undefined> }>()
defineEmits<{ (event: 'update:modelValue', value: string): void }>()
</script>
