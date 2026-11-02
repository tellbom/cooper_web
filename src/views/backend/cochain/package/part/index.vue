<template>
    <ResourceTablePage
        resource="packageParts"
        title="工作包零件关联"
        eyebrow="分包中心"
        description="核对工作包与批次零件之间的实际关联，不补造接口文档之外的业务字段。"
        search-field="partDrawingNo"
        search-placeholder="搜索零件图号"
        :columns="columns"
        :initial-query="initialQuery"
        ><template #actions
            ><el-button :loading="exporting" @click="exportData"
                ><el-icon><Download /></el-icon>导出</el-button
            ></template
        ></ResourceTablePage
    >
</template>
<script setup lang="ts">
import { ref } from 'vue'
import ResourceTablePage, { type DataColumn } from '/@/features/cochain/components/ResourceTablePage.vue'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'
import { getResourceService } from '/@/features/cochain/services'
const route = useRoute()
const initialQuery = { packageId: String(route.query.packageId || '') }
const service = getResourceService('packageParts')
const exporting = ref(false)
const exportData = async () => {
    exporting.value = true
    try {
        await service.exportXls(initialQuery as any)
    } catch (error: any) {
        ElMessage.error(error?.message || '导出失败')
    } finally {
        exporting.value = false
    }
}
const columns: DataColumn[] = [
    { prop: 'packageId', label: '工作包 ID', minWidth: 220 },
    { prop: 'partId', label: '零件明细 ID', minWidth: 220 },
    { prop: 'partDrawingNo', label: '零件图号', minWidth: 220 },
]
</script>
