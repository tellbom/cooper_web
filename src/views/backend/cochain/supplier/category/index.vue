<template>
    <section class="figma-page category-supplier-page">
        <header class="figma-page__header category-page-header">
            <div>
                <p class="figma-page__eyebrow">品类视图</p>
                <h1>品类供应商明细</h1>
                <p class="figma-page__description">从三级品类主数据视角出发，查看各品类下具备承制能力的供应商列表、质量等级及排名绩效。</p>
            </div>
        </header>

        <div class="category-workspace">
            <aside class="category-nav-card" aria-label="三级品类列表">
                <div class="category-nav-card__header">
                    <el-icon aria-hidden="true"><Collection /></el-icon>
                    <h2>三级品类列表</h2>
                </div>

                <div class="category-nav-search" role="search">
                    <el-input
                        v-model="categoryKeyword"
                        clearable
                        placeholder="搜索三级品类名称"
                        aria-label="搜索三级品类名称"
                        @keyup.enter="applyCategorySearch"
                        @clear="applyCategorySearch"
                    >
                        <template #prefix><el-icon><Search /></el-icon></template>
                    </el-input>
                    <el-button type="primary" aria-label="查询三级品类" @click="applyCategorySearch">查询</el-button>
                </div>

                <el-scrollbar class="category-nav-scrollbar" max-height="830px" always>
                    <div class="category-nav-list" v-loading="loading">
                        <button
                            v-for="item in filteredCategories"
                            :key="item.id"
                            class="category-nav-item"
                            :class="{ 'is-active': selectedCategory?.id === item.id }"
                            type="button"
                            :aria-pressed="selectedCategory?.id === item.id"
                            @click="selectCategory(item)"
                        >
                            <span class="category-nav-item__copy">
                                <strong>
                                    <el-icon aria-hidden="true"><PriceTag /></el-icon>
                                    {{ item.categoryName }}
                                </strong>
                                <small>{{ item.materialType }} · {{ item.partType }}</small>
                            </span>
                            <span class="category-nav-item__count">{{ supplierCount(item.id) }} 供方</span>
                        </button>

                        <el-empty
                            v-if="!loading && filteredCategories.length === 0"
                            :description="appliedCategoryKeyword ? '未找到匹配的三级品类' : '暂无三级品类'"
                            :image-size="72"
                        />
                    </div>
                </el-scrollbar>
            </aside>

            <main class="category-content">
                <template v-if="selectedCategory">
                    <article class="category-overview-card">
                        <div class="category-overview-card__heading">
                            <div>
                                <div class="category-title-row">
                                    <h2>{{ selectedCategory.categoryName }}</h2>
                                    <span class="part-type-badge">{{ selectedCategory.partType }}</span>
                                </div>
                                <p>品类ID: {{ selectedCategory.id }}</p>
                            </div>
                        </div>

                        <dl class="category-properties">
                            <div>
                                <dt>材料类型</dt>
                                <dd>{{ selectedCategory.materialType }}</dd>
                            </div>
                            <div>
                                <dt>尺寸判断逻辑</dt>
                                <dd class="mono-value">{{ selectedCategory.sizeLogic }}</dd>
                            </div>
                            <div>
                                <dt>长度规格区间</dt>
                                <dd class="mono-value">{{ selectedCategory.lengthMin }} ~ {{ selectedCategory.lengthMax }} mm</dd>
                            </div>
                            <div>
                                <dt>宽度规格区间</dt>
                                <dd class="mono-value">{{ selectedCategory.widthMin }} ~ {{ selectedCategory.widthMax }} mm</dd>
                            </div>
                        </dl>
                    </article>

                    <article class="supplier-ranking-card">
                        <div class="supplier-query-bar" role="search">
                            <el-input
                                v-model="keyword"
                                clearable
                                placeholder="搜索当前品类下的供应商名称"
                                aria-label="搜索当前品类下的供应商名称"
                                @keyup.enter="applySearch"
                                @clear="applySearch"
                            >
                                <template #prefix
                                    ><el-icon><Search /></el-icon
                                ></template>
                            </el-input>
                            <el-button type="primary" class="supplier-query-button" @click="applySearch">查询</el-button>
                            <el-button class="supplier-reset-button" @click="resetSearch">
                                <el-icon><RefreshRight /></el-icon>重置
                            </el-button>
                        </div>

                        <el-table
                            v-loading="loading"
                            :data="filteredSupplierRows"
                            row-key="id"
                            max-height="700px"
                            scrollbar-always-on
                            class="supplier-ranking-table"
                            empty-text="当前品类暂无符合条件的供应商"
                        >
                            <el-table-column label="供应商名称" min-width="190">
                                <template #default="{ row }">
                                    <span class="supplier-name"
                                        ><el-icon aria-hidden="true"><OfficeBuilding /></el-icon><strong>{{ row.supplierName }}</strong></span
                                    >
                                </template>
                            </el-table-column>
                            <el-table-column label="合作状态" width="104" align="center">
                                <template #default="{ row }">
                                    <span class="cooperation-badge" :class="row.enabled ? 'is-enabled' : 'is-disabled'"
                                        ><i aria-hidden="true"></i>{{ row.enabled ? '启用' : '停用' }}</span
                                    >
                                </template>
                            </el-table-column>
                            <el-table-column label="质量等级" width="104" align="center">
                                <template #default="{ row }">
                                    <span class="quality-badge" :class="row.qualityLevel === '优质' ? 'is-premium' : 'is-standard'"
                                        ><el-icon aria-hidden="true"><Medal /></el-icon>{{ row.qualityLevel }}</span
                                    >
                                </template>
                            </el-table-column>
                            <el-table-column label="品类内排名" width="110" align="center">
                                <template #default="{ row }">
                                    <span v-if="row.rankInCategory" class="category-rank">第 {{ row.rankInCategory }} 名</span
                                    ><span v-else class="empty-value">暂无排名</span>
                                </template>
                            </el-table-column>
                            <el-table-column label="综合绩效得分" width="126" align="right">
                                <template #default="{ row }"
                                    ><strong class="performance-score">{{ formatScore(row.comprehensiveScore) }}</strong></template
                                >
                            </el-table-column>
                            <el-table-column prop="remark" label="备注信息" min-width="150" show-overflow-tooltip>
                                <template #default="{ row }"
                                    ><span class="supplier-remark">{{ row.remark || '—' }}</span></template
                                >
                            </el-table-column>
                        </el-table>
                    </article>
                </template>

                <div v-else class="category-empty-card"><el-empty description="请选择左侧三级品类" /></div>
            </main>
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Collection, Medal, OfficeBuilding, PriceTag, RefreshRight, Search } from '@element-plus/icons-vue'
import type { CategoryMasterVO, RankingSnapshotVO, SupplierCategoryVO, SupplierVO } from '/@/features/cochain/contracts'
import { getResourceService } from '/@/features/cochain/services'

interface CategorySupplierRow {
    id: string
    supplierName: string
    enabled: boolean
    qualityLevel: string
    comprehensiveScore?: number
    rankInCategory?: number
    remark: string
}

const categoryService = getResourceService('categories')
const associationService = getResourceService('supplierCategories')
const supplierService = getResourceService('suppliers')
const rankingService = getResourceService('rankingSnapshots')
const categories = ref<CategoryMasterVO[]>([])
const associations = ref<SupplierCategoryVO[]>([])
const suppliers = ref<SupplierVO[]>([])
const rankings = ref<RankingSnapshotVO[]>([])
const selectedCategory = ref<CategoryMasterVO>()
const categoryKeyword = ref('')
const appliedCategoryKeyword = ref('')
const keyword = ref('')
const appliedKeyword = ref('')
const loading = ref(false)

const filteredCategories = computed(() => {
    const query = appliedCategoryKeyword.value.trim().toLocaleLowerCase()
    if (!query) return categories.value
    return categories.value.filter((item) => item.categoryName.toLocaleLowerCase().includes(query))
})

const selectedSupplierRows = computed<CategorySupplierRow[]>(() => {
    if (!selectedCategory.value) return []
    return associations.value
        .filter((association) => association.categoryId === selectedCategory.value?.id)
        .map((association) => {
            const supplier = suppliers.value.find((item) => item.id === association.supplierId)
            const ranking = rankings.value.find(
                (item) => item.supplierId === association.supplierId && item.categoryId === selectedCategory.value?.id
            )
            return {
                id: association.id,
                supplierName: supplier?.supplierName || '未知供应商',
                enabled: supplier?.enabled === 1,
                qualityLevel: ranking?.qualityLevel || '普通',
                comprehensiveScore: ranking?.comprehensiveScore,
                rankInCategory: ranking?.rankInCategory,
                remark: supplier?.remark || '',
            }
        })
        .sort((left, right) => (left.rankInCategory ?? Number.MAX_SAFE_INTEGER) - (right.rankInCategory ?? Number.MAX_SAFE_INTEGER))
})

const filteredSupplierRows = computed(() => {
    const query = appliedKeyword.value.trim().toLocaleLowerCase()
    if (!query) return selectedSupplierRows.value
    return selectedSupplierRows.value.filter((item) => item.supplierName.toLocaleLowerCase().includes(query))
})

const supplierCount = (categoryId: string) => associations.value.filter((item) => item.categoryId === categoryId).length
const applyCategorySearch = () => {
    appliedCategoryKeyword.value = categoryKeyword.value
}
const selectCategory = (category: CategoryMasterVO) => {
    selectedCategory.value = category
    resetSearch()
}
const applySearch = () => {
    appliedKeyword.value = keyword.value
}
const resetSearch = () => {
    keyword.value = ''
    appliedKeyword.value = ''
}
const formatScore = (score?: number) => (typeof score === 'number' ? score.toFixed(1) : '—')

onMounted(async () => {
    loading.value = true
    try {
        const [categoryRows, associationRows, supplierRows, rankingRows] = await Promise.all([
            categoryService.list(),
            associationService.list(),
            supplierService.list(),
            rankingService.list(),
        ])
        categories.value = categoryRows
        associations.value = associationRows
        suppliers.value = supplierRows
        rankings.value = rankingRows
        selectedCategory.value = categoryRows[0]
    } finally {
        loading.value = false
    }
})
</script>

<style scoped>
.category-supplier-page {
    --category-blue: #0066cc;
    --category-ink: #1d1d1f;
    --category-secondary: #6e6e73;
    --category-fill: #f5f5f7;
    gap: 24px;
}

.category-page-header h1 {
    font-size: clamp(26px, 2vw, 32px);
    font-weight: 650;
    line-height: 1.2;
    letter-spacing: -0.035em;
}
.category-page-header .figma-page__eyebrow {
    margin-bottom: 6px;
    font-size: 13px;
}
.category-page-header .figma-page__description {
    max-width: 780px;
    margin-top: 8px;
    font-size: 14px;
    line-height: 1.6;
}

.category-workspace {
    display: grid;
    grid-template-columns: 344px minmax(0, 1fr);
    gap: 24px;
    align-items: start;
}
.category-nav-card,
.category-overview-card,
.supplier-ranking-card,
.category-empty-card {
    border: 1px solid rgba(29, 29, 31, 0.12);
    border-radius: 18px;
    background: #fff;
}
.category-nav-card {
    min-height: 540px;
    padding: 14px;
}
.category-nav-card__header {
    display: flex;
    align-items: center;
    gap: 9px;
    min-height: 46px;
    padding: 0 12px 10px;
    border-bottom: 1px solid #ececef;
}
.category-nav-card__header .el-icon {
    color: var(--category-blue);
    font-size: 18px;
}
.category-nav-card__header h2 {
    margin: 0;
    color: var(--category-ink);
    font-size: 15px;
    font-weight: 650;
    letter-spacing: -0.01em;
}
.category-nav-search {
    display: flex;
    gap: 8px;
    padding: 12px 0 5px;
}
.category-nav-search .el-input {
    min-width: 0;
}
.category-supplier-page :deep(.category-nav-search .el-input__wrapper) {
    min-height: 40px;
    border-radius: 10px;
    box-shadow: 0 0 0 1px #d2d2d7 inset;
}
.category-supplier-page :deep(.category-nav-search .el-input__wrapper.is-focus) {
    box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.32) inset;
}
.category-supplier-page :deep(.category-nav-search .el-button) {
    min-height: 40px;
    padding-inline: 16px;
    border-radius: 10px;
}
.category-nav-scrollbar {
    margin-top: 12px;
}
.category-nav-list {
    display: grid;
    gap: 7px;
    padding-right: 8px;
}

.category-nav-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    min-height: 70px;
    padding: 13px 14px;
    border: 0;
    border-radius: 13px;
    background: transparent;
    color: var(--category-ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
    transition:
        color 160ms ease,
        background-color 160ms ease,
        box-shadow 160ms ease;
}
.category-nav-item:hover:not(.is-active) {
    background: var(--category-fill);
}
.category-nav-item:focus-visible {
    outline: 3px solid rgba(0, 102, 204, 0.25);
    outline-offset: 2px;
}
.category-nav-item.is-active {
    background: linear-gradient(135deg, #0879df 0%, #0066cc 100%);
    color: #fff;
    box-shadow: 0 8px 22px rgba(0, 102, 204, 0.22);
}
.category-nav-item__copy {
    min-width: 0;
}
.category-nav-item__copy strong {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    font-size: 14px;
    font-weight: 620;
}
.category-nav-item__copy strong .el-icon {
    flex: none;
    color: #86868b;
    font-size: 16px;
}
.category-nav-item__copy small {
    display: block;
    margin-top: 5px;
    color: #86868b;
    font-size: 12px;
}
.category-nav-item__count {
    flex: none;
    padding: 4px 10px;
    border-radius: 999px;
    background: #e8f2fc;
    color: var(--category-blue);
    font-size: 12px;
    font-weight: 650;
    white-space: nowrap;
}
.category-nav-item.is-active .category-nav-item__copy strong .el-icon,
.category-nav-item.is-active .category-nav-item__copy small {
    color: rgba(255, 255, 255, 0.78);
}
.category-nav-item.is-active .category-nav-item__count {
    background: rgba(255, 255, 255, 0.18);
    color: #fff;
}

.category-content {
    display: grid;
    gap: 20px;
    min-width: 0;
}
.category-overview-card {
    position: relative;
    overflow: hidden;
    padding: 24px 26px;
}
.category-overview-card::before {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 6px;
    background: var(--category-blue);
    content: '';
}
.category-overview-card__heading {
    margin-bottom: 20px;
}
.category-title-row {
    display: flex;
    align-items: center;
    gap: 10px;
}
.category-title-row h2 {
    margin: 0;
    color: var(--category-ink);
    font-size: 18px;
    font-weight: 650;
    letter-spacing: -0.02em;
}
.part-type-badge {
    padding: 3px 10px;
    border-radius: 999px;
    background: #e8f2fc;
    color: var(--category-blue);
    font-size: 12px;
    font-weight: 550;
}
.category-overview-card__heading p {
    margin: 5px 0 0;
    color: var(--category-secondary);
    font-size: 12px;
}
.category-properties {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 20px;
    margin: 0;
    padding: 18px 20px;
    border-radius: 14px;
    background: var(--category-fill);
}
.category-properties dt {
    margin-bottom: 4px;
    color: #86868b;
    font-size: 12px;
}
.category-properties dd {
    margin: 0;
    color: var(--category-ink);
    font-size: 13px;
    font-weight: 620;
}
.mono-value,
.category-rank,
.performance-score {
    font-variant-numeric: tabular-nums;
}
.mono-value {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.supplier-ranking-card {
    overflow: hidden;
}
.supplier-query-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 82px;
    padding: 16px 20px;
    border-bottom: 1px solid #ececef;
}
.supplier-query-bar .el-input {
    width: min(360px, 100%);
}
.category-supplier-page :deep(.supplier-query-bar .el-input__wrapper) {
    min-height: 42px;
    padding-inline: 14px;
    border-radius: 11px;
    box-shadow: 0 0 0 1px #d2d2d7 inset;
}
.category-supplier-page :deep(.supplier-query-bar .el-input__wrapper.is-focus) {
    box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.32) inset;
}
.category-supplier-page :deep(.supplier-query-bar .el-button) {
    min-height: 42px;
    padding-inline: 20px;
    border-radius: 11px;
}
.category-supplier-page :deep(.supplier-query-bar .supplier-query-button) {
    min-width: 82px;
    border-radius: 999px;
    box-shadow: none;
}
.supplier-reset-button .el-icon {
    margin-right: 5px;
}

.category-supplier-page :deep(.supplier-ranking-table) {
    --el-table-border-color: #ececef;
    --el-table-header-bg-color: #fafafa;
    --el-table-row-hover-bg-color: #f8f8fa;
}
.category-supplier-page :deep(.supplier-ranking-table th.el-table__cell) {
    height: 52px;
    color: #6e6e73;
    font-size: 12px;
    font-weight: 620;
}
.category-supplier-page :deep(.supplier-ranking-table td.el-table__cell) {
    height: 72px;
}
.supplier-name {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: var(--category-ink);
}
.supplier-name .el-icon {
    flex: none;
    color: var(--category-blue);
    font-size: 17px;
}
.supplier-name strong {
    font-size: 13px;
    font-weight: 620;
}
.cooperation-badge,
.quality-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 27px;
    padding: 2px 9px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 560;
    white-space: nowrap;
}
.cooperation-badge i {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
}
.cooperation-badge.is-enabled {
    border: 1px solid #a6e5ba;
    background: #f0fbf3;
    color: #159447;
}
.cooperation-badge.is-disabled {
    border: 1px solid #f5beb8;
    background: #fff4f3;
    color: #c43f36;
}
.quality-badge .el-icon {
    font-size: 14px;
}
.quality-badge.is-premium {
    border: 1px solid #ffd49a;
    background: #fff7e8;
    color: #d97706;
}
.quality-badge.is-standard {
    background: #f1f1f3;
    color: #6e6e73;
}
.category-rank {
    color: var(--category-blue);
    font-size: 13px;
    font-weight: 680;
}
.performance-score {
    color: var(--category-ink);
    font-size: 14px;
    font-weight: 680;
}
.supplier-remark,
.empty-value {
    color: #6e6e73;
}
.category-empty-card {
    display: grid;
    min-height: 560px;
    place-items: center;
}

@media (max-width: 1180px) {
    .category-workspace {
        grid-template-columns: 290px minmax(0, 1fr);
        gap: 18px;
    }
    .category-properties {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 900px) {
    .category-workspace {
        grid-template-columns: 1fr;
    }
    .category-nav-card {
        min-height: auto;
    }
    .category-nav-list {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 640px) {
    .category-supplier-page {
        gap: 18px;
    }
    .category-page-header h1 {
        font-size: 26px;
    }
    .category-nav-list,
    .category-properties {
        grid-template-columns: 1fr;
    }
    .category-overview-card {
        padding: 20px;
    }
    .supplier-query-bar {
        align-items: stretch;
        flex-wrap: wrap;
    }
    .supplier-query-bar .el-input {
        width: 100%;
    }
}

@media (prefers-reduced-motion: reduce) {
    .category-nav-item {
        transition: none;
    }
}
</style>
