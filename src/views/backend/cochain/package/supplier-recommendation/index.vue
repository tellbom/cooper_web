<template>
    <ResourceTablePage
        resource="recommendations"
        title="供应商推荐结果"
        eyebrow="分包中心"
        description="查看每个工作包的推荐顺序、来源、质量等级与绩效得分。"
        search-field="supplierName"
        search-placeholder="搜索供应商名称"
        :columns="columns"
    />
</template>
<script setup lang="ts">
import ResourceTablePage, { type DataColumn } from '/@/features/cochain/components/ResourceTablePage.vue'
const sourceLabels: Record<string, string> = { HISTORY: '历史供应商', QUALITY_ROUND: '优质轮流', NORMAL_ROUND: '普通轮流', ALL_CATEGORY: '全品类' }
const columns: DataColumn[] = [
    { prop: 'packageId', label: '工作包 ID', minWidth: 190 },
    { prop: 'supplierName', label: '供应商', minWidth: 170 },
    { prop: 'recommendOrder', label: '推荐序号', minWidth: 100 },
    {
        prop: 'recommendSource',
        label: '推荐来源',
        minWidth: 130,
        status: true,
        format: (row) => sourceLabels[row.recommendSource] || row.recommendSource,
        tone: () => 'info',
    },
    { prop: 'qualityLevel', label: '质量等级', minWidth: 110, status: true, tone: (row) => (row.qualityLevel === '优质' ? 'success' : 'neutral') },
    { prop: 'performanceScore', label: '绩效得分', minWidth: 110, format: (row) => Number(row.performanceScore).toFixed(2) },
    { prop: 'batchId', label: '批次 ID', minWidth: 190 },
]
</script>
