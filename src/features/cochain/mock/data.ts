import type { ResourceKey, ResourceTypeMap } from '../contracts'
import * as design from '../../../../figma/Design RBAC Menu Interface/src/mock'

/**
 * The Figma Make download only approximates business scenarios; field shapes below are
 * adapted to match the REAL backend contract confirmed against http://192.168.124.33:8080/v2/api-docs.
 * Denormalized display fields the Figma mock invented (categoryName/supplierName on resources whose
 * real backend entity doesn't carry them) are stripped here so Mock mode exercises the same shape as HTTP mode.
 */
export const mockData: { [K in ResourceKey]: ResourceTypeMap[K][] } = {
    batches: design.BATCHES.map((row) => ({ ...row })),
    batchParts: design.BATCH_PARTS.map((row) => ({ ...row })) as ResourceTypeMap['batchParts'][],
    packages: design.PACKAGES.map(({ categoryName: _categoryName, ...row }) => ({ ...row })) as ResourceTypeMap['packages'][],
    packageParts: design.BATCH_PARTS.filter((row) => row.packageId).map((row) => ({
        id: `pp-${row.id}`,
        packageId: row.packageId,
        partId: row.id,
        partDrawingNo: row.partDrawingNo,
    })),
    suppliers: design.SUPPLIERS.map((row) => ({ ...row })) as ResourceTypeMap['suppliers'][],
    performances: design.PERFORMANCES.map(({ supplierName: _supplierName, ...row }) => ({ ...row })),
    supplierCategories: design.SUPPLIER_CATEGORIES.map(({ categoryName: _categoryName, ...row }) => ({ ...row })),
    categories: design.CATEGORY_MASTERS.map((row) => ({ ...row })) as ResourceTypeMap['categories'][],
    specialCategories: design.CATEGORY_CONFIGS.map(({ categoryName: _categoryName, ...row }) => ({ ...row })) as ResourceTypeMap['specialCategories'][],
    rankingSnapshots: design.RANKINGS.map(({ supplierName: _supplierName, categoryName: _categoryName, ...row }) => ({
        ...row,
    })) as ResourceTypeMap['rankingSnapshots'][],
    roundRobinCursors: design.CATEGORY_MASTERS.slice(0, 3).map((category, index) => ({
        id: `cursor-${category.id}`,
        categoryId: category.id,
        qualityLevel: index === 2 ? ('普通' as const) : ('优质' as const),
        rankingYear: 2026,
        rankingMonth: 7,
        lastSelectedRank: index,
        lastSupplierId: design.SUPPLIER_CATEGORIES.find((row) => row.categoryId === category.id)?.supplierId,
        recommendOrder: index + 1,
    })),
    recommendations: design.RECOMMENDATIONS.map((row) => ({ ...row })) as ResourceTypeMap['recommendations'][],
    historySuppliers: design.BATCH_PARTS.filter((row) => row.historySupplier1).map((row) => ({
        id: `history-${row.id}`,
        partId: row.id,
        supplierName: row.historySupplier1,
        sortOrder: 1,
    })),
    leftRightRules: design.RIGHT_RULES.map((row) => ({ ...row })),
    leftRightManuals: design.RIGHT_MANUALS.map((row) => ({ ...row, aircraftModel: row.leftPartDrawingNo.split('-')[0] })),
    typePackageConfigs: design.TYPE_CONFIGS.map((row, index) => ({ ...row, sortOrder: index + 1 })) as ResourceTypeMap['typePackageConfigs'][],
    operationLogs: design.OPERATION_LOGS.map((row) => ({
        id: row.id,
        batchId: row.targetObject.startsWith('SUB-') ? row.targetObject : undefined,
        operationType: row.operationType,
        operationDetail: `${row.targetModule} · ${row.targetObject} · ${row.result}${row.remark ? ` · ${row.remark}` : ''}`,
        operator: row.operator,
    })),
    systemOperateLogs: design.SYSTEM_LOGS.map((row) => ({
        id: row.id,
        userId: row.operator,
        userIp: row.operatorIp,
        module: row.targetModule,
        name: row.operationType,
        requestUrl: row.targetObject,
        resultType: row.result === '成功' ? 1 : 2,
        resultMsg: row.remark,
        startTime: row.operateTime,
    })),
}
