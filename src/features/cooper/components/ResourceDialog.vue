<template>
    <el-dialog modal-class="portal-modal" :model-value="true" :title="kind" width="800px" align-center class="portal-dialog" @close="$emit('close')">
        <LoadState :loading="data.pending.value" :error="data.error.value" @retry="data.load">
            <el-table :data="data.data.value || []" row-key="Id" :tree-props="{ children: 'children' }" class="prototype-table">
                <el-table-column :prop="kind === '软件下载' ? 'Title' : 'ColumnTitle'" label="名称" />
                <el-table-column prop="CreateTime" label="更新时间" width="180" />
                <el-table-column label="操作" width="90"
                    ><template #default="{ row }"
                        ><a :href="safeLink(row.url || row.DownloadLink)" target="_blank" rel="noopener" download class="text-link">下载</a></template
                    ></el-table-column
                >
            </el-table>
        </LoadState>
        <template #footer><el-button @click="$emit('close')">关闭</el-button></template>
    </el-dialog>
</template>
<script setup lang="ts">
import * as api from '../api'
import { useResource } from '../useResource'
import { safeLink } from '../links'
import LoadState from './LoadState.vue'
const props = defineProps<{ kind: '软件下载' | '表格下载' }>()
defineEmits(['close'])
const data = useResource<api.SoftwareDownloadOutDto[] | api.TablesDownloadChildrenDto[]>(() =>
    props.kind === '软件下载' ? api.getSoftwareDownloads() : api.getTableDownloads()
)
</script>
