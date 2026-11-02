<template>
    <ResourceTablePage
        resource="packages"
        title="工作包管理"
        eyebrow="分包中心"
        description="按批次追踪工作包容量、零件构成、历史供应商与推荐执行状态。"
        search-field="packageNo"
        search-placeholder="搜索工作包编号"
        :columns="columns"
        :initial-query="initialQuery"
        ><template #row-actions="{ row }"><el-button link type="primary" @click="openParts(row.id)">包内零件</el-button></template></ResourceTablePage
    >
</template>
<script setup lang="ts">
import ResourceTablePage, { type DataColumn } from '/@/features/cochain/components/ResourceTablePage.vue'
import { useRoute } from 'vue-router'
import { routePush } from '/@/utils/router'
const route = useRoute()
const initialQuery = { batchId: String(route.query.batchId || '') }
const openParts = (packageId: string) => routePush({ path: '/cochain/package/part', query: { packageId } })
const columns: DataColumn[] = [
    { prop: 'packageNo', label: '工作包编号', minWidth: 170 },
    { prop: 'batchId', label: '批次 ID', minWidth: 190 },
    { prop: 'categoryId', label: '品类 ID', minWidth: 130 },
    { prop: 'partType', label: '零件类型', minWidth: 100 },
    { prop: 'partCount', label: '包内零件', minWidth: 100 },
    { prop: 'maxPartLimit', label: '容量上限', minWidth: 100 },
    { prop: 'recommendCount', label: '应推荐数', minWidth: 100 },
    {
        prop: 'recommendationStatus',
        label: '推荐状态',
        minWidth: 120,
        status: true,
        tone: (row) => (row.recommendationStatus === '已推荐' ? 'success' : 'warning'),
    },
]
</script>
