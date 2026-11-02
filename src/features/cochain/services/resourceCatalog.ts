import type { ResourceKey } from '../contracts'

export const resourceBasePaths: Record<ResourceKey, string> = {
    batches: '/api/subcontract/batch',
    batchParts: '/api/part/batch-part',
    packages: '/api/work/package',
    packageParts: '/api/package/part',
    suppliers: '/api/supplier',
    performances: '/api/supplier/performance',
    supplierCategories: '/api/supplier/category',
    categories: '/api/part/category-master',
    specialCategories: '/api/special/category-config',
    rankingSnapshots: '/api/supplier/ranking-snapshot',
    roundRobinCursors: '/api/round/robin-cursor',
    recommendations: '/api/package/supplier-recommendation',
    historySuppliers: '/api/part/history-supplier',
    leftRightRules: '/api/left/right-rule',
    leftRightManuals: '/api/left/right-manual',
    typePackageConfigs: '/api/part/type-package-config',
    operationLogs: '/api/operation/log',
    systemOperateLogs: '/api/system/operate-log',
}

/**
 * 通用 CRUD 导入接口的真实方法/路径，按后端 Swagger（http://192.168.124.33:8080/v2/api-docs）逐条核对。
 * `batches` 故意不在此列表中：分包批次的正式导入走 `POST /api/subcontract/batch/upload`（见 subcontractBatch.ts），
 * 不使用通用 CRUD 导入。
 *
 * 注意：多数资源的通用导入在 Swagger 中被登记为 GET 方法但要求 multipart/form-data（operationId 形如
 * `importDataUsingGET_1`），这是后端的既有声明，不是前端猜测；`categories`、`systemOperateLogs`、
 * `supplierCategories` 三个是 POST。
 */
export const resourceImportConfig: Partial<Record<ResourceKey, { method: 'get' | 'post'; path: string }>> = {
    batchParts: { method: 'get', path: '/api/part/batch-part/import' },
    packages: { method: 'get', path: '/api/work/package/import' },
    packageParts: { method: 'get', path: '/api/package/part/import' },
    suppliers: { method: 'get', path: '/api/supplier/import' },
    performances: { method: 'get', path: '/api/supplier/performance/import' },
    supplierCategories: { method: 'post', path: '/api/supplier/category/importCategorySupplier' },
    categories: { method: 'post', path: '/api/part/category-master/import' },
    specialCategories: { method: 'get', path: '/api/special/category-config/import' },
    rankingSnapshots: { method: 'get', path: '/api/supplier/ranking-snapshot/import' },
    roundRobinCursors: { method: 'get', path: '/api/round/robin-cursor/import' },
    recommendations: { method: 'get', path: '/api/package/supplier-recommendation/import' },
    historySuppliers: { method: 'get', path: '/api/part/history-supplier/import' },
    leftRightRules: { method: 'get', path: '/api/left/right-rule/import' },
    leftRightManuals: { method: 'get', path: '/api/left/right-manual/import' },
    typePackageConfigs: { method: 'get', path: '/api/part/type-package-config/import' },
    operationLogs: { method: 'get', path: '/api/operation/log/import' },
    systemOperateLogs: { method: 'post', path: '/api/system/operate-log/import' },
}
