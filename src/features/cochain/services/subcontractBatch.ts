import type {
    BatchImportResultVO,
    BatchStatusOptionVO,
    EntityId,
    OrchestrationResultVO,
    PackageVO,
    Result,
    SupplierRecommendationVO,
} from '../contracts'
import { downloadBlobResponse } from './download'
import { client } from './httpClient'
import { unwrap, unwrapWithMessage } from './resultUtils'

/**
 * 分包批次主流程专用接口，对应 docs/前端交接-上传分包调用流程.md §4-§8。
 * 不通过通用 ResourceService 的 create/update 冒充这些动作。
 */
export const subcontractBatchApi = {
    async uploadBatch(file: File, options: { aircraftModel?: string; operator?: string } = {}): Promise<BatchImportResultVO> {
        const form = new FormData()
        form.append('file', file)
        if (options.aircraftModel) form.append('aircraftModel', options.aircraftModel)
        if (options.operator) form.append('operator', options.operator)
        return unwrap((await client.post<Result<BatchImportResultVO>>('/api/subcontract/batch/upload', form)).data)
    },

    async fetchBatch(flowNo: string, operator?: string): Promise<BatchImportResultVO> {
        return unwrap(
            (await client.post<Result<BatchImportResultVO>>('/api/subcontract/batch/fetch', null, { params: { flowNo, operator } })).data
        )
    },

    async packageBatch(batchId: EntityId): Promise<{ packages: PackageVO[]; message: string }> {
        const { data, message } = unwrapWithMessage(
            (await client.post<Result<PackageVO[]>>(`/api/subcontract/batch/${encodeURIComponent(batchId)}/package`)).data
        )
        return { packages: data, message }
    },

    async recommendBatch(batchId: EntityId): Promise<{ recommendations: SupplierRecommendationVO[]; message: string }> {
        const { data, message } = unwrapWithMessage(
            (await client.post<Result<SupplierRecommendationVO[]>>(`/api/subcontract/batch/${encodeURIComponent(batchId)}/recommend`)).data
        )
        return { recommendations: data, message }
    },

    async runBatch(batchId: EntityId): Promise<OrchestrationResultVO> {
        return unwrap((await client.post<Result<OrchestrationResultVO>>(`/api/subcontract/batch/${encodeURIComponent(batchId)}/run`)).data)
    },

    async exportBatchResult(batchId: EntityId, batchNo: string): Promise<void> {
        const response = await client.get<Blob>(`/api/subcontract/batch/${encodeURIComponent(batchId)}/export`, { responseType: 'blob' })
        await downloadBlobResponse(response, `${batchNo || batchId}-供应商推荐清单.xlsx`)
    },

    async getStatusOptions(): Promise<BatchStatusOptionVO[]> {
        return unwrap((await client.get<Result<BatchStatusOptionVO[]>>('/api/subcontract/batch/status-options')).data)
    },
}
