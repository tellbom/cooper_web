<template>
    <ResourceTablePage
        resource="systemOperateLogs"
        title="系统操作日志"
        eyebrow="日志审计"
        description="查看模块、请求方法、请求路径与结果码；日志为只读记录。"
        search-field="userId"
        search-placeholder="搜索用户 ID"
        :columns="columns"
    >
        <template #actions
            ><el-button :loading="exporting" @click="exportData"
                ><el-icon><Download /></el-icon>导出</el-button
            ></template
        >
    </ResourceTablePage>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import ResourceTablePage, { type DataColumn } from '/@/features/cochain/components/ResourceTablePage.vue'
import { getResourceService } from '/@/features/cochain/services'
const service = getResourceService('systemOperateLogs')
const exporting = ref(false)
const columns: DataColumn[] = [
    { prop: 'startTime', label: '操作时间', minWidth: 170 },
    { prop: 'userId', label: '用户 ID', minWidth: 130 },
    { prop: 'module', label: '模块', minWidth: 130 },
    { prop: 'name', label: '操作名', minWidth: 140 },
    { prop: 'requestMethod', label: '方法', minWidth: 90 },
    { prop: 'requestUrl', label: '请求路径', minWidth: 240 },
    { prop: 'resultType', label: '结果', status: true, format: (r) => (r.resultType === 1 ? '成功' : '失败'), tone: (r) => (r.resultType === 1 ? 'success' : 'danger') },
    { prop: 'resultCode', label: '结果码', minWidth: 90 },
    { prop: 'userIp', label: '请求 IP', minWidth: 150 },
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
</script>
