<template>
    <section class="figma-page">
        <header class="figma-page__header">
            <div>
                <p class="figma-page__eyebrow">规则配置</p>
                <h1>规则配置</h1>
                <p class="figma-page__description">维护分包引擎所需的主数据与规则；变更配置后将影响后续批次的分包与推荐结果。</p>
            </div>
            <el-button v-if="activeTab !== 'capacity'" type="primary" :disabled="!canActive('save')" @click="openForm()"
                ><el-icon><Plus /></el-icon>{{ activeConfig.addLabel }}</el-button
            >
        </header>
        <div class="figma-card">
            <nav class="figma-tabs rule-tabs">
                <button
                    v-for="item in tabs"
                    :key="item.key"
                    class="figma-tab"
                    :class="{ 'is-active': activeTab === item.key }"
                    type="button"
                    @click="activeTab = item.key"
                >
                    {{ item.label }}
                </button>
            </nav>
            <form class="figma-search" role="search" @submit.prevent>
                <el-input v-model="keyword" clearable :placeholder="activeConfig.placeholder"
                    ><template #prefix
                        ><el-icon><Search /></el-icon></template></el-input
                ><el-button class="figma-query-button" type="primary">查询</el-button
                ><el-button @click="keyword = ''"
                    ><el-icon><Refresh /></el-icon>重置</el-button
                >
            </form>
            <el-table v-loading="loading" :data="filteredRows" row-key="id">
                <el-table-column
                    v-for="column in activeConfig.columns"
                    :key="column.prop"
                    :prop="column.prop"
                    :label="column.label"
                    :min-width="column.width"
                >
                    <template #default="{ row }"
                        ><span v-if="column.status" class="figma-status" :data-status="row[column.prop] ? 'ENABLED' : 'DISABLED'">{{
                            row[column.prop] ? '启用' : '停用'
                        }}</span
                        ><span
                            v-else-if="column.presentation === 'tag'"
                            class="rule-value-tag"
                            :data-kind="column.tagKind"
                            :data-value="row[column.prop]"
                            >{{ column.format ? column.format(row) : row[column.prop] ?? '—' }}</span
                        ><code v-else-if="column.presentation === 'code'" class="rule-code" :data-kind="column.tagKind">{{
                            row[column.prop] ?? '—'
                        }}</code
                        ><strong v-else-if="column.presentation === 'metric'" class="rule-metric">{{
                            column.format ? column.format(row) : row[column.prop] ?? '—'
                        }}</strong
                        ><span
                            v-else-if="column.presentation === 'boolean'"
                            class="rule-boolean"
                            :data-active="row[column.prop] ? 'true' : 'false'"
                            >{{ column.format ? column.format(row) : row[column.prop] ? '是' : '否' }}</span
                        ><span v-else-if="column.format">{{ column.format(row) }}</span
                        ><span v-else>{{ row[column.prop] ?? '—' }}</span></template
                    >
                </el-table-column>
                <el-table-column label="操作" width="145" fixed="right"
                    ><template #default="{ row }"
                        ><el-button type="primary" link :disabled="!canActive('update')" @click="openForm(row)">{{
                            activeTab === 'capacity' ? '调整容量' : '编辑'
                        }}</el-button
                        ><el-button v-if="activeTab !== 'capacity'" link type="danger" :disabled="!canActive('delete')" @click="remove(row)"
                            >删除</el-button
                        ></template
                    ></el-table-column
                >
                <template #empty
                    ><div class="empty-copy">暂无{{ activeConfig.label }}数据</div></template
                >
            </el-table>
            <footer class="figma-pagination">
                <span>共 {{ filteredRows.length }} 条记录</span
                ><el-pagination :total="filteredRows.length" :page-size="20" layout="prev, pager, next" />
            </footer>
        </div>

        <el-dialog v-model="formVisible" :title="`${form.id ? '编辑' : '新增'}${activeConfig.label}`" width="min(620px, 94vw)">
            <el-form label-position="top"
                ><div class="form-grid">
                    <el-form-item
                        v-for="field in activeConfig.fields"
                        :key="field.prop"
                        :label="field.label"
                        :required="field.required"
                        :class="{ wide: field.type === 'textarea' }"
                        ><el-switch v-if="field.type === 'switch'" v-model="form[field.prop]" :active-value="1" :inactive-value="0" /><el-input-number
                            v-else-if="field.type === 'number'"
                            v-model="form[field.prop]"
                            :min="field.min ?? 0"
                            controls-position="right"
                            style="width: 100%" /><el-select v-else-if="field.options" v-model="form[field.prop]" style="width: 100%"
                            ><el-option v-for="option in field.options" :key="option.value" :label="option.label" :value="option.value" /></el-select
                        ><el-input
                            v-else
                            v-model="form[field.prop]"
                            :type="field.type === 'textarea' ? 'textarea' : 'text'"
                            :rows="3"
                            :placeholder="field.placeholder"
                    /></el-form-item></div
            ></el-form>
            <template #footer
                ><el-button @click="formVisible = false">取消</el-button
                ><el-button type="primary" :loading="saving" @click="save">保存</el-button></template
            >
        </el-dialog>
    </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import { auth } from '/@/utils/common'
import { getResourceService } from '/@/features/cochain/services'

type TabKey = 'categories' | 'special' | 'rightRule' | 'rightManual' | 'capacity'
type Column = {
    prop: string
    label: string
    width?: number
    status?: boolean
    presentation?: 'tag' | 'code' | 'metric' | 'boolean'
    tagKind?: 'logic' | 'special' | 'left' | 'right' | 'drawing'
    format?: (row: any) => string
}
type Field = {
    prop: string
    label: string
    required?: boolean
    type?: 'text' | 'textarea' | 'number' | 'switch'
    min?: number
    placeholder?: string
    options?: { label: string; value: any }[]
}
type Config = {
    label: string
    addLabel: string
    placeholder: string
    resource: any
    authPath: string
    columns: Column[]
    fields: Field[]
    defaults: Record<string, any>
}
const tabs: { key: TabKey; label: string }[] = [
    { key: 'categories', label: '三级品类主数据' },
    { key: 'special', label: '特殊品类配置' },
    { key: 'rightRule', label: '左右识别规则' },
    { key: 'rightManual', label: '左右件人工关系' },
    { key: 'capacity', label: '工作包容量' },
]
const configs: Record<TabKey, Config> = {
    categories: {
        label: '三级品类',
        addLabel: '新增三级品类',
        placeholder: '搜索品类名称 / 材料类型',
        resource: 'categories',
        authPath: '/cochain/part/category-master',
        columns: [
            { prop: 'categoryName', label: '品类名称', width: 180 },
            { prop: 'materialType', label: '材料类型', width: 120 },
            { prop: 'lengthMin', label: '长度下限', width: 90 },
            { prop: 'lengthMax', label: '长度上限', width: 90 },
            { prop: 'widthMin', label: '宽度下限', width: 90 },
            { prop: 'widthMax', label: '宽度上限', width: 90 },
            { prop: 'sizeLogic', label: '尺寸逻辑', width: 90, presentation: 'tag', tagKind: 'logic' },
            { prop: 'partType', label: '零件类型', width: 90 },
        ],
        fields: [
            { prop: 'categoryName', label: '品类名称', required: true },
            { prop: 'materialType', label: '材料类型', required: true },
            { prop: 'lengthMin', label: '长度下限', type: 'number' },
            { prop: 'lengthMax', label: '长度上限', type: 'number' },
            { prop: 'widthMin', label: '宽度下限', type: 'number' },
            { prop: 'widthMax', label: '宽度上限', type: 'number' },
            {
                prop: 'sizeLogic',
                label: '尺寸逻辑',
                options: [
                    { label: '同时满足（AND）', value: 'AND' },
                    { label: '满足任一（OR）', value: 'OR' },
                ],
            },
            { prop: 'partType', label: '零件类型', options: ['小型', '中型', '大型', '超大型', '其他'].map((value) => ({ label: value, value })) },
        ],
        defaults: { sizeLogic: 'AND', partType: '其他', lengthMin: 0, lengthMax: 0, widthMin: 0, widthMax: 0 },
    },
    special: {
        label: '特殊品类配置',
        addLabel: '新增特殊品类',
        placeholder: '搜索品类名称',
        resource: 'specialCategories',
        authPath: '/cochain/special/category-config',
        columns: [
            { prop: 'categoryId', label: '三级品类', width: 210, format: (r: any) => categoryName(r.categoryId) },
            {
                prop: 'specialType',
                label: '特殊类型',
                width: 150,
                presentation: 'tag',
                tagKind: 'special',
                format: (r) => (r.specialType === 'COMPOSITE' ? '复合材料' : '加强件'),
            },
            {
                prop: 'recommendRule',
                label: '推荐规则',
                width: 160,
                format: (r) => (r.recommendRule === 'ALL_SUPPLIERS' ? '全部供应商' : '轮询推荐'),
            },
            { prop: 'ignoreQuality', label: '忽略质量等级', width: 120, presentation: 'boolean', format: (r) => (r.ignoreQuality ? '是' : '否') },
        ],
        fields: [
            { prop: 'categoryId', label: '品类编号', required: true },
            {
                prop: 'specialType',
                label: '特殊类型',
                options: [
                    { label: '复合材料', value: 'COMPOSITE' },
                    { label: '加强件', value: 'REINFORCEMENT' },
                ],
            },
            {
                prop: 'recommendRule',
                label: '推荐规则',
                options: [
                    { label: '全部供应商', value: 'ALL_SUPPLIERS' },
                    { label: '轮询推荐', value: 'ROUND_ROBIN' },
                ],
            },
            { prop: 'ignoreQuality', label: '忽略质量等级', type: 'switch' },
        ],
        defaults: { specialType: 'COMPOSITE', recommendRule: 'ALL_SUPPLIERS', ignoreQuality: 0 },
    },
    rightRule: {
        label: '左右识别规则',
        addLabel: '新增识别规则',
        placeholder: '搜索机型 / 后缀',
        resource: 'leftRightRules',
        authPath: '/cochain/left/right-rule',
        columns: [
            { prop: 'aircraftModel', label: '机型', width: 160 },
            { prop: 'leftSuffix', label: '左件后缀', width: 130, presentation: 'code', tagKind: 'left' },
            { prop: 'rightSuffix', label: '右件后缀', width: 130, presentation: 'code', tagKind: 'right' },
            { prop: 'description', label: '说明', width: 230 },
        ],
        fields: [
            { prop: 'aircraftModel', label: '机型', required: true },
            { prop: 'leftSuffix', label: '左件后缀', required: true },
            { prop: 'rightSuffix', label: '右件后缀', required: true },
            { prop: 'description', label: '说明', type: 'textarea' },
        ],
        defaults: { description: '' },
    },
    rightManual: {
        label: '左右件人工关系',
        addLabel: '新增人工关系',
        placeholder: '搜索机型 / 零件图号',
        resource: 'leftRightManuals',
        authPath: '/cochain/left/right-manual',
        columns: [
            { prop: 'aircraftModel', label: '机型', width: 120 },
            { prop: 'leftPartDrawingNo', label: '左件图号', width: 220, presentation: 'code', tagKind: 'drawing' },
            { prop: 'rightPartDrawingNo', label: '右件图号', width: 220, presentation: 'code', tagKind: 'drawing' },
        ],
        fields: [
            { prop: 'aircraftModel', label: '机型', required: true },
            { prop: 'leftPartDrawingNo', label: '左件图号', required: true },
            { prop: 'rightPartDrawingNo', label: '右件图号', required: true },
        ],
        defaults: {},
    },
    capacity: {
        label: '工作包容量',
        addLabel: '新增容量',
        placeholder: '搜索零件类型',
        resource: 'typePackageConfigs',
        authPath: '/cochain/part/type-package-config',
        columns: [
            { prop: 'partType', label: '零件类型', width: 140 },
            { prop: 'typeLabel', label: '类型说明', width: 160 },
            { prop: 'maxPartCount', label: '每包最大零件数', width: 160, presentation: 'metric' },
            { prop: 'sortOrder', label: '排序', width: 90 },
        ],
        fields: [
            {
                prop: 'partType',
                label: '零件类型',
                required: true,
                options: ['小型', '中型', '大型', '超大型', '其他'].map((value) => ({ label: value, value })),
            },
            { prop: 'typeLabel', label: '类型说明' },
            { prop: 'maxPartCount', label: '每包最大零件数', required: true, type: 'number', min: 1 },
            { prop: 'sortOrder', label: '排序', type: 'number', min: 0 },
        ],
        defaults: { maxPartCount: 1, sortOrder: 0 },
    },
}
const activeTab = ref<TabKey>('categories')
const activeConfig = computed(() => configs[activeTab.value])
const rows = ref<any[]>([])
const keyword = ref('')
const loading = ref(false)
const saving = ref(false)
const formVisible = ref(false)
const form = reactive<Record<string, any>>({})
const categoryLookup = ref<{ id: string; categoryName: string }[]>([])
const categoryName = (id: string) => categoryLookup.value.find((item) => item.id === id)?.categoryName || id
const filteredRows = computed(() =>
    !keyword.value ? rows.value : rows.value.filter((row) => Object.values(row).some((value) => String(value ?? '').includes(keyword.value)))
)
const service = () => getResourceService(activeConfig.value.resource) as any
const load = async () => {
    loading.value = true
    try {
        rows.value = await service().list()
    } finally {
        loading.value = false
    }
}
const canActive = (action: string) => auth({ name: activeConfig.value.authPath, subNodeName: `${activeConfig.value.authPath}/${action}` })
const openForm = (row?: any) => {
    Object.keys(form).forEach((key) => delete form[key])
    Object.assign(form, activeConfig.value.defaults, row || {})
    formVisible.value = true
}
const save = async () => {
    const required = activeConfig.value.fields.find(
        (field) => field.required && (form[field.prop] === undefined || String(form[field.prop]).trim() === '')
    )
    if (required) return ElMessage.warning(`请填写${required.label}`)
    saving.value = true
    try {
        if (form.id) await service().update({ ...form })
        else {
            const input = { ...form }
            delete input.id
            await service().create(input)
        }
        formVisible.value = false
        ElMessage.success(`${activeConfig.value.label}已保存`)
        load()
    } finally {
        saving.value = false
    }
}
const remove = async (row: any) => {
    await ElMessageBox.confirm(`确认删除该${activeConfig.value.label}记录？`, '删除记录', {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
    })
    await service().remove(row.id)
    ElMessage.success('记录已删除')
    load()
}
watch(activeTab, () => {
    keyword.value = ''
    load()
})
onMounted(async () => {
    categoryLookup.value = await getResourceService('categories').list()
    await load()
})
</script>

<style scoped>
.rule-tabs {
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
}
.rule-tabs::-webkit-scrollbar {
    display: none;
}
.rule-tabs .figma-tab {
    flex: 0 0 auto;
    white-space: nowrap;
}
.rule-value-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 22px;
    padding: 1px 8px;
    border-radius: 5px;
    font-size: 11px;
    font-weight: 650;
    line-height: 20px;
    white-space: nowrap;
}
.rule-value-tag[data-kind='logic'][data-value='AND'] {
    background: #e8f1fb;
    color: #0055aa;
}
.rule-value-tag[data-kind='logic'][data-value='OR'] {
    background: #fff3e0;
    color: #b54708;
}
.rule-value-tag[data-kind='special'] {
    padding: 2px 10px;
    border-radius: 6px;
    background: #f3eaff;
    color: #7030c0;
    font-size: 12px;
    font-weight: 550;
}
.rule-code {
    display: inline-flex;
    padding: 1px 7px;
    border-radius: 4px;
    font:
        600 12px/20px ui-monospace,
        SFMono-Regular,
        Menlo,
        Monaco,
        Consolas,
        monospace;
    white-space: nowrap;
}
.rule-code[data-kind='left'] {
    background: #e8f1fb;
    color: #0055aa;
}
.rule-code[data-kind='right'] {
    background: #fff3e0;
    color: #b54708;
}
.rule-code[data-kind='drawing'] {
    padding: 0;
    background: transparent;
    color: #0066cc;
    font-weight: 550;
}
.rule-metric {
    color: #0066cc;
    font-size: 16px;
    font-variant-numeric: tabular-nums;
}
.rule-boolean {
    font-size: 12px;
    font-weight: 550;
}
.rule-boolean[data-active='true'] {
    color: #b54708;
}
.rule-boolean[data-active='false'] {
    color: #7a7a7a;
}
.form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 16px;
}
.wide {
    grid-column: 1/-1;
}
.empty-copy {
    padding: 48px;
    color: #a1a1a6;
    text-align: center;
}
@media (max-width: 620px) {
    .form-grid {
        grid-template-columns: 1fr;
    }
}
</style>
