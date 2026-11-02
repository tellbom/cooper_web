<template>
    <ManagedResourcePage
        resource="typePackageConfigs"
        title="工作包容量配置"
        eyebrow="规则与主数据"
        description="维护各零件类型的工作包容量上限；此页仅允许修改，不新增或删除类型。"
        :columns="columns"
        :fields="fields"
        :allow-create="false"
        :allow-delete="false"
        :validate="validate"
    />
</template>
<script setup lang="ts">
import ManagedResourcePage, { type FormField } from '/@/features/cochain/components/ManagedResourcePage.vue'
import type { DataColumn } from '/@/features/cochain/components/ResourceTablePage.vue'
const columns: DataColumn[] = [
    { prop: 'partType', label: '零件类型', minWidth: 120 },
    { prop: 'typeLabel', label: '类型说明', minWidth: 160 },
    { prop: 'maxPartCount', label: '容量上限' },
    { prop: 'sortOrder', label: '排序' },
]
const fields: FormField[] = [
    {
        prop: 'partType',
        label: '零件类型',
        type: 'select',
        required: true,
        options: ['小型', '中型', '大型', '超大型', '其他'].map((v) => ({ label: v, value: v })),
    },
    { prop: 'typeLabel', label: '类型说明' },
    { prop: 'maxPartCount', label: '容量上限', type: 'number', min: 1, required: true },
    { prop: 'sortOrder', label: '排序', type: 'number', min: 0 },
]
const validate = (form: Record<string, any>) =>
    !Number.isInteger(Number(form.maxPartCount)) || Number(form.maxPartCount) <= 0 ? '容量上限必须为正整数' : undefined
</script>
