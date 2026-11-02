<template>
    <section class="figma-page">
        <header class="figma-page__header"><div><p class="figma-page__eyebrow">审计追踪</p><h1>日志记录</h1><p class="figma-page__description">查看业务操作与系统访问记录，定位失败请求并追踪关键变更。</p></div></header>
        <div class="figma-card">
            <nav class="figma-tabs"><button class="figma-tab" :class="{ 'is-active': activeTab === 'business' }" type="button" @click="activeTab = 'business'">业务操作日志</button><button class="figma-tab" :class="{ 'is-active': activeTab === 'system' }" type="button" @click="activeTab = 'system'">系统操作日志</button></nav>
            <form class="figma-search" role="search" @submit.prevent><el-input v-model="keyword" clearable placeholder="搜索操作人 / 模块 / 对象"><template #prefix><el-icon><Search /></el-icon></template></el-input><el-button type="primary" class="figma-query-button">查询</el-button><el-button @click="reset"><el-icon><Refresh /></el-icon>重置</el-button></form>
            <el-table v-loading="loading" :data="filteredRows" row-key="id">
                <el-table-column prop="operator" label="操作人" width="100" /><el-table-column prop="type" label="操作类型" min-width="130" /><el-table-column prop="module" label="目标模块" min-width="130" /><el-table-column prop="object" label="目标对象" min-width="220" show-overflow-tooltip /><el-table-column label="操作" width="75"><template #default="{ row }"><el-button link type="primary" @click="openDetail(row)">详情</el-button></template></el-table-column>
            </el-table>
            <footer class="figma-pagination"><span>共 {{ filteredRows.length }} 条记录</span><el-pagination :total="filteredRows.length" :page-size="20" layout="prev, pager, next" /></footer>
        </div>
        <el-dialog v-model="detailVisible" title="日志详情" width="min(640px, 94vw)"><dl v-if="current" class="figma-info-grid"><div><dt>操作人</dt><dd>{{ current.operator }}</dd></div><div><dt>操作类型</dt><dd>{{ current.type }}</dd></div><div><dt>目标模块</dt><dd>{{ current.module }}</dd></div><div class="wide"><dt>目标对象</dt><dd>{{ current.object }}</dd></div></dl></el-dialog>
    </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Refresh, Search } from '@element-plus/icons-vue'
import type { OperationLogVO, SystemOperateLogVO } from '/@/features/cochain/contracts'
import { getResourceService } from '/@/features/cochain/services'

type LogRow = { id: string; operator: string; type: string; module: string; object: string }
const businessService = getResourceService('operationLogs')
const systemService = getResourceService('systemOperateLogs')
const activeTab = ref<'business' | 'system'>('business')
const businessRows = ref<OperationLogVO[]>([])
const systemRows = ref<SystemOperateLogVO[]>([])
const keyword = ref('')
const loading = ref(false)
const detailVisible = ref(false)
const current = ref<LogRow>()
const normalizedBusiness = computed<LogRow[]>(() =>
    businessRows.value.map((row) => ({ id: row.id, operator: row.operator, type: row.operationType, module: row.batchId || '分包业务', object: row.operationDetail }))
)
const normalizedSystem = computed<LogRow[]>(() =>
    systemRows.value.map((row) => ({
        id: row.id,
        operator: row.userId || '—',
        type: row.requestMethod || row.name || '—',
        module: row.module || 'RBAC / 系统',
        object: `${row.requestUrl || ''}${row.resultCode ? `（${row.resultCode}）` : ''}`,
    }))
)
const allRows = computed(() => (activeTab.value === 'business' ? normalizedBusiness.value : normalizedSystem.value))
const filteredRows = computed(() =>
    allRows.value.filter((row) => !keyword.value || [row.operator, row.module, row.object, row.type].some((value) => value.includes(keyword.value)))
)
const reset = () => {
    keyword.value = ''
}
const openDetail = (row: LogRow) => {
    current.value = row
    detailVisible.value = true
}
onMounted(async () => {
    loading.value = true
    try {
        const [business, system] = await Promise.all([businessService.list(), systemService.list()])
        businessRows.value = business
        systemRows.value = system
    } finally {
        loading.value = false
    }
})
</script>

<style scoped>
.wide{grid-column:1/-1}.detail-copy{padding:12px;border-radius:8px;background:#fafafc;white-space:pre-wrap}
</style>
