<template>
    <ResourceTablePage
        resource="roundRobinCursors"
        title="轮流选取游标"
        eyebrow="供应商与绩效"
        description="只读查看各品类、质量等级与月份的轮流选取位置。"
        :columns="columns"
    />
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import ResourceTablePage, { type DataColumn } from '/@/features/cochain/components/ResourceTablePage.vue'
import { getResourceService } from '/@/features/cochain/services'
import type { CategoryMasterVO } from '/@/features/cochain/contracts'
const categoryService = getResourceService('categories')
const categories = ref<CategoryMasterVO[]>([])
const categoryName = (id: string) => categories.value.find((item) => item.id === id)?.categoryName || id
onMounted(async () => {
    categories.value = await categoryService.list()
})
const columns: DataColumn[] = [
    { prop: 'categoryId', label: '品类', minWidth: 180, format: (r) => categoryName(r.categoryId) },
    { prop: 'qualityLevel', label: '质量等级', status: true, tone: (r) => (r.qualityLevel === '优质' ? 'success' : 'neutral') },
    { prop: 'rankingYear', label: '年份' },
    { prop: 'rankingMonth', label: '月份' },
    { prop: 'lastSelectedRank', label: '上次选取排名', minWidth: 110 },
    { prop: 'lastSupplierId', label: '上次选取供应商 ID', minWidth: 170 },
    { prop: 'recommendOrder', label: '推荐序号', minWidth: 100 },
]
</script>
