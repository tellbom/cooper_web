<template>
    <main class="office-preview">
        <div v-if="error" class="office-preview-error" role="alert">
            <h1>文档预览暂不可用</h1>
            <p>{{ error }}</p>
            <el-button @click="retry">重新加载</el-button>
        </div>
        <template v-else-if="config"
            ><div v-if="!ready" class="office-loading" role="status">
                <el-icon class="is-loading"><Loading /></el-icon><span>正在加载文档预览…</span>
            </div>
            <DocumentEditor
                :key="generation"
                id="cooper-office-preview"
                :document-server-url="server"
                :config="config"
                :events_on-document-ready="onReady"
                :events_on-error="onError"
                :on-load-component-error="onLoadError"
                height="100%"
                width="100%"
        /></template>
    </main>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { DocumentEditor } from '@onlyoffice/document-editor-vue'
import { Loading } from '@element-plus/icons-vue'
import { safeLink } from '../links'
import {useAdminInfo} from '/@/stores/adminInfo'
const route = useRoute(),
    error = ref(''),
    ready = ref(false),
    generation = ref(0)
const admin=useAdminInfo()
const server = String(import.meta.env.VITE_ONLYOFFICE_URL || '')
let timeout: ReturnType<typeof setTimeout> | undefined
const config = computed(() => {
    const url = safeLink(String(route.query.url || '')),
        type = String(route.query.fileType || url?.split('?')[0].split('.').pop() || '').toLowerCase()
    if (!server || !url || !['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp', 'pdf', 'rtf', 'txt', 'csv'].includes(type)) return null
    let key = 2166136261
    for (const c of url + String(route.query.version || '')) key = Math.imul(key ^ c.charCodeAt(0), 16777619)
    return {
        documentType: ['xls', 'xlsx', 'ods', 'csv'].includes(type) ? 'cell' : ['ppt', 'pptx', 'odp'].includes(type) ? 'slide' : 'word',
        document: {
            fileType: type,
            key: `cooper-${(key >>> 0).toString(16)}`,
            title: String(route.query.title || '文档预览'),
            url,
            permissions: { edit: false, download: true, print: true },
        },
        editorConfig: {
            mode: 'view',
            user:{id:admin.userid||'cooper-reader',name:admin.nickname||admin.username||'预览用户'},
            lang: 'zh-CN',
            customization: { autosave: false, chat: false, comments: false, compactHeader: true, help: false },
        },
        height: '100%',
        width: '100%',
    }
})
function reset() {
    error.value = ''
    ready.value = false
    clearTimeout(timeout)
    if (!config.value) {
        error.value = !server ? '尚未配置 OnlyOffice Document Server 地址' : '请提供可访问的 Office 文档 URL 和受支持的 fileType'
        return
    }
    timeout = setTimeout(() => {
        if (!ready.value) error.value = '文档服务响应超时，请检查文档地址能否被 Document Server 访问'
    }, 45000)
}
function retry() {
    generation.value++
    reset()
}
function onReady() {
    ready.value = true
    clearTimeout(timeout)
}
function onError(e: unknown) {
    const message = (e as { data?: { errorDescription?: string } })?.data?.errorDescription
    error.value = message || '文档服务加载失败，请检查文档地址和服务配置'
    clearTimeout(timeout)
}
function onLoadError() {
    error.value = '无法加载 OnlyOffice 组件，请检查文档服务地址'
    clearTimeout(timeout)
}
watch(() => route.fullPath, reset, { immediate: true })
onBeforeUnmount(() => clearTimeout(timeout))
</script>
