<template>
    <ManagedResourcePage
        resource="leftRightRules"
        title="左右件识别规则"
        eyebrow="规则与主数据"
        description="按机型维护左右件图号后缀识别规则。"
        search-field="aircraftModel"
        search-placeholder="搜索机型"
        :columns="columns"
        :fields="fields"
        :validate="validate"
    />
</template>
<script setup lang="ts">
import ManagedResourcePage, { type FormField } from '/@/features/cochain/components/ManagedResourcePage.vue'
import type { DataColumn } from '/@/features/cochain/components/ResourceTablePage.vue'
const columns: DataColumn[] = [
    { prop: 'aircraftModel', label: '机型' },
    { prop: 'leftSuffix', label: '左件后缀' },
    { prop: 'rightSuffix', label: '右件后缀' },
    { prop: 'description', label: '说明', minWidth: 240 },
]
const fields: FormField[] = [
    { prop: 'aircraftModel', label: '机型', required: true },
    { prop: 'leftSuffix', label: '左件后缀', required: true },
    { prop: 'rightSuffix', label: '右件后缀', required: true },
    { prop: 'description', label: '说明', type: 'textarea' },
]
const validate = (form: Record<string, any>) => (form.leftSuffix === form.rightSuffix ? '左件后缀与右件后缀不能相同' : undefined)
</script>
