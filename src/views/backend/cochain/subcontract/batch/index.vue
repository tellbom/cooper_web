<template>
    <section class="figma-page">
        <template v-if="!activeBatch">
            <header class="figma-page__header">
                <div>
                    <p class="figma-page__eyebrow">分包中心</p>
                    <h1>分包批次列表</h1>
                    <p class="figma-page__description">管理所有分包批次；支持上传 Excel 或从全流程系统抓取数据，上传成功后进入批次工作台完成分包。</p>
                </div>
                <div class="figma-page__actions batch-list-actions">
                    <el-button v-auth="'fetch'" plain type="primary" @click="fetchVisible = true"
                        ><el-icon><Cloudy /></el-icon>从全流程系统抓取</el-button
                    >
                    <el-button v-auth="'upload'" type="primary" @click="openUpload"
                        ><el-icon><Upload /></el-icon>上传 Excel</el-button
                    >
                </div>
            </header>
            <div class="figma-card">
                <form class="figma-search" role="search" @submit.prevent="loadBatches">
                    <el-input v-model="query.batchNo" class="batch-keyword" clearable placeholder="搜索批次编号"
                        ><template #prefix
                            ><el-icon><Search /></el-icon></template
                    ></el-input>
                    <el-input v-model="query.flowNo" class="batch-keyword" clearable placeholder="搜索流程编号" />
                    <el-select v-model="query.batchStatus" class="batch-status-select" clearable placeholder="全部状态"
                        ><el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value"
                    /></el-select>
                    <el-input v-model="query.operator" clearable placeholder="操作人" class="operator-input" />
                    <el-button native-type="submit" class="figma-query-button" type="primary">查询</el-button>
                    <el-button @click="resetQuery"
                        ><el-icon><Refresh /></el-icon>重置</el-button
                    >
                </form>
                <el-table v-loading="loading" :data="batches" row-key="id" table-layout="auto">
                    <el-table-column label="批次编号" min-width="170"
                        ><template #default="{ row }"
                            ><span class="batch-number">{{ row.batchNo }}</span></template
                        ></el-table-column
                    >
                    <el-table-column label="流程编号" min-width="128"
                        ><template #default="{ row }"
                            ><span class="flow-number">{{ row.flowNo || '—' }}</span></template
                        ></el-table-column
                    >
                    <el-table-column label="状态" min-width="112"
                        ><template #default="{ row }"
                            ><span class="figma-status" :data-status="row.batchStatus">{{ statusLabel(row.batchStatus) }}</span></template
                        ></el-table-column
                    >
                    <el-table-column label="上传文件" min-width="238" show-overflow-tooltip
                        ><template #default="{ row }"
                            ><span class="upload-file"
                                ><el-icon><Document /></el-icon>{{ row.uploadFileName || '—' }}</span
                            ></template
                        ></el-table-column
                    >
                    <el-table-column label="零件数" width="86" align="center"
                        ><template #default="{ row }"
                            ><strong class="table-count">{{ row.totalPartCount }}</strong></template
                        ></el-table-column
                    >
                    <el-table-column label="工作包数" width="92" align="center"
                        ><template #default="{ row }"
                            ><strong class="table-count">{{ row.totalPackageCount }}</strong></template
                        ></el-table-column
                    >
                    <el-table-column label="操作人" width="92"
                        ><template #default="{ row }"
                            ><span class="operator-name">{{ row.operator }}</span></template
                        ></el-table-column
                    >
                    <el-table-column label="操作" width="176" fixed="right" align="right"
                        ><template #default="{ row }"
                            ><el-button link type="primary" @click="enterWorkbench(row)"
                                >进入工作台 <el-icon><ArrowRight /></el-icon></el-button
                            ><el-button v-auth="'delete'" link type="danger" @click="removeBatch(row)">删除</el-button></template
                        ></el-table-column
                    >
                    <template #empty><div class="empty-copy">暂无批次数据</div></template>
                </el-table>
                <footer class="figma-pagination">
                    <span>共 {{ total }} 条</span><span>{{ query.pageSize }} 条/页</span
                    ><el-pagination
                        v-model:current-page="query.pageNo"
                        :page-size="query.pageSize"
                        :total="total"
                        layout="prev, pager, next"
                        @current-change="loadBatches"
                    />
                </footer>
            </div>
        </template>

        <template v-else>
            <div v-loading="workbenchLoading" class="batch-workbench">
                <header class="workbench-topbar">
                    <button class="back-button" type="button" @click="leaveWorkbench">
                        <el-icon><ArrowLeft /></el-icon>返回批次列表
                    </button>
                    <div class="batch-summary-row">
                        <div class="batch-summary-primary">
                            <span>批次编号</span><strong>{{ activeBatch.batchNo }}</strong>
                        </div>
                        <i class="summary-divider" aria-hidden="true"></i>
                        <span class="figma-status workbench-status" :data-status="activeBatch.batchStatus">{{
                            statusLabel(activeBatch.batchStatus)
                        }}</span>
                        <template v-if="activeBatch.flowNo">
                            <i class="summary-divider" aria-hidden="true"></i>
                            <div class="batch-summary-primary">
                                <span>流程编号</span><strong class="flow-id">{{ activeBatch.flowNo }}</strong>
                            </div>
                        </template>
                        <i class="summary-divider" aria-hidden="true"></i>
                        <div class="batch-facts">
                            <span
                                >零件：<strong>{{ activeBatch.totalPartCount }}</strong></span
                            ><span
                                >工作包：<strong>{{ packages.length }}</strong></span
                            ><span
                                >操作人：<b>{{ activeBatch.operator }}</b></span
                            >
                        </div>
                        <div class="workbench-actions">
                            <el-button v-if="canPackage" v-auth="'package'" :disabled="advancing" :loading="advancing" @click="handlePackage">生成工作包</el-button>
                            <el-button v-if="canRecommend" v-auth="'recommend'" :disabled="advancing" :loading="advancing" @click="handleRecommend">生成供应商推荐</el-button>
                            <el-button v-auth="'run'" :disabled="!canRun || advancing" :loading="advancing" @click="handleRun"
                                ><el-icon><Lightning /></el-icon>一键编排</el-button
                            >
                            <el-button
                                v-auth="'export-result'"
                                :disabled="!['RECOMMENDED', 'PARTIAL', 'COMPLETED'].includes(activeBatch.batchStatus)"
                                :loading="exporting"
                                @click="exportResult"
                                ><el-icon><Download /></el-icon>导出 Excel</el-button
                            >
                        </div>
                    </div>
                </header>

                <div v-if="warningBanner" class="package-lock-notice batch-warning-banner">
                    <el-icon><WarningFilled /></el-icon>
                    <div>
                        <strong>{{ activeBatch.batchStatus === 'PARTIAL' ? '推荐不完整' : '存在数量缺口提示' }}</strong>
                        <p>{{ warningBanner.message }}</p>
                        <ul v-if="warningBanner.warnings.length">
                            <li v-for="item in warningBanner.warnings" :key="item.packageId">
                                {{ item.packageNo }}：需 {{ item.requiredCount }} 家，现有 {{ item.availableCount }} 家，缺口 {{ item.shortageCount }} 家
                            </li>
                        </ul>
                    </div>
                </div>

                <div v-if="packages.length" class="workbench-layout">
                    <aside class="package-sidebar">
                        <div class="package-sidebar__title">工作包列表 ({{ packages.length }})</div>
                        <div class="package-sidebar__search">
                            <el-input v-model="packageSearchKeyword" clearable placeholder="搜索工作包编号 / 品类" size="small"
                                ><template #prefix><el-icon><Search /></el-icon></template></el-input
                            >
                        </div>
                        <div class="package-list">
                            <button
                                v-for="item in filteredPackages"
                                :key="item.id"
                                class="package-card"
                                :class="{ 'is-active': selectedPackage?.id === item.id }"
                                type="button"
                                @click="selectPackage(item)"
                            >
                                <span class="package-card__top"
                                    ><strong>{{ item.packageNo }}</strong
                                    ><em v-if="item.recommendationStatus" :data-recommend-status="item.recommendationStatus">{{
                                        recommendStatusLabel(item.recommendationStatus)
                                    }}</em>
                                </span>
                                <span class="package-card__category">{{ categoryName(item.categoryId) }}</span>
                                <span class="package-card__meta"
                                    >零件 {{ item.partCount }}<i>·</i>{{ item.partType }}<b v-if="item.isSpecialCategory">特殊品类</b></span
                                >
                            </button>
                            <div v-if="!filteredPackages.length" class="empty-copy">未找到匹配的工作包</div>
                        </div>
                    </aside>

                    <main v-if="selectedPackage" class="package-workspace">
                        <section class="package-overview">
                            <div class="package-overview__title">
                                <strong>{{ selectedPackage.packageNo }}</strong
                                ><span>{{ categoryName(selectedPackage.categoryId) }}</span
                                ><em v-if="selectedPackage.hasHistorySupplier">有历史供应商</em
                                ><em v-if="selectedPackage.isSpecialCategory" class="is-special">特殊品类 · {{ selectedPackage.specialType }}</em>
                            </div>
                            <dl class="package-overview__facts">
                                <div>
                                    <dt>零件类型</dt>
                                    <dd>{{ selectedPackage.partType }}</dd>
                                </div>
                                <div>
                                    <dt>零件数量</dt>
                                    <dd>{{ selectedPackage.partCount }} / {{ selectedPackage.maxPartLimit }}（容量上限）</dd>
                                </div>
                                <div>
                                    <dt>供应商需求数</dt>
                                    <dd>{{ selectedPackage.supplierCountNeeded }}</dd>
                                </div>
                                <div>
                                    <dt>应推荐供应商数</dt>
                                    <dd>{{ selectedPackage.recommendCount }}</dd>
                                </div>
                            </dl>
                        </section>

                        <div class="package-detail-tabs">
                            <nav aria-label="工作包详情">
                                <button :class="{ 'is-active': detailTab === 'parts' }" type="button" @click="detailTab = 'parts'">
                                    零件明细 ({{ selectedPackage.partCount }})</button
                                ><button
                                    :class="{ 'is-active': detailTab === 'recommendations' }"
                                    type="button"
                                    @click="detailTab = 'recommendations'"
                                >
                                    推荐结果 ({{ packageRecommendations.length }})
                                </button>
                            </nav>
                            <div v-if="detailTab === 'recommendations' && ['RECOMMENDED', 'PARTIAL'].includes(activeBatch.batchStatus)" class="manual-add">
                                <span>手动添加</span
                                ><el-select v-model="manualSupplierId" filterable placeholder="选择供应商…"
                                    ><el-option
                                        v-for="item in availableManualSuppliers"
                                        :key="item.id"
                                        :label="item.supplierName"
                                        :value="item.id" /></el-select
                                ><el-button type="primary" :disabled="!manualSupplierId" @click="addManualSupplier"
                                    ><el-icon><Plus /></el-icon>添加</el-button
                                >
                            </div>
                        </div>

                        <template v-if="detailTab === 'parts'">
                            <div v-if="lockedBatch" class="package-lock-notice">
                                <el-icon><Switch /></el-icon>批次已处于【{{ statusLabel(activeBatch.batchStatus) }}】状态，不允许执行移包操作。
                            </div>
                            <div v-else-if="selectedParts.length" class="batch-move-banner">
                                <span>已选 {{ selectedParts.length }} 个零件</span>
                                <el-button type="primary" round size="small" @click="openBatchMove"
                                    ><el-icon><Switch /></el-icon>批量移动</el-button
                                ><el-button text size="small" @click="clearPartSelection">取消选择</el-button>
                            </div>
                            <section class="workbench-table-card">
                                <el-skeleton v-if="packageDetailLoading" :rows="6" animated class="detail-skeleton" />
                                <template v-else>
                                    <el-table ref="partsTableRef" :data="packageParts" row-key="id" @selection-change="handlePartSelectionChange">
                                        <el-table-column v-if="!lockedBatch" type="selection" width="42" align="center" />
                                        <el-table-column prop="seqNo" label="序号" width="54" align="center" />
                                        <el-table-column label="零件图号" min-width="135"
                                            ><template #default="{ row }"
                                                ><span class="part-drawing-no">{{ row.partDrawingNo }}</span></template
                                            ></el-table-column
                                        >
                                        <el-table-column label="零件名称" min-width="120"
                                            ><template #default="{ row }"
                                                ><strong class="part-name">{{ row.partName }}</strong></template
                                            ></el-table-column
                                        >
                                        <el-table-column prop="materialType" label="材料类型" width="90" />
                                        <el-table-column label="尺寸（长×宽）" width="120"
                                            ><template #default="{ row }"
                                                ><span class="part-size">{{ row.lengthValue }} × {{ row.widthValue }} mm</span></template
                                            ></el-table-column
                                        >
                                        <el-table-column label="套裁信息" width="100"
                                            ><template #default="{ row }"
                                                ><span v-if="row.nestingInfo" class="nesting-tag">{{ row.nestingInfo }}</span
                                                ><span v-else class="empty-value">—</span></template
                                            ></el-table-column
                                        >
                                        <el-table-column label="历史供应商" min-width="140" show-overflow-tooltip
                                            ><template #default="{ row }"
                                                ><span class="history-suppliers">{{
                                                    [row.historySupplier1, row.historySupplier2, row.historySupplier3].filter(Boolean).join('、') || '—'
                                                }}</span></template
                                            ></el-table-column
                                        >
                                        <el-table-column label="操作" width="136" align="center"
                                            ><template #default="{ row }"
                                                ><div class="part-row-actions"
                                                    ><el-button link type="primary" @click="showPart(row)"
                                                        ><el-icon><InfoFilled /></el-icon>详情</el-button
                                                    ><el-button v-if="!lockedBatch" link type="primary" @click="openMove(row)"
                                                        >移动</el-button
                                                    ></div
                                                ></template
                                            ></el-table-column
                                        >
                                        <template #empty><div class="empty-copy">当前工作包暂无零件数据</div></template>
                                    </el-table>
                                    <footer class="workbench-table-footer">
                                        <span>共 {{ packageParts.length }} 条</span><span>8 条/页</span
                                        ><el-pagination :total="packageParts.length" :page-size="8" layout="prev, pager, next" />
                                    </footer>
                                </template>
                            </section>
                        </template>

                        <section v-else class="workbench-table-card recommendation-table-card">
                            <el-skeleton v-if="packageDetailLoading" :rows="6" animated class="detail-skeleton" />
                            <template v-else>
                                <el-table :data="packageRecommendations" row-key="id">
                                    <el-table-column label="推荐顺序" width="130" align="center"
                                        ><template #default="{ row }"
                                            ><span class="recommend-order" :class="{ 'is-leading': row.recommendOrder <= 2 }">{{
                                                row.recommendOrder
                                            }}</span></template
                                        ></el-table-column
                                    >
                                    <el-table-column label="供应商名称" min-width="220"
                                        ><template #default="{ row }"
                                            ><strong class="recommend-supplier">{{ row.supplierName }}</strong></template
                                        ></el-table-column
                                    >
                                    <el-table-column label="推荐来源" min-width="150"
                                        ><template #default="{ row }"
                                            ><span class="recommend-source" :data-source="row.recommendSource">{{
                                                sourceLabel(row.recommendSource)
                                            }}</span></template
                                        ></el-table-column
                                    >
                                    <el-table-column label="质量等级" width="120" align="center"
                                        ><template #default="{ row }"
                                            ><strong class="recommend-quality" :data-level="row.qualityLevel">{{ row.qualityLevel || '—' }}</strong></template
                                        ></el-table-column
                                    >
                                    <el-table-column label="绩效得分" width="130" align="right"
                                        ><template #default="{ row }"
                                            ><strong class="recommend-score">{{ row.performanceScore != null ? row.performanceScore.toFixed(1) : '—' }}</strong></template
                                        ></el-table-column
                                    >
                                    <el-table-column label="操作" width="92" align="center"><template #default>—</template></el-table-column>
                                    <template #empty><div class="empty-copy">暂无推荐结果</div></template>
                                </el-table>
                                <footer class="workbench-table-footer">
                                    <span>共 {{ packageRecommendations.length }} 条</span><span>8 条/页</span
                                    ><el-pagination :total="packageRecommendations.length" :page-size="8" layout="prev, pager, next" />
                                </footer>
                            </template>
                        </section>
                    </main>

                    <div v-else class="workbench-empty">请选择左侧工作包</div>
                </div>
                <div v-else class="workbench-empty no-packages">
                    <el-icon class="workbench-empty__icon"><Box /></el-icon>
                    <p>{{ activeBatch.batchStatus === 'DATA_READY' ? '点击【生成工作包】开始分包' : '暂无工作包数据' }}</p>
                    <el-button v-if="canPackage" v-auth="'package'" type="primary" round :loading="advancing" @click="handlePackage"
                        ><el-icon><Box /></el-icon>生成工作包</el-button
                    >
                </div>
            </div>
        </template>

        <el-dialog v-model="uploadVisible" title="上传分包 Excel" width="min(480px, 94vw)" class="upload-modal"
            ><el-form label-position="top"
                ><el-form-item label="选择文件"
                    ><el-upload
                        ref="uploadRef"
                        drag
                        class="upload-dropzone"
                        :show-file-list="false"
                        :auto-upload="false"
                        :limit="1"
                        accept=".xlsx,.xls"
                        :on-change="(file) => (uploadFile = file)"
                        :on-exceed="handleUploadExceed"
                        ><div class="upload-dropzone__icon"><el-icon><Upload /></el-icon></div>
                        <template v-if="uploadFile"><p class="upload-filename">{{ uploadFile.name }}</p></template>
                        <template v-else
                            ><p class="upload-hint-primary">点击选择或拖拽 Excel 文件</p>
                            <p class="upload-hint-secondary">支持 .xlsx / .xls 格式，最大 20 MB</p></template
                        ></el-upload
                    ></el-form-item
                ><div class="upload-modal-grid"
                    ><el-form-item label="机型（选填）"
                        ><el-select v-model="uploadForm.aircraftModel" placeholder="请选择机型" style="width: 100%"
                            ><el-option v-for="item in aircraftModelOptions" :key="item" :label="item" :value="item" /></el-select></el-form-item
                    ><el-form-item label="操作人（选填）"><el-input :model-value="operatorDisplay" disabled /></el-form-item></div
                ></el-form
            ><footer class="upload-modal-footer"
                ><a class="figma-link" href="#" @click.prevent="downloadTemplate">下载导入模板</a
                ><div class="upload-modal-footer__actions"
                    ><el-button round @click="uploadVisible = false">取消</el-button
                    ><el-button round type="primary" :loading="saving" :disabled="!uploadFile" @click="submitUpload">开始导入</el-button></div
                ></footer
            ></el-dialog
        >
        <el-dialog v-model="fetchVisible" title="从全流程系统抓取" width="min(520px, 94vw)"
            ><el-form label-position="top"
                ><el-form-item label="流程编号" required
                    ><el-input v-model="fetchFlowNo" placeholder="请输入全流程系统流程编号" /></el-form-item></el-form
            ><template #footer
                ><el-button @click="fetchVisible = false">取消</el-button
                ><el-button type="primary" :loading="saving" @click="submitFetch">开始抓取</el-button></template
            ></el-dialog
        >
        <el-dialog v-model="importResultVisible" title="导入结果" width="min(600px, 94vw)"
            ><div v-if="importResult" class="import-summary">
                <div><strong>{{ importResult.totalRows }}</strong><span>总行数</span></div>
                <div class="success"><strong>{{ importResult.successCount }}</strong><span>成功</span></div>
                <div class="failed"><strong>{{ importResult.errorCount }}</strong><span>失败</span></div>
            </div>
            <el-table v-if="importResult?.errors.length" :data="importResult.errors"
                ><el-table-column prop="rowNo" label="行号" width="90" /><el-table-column prop="message" label="失败原因" /></el-table
            ><template #footer><el-button type="primary" @click="importResultVisible = false">知道了</el-button></template></el-dialog
        >
        <el-dialog v-model="partVisible" title="零件详情" width="min(680px, 94vw)"
            ><dl v-if="currentPart" class="figma-info-grid">
                <div>
                    <dt>零件图号</dt>
                    <dd>{{ currentPart.partDrawingNo }}</dd>
                </div>
                <div>
                    <dt>零件名称</dt>
                    <dd>{{ currentPart.partName }}</dd>
                </div>
                <div>
                    <dt>机型</dt>
                    <dd>{{ currentPart.aircraftModel }}</dd>
                </div>
                <div>
                    <dt>材料</dt>
                    <dd>{{ currentPart.materialType }}</dd>
                </div>
                <div>
                    <dt>尺寸</dt>
                    <dd>{{ currentPart.lengthValue }} × {{ currentPart.widthValue }}</dd>
                </div>
                <div>
                    <dt>历史供应商</dt>
                    <dd>{{ currentPart.historySupplier1 || '无' }}</dd>
                </div>
            </dl></el-dialog
        >
        <el-dialog v-model="moveVisible" :title="`移动零件 (${moveParts.length} 个)`" width="min(480px, 94vw)"
            ><el-form label-position="top"
                ><el-form-item label="已选零件"
                    ><div class="move-part-list"
                        ><span v-for="item in moveParts" :key="item.id">{{ item.partDrawingNo }}</span></div
                    ></el-form-item
                ><el-form-item label="目标工作包"
                    ><el-select v-model="movePackageId" style="width: 100%"
                        ><el-option
                            v-for="item in packages.filter((p) => p.id !== selectedPackage?.id)"
                            :key="item.id"
                            :label="item.packageNo"
                            :value="item.id" /></el-select></el-form-item></el-form
            ><template #footer
                ><el-button @click="moveVisible = false">取消</el-button
                ><el-button type="primary" :loading="moving" @click="submitMove">确认移动</el-button></template
            ></el-dialog
        >
        <el-dialog v-model="manualVisible" title="手工添加供应商" width="min(520px, 94vw)"
            ><el-form label-position="top"
                ><el-form-item label="供应商"
                    ><el-select v-model="manualSupplierId" filterable style="width: 100%"
                        ><el-option
                            v-for="item in suppliers"
                            :key="item.id"
                            :label="item.supplierName"
                            :value="item.id" /></el-select></el-form-item></el-form
            ><template #footer
                ><el-button @click="manualVisible = false">取消</el-button
                ><el-button type="primary" @click="addManualSupplier">确认添加</el-button></template
            ></el-dialog
        >
    </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import {
    ElMessage,
    ElMessageBox,
    ElTable,
    genFileId,
    type UploadFile,
    type UploadInstance,
    type UploadProps,
    type UploadRawFile,
} from 'element-plus'
import {
    ArrowLeft,
    ArrowRight,
    Box,
    Cloudy,
    Document,
    Download,
    InfoFilled,
    Lightning,
    Plus,
    Refresh,
    Search,
    Switch,
    Upload,
    WarningFilled,
} from '@element-plus/icons-vue'
import type {
    BatchImportResultVO,
    BatchPartVO,
    BatchStatus,
    BatchStatusOptionVO,
    BatchVO,
    CategoryMasterVO,
    PackageVO,
    RecommendationWarning,
    SupplierRecommendationVO,
    SupplierVO,
} from '/@/features/cochain/contracts'
import { getResourceService } from '/@/features/cochain/services'
import { subcontractBatchApi } from '/@/features/cochain/services/subcontractBatch'
import { useAdminInfo } from '/@/stores/adminInfo'

const adminInfo = useAdminInfo()
const operatorDisplay = computed(() => adminInfo.userid || adminInfo.username || '—')
const aircraftModelOptions = ['C919', 'ARJ21', 'CR929', '通用']

const batchService = getResourceService('batches')
const packageService = getResourceService('packages')
const partService = getResourceService('batchParts')
const recommendationService = getResourceService('recommendations')
const supplierService = getResourceService('suppliers')
const categoryService = getResourceService('categories')
const query = reactive({ batchNo: '', flowNo: '', batchStatus: undefined as BatchStatus | undefined, operator: '', pageNo: 1, pageSize: 10 })
const STATUS_LABEL_FALLBACK: Record<BatchStatus, string> = {
    DRAFT: '草稿',
    DATA_READY: '数据就绪',
    PACKAGED: '已分包',
    RECOMMENDED: '已推荐',
    PARTIAL: '部分推荐',
    COMPLETED: '已完成',
}
const statusOptions = ref<BatchStatusOptionVO[]>([])
const batches = ref<BatchVO[]>([])
const total = ref(0)
const loading = ref(false)
const saving = ref(false)
const advancing = ref(false)
const exporting = ref(false)
const activeBatch = ref<BatchVO>()
const workbenchLoading = ref(false)
const packages = ref<PackageVO[]>([])
const packageParts = ref<BatchPartVO[]>([])
const packageRecommendations = ref<SupplierRecommendationVO[]>([])
const packageDetailLoading = ref(false)
const suppliers = ref<SupplierVO[]>([])
const categories = ref<CategoryMasterVO[]>([])
const selectedPackage = ref<PackageVO>()
const packageSearchKeyword = ref('')
const detailTab = ref<'parts' | 'recommendations'>('parts')
const uploadVisible = ref(false)
const fetchVisible = ref(false)
const partVisible = ref(false)
const moveVisible = ref(false)
const manualVisible = ref(false)
const importResultVisible = ref(false)
const uploadRef = ref<UploadInstance>()
const uploadFile = ref<UploadFile>()
const uploadForm = reactive({ aircraftModel: '' })
const fetchFlowNo = ref('')
const currentPart = ref<BatchPartVO>()
const partsTableRef = ref<InstanceType<typeof ElTable>>()
const selectedParts = ref<BatchPartVO[]>([])
const moveParts = ref<BatchPartVO[]>([])
const moving = ref(false)
const movePackageId = ref('')
const manualSupplierId = ref('')
const importResult = ref<BatchImportResultVO>()
const warningBanner = ref<{ message: string; warnings: RecommendationWarning[] } | null>(null)
const availableManualSuppliers = computed(() =>
    suppliers.value.filter((supplier) => supplier.enabled === 1 && !packageRecommendations.value.some((item) => item.supplierId === supplier.id))
)
const canPackage = computed(() => activeBatch.value?.batchStatus === 'DATA_READY')
const canRecommend = computed(() => activeBatch.value?.batchStatus === 'PACKAGED')
const canRun = computed(() => !!activeBatch.value && activeBatch.value.batchStatus !== 'DRAFT')
const lockedBatch = computed(() => !!activeBatch.value && ['RECOMMENDED', 'PARTIAL', 'COMPLETED'].includes(activeBatch.value.batchStatus))
const statusLabel = (status: BatchStatus) => statusOptions.value.find((item) => item.value === status)?.label || STATUS_LABEL_FALLBACK[status] || status
const sourceLabel = (source: string) =>
    ({
        HISTORY: '历史供应商',
        QUALITY_ROUND: '优质轮询',
        NORMAL_ROUND: '普通轮询',
        CATEGORY_CAPABILITY: '品类能力补充',
        ALL_CATEGORY: '全品类补位',
    })[source] || source
const recommendStatusLabel = (status: string) =>
    ({ PENDING: '待推荐', RECOMMENDED: '已推荐', PARTIAL: '推荐不足', FAILED: '推荐失败' })[status] || status
const categoryName = (id: string) => categories.value.find((item) => item.id === id)?.categoryName || id
const filteredPackages = computed(() => {
    const keyword = packageSearchKeyword.value.trim().toLowerCase()
    if (!keyword) return packages.value
    return packages.value.filter(
        (item) => item.packageNo.toLowerCase().includes(keyword) || categoryName(item.categoryId).toLowerCase().includes(keyword)
    )
})
const loadStatusOptions = async () => {
    try {
        statusOptions.value = await subcontractBatchApi.getStatusOptions()
    } catch (error: any) {
        ElMessage.error(error?.message || '获取状态选项失败')
    }
}
const loadBatches = async () => {
    loading.value = true
    try {
        const result = await batchService.page(query)
        batches.value = result.list
        total.value = result.total
    } catch (error: any) {
        ElMessage.error(error?.message || '批次列表加载失败')
    } finally {
        loading.value = false
    }
}
const resetQuery = () => {
    Object.assign(query, { batchNo: '', flowNo: '', batchStatus: undefined, operator: '', pageNo: 1 })
    loadBatches()
}
const enterWorkbench = async (row: BatchVO) => {
    activeBatch.value = { ...row }
    warningBanner.value = null
    packages.value = []
    packageParts.value = []
    packageRecommendations.value = []
    selectedPackage.value = undefined
    packageSearchKeyword.value = ''
    workbenchLoading.value = true
    try {
        const [packageRows, supplierRows, categoryRows] = await Promise.all([
            packageService.list({ batchId: row.id } as any),
            supplierService.list({ enabled: 1 } as any),
            categoryService.list(),
        ])
        packages.value = packageRows
        suppliers.value = supplierRows
        categories.value = categoryRows
        if (packageRows[0]) await selectPackage(packageRows[0])
    } catch (error: any) {
        ElMessage.error(error?.message || '工作台数据加载失败')
        activeBatch.value = undefined
    } finally {
        workbenchLoading.value = false
    }
}
const leaveWorkbench = () => {
    activeBatch.value = undefined
    selectedPackage.value = undefined
    warningBanner.value = null
    loadBatches()
}
const loadPackageDetail = async (packageId: string) => {
    packageDetailLoading.value = true
    try {
        const [partRows, recRows] = await Promise.all([partService.list({ packageId } as any), recommendationService.list({ packageId } as any)])
        packageParts.value = partRows
        packageRecommendations.value = recRows
    } catch (error: any) {
        ElMessage.error(error?.message || '工作包详情加载失败')
    } finally {
        packageDetailLoading.value = false
    }
}
const selectPackage = async (item: PackageVO) => {
    selectedPackage.value = item
    detailTab.value = 'parts'
    await loadPackageDetail(item.id)
}
const handlePackage = async () => {
    if (!activeBatch.value) return
    advancing.value = true
    try {
        const { packages: packageRows, message } = await subcontractBatchApi.packageBatch(activeBatch.value.id)
        packages.value = packageRows
        activeBatch.value = await batchService.get(activeBatch.value.id)
        warningBanner.value = message ? { message, warnings: [] } : null
        if (packageRows[0]) await selectPackage(packageRows[0])
        else {
            selectedPackage.value = undefined
            packageParts.value = []
            packageRecommendations.value = []
        }
        ElMessage.success('工作包已生成')
    } catch (error: any) {
        ElMessage.error(error?.message || '生成工作包失败')
    } finally {
        advancing.value = false
    }
}
const handleRecommend = async () => {
    if (!activeBatch.value) return
    advancing.value = true
    try {
        const { message } = await subcontractBatchApi.recommendBatch(activeBatch.value.id)
        const [packageRows, detail] = await Promise.all([
            packageService.list({ batchId: activeBatch.value.id } as any),
            batchService.get(activeBatch.value.id),
        ])
        packages.value = packageRows
        activeBatch.value = detail
        warningBanner.value = message ? { message, warnings: [] } : null
        const refreshed = packageRows.find((item) => item.id === selectedPackage.value?.id)
        if (refreshed) await selectPackage(refreshed)
        ElMessage.success(detail.batchStatus === 'PARTIAL' ? '推荐已生成，但存在数量缺口' : '供应商推荐已生成')
    } catch (error: any) {
        ElMessage.error(error?.message || '生成供应商推荐失败')
    } finally {
        advancing.value = false
    }
}
const handleRun = async () => {
    if (!activeBatch.value) return
    advancing.value = true
    try {
        const result = await subcontractBatchApi.runBatch(activeBatch.value.id)
        const packageRows = await packageService.list({ batchId: activeBatch.value.id } as any)
        packages.value = packageRows
        activeBatch.value = { ...activeBatch.value, batchStatus: result.batchStatus, totalPackageCount: result.packageCount }
        warningBanner.value = result.hasWarning
            ? { message: result.warnings.map((item) => item.message).join('；') || '存在供应商数量缺口', warnings: result.warnings }
            : null
        if (packageRows[0]) await selectPackage(packageRows[0])
        ElMessage.success(result.hasWarning ? '编排完成，但存在数量缺口' : '编排已完成')
    } catch (error: any) {
        ElMessage.error(error?.message || '一键编排失败')
    } finally {
        advancing.value = false
    }
}
const removeBatch = async (row: BatchVO) => {
    try {
        await ElMessageBox.confirm(`确认删除批次 ${row.batchNo}？`, '删除批次', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' })
    } catch {
        return
    }
    try {
        await batchService.remove(row.id)
        ElMessage.success('批次已删除')
        loadBatches()
    } catch (error: any) {
        ElMessage.error(error?.message || '删除失败')
    }
}
const openUpload = () => {
    uploadFile.value = undefined
    uploadRef.value?.clearFiles()
    Object.assign(uploadForm, { aircraftModel: '' })
    uploadVisible.value = true
}
const handleUploadExceed: UploadProps['onExceed'] = (files) => {
    uploadRef.value?.clearFiles()
    const file = files[0] as UploadRawFile
    file.uid = genFileId()
    uploadRef.value?.handleStart(file)
}
const submitUpload = async () => {
    if (!uploadFile.value?.raw) return ElMessage.warning('请选择 Excel 文件')
    saving.value = true
    try {
        const result = await subcontractBatchApi.uploadBatch(uploadFile.value.raw, {
            aircraftModel: uploadForm.aircraftModel || undefined,
            operator: adminInfo.userid || undefined,
        })
        uploadVisible.value = false
        importResult.value = result
        if (result.errorCount > 0) importResultVisible.value = true
        else ElMessage.success(`导入完成：${result.totalRows} 行中 ${result.successCount} 行成功`)
        loadBatches()
    } catch (error: any) {
        ElMessage.error(error?.message || '上传失败')
    } finally {
        saving.value = false
    }
}
const submitFetch = async () => {
    if (!fetchFlowNo.value.trim()) return ElMessage.warning('请输入流程编号')
    saving.value = true
    try {
        const result = await subcontractBatchApi.fetchBatch(fetchFlowNo.value.trim())
        fetchVisible.value = false
        importResult.value = result
        if (result.errorCount > 0) importResultVisible.value = true
        else ElMessage.success(`抓取完成：${result.totalRows} 行中 ${result.successCount} 行成功`)
        loadBatches()
    } catch (error: any) {
        ElMessage.error(error?.message || '抓取失败')
    } finally {
        saving.value = false
    }
}
const downloadTemplate = () => {
    ElMessage.info('接口文档未提供分包模板下载端点，请使用标准联调模板文件《待上传分包测试数据_下料尺寸_20260814.xlsx》（36 列）')
}
const exportResult = async () => {
    if (!activeBatch.value) return
    exporting.value = true
    try {
        await subcontractBatchApi.exportBatchResult(activeBatch.value.id, activeBatch.value.batchNo)
        activeBatch.value = await batchService.get(activeBatch.value.id)
        ElMessage.success('结果已导出')
    } catch (error: any) {
        ElMessage.error(error?.message || '导出失败')
    } finally {
        exporting.value = false
    }
}
const showPart = (row: BatchPartVO) => {
    currentPart.value = row
    partVisible.value = true
}
const handlePartSelectionChange = (rows: BatchPartVO[]) => {
    selectedParts.value = rows
}
const clearPartSelection = () => {
    partsTableRef.value?.clearSelection()
}
const openMove = (row: BatchPartVO) => {
    moveParts.value = [row]
    movePackageId.value = ''
    moveVisible.value = true
}
const openBatchMove = () => {
    moveParts.value = [...selectedParts.value]
    movePackageId.value = ''
    moveVisible.value = true
}
const submitMove = async () => {
    if (!moveParts.value.length || !movePackageId.value) return ElMessage.warning('请选择目标工作包')
    moving.value = true
    try {
        await Promise.all(moveParts.value.map((part) => partService.update({ ...part, packageId: movePackageId.value })))
        moveVisible.value = false
        clearPartSelection()
        ElMessage.success(`已移动 ${moveParts.value.length} 个零件`)
        if (activeBatch.value) packages.value = await packageService.list({ batchId: activeBatch.value.id } as any)
        if (selectedPackage.value) await loadPackageDetail(selectedPackage.value.id)
    } catch (error: any) {
        ElMessage.error(error?.message || '移动失败')
    } finally {
        moving.value = false
    }
}
const addManualSupplier = async () => {
    const supplier = suppliers.value.find((item) => item.id === manualSupplierId.value)
    if (!supplier || !activeBatch.value || !selectedPackage.value) return ElMessage.warning('请选择供应商')
    try {
        await recommendationService.create({
            packageId: selectedPackage.value.id,
            batchId: activeBatch.value.id,
            supplierId: supplier.id,
            supplierName: supplier.supplierName,
            recommendOrder: packageRecommendations.value.length + 1,
            recommendSource: 'ALL_CATEGORY',
            qualityLevel: '普通',
            performanceScore: 0,
        })
        await loadPackageDetail(selectedPackage.value.id)
        manualSupplierId.value = ''
        manualVisible.value = false
        ElMessage.success('供应商已添加')
    } catch (error: any) {
        ElMessage.error(error?.message || '添加供应商失败')
    }
}
onMounted(() => {
    loadStatusOptions()
    loadBatches()
})
</script>


<style scoped>
.figma-page__actions .el-button:first-child {
    width: 158px;
}
.figma-page__actions .el-button:nth-child(2) {
    width: 114px;
}
.batch-keyword {
    width: 168px !important;
}
.batch-status-select {
    width: 98px !important;
}
.operator-input {
    width: 112px !important;
}
.batch-number {
    color: #1d1d1f;
    font:
        600 12px ui-monospace,
        SFMono-Regular,
        Menlo,
        Consolas,
        monospace;
}
.flow-number {
    color: #7a7a7a;
    font:
        12px ui-monospace,
        SFMono-Regular,
        Menlo,
        Consolas,
        monospace;
}
.upload-file {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #555;
}
.upload-file .el-icon {
    color: #b0b0b0;
}
.table-count {
    color: #1d1d1f;
    font-weight: 600;
}
.operator-name {
    color: #7a7a7a;
}
.empty-copy {
    padding: 48px 20px;
    color: #a1a1a6;
    text-align: center;
}
.empty-large {
    min-height: 430px;
    display: grid;
    place-items: center;
}
.back-button {
    display: flex;
    align-items: center;
    gap: 5px;
    margin: 0 0 6px;
    padding: 0;
    border: 0;
    background: transparent;
    color: #0066cc;
    font: 500 12px var(--co-font-family);
    cursor: pointer;
}
.title-line {
    display: flex;
    align-items: center;
    gap: 12px;
}
.package-info {
    border-bottom: 1px solid #f0f0f0;
}
.workbench-detail {
    min-width: 0;
}
.recommend-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 54px;
    padding: 10px 18px;
    border-bottom: 1px solid #f0f0f0;
}
.upload-dropzone__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    margin-bottom: 12px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    color: #0066cc;
    font-size: 22px;
    transition: transform 300ms ease;
}
.upload-modal :deep(.el-upload),
.upload-modal :deep(.el-upload-dragger) {
    width: 100%;
}
.upload-modal :deep(.el-upload-dragger) {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 18px;
    border: 1px dashed #d2d2d7;
    border-radius: 14px;
    background: #f5f5f7;
    transition:
        border-color 300ms ease,
        background-color 300ms ease;
}
.upload-modal :deep(.el-upload-dragger:hover),
.upload-modal :deep(.el-upload-dragger.is-dragover) {
    border-color: rgba(0, 102, 204, 0.4);
    background: rgba(0, 102, 204, 0.05);
}
.upload-modal :deep(.el-upload-dragger:hover) .upload-dropzone__icon {
    transform: scale(1.1);
}
.upload-filename {
    margin: 0;
    color: #1d1d1f;
    font-size: 14px;
    font-weight: 500;
}
.upload-hint-primary {
    margin: 0 0 4px;
    color: #1d1d1f;
    font-size: 14px;
    font-weight: 500;
}
.upload-hint-secondary {
    margin: 0;
    color: #86868b;
    font-size: 12px;
}
.upload-modal-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}
.upload-modal-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 8px;
    padding-top: 20px;
    border-top: 1px solid rgba(210, 210, 215, 0.5);
}
.upload-modal-footer__actions {
    display: flex;
    gap: 10px;
}
.upload-modal-footer__actions .el-button {
    min-height: 34px;
    padding-inline: 18px;
    border: 0;
}
.upload-modal-footer__actions .el-button:first-child {
    background: #f5f5f7;
    color: #1d1d1f;
}
.upload-modal-footer__actions .el-button:first-child:hover {
    background: #e8e8ed;
}
.upload-modal-footer__actions .el-button--primary.is-disabled,
.upload-modal-footer__actions .el-button--primary.is-disabled:hover {
    background: #d2d2d7;
    color: #86868b;
    border-color: #d2d2d7;
}
@media (max-width: 480px) {
    .upload-modal-grid {
        grid-template-columns: 1fr;
    }
}
.workbench-header .figma-page__actions .el-button {
    width: auto;
}

.batch-workbench {
    width: calc(100% + 56px);
    min-height: calc(100vh - 52px);
    margin: -28px;
    background: #f5f5f7;
}

.workbench-topbar {
    padding: 18px 26px 20px;
    border-bottom: 1px solid #e5e5e7;
    background: #fff;
}

.workbench-topbar .back-button {
    margin-bottom: 16px;
    font-size: 13px;
}

.batch-summary-row,
.batch-facts,
.workbench-actions,
.package-card__top,
.package-overview__title,
.package-detail-tabs,
.manual-add,
.workbench-table-footer {
    display: flex;
    align-items: center;
}

.batch-summary-row {
    gap: 18px;
}
.batch-summary-primary {
    display: grid;
    gap: 3px;
}
.batch-summary-primary span {
    color: #7a7a7a;
    font-size: 11px;
}
.batch-summary-primary strong {
    color: #1d1d1f;
    font:
        650 13px ui-monospace,
        SFMono-Regular,
        Menlo,
        Monaco,
        Consolas,
        monospace;
    white-space: nowrap;
}
.batch-summary-primary .flow-id {
    color: #555;
    font-weight: 500;
}
.summary-divider {
    width: 1px;
    height: 38px;
    background: #e0e0e0;
}
.workbench-status {
    min-height: 30px;
    padding-inline: 12px;
}
.batch-facts {
    gap: 18px;
    color: #7a7a7a;
    font-size: 13px;
    white-space: nowrap;
}
.batch-facts strong,
.batch-facts b {
    color: #1d1d1f;
    font-weight: 650;
}
.workbench-actions {
    gap: 10px;
    margin-left: auto;
}
.batch-workbench :deep(.workbench-actions .el-button) {
    width: auto;
    min-height: 38px;
    padding-inline: 16px;
    border-radius: 10px;
    color: #1d1d1f;
}

.workbench-layout {
    display: grid;
    grid-template-columns: 260px minmax(0, 1fr);
    min-height: 720px;
}
.package-sidebar {
    display: flex;
    flex-direction: column;
    border-right: 1px solid #ebebeb;
    background: #fff;
}
.package-sidebar__title {
    padding: 16px 18px 14px;
    border-bottom: 1px solid #f0f0f0;
    color: #6e6e73;
    font-size: 13px;
    font-weight: 650;
}
.package-sidebar__search {
    padding: 12px 14px 0;
}
.package-sidebar__search :deep(.el-input__wrapper) {
    border-radius: 8px;
}
.package-list {
    display: grid;
    align-content: start;
    grid-auto-rows: minmax(94px, auto);
    gap: 9px;
    max-height: calc(100vh - 320px);
    padding: 14px;
    overflow-y: auto;
}
.package-card {
    display: grid;
    grid-template-rows: auto auto auto;
    gap: 7px;
    width: 100%;
    height: auto;
    min-height: 94px;
    padding: 14px;
    border: 1px solid #e0e0e0;
    border-radius: 10px;
    background: #fff;
    color: #1d1d1f;
    font: inherit;
    text-align: left;
    cursor: pointer;
    transition:
        border-color 160ms ease,
        background-color 160ms ease;
}
.package-card:hover {
    background: #fafafa;
}
.package-card:focus-visible {
    outline: 3px solid rgba(0, 102, 204, 0.22);
    outline-offset: 2px;
}
.package-card.is-active {
    border-color: #0066cc;
    background: #e8f1fb;
}
.package-card__top {
    justify-content: space-between;
    gap: 10px;
}
.package-card__top strong {
    color: #555;
    font:
        650 11px ui-monospace,
        SFMono-Regular,
        Menlo,
        Monaco,
        Consolas,
        monospace;
}
.package-card.is-active .package-card__top strong {
    color: #0055aa;
}
.package-card__top em {
    padding: 2px 7px;
    border-radius: 5px;
    background: #f0faf0;
    color: #1a7f3c;
    font-size: 10px;
    font-style: normal;
    font-weight: 550;
}
.package-card__top em[data-recommend-status='PENDING'] {
    background: #f1f1f3;
    color: #6e6e73;
}
.package-card__top em[data-recommend-status='PARTIAL'] {
    background: #fff4ed;
    color: #c4320a;
}
.package-card__top em[data-recommend-status='FAILED'] {
    background: #fef3f2;
    color: #b42318;
}
.package-card__category {
    display: block;
    color: #555;
    font-size: 13px;
    line-height: 18px;
}
.package-card__meta {
    display: flex;
    align-items: center;
    gap: 7px;
    color: #7a7a7a;
    font-size: 11px;
    line-height: 16px;
}
.package-card__meta i {
    font-style: normal;
}
.package-card__meta b {
    padding: 2px 6px;
    border-radius: 5px;
    background: #fff3e0;
    color: #b54708;
    font-size: 10px;
    font-weight: 550;
}

.package-workspace {
    display: grid;
    align-content: start;
    gap: 16px;
    min-width: 0;
    padding: 20px;
}
.package-overview,
.workbench-table-card {
    overflow: hidden;
    border: 1px solid #dedee1;
    border-radius: 16px;
    background: #fff;
}
.detail-skeleton {
    padding: 24px;
}
.package-overview__title {
    gap: 12px;
    min-height: 58px;
    padding: 12px 20px;
    border-bottom: 1px solid #f0f0f0;
}
.package-overview__title strong {
    font:
        650 13px ui-monospace,
        SFMono-Regular,
        Menlo,
        Monaco,
        Consolas,
        monospace;
}
.package-overview__title > span {
    color: #7a7a7a;
    font-size: 12px;
}
.package-overview__title em {
    padding: 3px 9px;
    border: 1px solid #b3d0f5;
    border-radius: 6px;
    background: #e8f1fb;
    color: #0055aa;
    font-size: 11px;
    font-style: normal;
    font-weight: 550;
}
.package-overview__title em.is-special {
    border-color: #f5c77e;
    background: #fff3e0;
    color: #b54708;
}
.package-overview__facts {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px 80px;
    margin: 0;
    padding: 18px 20px;
}
.package-overview__facts > div {
    display: grid;
    grid-template-columns: 130px minmax(0, 1fr);
    align-items: center;
}
.package-overview__facts dt {
    color: #7a7a7a;
    font-size: 12px;
}
.package-overview__facts dd {
    margin: 0;
    color: #1d1d1f;
    font-size: 13px;
    font-weight: 560;
}

.package-detail-tabs {
    justify-content: space-between;
    min-height: 52px;
    border-bottom: 1px solid #ececef;
}
.package-detail-tabs nav {
    display: flex;
    align-self: stretch;
}
.package-detail-tabs nav button {
    position: relative;
    padding: 0 20px;
    border: 0;
    background: transparent;
    color: #7a7a7a;
    font: 550 13px var(--co-font-family);
    cursor: pointer;
}
.package-detail-tabs nav button.is-active {
    color: #0066cc;
}
.package-detail-tabs nav button.is-active::after {
    position: absolute;
    right: 0;
    bottom: -1px;
    left: 0;
    height: 2px;
    background: #0066cc;
    content: '';
}
.manual-add {
    gap: 8px;
    padding-right: 2px;
}
.manual-add > span {
    color: #999;
    font-size: 11px;
}
.manual-add .el-select {
    width: 200px;
}
.batch-workbench :deep(.manual-add .el-select__wrapper),
.batch-workbench :deep(.manual-add .el-button) {
    min-height: 32px;
    border-radius: 8px;
}

.package-lock-notice {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 11px 15px;
    border: 1px solid #f5c77e;
    border-radius: 11px;
    background: #fff3e0;
    color: #b54708;
    font-size: 12px;
}
.batch-move-banner {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 15px;
    border-radius: 10px;
    background: #e8f1fb;
    color: #0055aa;
    font-size: 13px;
    font-weight: 500;
}
.move-part-list {
    display: grid;
    gap: 4px;
    max-height: 160px;
    padding: 10px 12px;
    overflow-y: auto;
    border-radius: 8px;
    background: #f5f5f7;
    color: #555;
    font:
        12px ui-monospace,
        SFMono-Regular,
        Menlo,
        Consolas,
        monospace;
}
.batch-warning-banner {
    align-items: flex-start;
    margin: 16px 26px 0;
    padding: 14px 16px;
    border-color: #f0b090;
    background: #fff4ed;
    color: #c4320a;
}
.batch-warning-banner .el-icon {
    margin-top: 2px;
    font-size: 15px;
}
.batch-warning-banner strong {
    font-size: 13px;
    font-weight: 650;
}
.batch-warning-banner p {
    margin: 4px 0 0;
    font-size: 12px;
    line-height: 1.6;
}
.batch-warning-banner ul {
    margin: 6px 0 0;
    padding-left: 18px;
    font-size: 12px;
    line-height: 1.7;
}
.batch-workbench :deep(.workbench-table-card .el-table th.el-table__cell) {
    height: 48px;
}
.batch-workbench :deep(.workbench-table-card .el-table td.el-table__cell) {
    height: 58px;
}
.part-row-actions {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    white-space: nowrap;
}
.part-row-actions :deep(.el-button + .el-button) {
    margin-left: 0;
}
.part-drawing-no {
    color: #0066cc;
    font:
        500 12px ui-monospace,
        SFMono-Regular,
        Menlo,
        Monaco,
        Consolas,
        monospace;
}
.part-name,
.recommend-supplier {
    color: #1d1d1f;
    font-weight: 600;
}
.part-size,
.history-suppliers {
    color: #7a7a7a;
    font-size: 12px;
}
.nesting-tag {
    padding: 2px 8px;
    border-radius: 5px;
    background: #f3eaff;
    color: #7030c0;
    font:
        550 11px ui-monospace,
        SFMono-Regular,
        Menlo,
        Monaco,
        Consolas,
        monospace;
}
.empty-value {
    color: #c7c7cc;
}
.workbench-table-footer {
    justify-content: flex-end;
    gap: 14px;
    min-height: 58px;
    padding: 10px 16px;
    border-top: 1px solid #f0f0f0;
    color: #7a7a7a;
    font-size: 12px;
}

.recommend-order {
    display: inline-grid;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    place-items: center;
    background: #f5f5f7;
    color: #555;
    font-size: 12px;
    font-weight: 700;
}
.recommend-order.is-leading {
    background: #0066cc;
    color: #fff;
}
.recommend-source {
    display: inline-flex;
    padding: 3px 9px;
    border: 1px solid #dedee1;
    border-radius: 6px;
    background: #f5f5f7;
    color: #555;
    font-size: 11px;
    font-weight: 550;
}
.recommend-source[data-source='HISTORY'] {
    border-color: #b3d0f5;
    background: #e8f1fb;
    color: #0055aa;
}
.recommend-source[data-source='QUALITY_ROUND'] {
    border-color: #b7ebc0;
    background: #f0faf0;
    color: #1a7f3c;
}
.recommend-source[data-source='ALL_CATEGORY'] {
    border-color: #f5c77e;
    background: #fff3e0;
    color: #b54708;
}
.recommend-source[data-source='CATEGORY_CAPABILITY'] {
    border-color: #d8bdf5;
    background: #f3eaff;
    color: #7030c0;
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
.recommend-quality {
    color: #7a7a7a;
    font-size: 12px;
}
.recommend-quality[data-level='优质'] {
    color: #1a7f3c;
}
.recommend-score {
    color: #1d1d1f;
    font-size: 13px;
    font-variant-numeric: tabular-nums;
}
.workbench-empty {
    display: grid;
    min-height: 520px;
    place-items: center;
    color: #a1a1a6;
}
.no-packages {
    min-height: 700px;
    gap: 16px;
}
.no-packages .workbench-empty__icon {
    font-size: 48px;
    color: #d0d0d0;
}
.no-packages p {
    margin: 0;
    color: #7a7a7a;
    font-size: 15px;
    font-weight: 500;
}
.no-packages .el-button {
    min-height: 40px;
    padding-inline: 22px;
}

@media (max-width: 1100px) {
    .batch-summary-row {
        flex-wrap: wrap;
    }
    .workbench-actions {
        width: 100%;
        margin-left: 0;
    }
    .workbench-layout {
        grid-template-columns: 230px minmax(0, 1fr);
    }
    .package-overview__facts {
        gap: 16px 30px;
    }
}

@media (max-width: 820px) {
    .batch-workbench {
        width: calc(100% + 32px);
        margin: -16px;
    }
    .summary-divider {
        display: none;
    }
    .workbench-layout {
        grid-template-columns: 1fr;
    }
    .package-sidebar {
        border-right: 0;
        border-bottom: 1px solid #e5e5e7;
    }
    .package-list {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .package-overview__facts {
        grid-template-columns: 1fr;
    }
    .package-detail-tabs {
        align-items: stretch;
        flex-direction: column;
        gap: 10px;
    }
    .manual-add {
        justify-content: flex-end;
        padding-bottom: 10px;
    }
}

@media (max-width: 560px) {
    .workbench-topbar {
        padding-inline: 16px;
    }
    .batch-facts {
        align-items: flex-start;
        flex-direction: column;
        gap: 5px;
    }
    .workbench-actions {
        flex-wrap: wrap;
    }
    .package-list {
        grid-template-columns: 1fr;
    }
    .package-workspace {
        padding: 14px;
    }
    .package-overview__facts > div {
        grid-template-columns: 112px minmax(0, 1fr);
    }
    .manual-add {
        align-items: stretch;
        flex-direction: column;
    }
    .manual-add .el-select {
        width: 100%;
    }
}
</style>
