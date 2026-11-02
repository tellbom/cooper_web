<template>
    <ResourceTablePage
        ref="pageRef"
        resource="historySuppliers"
        title="零件历史供应商"
        eyebrow="供应商与绩效"
        description="按零件明细 ID 查看历史合作供应商及排序。"
        search-field="supplierName"
        search-placeholder="搜索供应商名称"
        :columns="columns"
    >
        <template #actions
            ><el-button @click="openImport"
                ><el-icon><Upload /></el-icon>导入</el-button
            ><el-button :loading="exporting" @click="exportData"
                ><el-icon><Download /></el-icon>导出</el-button
            ></template
        >
    </ResourceTablePage>
    <el-dialog v-model="importVisible" title="导入零件历史供应商" width="min(520px, 94vw)"
        ><el-form label-position="top"
            ><el-form-item label="Excel 文件" required
                ><el-upload
                    ref="uploadRef"
                    drag
                    :auto-upload="false"
                    :limit="1"
                    accept=".xlsx,.xls"
                    :on-change="(file) => (importFile = file)"
                    :on-exceed="handleUploadExceed"
                    ><el-icon class="upload-icon"><Upload /></el-icon>
                    <div>拖拽文件到此处，或点击选择文件</div></el-upload
                ></el-form-item
            ></el-form
        ><template #footer
            ><el-button @click="importVisible = false">取消</el-button
            ><el-button type="primary" :loading="importing" @click="submitImport">开始导入</el-button></template
        ></el-dialog
    >
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, genFileId, type UploadFile, type UploadInstance, type UploadProps, type UploadRawFile } from 'element-plus'
import { Download, Upload } from '@element-plus/icons-vue'
import ResourceTablePage, { type DataColumn } from '/@/features/cochain/components/ResourceTablePage.vue'
import { getResourceService } from '/@/features/cochain/services'
const service = getResourceService('historySuppliers')
const pageRef = ref<InstanceType<typeof ResourceTablePage>>()
const exporting = ref(false)
const importVisible = ref(false)
const importing = ref(false)
const uploadRef = ref<UploadInstance>()
const importFile = ref<UploadFile>()
const columns: DataColumn[] = [
    { prop: 'partId', label: '零件明细 ID', minWidth: 220 },
    { prop: 'supplierName', label: '供应商', minWidth: 200 },
    { prop: 'sortOrder', label: '排序', minWidth: 100 },
]
const exportData = async () => {
    exporting.value = true
    try {
        await service.exportXls()
    } catch (error: any) {
        ElMessage.error(error?.message || '导出失败')
    } finally {
        exporting.value = false
    }
}
const openImport = () => {
    importFile.value = undefined
    uploadRef.value?.clearFiles()
    importVisible.value = true
}
const handleUploadExceed: UploadProps['onExceed'] = (files) => {
    uploadRef.value?.clearFiles()
    const raw = files[0] as UploadRawFile
    raw.uid = genFileId()
    uploadRef.value?.handleStart(raw)
}
const submitImport = async () => {
    if (!importFile.value?.raw) return ElMessage.warning('请选择 Excel 文件')
    importing.value = true
    try {
        await service.importXls(importFile.value.raw)
        importVisible.value = false
        ElMessage.success('导入成功')
        pageRef.value?.reload()
    } finally {
        importing.value = false
    }
}
</script>
<style scoped>
.upload-icon {
    margin-bottom: 8px;
    color: #0066cc;
    font-size: 28px;
}
:deep(.el-upload),
:deep(.el-upload-dragger) {
    width: 100%;
}
:deep(.el-upload-dragger) {
    padding: 30px 18px;
    border-radius: 10px;
    background: #fafafc;
}
</style>
