export interface Result<T> {
    success: boolean
    code: number
    message: string
    data: T
    timestamp?: number
}

export interface PageData<T> {
    list: T[]
    total: number
}

export interface PageQuery {
    pageNo?: number
    pageSize?: number
}

export type EntityId = string
export type BatchStatus = 'DRAFT' | 'DATA_READY' | 'PACKAGED' | 'RECOMMENDED' | 'PARTIAL' | 'COMPLETED'
export type RecommendSource = 'HISTORY' | 'QUALITY_ROUND' | 'NORMAL_ROUND' | 'CATEGORY_CAPABILITY' | 'ALL_CATEGORY'
export type RecommendationStatus = 'PENDING' | 'RECOMMENDED' | 'PARTIAL' | 'FAILED'
export type QualityLevel = '优质' | '普通'
export type PartType = '小型' | '中型' | '大型' | '超大型' | '其他'
export type SizeLogic = 'AND' | 'OR'
export type SpecialType = 'COMPOSITE' | 'REINFORCEMENT'
export type RecommendRule = 'ALL_SUPPLIERS' | 'ROUND_ROBIN'

/**
 * 字段来源：http://192.168.124.33:8080/v2/api-docs（Knife4j/Swagger），非文档假定。
 * 后端审计字段 createTime/updateTime 在所有实体的响应 schema 中均未出现（虽然可作为查询参数），
 * 因此不在 BaseEntity 中建模，避免展示一个后端从未返回的字段。
 */
export interface BaseEntity {
    id: EntityId
}

export interface BatchVO extends BaseEntity {
    batchNo: string
    flowNo: string
    batchStatus: BatchStatus
    uploadFileName: string
    totalPartCount: number
    totalPackageCount: number
    operator: string
}
export interface BatchQuery extends PageQuery {
    batchNo?: string
    flowNo?: string
    batchStatus?: BatchStatus
    operator?: string
}

/** BatchPart对象；36 列上传模板字段与 Excel 列名对照见 docs/前端交接-上传分包调用流程.md §3 */
export interface BatchPartVO extends BaseEntity {
    batchId: EntityId
    seqNo?: number
    partDrawingNo: string
    aircraftModel?: string
    outsourceDrawingNo?: string
    partName?: string
    workRoute?: string
    fourthCategory?: string
    suggestMode?: string
    perUnitCount?: number
    outsourceShare?: number
    orderCount?: number
    mainProcess?: string
    proposeUnit?: string
    provideTooling?: 0 | 1
    provideMaterial?: 0 | 1
    keyInfo?: string
    capabilityLevel?: string
    materialType?: string
    partMaterial?: string
    materialSpec?: string
    nestingInfo?: string
    historySupplier1?: string
    historySupplier2?: string
    historySupplier3?: string
    supplierCountNeeded: number
    thirdCategory?: string
    thirdCategoryId?: EntityId
    partType?: PartType
    packageId?: EntityId
    packageNo?: string
    lengthValue?: number
    widthValue?: number
    remark?: string
    recommendSupplier1?: string
    recommendSupplier2?: string
    recommendSupplier3?: string
    recommendSupplier4?: string
    recommendSupplier5?: string
    recommendSupplier6?: string
    recommendSupplier7?: string
}
export interface BatchPartQuery extends PageQuery {
    batchId?: EntityId
    partDrawingNo?: string
    aircraftModel?: string
    thirdCategoryId?: EntityId
    thirdCategory?: string
    packageId?: EntityId
    packageNo?: string
    partType?: PartType
}

export interface PackageVO extends BaseEntity {
    batchId: EntityId
    packageNo: string
    categoryId: EntityId
    supplierCountNeeded: number
    recommendCount: number
    partCount: number
    partType: PartType
    maxPartLimit: number
    hasHistorySupplier: 0 | 1
    isSpecialCategory: 0 | 1
    specialType?: SpecialType
    recommendationStatus?: RecommendationStatus
}
export interface PackageQuery extends PageQuery {
    batchId?: EntityId
    packageNo?: string
    categoryId?: EntityId
    recommendationStatus?: string
}

/** 后端 Part对象（工作包零件关联），只有 id/packageId/partId/partDrawingNo，无冗余展示字段 */
export interface PackagePartVO extends BaseEntity {
    packageId: EntityId
    partId: EntityId
    partDrawingNo: string
}
export interface PackagePartQuery extends PageQuery {
    packageId?: EntityId
    partId?: EntityId
    partDrawingNo?: string
}

export interface SupplierVO extends BaseEntity {
    supplierName: string
    enabled: 0 | 1
    remark: string
}
export interface SupplierQuery extends PageQuery {
    supplierName?: string
    enabled?: 0 | 1
}

/** Performance对象：无 supplierName，前端需按 supplierId 关联 suppliers 资源展示名称 */
export interface SupplierPerformanceVO extends BaseEntity {
    supplierId: EntityId
    performanceYear: number
    performanceMonth: number
    score: number
    halfYearAvg: number
    lastMonthScore: number
    comprehensiveScore: number
}
export interface SupplierPerformanceQuery extends PageQuery {
    supplierId?: EntityId
    performanceYear?: number
    performanceMonth?: number
}

/** Category对象（供应商-品类关联）：只有 id/supplierId/categoryId，无冗余展示字段 */
export interface SupplierCategoryVO extends BaseEntity {
    supplierId: EntityId
    categoryId: EntityId
}
export interface SupplierCategoryQuery extends PageQuery {
    supplierId?: EntityId
    categoryId?: EntityId
}

export interface CategoryMasterVO extends BaseEntity {
    categoryName: string
    materialType: string
    lengthMin: number
    lengthMax: number
    widthMin: number
    widthMax: number
    sizeLogic: SizeLogic
    partType: PartType
}
export interface CategoryMasterQuery extends PageQuery {
    categoryName?: string
    materialType?: string
    partType?: PartType
}

/** CategoryConfig对象：无 categoryName，前端需按 categoryId 关联 categories 资源展示名称 */
export interface SpecialCategoryConfigVO extends BaseEntity {
    categoryId: EntityId
    specialType: SpecialType
    recommendRule: RecommendRule
    ignoreQuality: 0 | 1
}
export interface SpecialCategoryConfigQuery extends PageQuery {
    categoryId?: EntityId
    specialType?: SpecialType
}

/** RankingSnapshot对象：无 supplierName/categoryName，前端需自行关联展示 */
export interface RankingSnapshotVO extends BaseEntity {
    supplierId: EntityId
    categoryId: EntityId
    rankingYear: number
    rankingMonth: number
    comprehensiveScore: number
    rankInCategory: number
    qualityLevel: QualityLevel
    totalSupplierCount: number
}
export interface RankingSnapshotQuery extends PageQuery {
    supplierId?: EntityId
    categoryId?: EntityId
    rankingYear?: number
    rankingMonth?: number
    qualityLevel?: QualityLevel
}

/** RobinCursor对象：真实字段是 lastSelectedRank/lastSupplierId/recommendOrder，不是 cursorPosition/supplierCount */
export interface RoundRobinCursorVO extends BaseEntity {
    categoryId: EntityId
    qualityLevel: QualityLevel
    rankingYear: number
    rankingMonth: number
    lastSelectedRank: number
    lastSupplierId?: EntityId
    recommendOrder: number
}
export interface RoundRobinCursorQuery extends PageQuery {
    categoryId?: EntityId
    qualityLevel?: QualityLevel
    rankingYear?: number
    rankingMonth?: number
}

export interface SupplierRecommendationVO extends BaseEntity {
    packageId: EntityId
    batchId: EntityId
    supplierId: EntityId
    supplierName: string
    recommendOrder: number
    recommendSource: RecommendSource
    qualityLevel: QualityLevel
    performanceScore: number
}
export interface SupplierRecommendationQuery extends PageQuery {
    packageId?: EntityId
    batchId?: EntityId
    supplierId?: EntityId
    supplierName?: string
    recommendSource?: RecommendSource
    qualityLevel?: QualityLevel
}

/** HistorySupplier对象：真实字段是 partId + sortOrder，没有 partDrawingNo/supplierId/cooperationCount/lastCooperationTime */
export interface HistorySupplierVO extends BaseEntity {
    partId: EntityId
    supplierName: string
    sortOrder: number
}
export interface HistorySupplierQuery extends PageQuery {
    partId?: EntityId
    supplierName?: string
}

/** RightRule对象：没有 enabled 字段，只有 description */
export interface LeftRightRuleVO extends BaseEntity {
    aircraftModel: string
    leftSuffix: string
    rightSuffix: string
    description?: string
}
export interface LeftRightRuleQuery extends PageQuery {
    aircraftModel?: string
}

/** RightManual对象：没有 remark 字段 */
export interface LeftRightManualVO extends BaseEntity {
    aircraftModel: string
    leftPartDrawingNo: string
    rightPartDrawingNo: string
}
export interface LeftRightManualQuery extends PageQuery {
    aircraftModel?: string
}

/** TypePackageConfig对象：真实字段是 maxPartCount + typeLabel + sortOrder，没有 enabled/remark，也不是 maxPartLimit */
export interface TypePackageConfigVO extends BaseEntity {
    partType: PartType
    typeLabel?: string
    maxPartCount: number
    sortOrder?: number
}
export interface TypePackageConfigQuery extends PageQuery {
    partType?: PartType
}

/** Log对象（业务操作日志）：没有 operationResult/operationTime 字段 */
export interface OperationLogVO extends BaseEntity {
    batchId?: EntityId
    operationType: string
    operationDetail: string
    operator: string
}
export interface OperationLogQuery extends PageQuery {
    batchId?: EntityId
    operationType?: string
    operator?: string
}

/** OperateLog对象（系统操作日志），字段与业务日志完全不同，来自 RBAC/系统访问审计 */
export interface SystemOperateLogVO extends BaseEntity {
    userId?: string
    userIp?: string
    userType?: number
    userAgent?: string
    module?: string
    name?: string
    type?: number
    requestMethod?: string
    requestUrl?: string
    javaMethod?: string
    javaMethodArgs?: string
    resultType?: number
    resultCode?: number
    resultMsg?: string
    resultData?: string
    content?: string
    duration?: number
    startTime?: string
    traceId?: string
    tenantId?: string
}
export interface SystemOperateLogQuery extends PageQuery {
    userId?: string
    module?: string
    name?: string
    requestMethod?: string
    requestUrl?: string
    resultCode?: number
    resultType?: number
}

export interface ImportErrorItem {
    rowNo: number
    message: string
}

export interface BatchImportResultVO {
    batchId: EntityId
    batchNo: string
    totalRows: number
    successCount: number
    errorCount: number
    errors: ImportErrorItem[]
}

export interface RecommendationWarning {
    packageId: EntityId
    packageNo: string
    requiredCount: number
    availableCount: number
    shortageCount: number
    message: string
}

export interface OrchestrationResultVO {
    batchId: EntityId
    batchNo: string
    batchStatus: Extract<BatchStatus, 'RECOMMENDED' | 'PARTIAL'>
    packageCount: number
    recommendationCount: number
    hasWarning: boolean
    warnings: RecommendationWarning[]
}

export interface PerformanceUploadResultVO {
    totalRows: number
    successCount: number
    errorCount: number
    errors: ImportErrorItem[]
}

export interface CategoryImportRowError {
    rowNo: number
    message: string
    supplierName?: string
    categoryName?: string
}

export interface CategoryImportResultVO {
    totalRows: number
    successCount: number
    errorCount: number
    errors: CategoryImportRowError[]
}

export interface BatchStatusOptionVO {
    label: string
    value: BatchStatus
}

export type ResourceKey =
    | 'batches'
    | 'batchParts'
    | 'packages'
    | 'packageParts'
    | 'suppliers'
    | 'performances'
    | 'supplierCategories'
    | 'categories'
    | 'specialCategories'
    | 'rankingSnapshots'
    | 'roundRobinCursors'
    | 'recommendations'
    | 'historySuppliers'
    | 'leftRightRules'
    | 'leftRightManuals'
    | 'typePackageConfigs'
    | 'operationLogs'
    | 'systemOperateLogs'

export interface ResourceTypeMap {
    batches: BatchVO
    batchParts: BatchPartVO
    packages: PackageVO
    packageParts: PackagePartVO
    suppliers: SupplierVO
    performances: SupplierPerformanceVO
    supplierCategories: SupplierCategoryVO
    categories: CategoryMasterVO
    specialCategories: SpecialCategoryConfigVO
    rankingSnapshots: RankingSnapshotVO
    roundRobinCursors: RoundRobinCursorVO
    recommendations: SupplierRecommendationVO
    historySuppliers: HistorySupplierVO
    leftRightRules: LeftRightRuleVO
    leftRightManuals: LeftRightManualVO
    typePackageConfigs: TypePackageConfigVO
    operationLogs: OperationLogVO
    systemOperateLogs: SystemOperateLogVO
}
