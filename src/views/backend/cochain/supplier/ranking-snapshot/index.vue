<template>
    <div class="supplier-ranking-snapshot-page">
        <ManagedResourcePage
            ref="pageRef"
            resource="rankingSnapshots"
            title="排名快照管理"
            eyebrow="供应商与绩效"
            description="按年月生成品类内排名快照；前 30% 标记为优质，并重置轮流游标。"
            :columns="columns"
            :fields="fields"
            :allow-edit="false"
            :allow-delete="false"
        >
            <template #actions
                ><el-button v-auth="'generate'" type="primary" @click="visible = true"
                    ><Icon name="fa fa-refresh" aria-hidden="true" />生成快照</el-button
                ></template
            >
        </ManagedResourcePage>
        <el-dialog v-model="visible" title="生成排名快照" width="min(460px,94vw)"
            ><el-form label-position="top"
                ><el-form-item label="年份"><el-input-number v-model="year" :min="2020" :max="2100" /></el-form-item
                ><el-form-item label="月份"><el-input-number v-model="month" :min="1" :max="12" /></el-form-item></el-form
            ><template #footer
                ><el-button @click="visible = false">取消</el-button><el-button type="primary" @click="generate">生成</el-button></template
            ></el-dialog
        >
    </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ManagedResourcePage, { type FormField } from '/@/features/cochain/components/ManagedResourcePage.vue'
import type { DataColumn } from '/@/features/cochain/components/ResourceTablePage.vue'
import { supplierActionsApi } from '/@/features/cochain/services/supplierActions'
import { getResourceService } from '/@/features/cochain/services'
import type { CategoryMasterVO, SupplierVO } from '/@/features/cochain/contracts'
const pageRef = ref<InstanceType<typeof ManagedResourcePage>>()
const visible = ref(false),
    year = ref(2026),
    month = ref(7)
const categoryService = getResourceService('categories')
const supplierService = getResourceService('suppliers')
const categories = ref<CategoryMasterVO[]>([])
const suppliers = ref<SupplierVO[]>([])
const categoryName = (id: string) => categories.value.find((item) => item.id === id)?.categoryName || id
const supplierName = (id: string) => suppliers.value.find((item) => item.id === id)?.supplierName || id
onMounted(async () => {
    const [categoryRows, supplierRows] = await Promise.all([categoryService.list(), supplierService.list()])
    categories.value = categoryRows
    suppliers.value = supplierRows
})
const columns: DataColumn[] = [
    { prop: 'supplierId', label: '供应商', minWidth: 180, format: (r) => supplierName(r.supplierId) },
    { prop: 'categoryId', label: '品类', minWidth: 160, format: (r) => categoryName(r.categoryId) },
    { prop: 'rankingYear', label: '年份' },
    { prop: 'rankingMonth', label: '月份' },
    { prop: 'comprehensiveScore', label: '综合得分' },
    { prop: 'rankInCategory', label: '品类排名' },
    {
        prop: 'qualityLevel',
        label: '质量等级',
        status: true,
        tone: (r) => (r.qualityLevel === '优质' ? 'success' : 'neutral'),
    },
    { prop: 'totalSupplierCount', label: '品类供应商数' },
]
const fields: FormField[] = []
const generate = async () => {
    await ElMessageBox.confirm(`将重新生成 ${year.value} 年 ${month.value} 月排名，并重置轮流游标。继续？`, '生成排名快照', {
        type: 'warning',
        confirmButtonText: '生成',
        cancelButtonText: '取消',
    })
    const result = await supplierActionsApi.generateRankingSnapshot(year.value, month.value)
    visible.value = false
    ElMessage.success(result.message || '排名快照已生成，轮流游标已重置')
    pageRef.value?.reload()
}
</script>
