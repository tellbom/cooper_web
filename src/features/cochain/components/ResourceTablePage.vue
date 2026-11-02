<template>
    <CochainPage :title="title" :description="description" :eyebrow="eyebrow">
        <template #actions><slot name="actions" :reload="load" /></template>

        <DataSurface :label="`${title}数据列表`">
            <form class="table-toolbar" role="search" @submit.prevent="onSearch">
                <template v-if="searchField">
                    <label class="table-toolbar__label" for="resource-keyword">关键词</label>
                    <el-input id="resource-keyword" v-model="keyword" clearable :placeholder="searchPlaceholder" @clear="onSearch">
                        <template #prefix><Icon name="fa fa-search" aria-hidden="true" /></template>
                    </el-input>
                    <el-button type="primary" native-type="submit">查询</el-button>
                    <el-button @click="onReset"><Icon name="fa fa-refresh" aria-hidden="true" />重置</el-button>
                </template>
                <span class="table-toolbar__total">共 {{ state.total }} 条</span>
            </form>

            <el-alert v-if="state.error" :title="state.error" type="error" show-icon :closable="false" />

            <el-table v-loading="state.loading" :data="state.rows" row-key="id" table-layout="auto" @row-dblclick="openDetail">
                <el-table-column
                    v-for="column in columns"
                    :key="column.prop"
                    :prop="column.prop"
                    :label="column.label"
                    :min-width="column.minWidth || 140"
                    show-overflow-tooltip
                >
                    <template #default="scope">
                        <StatusTag v-if="column.status" :label="formatCell(scope.row, column)" :tone="getTone(scope.row, column)" />
                        <span v-else>{{ formatCell(scope.row, column) }}</span>
                    </template>
                </el-table-column>
                <el-table-column fixed="right" label="操作" width="92">
                    <template #default="scope">
                        <slot name="row-actions" :row="scope.row" />
                        <el-button link type="primary" @click="openDetail(scope.row)">详情</el-button>
                    </template>
                </el-table-column>
                <template #empty>
                    <DataState
                        :title="state.error ? '数据加载失败' : '暂无匹配数据'"
                        :description="state.error ? '请检查网络或稍后重试。' : '调整筛选条件后再试。'"
                        action-label="重新加载"
                        :icon="state.error ? 'fa fa-exclamation-circle' : 'fa fa-inbox'"
                        @action="load"
                    />
                </template>
            </el-table>

            <footer class="table-pagination">
                <el-pagination
                    v-model:current-page="state.pageNum"
                    v-model:page-size="state.pageSize"
                    :total="state.total"
                    :page-sizes="[10, 20, 50]"
                    layout="total, sizes, prev, pager, next, jumper"
                    @current-change="load"
                    @size-change="onPageSizeChange"
                />
            </footer>
        </DataSurface>

        <el-drawer v-model="state.detailVisible" title="记录详情" size="min(520px, 92vw)">
            <el-descriptions v-if="state.current" :column="1" border>
                <el-descriptions-item v-for="column in columns" :key="column.prop" :label="column.label">
                    {{ formatCell(state.current, column) }}
                </el-descriptions-item>
                <el-descriptions-item label="记录 ID">{{ state.current.id }}</el-descriptions-item>
            </el-descriptions>
        </el-drawer>
    </CochainPage>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import type { BaseEntity, ResourceKey } from '../contracts'
import { getResourceService } from '../services'
import CochainPage from './CochainPage.vue'
import DataState from './DataState.vue'
import DataSurface from './DataSurface.vue'
import StatusTag from './StatusTag.vue'

export interface DataColumn {
    prop: string
    label: string
    minWidth?: number
    status?: boolean
    format?: (row: Record<string, any>) => string
    tone?: (row: Record<string, any>) => 'neutral' | 'success' | 'warning' | 'danger' | 'info'
}

const props = withDefaults(
    defineProps<{
        resource: ResourceKey
        title: string
        description?: string
        eyebrow?: string
        /** 搜索框实际绑定的后端真实查询字段名；不传则不渲染搜索框（避免发送后端不存在的参数） */
        searchField?: string
        searchPlaceholder?: string
        columns: DataColumn[]
        initialQuery?: Record<string, unknown>
    }>(),
    { eyebrow: 'Cochain', description: '', searchPlaceholder: '输入关键词查询', initialQuery: () => ({}) }
)

const service = getResourceService(props.resource)
const keyword = ref('')
const state = reactive({
    loading: false,
    error: '',
    rows: [] as BaseEntity[],
    total: 0,
    pageNum: 1,
    pageSize: 20,
    current: null as BaseEntity | null,
    detailVisible: false,
})

const load = async () => {
    state.loading = true
    state.error = ''
    try {
        const page = await service.page({
            ...props.initialQuery,
            ...(props.searchField && keyword.value ? { [props.searchField]: keyword.value } : {}),
            pageNo: state.pageNum,
            pageSize: state.pageSize,
        })
        state.rows = page.list
        state.total = page.total
    } catch (error: any) {
        state.rows = []
        state.total = 0
        state.error = error?.message || '数据加载失败'
    } finally {
        state.loading = false
    }
}

const onSearch = () => {
    state.pageNum = 1
    load()
}
const onReset = () => {
    keyword.value = ''
    onSearch()
}
const onPageSizeChange = () => {
    state.pageNum = 1
    load()
}
const openDetail = (row: BaseEntity) => {
    state.current = row
    state.detailVisible = true
}
const formatCell = (row: BaseEntity, column: DataColumn) =>
    column.format ? column.format(row as Record<string, any>) : String((row as Record<string, any>)[column.prop] ?? '-')
const getTone = (row: BaseEntity, column: DataColumn) => (column.tone ? column.tone(row as Record<string, any>) : 'neutral')

onMounted(load)
defineExpose({ reload: load })
</script>

<style scoped lang="scss">
.table-toolbar {
    display: flex;
    align-items: center;
    gap: var(--co-space-2);
    padding: var(--co-space-4);
    border-bottom: 1px solid var(--co-divider);
}
.table-toolbar .el-input {
    width: min(360px, 100%);
}
.table-toolbar__total {
    margin-left: auto;
    color: var(--co-ink-muted);
    font-size: 13px;
}
.table-pagination {
    display: flex;
    justify-content: flex-end;
    overflow-x: auto;
    padding: var(--co-space-4);
    border-top: 1px solid var(--co-divider);
}
:deep(.el-table) {
    width: 100%;
    --el-table-row-hover-bg-color: #fafafa;
}
:deep(.el-table th.el-table__cell) {
    height: 44px;
    background: #fafafa;
    color: var(--co-ink-muted);
    font-size: 12px;
    font-weight: 600;
}
:deep(.el-table td.el-table__cell) {
    height: 50px;
    color: var(--co-ink-secondary);
    font-size: 13px;
}
:deep(.el-table__inner-wrapper::before) {
    display: none;
}
:deep(.el-button) {
    min-height: 36px;
}
:deep(.el-button.is-link) {
    min-height: auto;
}
.table-toolbar__label {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    clip-path: inset(50%);
}
@media (max-width: 768px) {
    .table-toolbar {
        align-items: stretch;
        flex-wrap: wrap;
    }
    .table-toolbar .el-input {
        width: 100%;
    }
    .table-toolbar__total {
        width: 100%;
        margin-left: 0;
    }
    .table-pagination {
        justify-content: flex-start;
    }
}
</style>
