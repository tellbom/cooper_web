<template>
    <section class="figma-page">
        <header class="figma-page__header">
            <div>
                <p class="figma-page__eyebrow">供应商分析</p>
                <h1>供应商绩效与排名</h1>
                <p class="figma-page__description">维护月度绩效数据，查看各三级品类的供应商排名快照。</p>
            </div>
            <el-button v-if="activeTab === 'performance'" v-auth="'upload'" type="primary" @click="openUpload"
                ><el-icon><Upload /></el-icon>上传月度绩效</el-button
            ><el-button
                v-else
                v-auth="{ name: '/cochain/supplier/ranking-snapshot', subNodeName: '/cochain/supplier/ranking-snapshot/generate' }"
                type="primary"
                @click="generateRanking"
                ><el-icon><Refresh /></el-icon>生成排名快照</el-button
            >
        </header>
        <div class="figma-card">
            <nav class="figma-tabs">
                <button class="figma-tab" :class="{ 'is-active': activeTab === 'performance' }" type="button" @click="activeTab = 'performance'">
                    绩效记录</button
                ><button class="figma-tab" :class="{ 'is-active': activeTab === 'ranking' }" type="button" @click="activeTab = 'ranking'">
                    排名快照
                </button>
            </nav>
            <form class="figma-search" role="search" @submit.prevent="load">
                <el-input v-model="keyword" clearable placeholder="搜索供应商名称"
                    ><template #prefix
                        ><el-icon><Search /></el-icon></template></el-input
                ><el-select v-model="year" clearable placeholder="年份"
                    ><el-option v-for="item in years" :key="item" :label="`${item} 年`" :value="item" /></el-select
                ><el-select v-model="month" clearable placeholder="月份"
                    ><el-option v-for="item in 12" :key="item" :label="`${item} 月`" :value="item" /></el-select
                ><el-select v-if="activeTab === 'ranking'" v-model="categoryId" clearable placeholder="全部品类"
                    ><el-option v-for="item in categories" :key="item.id" :label="item.categoryName" :value="item.id" /></el-select
                ><el-select v-if="activeTab === 'ranking'" v-model="qualityLevel" clearable placeholder="质量等级"
                    ><el-option label="优质" value="优质" /><el-option label="普通" value="普通" /></el-select
                ><el-button native-type="submit" type="primary" class="figma-query-button">查询</el-button
                ><el-button @click="reset"
                    ><el-icon><Refresh /></el-icon>重置</el-button
                >
            </form>
            <el-table v-if="activeTab === 'performance'" v-loading="loading" :data="pagedPerformances" row-key="id">
                <el-table-column label="供应商名称" min-width="240"
                    ><template #default="{ row }">{{ supplierName(row.supplierId) }}</template></el-table-column
                ><el-table-column label="绩效月份" width="110"
                    ><template #default="{ row }"
                        >{{ row.performanceYear }}-{{ String(row.performanceMonth).padStart(2, '0') }}</template
                    ></el-table-column
                ><el-table-column label="当月得分" width="105"
                    ><template #default="{ row }"
                        ><span class="figma-score">{{ row.score.toFixed(1) }}</span></template
                    ></el-table-column
                ><el-table-column label="近半年平均" width="112"
                    ><template #default="{ row }">{{ row.halfYearAvg.toFixed(1) }}</template></el-table-column
                ><el-table-column label="上月得分" width="105"
                    ><template #default="{ row }">{{ row.lastMonthScore.toFixed(1) }}</template></el-table-column
                ><el-table-column label="综合得分" width="110"
                    ><template #default="{ row }"
                        ><strong>{{ row.comprehensiveScore.toFixed(1) }}</strong></template
                    ></el-table-column
                ><el-table-column label="趋势" min-width="110"
                    ><template #default="{ row }"
                        ><span :class="row.score >= row.lastMonthScore ? 'trend-up' : 'trend-down'"
                            >{{ row.score >= row.lastMonthScore ? '↑' : '↓' }} {{ Math.abs(row.score - row.lastMonthScore).toFixed(1) }}</span
                        ></template
                    ></el-table-column
                >
            </el-table>
            <el-table v-else v-loading="loading" :data="pagedRankings" row-key="id">
                <el-table-column label="三级品类" min-width="190"
                    ><template #default="{ row }">{{ categoryName(row.categoryId) }}</template></el-table-column
                ><el-table-column label="排名" width="124" align="center"
                    ><template #default="{ row }"
                        ><span class="rank" :data-rank="row.rankInCategory"
                            ><span v-if="row.rankInCategory <= 3" class="rank__medal" aria-hidden="true">{{
                                ['🥇', '🥈', '🥉'][row.rankInCategory - 1]
                            }}</span
                            ><span>第 {{ row.rankInCategory }} 名</span></span
                        ></template
                    ></el-table-column
                ><el-table-column label="供应商名称" min-width="240"
                    ><template #default="{ row }">{{ supplierName(row.supplierId) }}</template></el-table-column
                ><el-table-column label="综合得分" width="105"
                    ><template #default="{ row }"
                        ><span class="figma-score">{{ row.comprehensiveScore.toFixed(1) }}</span></template
                    ></el-table-column
                ><el-table-column label="质量等级" width="100"
                    ><template #default="{ row }"
                        ><span class="quality" :data-level="row.qualityLevel">{{ row.qualityLevel }}</span></template
                    ></el-table-column
                ><el-table-column label="快照月份" width="110"
                    ><template #default="{ row }">{{ row.rankingYear }}-{{ String(row.rankingMonth).padStart(2, '0') }}</template></el-table-column
                ><el-table-column label="参评数量" width="90"
                    ><template #default="{ row }">{{ row.totalSupplierCount }} 家</template></el-table-column
                >
            </el-table>
            <footer class="figma-pagination">
                <span>共 {{ activeTab === 'performance' ? filteredPerformances.length : filteredRankings.length }} 条记录</span
                ><el-pagination
                    v-model:current-page="currentPage"
                    :total="activeTab === 'performance' ? filteredPerformances.length : filteredRankings.length"
                    :page-size="PAGE_SIZE"
                    layout="prev, pager, next"
                />
            </footer>
        </div>

        <el-dialog v-model="uploadVisible" title="上传供应商月度绩效" width="min(620px, 94vw)"
            ><el-form label-position="top"
                ><div class="period-grid">
                    <el-form-item label="绩效年份" required
                        ><el-select v-model="uploadForm.year" style="width: 100%"
                            ><el-option v-for="item in years" :key="item" :label="`${item} 年`" :value="item" /></el-select></el-form-item
                    ><el-form-item label="绩效月份" required
                        ><el-select v-model="uploadForm.month" style="width: 100%"
                            ><el-option v-for="item in 12" :key="item" :label="`${item} 月`" :value="item" /></el-select
                    ></el-form-item>
                </div>
                <el-form-item label="绩效 Excel" required
                    ><el-upload
                        ref="uploadRef"
                        drag
                        :auto-upload="false"
                        :limit="1"
                        accept=".xlsx,.xls"
                        :on-change="(item) => (file = item)"
                        :on-exceed="handleUploadExceed"
                        ><el-icon class="upload-icon"><Upload /></el-icon>
                        <div>拖拽文件到此处，或 <span class="figma-link">点击选择文件</span></div>
                        <template #tip><div>请使用标准月度绩效模板</div></template></el-upload
                    ></el-form-item
                ><a class="figma-link" href="#" @click.prevent="downloadTemplate">下载绩效模板</a></el-form
            ><template #footer
                ><el-button @click="uploadVisible = false">取消</el-button
                ><el-button type="primary" :loading="saving" @click="submitUpload">开始导入</el-button></template
            ></el-dialog
        >
        <el-dialog v-model="resultVisible" title="绩效导入结果" width="min(600px, 94vw)"
            ><div v-if="importResult" class="import-summary">
                <div><strong>{{ importResult.totalRows }}</strong><span>总行数</span></div>
                <div class="success"><strong>{{ importResult.successCount }}</strong><span>成功</span></div>
                <div class="failed"><strong>{{ importResult.errorCount }}</strong><span>失败</span></div>
            </div>
            <el-table v-if="importResult?.errors.length" :data="importResult.errors"
                ><el-table-column prop="rowNo" label="行号" width="90" /><el-table-column prop="message" label="失败原因" /></el-table
        ></el-dialog>
    </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, genFileId, type UploadFile, type UploadInstance, type UploadProps, type UploadRawFile } from 'element-plus'
import { Refresh, Search, Upload } from '@element-plus/icons-vue'
import type { CategoryMasterVO, PerformanceUploadResultVO, RankingSnapshotVO, SupplierPerformanceVO, SupplierVO } from '/@/features/cochain/contracts'
import { getResourceService } from '/@/features/cochain/services'
import { supplierActionsApi } from '/@/features/cochain/services/supplierActions'

const performanceService = getResourceService('performances')
const rankingService = getResourceService('rankingSnapshots')
const categoryService = getResourceService('categories')
const supplierService = getResourceService('suppliers')
const activeTab = ref<'performance' | 'ranking'>('performance')
const performances = ref<SupplierPerformanceVO[]>([])
const rankings = ref<RankingSnapshotVO[]>([])
const categories = ref<CategoryMasterVO[]>([])
const suppliers = ref<SupplierVO[]>([])
const loading = ref(false)
const saving = ref(false)
const keyword = ref('')
const year = ref<number>()
const month = ref<number>()
const categoryId = ref('')
const qualityLevel = ref('')
const currentPage = ref(1)
const PAGE_SIZE = 20
const uploadVisible = ref(false)
const resultVisible = ref(false)
const uploadRef = ref<UploadInstance>()
const file = ref<UploadFile>()
const uploadForm = reactive({ year: 2026, month: 7 })
const importResult = ref<PerformanceUploadResultVO>()
const years = [2026, 2025, 2024]
const supplierName = (id: string) => suppliers.value.find((item) => item.id === id)?.supplierName || id
const categoryName = (id: string) => categories.value.find((item) => item.id === id)?.categoryName || id
const filteredPerformances = computed(() =>
    performances.value.filter(
        (row) =>
            (!keyword.value || supplierName(row.supplierId).includes(keyword.value)) &&
            (!year.value || row.performanceYear === year.value) &&
            (!month.value || row.performanceMonth === month.value)
    )
)
const filteredRankings = computed(() =>
    rankings.value.filter(
        (row) =>
            (!keyword.value || supplierName(row.supplierId).includes(keyword.value)) &&
            (!year.value || row.rankingYear === year.value) &&
            (!month.value || row.rankingMonth === month.value) &&
            (!categoryId.value || row.categoryId === categoryId.value) &&
            (!qualityLevel.value || row.qualityLevel === qualityLevel.value)
    )
)
const pagedPerformances = computed(() => {
    const start = (currentPage.value - 1) * PAGE_SIZE
    return filteredPerformances.value.slice(start, start + PAGE_SIZE)
})
const pagedRankings = computed(() => {
    const start = (currentPage.value - 1) * PAGE_SIZE
    return filteredRankings.value.slice(start, start + PAGE_SIZE)
})
const load = async () => {
    loading.value = true
    try {
        const [performanceRows, rankingRows, categoryRows, supplierRows] = await Promise.all([
            performanceService.list(),
            rankingService.list(),
            categoryService.list(),
            supplierService.list(),
        ])
        performances.value = performanceRows
        rankings.value = rankingRows
        categories.value = categoryRows
        suppliers.value = supplierRows
    } finally {
        loading.value = false
    }
}
const reset = () => {
    keyword.value = ''
    year.value = undefined
    month.value = undefined
    categoryId.value = ''
    qualityLevel.value = ''
    currentPage.value = 1
}
const openUpload = () => {
    file.value = undefined
    uploadRef.value?.clearFiles()
    uploadVisible.value = true
}
const handleUploadExceed: UploadProps['onExceed'] = (files) => {
    uploadRef.value?.clearFiles()
    const raw = files[0] as UploadRawFile
    raw.uid = genFileId()
    uploadRef.value?.handleStart(raw)
}
const submitUpload = async () => {
    if (!file.value?.raw) return ElMessage.warning('请选择绩效 Excel')
    saving.value = true
    try {
        importResult.value = await supplierActionsApi.uploadPerformance(file.value.raw, uploadForm.year, uploadForm.month)
        uploadVisible.value = false
        resultVisible.value = true
        await load()
    } finally {
        saving.value = false
    }
}
const generateRanking = async () => {
    const targetYear = year.value || 2026
    const targetMonth = month.value || 7
    loading.value = true
    try {
        const result = await supplierActionsApi.generateRankingSnapshot(targetYear, targetMonth)
        ElMessage.success(result.message || `${targetYear} 年 ${targetMonth} 月排名快照已生成`)
        await load()
    } finally {
        loading.value = false
    }
}
const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob(['供应商名称,年份,月份,得分'], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = '供应商绩效模板.csv'
    a.click()
    URL.revokeObjectURL(url)
}
watch(activeTab, reset)
watch([keyword, year, month, categoryId, qualityLevel], () => {
    currentPage.value = 1
})
onMounted(load)
</script>

<style scoped>
.trend-up {
    color: #067647;
    font-weight: 600;
}
.trend-down {
    color: #b42318;
    font-weight: 600;
}
.quality {
    display: inline-flex;
    padding: 2px 9px;
    border-radius: 999px;
    font-size: 12px;
}
.quality[data-level='优质'] {
    background: #ecfdf3;
    color: #067647;
}
.quality[data-level='普通'] {
    background: #f1f1f3;
    color: #6e6e73;
}
.rank {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    min-width: 74px;
    padding: 3px 8px;
    border-radius: 999px;
    background: #f5f5f7;
    color: #555;
    font-weight: 650;
    line-height: 20px;
    white-space: nowrap;
}
.rank[data-rank='1'] {
    border: 1px solid #f4d58a;
    background: #fff8e8;
    color: #9a6700;
}
.rank[data-rank='2'] {
    border: 1px solid #d8d8dc;
    background: #f5f5f7;
    color: #5f6368;
}
.rank[data-rank='3'] {
    border: 1px solid #e2c0a8;
    background: #fbf1ea;
    color: #8a4b23;
}
.rank__medal {
    flex: none;
    font-size: 14px;
    line-height: 1;
}
.period-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}
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
.import-summary {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 18px;
}
.import-summary > div {
    display: flex;
    flex-direction: column;
    padding: 16px;
    border-radius: 10px;
    background: #fafafc;
}
.import-summary strong {
    font-size: 24px;
}
.import-summary span {
    color: #7a7a7a;
    font-size: 12px;
}
.import-summary .success strong {
    color: #067647;
}
.import-summary .failed strong {
    color: #b42318;
}
@media (max-width: 600px) {
    .period-grid {
        grid-template-columns: 1fr;
    }
}
</style>
