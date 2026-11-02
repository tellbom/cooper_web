<template>
    <ManagedResourcePage
        resource="specialCategories"
        title="特殊品类配置"
        eyebrow="规则与主数据"
        description="为复合材料与补充加工品类配置全部推荐或轮流推荐策略。"
        :columns="columns"
        :fields="fields"
    />
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import ManagedResourcePage, { type FormField } from '/@/features/cochain/components/ManagedResourcePage.vue'
import type { DataColumn } from '/@/features/cochain/components/ResourceTablePage.vue'
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
    { prop: 'specialType', label: '特殊类型', minWidth: 160, format: (r) => (r.specialType === 'COMPOSITE' ? '复合材料' : '补充加工') },
    { prop: 'recommendRule', label: '推荐规则', minWidth: 160, format: (r) => (r.recommendRule === 'ALL_SUPPLIERS' ? '推荐全部供应商' : '轮流推荐') },
    {
        prop: 'ignoreQuality',
        label: '忽略质量分层',
        status: true,
        format: (r) => (r.ignoreQuality === 1 ? '是' : '否'),
        tone: (r) => (r.ignoreQuality === 1 ? 'warning' : 'neutral'),
    },
]
const fields: FormField[] = [
    { prop: 'categoryId', label: '品类 ID', required: true },
    {
        prop: 'specialType',
        label: '特殊类型',
        type: 'select',
        required: true,
        options: [
            { label: '复合材料/泡沫/蜂窝', value: 'COMPOSITE' },
            { label: '零组件补充加工', value: 'REINFORCEMENT' },
        ],
    },
    {
        prop: 'recommendRule',
        label: '推荐规则',
        type: 'select',
        required: true,
        options: [
            { label: '推荐全部供应商', value: 'ALL_SUPPLIERS' },
            { label: '轮流推荐', value: 'ROUND_ROBIN' },
        ],
    },
    { prop: 'ignoreQuality', label: '忽略优质/普通区分', type: 'switch' },
]
</script>
