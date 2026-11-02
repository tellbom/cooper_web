<template>
    <CochainPage :title="title" :description="description" :eyebrow="eyebrow">
        <template #actions>
            <slot name="actions" :reload="load" />
            <el-button v-if="allowCreate" v-auth="'save'" type="primary" @click="openCreate"
                ><Icon name="fa fa-plus" aria-hidden="true" />新建</el-button
            >
        </template>

        <DataSurface :label="`${title}数据列表`">
            <form class="managed-toolbar" role="search" @submit.prevent="search">
                <template v-if="searchField">
                    <label class="managed-toolbar__label" for="managed-resource-keyword">关键词</label>
                    <el-input id="managed-resource-keyword" v-model="keyword" clearable :placeholder="searchPlaceholder" @clear="search">
                        <template #prefix><Icon name="fa fa-search" aria-hidden="true" /></template>
                    </el-input>
                    <el-button native-type="submit" type="primary">查询</el-button>
                    <el-button @click="reset"><Icon name="fa fa-refresh" aria-hidden="true" />重置</el-button>
                </template>
                <el-button v-if="allowDelete && state.selection.length" v-auth="'delete'" type="danger" plain @click="removeSelected"
                    >批量删除（{{ state.selection.length }}）</el-button
                >
                <span>共 {{ state.total }} 条</span>
            </form>

            <el-alert v-if="state.error" :title="state.error" type="error" show-icon :closable="false" />

            <el-table v-loading="state.loading" :data="state.rows" row-key="id" table-layout="auto" @selection-change="state.selection = $event">
                <el-table-column v-if="allowDelete" type="selection" width="48" />
                <el-table-column
                    v-for="column in columns"
                    :key="column.prop"
                    :prop="column.prop"
                    :label="column.label"
                    :min-width="column.minWidth || 130"
                    show-overflow-tooltip
                >
                    <template #default="scope">
                        <StatusTag
                            v-if="column.status"
                            :label="displayValue(scope.row, column)"
                            :tone="column.tone ? column.tone(scope.row) : 'neutral'"
                        />
                        <span v-else>{{ displayValue(scope.row, column) }}</span>
                    </template>
                </el-table-column>
                <el-table-column v-if="allowEdit || allowDelete" fixed="right" label="操作" width="132">
                    <template #default="scope">
                        <el-button v-if="allowEdit" v-auth="'update'" link type="primary" @click="openEdit(scope.row)">编辑</el-button>
                        <el-button v-if="allowDelete" v-auth="'delete'" link type="danger" @click="remove(scope.row)">删除</el-button>
                    </template>
                </el-table-column>
                <template #empty
                    ><DataState
                        :title="state.error ? '数据加载失败' : '暂无数据'"
                        :description="state.error ? '请检查网络或稍后重试。' : '调整筛选条件，或新建第一条记录。'"
                        :action-label="state.error ? '重新加载' : undefined"
                        :icon="state.error ? 'fa fa-exclamation-circle' : 'fa fa-inbox'"
                        @action="load"
                /></template>
            </el-table>

            <footer class="managed-pagination">
                <el-pagination
                    v-model:current-page="state.pageNum"
                    v-model:page-size="state.pageSize"
                    :total="state.total"
                    layout="total, sizes, prev, pager, next"
                    :page-sizes="[10, 20, 50]"
                    @current-change="load"
                    @size-change="pageSizeChanged"
                />
            </footer>
        </DataSurface>

        <el-dialog v-model="state.formVisible" :title="state.editingId ? '编辑记录' : '新建记录'" width="min(620px, 94vw)" destroy-on-close>
            <el-form label-position="top">
                <el-form-item v-for="field in fields" :key="field.prop" :label="field.label" :required="field.required">
                    <el-select v-if="field.type === 'select'" v-model="form[field.prop]" clearable filterable :placeholder="`请选择${field.label}`">
                        <el-option v-for="option in field.options || []" :key="String(option.value)" :label="option.label" :value="option.value" />
                    </el-select>
                    <el-input-number
                        v-else-if="field.type === 'number'"
                        v-model="form[field.prop]"
                        :min="field.min"
                        :max="field.max"
                        controls-position="right"
                    />
                    <el-switch v-else-if="field.type === 'switch'" v-model="form[field.prop]" :active-value="1" :inactive-value="0" />
                    <el-input v-else-if="field.type === 'textarea'" v-model="form[field.prop]" type="textarea" :rows="3" />
                    <el-input v-else v-model="form[field.prop]" :placeholder="`请输入${field.label}`" />
                </el-form-item>
            </el-form>
            <template #footer
                ><el-button @click="state.formVisible = false">取消</el-button
                ><el-button type="primary" :loading="state.saving" @click="save">保存</el-button></template
            >
        </el-dialog>
    </CochainPage>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { BaseEntity, ResourceKey } from '../contracts'
import { getResourceService } from '../services'
import type { DataColumn } from './ResourceTablePage.vue'
import CochainPage from './CochainPage.vue'
import DataState from './DataState.vue'
import DataSurface from './DataSurface.vue'
import StatusTag from './StatusTag.vue'

export interface FieldOption {
    label: string
    value: string | number
}
export interface FormField {
    prop: string
    label: string
    type?: 'text' | 'textarea' | 'number' | 'select' | 'switch'
    required?: boolean
    options?: FieldOption[]
    min?: number
    max?: number
    defaultValue?: unknown
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
        fields: FormField[]
        allowCreate?: boolean
        allowEdit?: boolean
        allowDelete?: boolean
        validate?: (form: Record<string, any>) => string | undefined
        beforeSave?: (form: Record<string, any>, original: BaseEntity | null) => boolean | Promise<boolean>
    }>(),
    {
        description: '',
        eyebrow: 'Cochain',
        searchPlaceholder: '输入关键词查询',
        allowCreate: true,
        allowEdit: true,
        allowDelete: true,
    }
)
const service = getResourceService(props.resource)
const keyword = ref('')
const state = reactive({
    loading: false,
    saving: false,
    rows: [] as BaseEntity[],
    error: '',
    selection: [] as BaseEntity[],
    total: 0,
    pageNum: 1,
    pageSize: 20,
    formVisible: false,
    editingId: '',
    original: null as BaseEntity | null,
})
const form = reactive<Record<string, any>>({})

const load = async () => {
    state.loading = true
    state.error = ''
    try {
        const result = await service.page({
            ...(props.searchField && keyword.value ? { [props.searchField]: keyword.value } : {}),
            pageNo: state.pageNum,
            pageSize: state.pageSize,
        })
        state.rows = result.list
        state.total = result.total
    } catch (error: any) {
        state.rows = []
        state.total = 0
        state.error = error?.message || '数据加载失败'
        ElMessage.error(state.error)
    } finally {
        state.loading = false
    }
}
const search = () => {
    state.pageNum = 1
    load()
}
const reset = () => {
    keyword.value = ''
    search()
}
const pageSizeChanged = () => {
    state.pageNum = 1
    load()
}
const resetForm = () => {
    Object.keys(form).forEach((key) => delete form[key])
    props.fields.forEach((field) => {
        form[field.prop] = field.defaultValue ?? (field.type === 'switch' ? 1 : field.type === 'number' ? 0 : '')
    })
}
const openCreate = () => {
    state.editingId = ''
    state.original = null
    resetForm()
    state.formVisible = true
}
const openEdit = (row: BaseEntity) => {
    state.editingId = row.id
    state.original = { ...row }
    resetForm()
    Object.assign(form, row)
    state.formVisible = true
}
const save = async () => {
    const missing = props.fields.find((field) => field.required && (form[field.prop] === '' || form[field.prop] === undefined))
    if (missing) return ElMessage.warning(`请填写${missing.label}`)
    const validation = props.validate?.(form)
    if (validation) return ElMessage.warning(validation)
    if (props.beforeSave && !(await props.beforeSave(form, state.original))) return
    state.saving = true
    try {
        if (state.editingId) await service.update({ ...form, id: state.editingId } as any)
        else await service.create(form as any)
        state.formVisible = false
        ElMessage.success('保存成功')
        load()
    } catch (error: any) {
        ElMessage.error(error?.message || '保存失败')
    } finally {
        state.saving = false
    }
}
const remove = async (row: BaseEntity) => {
    await ElMessageBox.confirm('删除后无法在当前会话中恢复，确认继续？', '删除记录', {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
    })
    await service.remove(row.id)
    ElMessage.success('删除成功')
    load()
}
const removeSelected = async () => {
    await ElMessageBox.confirm(`将删除 ${state.selection.length} 条记录，确认继续？`, '批量删除', {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
    })
    await service.removeMany(state.selection.map((row) => row.id))
    state.selection = []
    ElMessage.success('批量删除成功')
    load()
}
const displayValue = (row: BaseEntity, column: DataColumn) =>
    column.format ? column.format(row as Record<string, any>) : String((row as Record<string, any>)[column.prop] ?? '-')
onMounted(load)
defineExpose({ reload: load, openCreate })
</script>

<style scoped lang="scss">
.managed-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px;
    border-bottom: 1px solid var(--co-divider);
}
.managed-toolbar .el-input {
    width: min(360px, 100%);
}
.managed-toolbar span {
    margin-left: auto;
    color: var(--co-ink-muted);
    font-size: 13px;
}
.managed-pagination {
    display: flex;
    justify-content: flex-end;
    overflow-x: auto;
    padding: 16px;
    border-top: 1px solid var(--co-divider);
}
:deep(.el-table th.el-table__cell) {
    height: 44px;
    background: #fafafa;
    color: var(--co-ink-muted);
    font-size: 12px;
    font-weight: 600;
}
:deep(.el-table) {
    --el-table-row-hover-bg-color: #fafafa;
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
.managed-toolbar__label {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    clip-path: inset(50%);
}
@media (max-width: 768px) {
    .managed-toolbar {
        align-items: stretch;
        flex-wrap: wrap;
    }
    .managed-toolbar .el-input {
        width: 100%;
    }
    .managed-toolbar span {
        width: 100%;
        margin-left: 0;
    }
    .managed-pagination {
        justify-content: flex-start;
    }
}
</style>
