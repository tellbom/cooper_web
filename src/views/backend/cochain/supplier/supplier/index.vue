<template>
    <section class="figma-page">
        <template v-if="!selectedSupplier">
            <header class="figma-page__header"><div><p class="figma-page__eyebrow">供应商管理</p><h1>供应商中心</h1><p class="figma-page__description">维护供应商基础信息、启停状态及关联的三级品类。</p></div><div class="figma-page__actions"><el-button v-auth="'import'" plain @click="openCategoryImport"><el-icon><Upload /></el-icon>导入品类关联</el-button><el-button v-auth="'save'" type="primary" @click="openForm()"><el-icon><Plus /></el-icon>新增供应商</el-button></div></header>
            <div class="figma-card">
                <form class="figma-search" role="search" @submit.prevent="load"><el-input v-model="query.supplierName" clearable placeholder="搜索供应商名称"><template #prefix><el-icon><Search /></el-icon></template></el-input><el-select v-model="query.enabled" clearable placeholder="全部状态"><el-option label="启用" :value="1" /><el-option label="停用" :value="0" /></el-select><el-input v-model="categoryKeyword" clearable placeholder="关联品类" class="category-filter" /><el-button native-type="submit" type="primary" class="figma-query-button">查询</el-button><el-button @click="reset"><el-icon><Refresh /></el-icon>重置</el-button></form>
                <el-table v-loading="loading" :data="filteredRows" row-key="id">
                    <el-table-column prop="supplierName" label="供应商名称" min-width="230"><template #default="{ row }"><button class="supplier-link" type="button" @click="openDetail(row)">{{ row.supplierName }}</button></template></el-table-column>
                    <el-table-column label="状态" width="100"><template #default="{ row }"><span class="figma-status" :data-status="row.enabled ? 'ENABLED' : 'DISABLED'">{{ row.enabled ? '启用' : '停用' }}</span></template></el-table-column>
                    <el-table-column label="可承制品类数" min-width="200"><template #default="{ row }"><el-popover v-if="supplierCategories(row.id).length" trigger="hover" placement="bottom-start" :width="380" :show-after="120" popper-class="supplier-category-popover"><template #reference><button class="category-count-trigger" type="button">{{ supplierCategories(row.id).length }} 个品类</button></template><div class="supplier-category-panel"><div class="supplier-category-panel__header"><strong><el-icon><PriceTag /></el-icon>可承制品类主数据明细</strong><span>共 {{ supplierCategories(row.id).length }} 项</span></div><div class="supplier-category-panel__list"><article v-for="association in supplierCategories(row.id)" :key="association.id" class="supplier-category-card"><div class="supplier-category-card__title"><strong>{{ categoryMaster(association.categoryId)?.categoryName || association.categoryId }}</strong><span v-if="categoryMaster(association.categoryId)">{{ categoryMaster(association.categoryId)?.partType }}</span></div><dl v-if="categoryMaster(association.categoryId)"><div><dt>材料类型：</dt><dd>{{ categoryMaster(association.categoryId)?.materialType }}</dd></div><div><dt>尺寸逻辑：</dt><dd class="logic-value">{{ categoryMaster(association.categoryId)?.sizeLogic }}</dd></div><div class="wide"><dt>长度限制：</dt><dd>{{ categoryMaster(association.categoryId)?.lengthMin }} ~ {{ categoryMaster(association.categoryId)?.lengthMax }} mm</dd></div><div class="wide"><dt>宽度限制：</dt><dd>{{ categoryMaster(association.categoryId)?.widthMin }} ~ {{ categoryMaster(association.categoryId)?.widthMax }} mm</dd></div></dl><small v-else>品类ID：{{ association.categoryId }}</small></article></div></div></el-popover><span v-else class="category-empty">未关联</span></template></el-table-column>
                    <el-table-column prop="remark" label="备注" min-width="230" show-overflow-tooltip />
                    <el-table-column label="操作" width="210" fixed="right"><template #default="{ row }"><el-button link type="primary" @click="openDetail(row)">查看</el-button><el-button v-auth="'update'" link type="primary" @click="openForm(row)">编辑</el-button><el-button v-auth="'update'" link :type="row.enabled ? 'warning' : 'success'" @click="toggle(row)">{{ row.enabled ? '停用' : '启用' }}</el-button><el-button v-auth="'delete'" link type="danger" @click="remove(row)">删除</el-button></template></el-table-column>
                </el-table>
                <footer class="figma-pagination"><span>共 {{ filteredRows.length }} 条记录</span><el-pagination :total="filteredRows.length" :page-size="20" layout="prev, pager, next" /></footer>
            </div>
        </template>

        <template v-else>
            <header class="figma-page__header"><div><button class="back-button" type="button" @click="selectedSupplier = undefined"><el-icon><ArrowLeft /></el-icon>返回供应商列表</button><div class="detail-title"><h1>{{ selectedSupplier.supplierName }}</h1><span class="figma-status" :data-status="selectedSupplier.enabled ? 'ENABLED' : 'DISABLED'">{{ selectedSupplier.enabled ? '启用' : '停用' }}</span></div><p class="figma-page__description">供应商详情及三级品类关联</p></div><div class="figma-page__actions"><el-button v-auth="'update'" @click="openForm(selectedSupplier)">编辑信息</el-button><el-button v-auth="'update'" :type="selectedSupplier.enabled ? 'warning' : 'success'" plain @click="toggle(selectedSupplier)">{{ selectedSupplier.enabled ? '停用供应商' : '启用供应商' }}</el-button></div></header>
            <div class="figma-card"><div class="figma-card__header"><h2>基础信息</h2></div><dl class="figma-info-grid"><div><dt>供应商编号</dt><dd>{{ selectedSupplier.id }}</dd></div><div><dt>当前状态</dt><dd>{{ selectedSupplier.enabled ? '启用' : '停用' }}</dd></div><div class="wide"><dt>供应商名称</dt><dd>{{ selectedSupplier.supplierName }}</dd></div><div class="wide"><dt>备注</dt><dd>{{ selectedSupplier.remark || '—' }}</dd></div></dl></div>
            <div class="figma-card"><div class="figma-card__header"><div><h2>关联三级品类</h2><span class="figma-muted">共 {{ supplierCategories(selectedSupplier.id).length }} 项</span></div><el-button v-auth="'save'" type="primary" plain @click="categoryVisible = true"><el-icon><Plus /></el-icon>添加关联</el-button></div><el-table :data="supplierCategories(selectedSupplier.id)" row-key="id"><el-table-column label="三级品类名称" min-width="260"><template #default="{ row }">{{ categoryMaster(row.categoryId)?.categoryName || '—' }}</template></el-table-column><el-table-column prop="categoryId" label="品类编号" min-width="180" /><el-table-column label="操作" width="100"><template #default="{ row }"><el-button v-auth="'delete'" link type="danger" @click="removeCategory(row)">解除关联</el-button></template></el-table-column></el-table></div>
        </template>

        <el-dialog v-model="formVisible" :title="form.id ? '编辑供应商' : '新增供应商'" width="min(540px, 94vw)"><el-form label-position="top"><el-form-item label="供应商名称" required><el-input v-model="form.supplierName" placeholder="请输入供应商全称" /></el-form-item><el-form-item label="状态"><el-radio-group v-model="form.enabled"><el-radio-button :value="1">启用</el-radio-button><el-radio-button :value="0">停用</el-radio-button></el-radio-group></el-form-item><el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="3" placeholder="选填" /></el-form-item></el-form><template #footer><el-button @click="formVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="save">保存</el-button></template></el-dialog>
        <el-dialog v-model="categoryVisible" title="添加品类关联" width="min(520px, 94vw)"><el-form label-position="top"><el-form-item label="三级品类"><el-select v-model="categoryId" filterable style="width:100%"><el-option v-for="item in categories" :key="item.id" :label="item.categoryName" :value="item.id" /></el-select></el-form-item></el-form><template #footer><el-button @click="categoryVisible = false">取消</el-button><el-button type="primary" @click="addCategory">确认添加</el-button></template></el-dialog>
        <el-dialog v-model="categoryImportVisible" title="导入供应商品类关联" width="min(560px, 94vw)"
            ><el-form label-position="top"
                ><el-form-item label="关联关系 Excel" required
                    ><el-upload
                        ref="uploadRef"
                        drag
                        :auto-upload="false"
                        :limit="1"
                        accept=".xlsx,.xls"
                        :on-change="(file) => (categoryImportFile = file)"
                        :on-exceed="handleUploadExceed"
                        ><el-icon class="upload-icon"><Upload /></el-icon>
                        <div>拖拽文件到此处，或 <span class="figma-link">点击选择文件</span></div>
                        <template #tip><div>两列（含表头）：供应商名称、三级品类名称，均需与系统内名称精确一致</div></template></el-upload
                    ></el-form-item
                ></el-form
            ><template #footer
                ><el-button @click="categoryImportVisible = false">取消</el-button
                ><el-button type="primary" :loading="categoryImportSaving" @click="submitCategoryImport">开始导入</el-button></template
            ></el-dialog
        >
        <el-dialog v-model="categoryImportResultVisible" title="导入结果" width="min(600px, 94vw)"
            ><div v-if="categoryImportResult" class="import-summary">
                <div><strong>{{ categoryImportResult.totalRows }}</strong><span>总行数</span></div>
                <div class="success"><strong>{{ categoryImportResult.successCount }}</strong><span>成功</span></div>
                <div class="failed"><strong>{{ categoryImportResult.errorCount }}</strong><span>失败</span></div>
            </div>
            <el-table v-if="categoryImportResult?.errors.length" :data="categoryImportResult.errors"
                ><el-table-column prop="rowNo" label="行号" width="70" /><el-table-column prop="supplierName" label="供应商" min-width="120" /><el-table-column
                    prop="categoryName"
                    label="三级品类"
                    min-width="120"
                /><el-table-column prop="message" label="失败原因" min-width="160" /></el-table
            ><template #footer><el-button type="primary" @click="categoryImportResultVisible = false">知道了</el-button></template></el-dialog
        >
    </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, genFileId, type UploadFile, type UploadInstance, type UploadProps, type UploadRawFile } from 'element-plus'
import { ArrowLeft, Plus, PriceTag, Refresh, Search, Upload } from '@element-plus/icons-vue'
import type { CategoryImportResultVO, CategoryMasterVO, SupplierCategoryVO, SupplierVO } from '/@/features/cochain/contracts'
import { getResourceService } from '/@/features/cochain/services'
import { supplierActionsApi } from '/@/features/cochain/services/supplierActions'

const supplierService = getResourceService('suppliers'); const associationService = getResourceService('supplierCategories'); const categoryService = getResourceService('categories')
const query = reactive({ supplierName: '', enabled: undefined as 0 | 1 | undefined, pageNo: 1, pageSize: 100 }); const categoryKeyword = ref(''); const rows = ref<SupplierVO[]>([]); const associations = ref<SupplierCategoryVO[]>([]); const categories = ref<CategoryMasterVO[]>([]); const loading = ref(false); const saving = ref(false); const selectedSupplier = ref<SupplierVO>(); const formVisible = ref(false); const categoryVisible = ref(false); const categoryId = ref(''); const form = reactive<Partial<SupplierVO>>({})
const categoryImportVisible = ref(false); const categoryImportResultVisible = ref(false); const categoryImportSaving = ref(false); const uploadRef = ref<UploadInstance>(); const categoryImportFile = ref<UploadFile>(); const categoryImportResult = ref<CategoryImportResultVO>()
const supplierCategories = (supplierId: string) => associations.value.filter((item) => item.supplierId === supplierId)
const categoryMaster = (categoryId: string) => categories.value.find((item) => item.id === categoryId)
const filteredRows = computed(() => !categoryKeyword.value ? rows.value : rows.value.filter((row) => supplierCategories(row.id).some((item) => categoryMaster(item.categoryId)?.categoryName?.includes(categoryKeyword.value))))
const load = async () => { loading.value = true; try { const [supplierResult, associationRows, categoryRows] = await Promise.all([supplierService.page(query), associationService.list(), categoryService.list()]); rows.value = supplierResult.list; associations.value = associationRows; categories.value = categoryRows } finally { loading.value = false } }
const reset = () => { Object.assign(query, { supplierName: '', enabled: undefined, pageNo: 1 }); categoryKeyword.value = ''; load() }
const openDetail = (row: SupplierVO) => { selectedSupplier.value = { ...row } }; const openForm = (row?: SupplierVO) => { Object.assign(form, row || { id: undefined, supplierName: '', enabled: 1, remark: '' }); formVisible.value = true }
const save = async () => { if (!form.supplierName?.trim()) return ElMessage.warning('请输入供应商名称'); saving.value = true; try { if (form.id) await supplierService.update(form as SupplierVO); else await supplierService.create({ supplierName: form.supplierName, enabled: form.enabled ?? 1, remark: form.remark || '' }); formVisible.value = false; ElMessage.success('供应商已保存'); await load(); if (selectedSupplier.value && form.id === selectedSupplier.value.id) selectedSupplier.value = rows.value.find((item) => item.id === form.id) } finally { saving.value = false } }
const toggle = async (row: SupplierVO) => { const next = row.enabled ? 0 : 1; if (!next) await ElMessageBox.confirm('停用后该供应商将不再参与推荐，确认停用？', '停用供应商', { type: 'warning', confirmButtonText: '停用', cancelButtonText: '取消' }); await supplierActionsApi.setSupplierEnabled(row.id, next as 0 | 1); ElMessage.success(next ? '供应商已启用' : '供应商已停用'); await load(); if (selectedSupplier.value?.id === row.id) selectedSupplier.value = rows.value.find((item) => item.id === row.id) }
const remove = async (row: SupplierVO) => { await ElMessageBox.confirm(`确认删除供应商“${row.supplierName}”？`, '删除供应商', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }); await supplierService.remove(row.id); ElMessage.success('供应商已删除'); load() }
const addCategory = async () => { if (!selectedSupplier.value || !categoryId.value) return ElMessage.warning('请选择三级品类'); const category = categories.value.find((item) => item.id === categoryId.value); if (!category) return; if (supplierCategories(selectedSupplier.value.id).some((item) => item.categoryId === category.id)) return ElMessage.warning('该品类已关联'); await associationService.create({ supplierId: selectedSupplier.value.id, categoryId: category.id }); associations.value = await associationService.list(); categoryVisible.value = false; ElMessage.success('品类关联已添加') }
const removeCategory = async (row: SupplierCategoryVO) => { await associationService.remove(row.id); associations.value = await associationService.list(); ElMessage.success('品类关联已解除') }
const openCategoryImport = () => { categoryImportFile.value = undefined; uploadRef.value?.clearFiles(); categoryImportVisible.value = true }
const handleUploadExceed: UploadProps['onExceed'] = (files) => { uploadRef.value?.clearFiles(); const raw = files[0] as UploadRawFile; raw.uid = genFileId(); uploadRef.value?.handleStart(raw) }
const submitCategoryImport = async () => {
    if (!categoryImportFile.value?.raw) return ElMessage.warning('请选择关联关系 Excel')
    categoryImportSaving.value = true
    try {
        const result = await supplierActionsApi.importSupplierCategory(categoryImportFile.value.raw)
        categoryImportVisible.value = false
        categoryImportResult.value = result
        categoryImportResultVisible.value = true
        associations.value = await associationService.list()
    } finally {
        categoryImportSaving.value = false
    }
}
onMounted(load)
</script>

<style scoped>
.category-filter{width:160px!important}.supplier-link{padding:0;border:0;background:transparent;color:#0066cc;font:500 13px var(--co-font-family);cursor:pointer}.category-count-trigger{padding:0;border:0;border-bottom:1px dotted #99c0e8;background:transparent;color:#0066cc;font:600 13px var(--co-font-family);cursor:default}.category-empty{color:#b0b0b0;font-size:12px}.back-button{display:flex;align-items:center;gap:5px;margin:0 0 6px;padding:0;border:0;background:transparent;color:#0066cc;font:500 12px var(--co-font-family);cursor:pointer}.detail-title{display:flex;align-items:center;gap:12px}.wide{grid-column:1/-1}
.upload-icon{margin-bottom:8px;color:#0066cc;font-size:28px}
:deep(.el-upload),:deep(.el-upload-dragger){width:100%}
:deep(.el-upload-dragger){padding:30px 18px;border-radius:10px;background:#fafafc}
.import-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px}
.import-summary>div{display:flex;flex-direction:column;padding:16px;border-radius:10px;background:#fafafc}
.import-summary strong{font-size:24px}
.import-summary span{color:#7a7a7a;font-size:12px}
.import-summary .success strong{color:#067647}
.import-summary .failed strong{color:#b42318}
</style>
