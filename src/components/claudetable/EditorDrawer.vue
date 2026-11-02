<template>
    <el-drawer v-model="visible" :title="title" :size="width" direction="rtl" destroy-on-close :before-close="beforeClose">
        <slot name="before-fields" />
        <template #footer>
            <slot name="footer" :cancel="cancel">
                <el-button @click="cancel">取消</el-button>
            </slot>
        </template>
    </el-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
    modelValue: boolean
    title?: string
    width?: string | number
    mode?: string
    model?: Record<string, unknown>
    schema?: unknown[]
}

const props = withDefaults(defineProps<Props>(), {
    title: '',
    width: 620,
    mode: 'create',
    model: () => ({}),
    schema: () => [],
})

const emit = defineEmits<{
    (event: 'update:modelValue', value: boolean): void
    (event: 'cancel'): void
}>()

const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value),
})

function cancel() {
    emit('cancel')
    visible.value = false
}

function beforeClose(done: () => void) {
    emit('cancel')
    done()
}
</script>
