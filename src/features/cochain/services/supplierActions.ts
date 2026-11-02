import type { CategoryImportResultVO, EntityId, PerformanceUploadResultVO, Result } from '../contracts'
import { client } from './httpClient'
import { unwrap, unwrapWithMessage } from './resultUtils'

/**
 * 供应商相关专用接口（启停 / 绩效上传 / 排名快照生成 / 品类关联导入），
 * 均对应后端已实现的专用端点，不通过通用 CRUD 冒充。
 */
export const supplierActionsApi = {
    async setSupplierEnabled(id: EntityId, enabled: 0 | 1): Promise<boolean> {
        return unwrap((await client.put<Result<boolean>>(`/api/supplier/${encodeURIComponent(id)}/enabled`, null, { params: { enabled } })).data)
    },

    async uploadPerformance(file: File, year: number, month: number): Promise<PerformanceUploadResultVO> {
        const form = new FormData()
        form.append('file', file)
        return unwrap(
            (await client.post<Result<PerformanceUploadResultVO>>('/api/supplier/performance/upload', form, { params: { year, month } })).data
        )
    },

    /**
     * 后端 Swagger 声明该接口返回 Result<boolean>（不是 docs/api-documentation.md §2.7.1 描述的
     * 品类诊断结构体），因此这里只暴露 success + message；message 按文档示例包含品类生成/跳过的文字摘要。
     * 若后端后续把响应升级为结构化诊断对象，再补充 categories 字段。
     */
    async generateRankingSnapshot(year: number, month: number): Promise<{ success: boolean; message: string }> {
        const { data, message } = unwrapWithMessage(
            (await client.post<Result<boolean>>('/api/supplier/ranking-snapshot/generate', null, { params: { year, month } })).data
        )
        return { success: data, message }
    },

    async importSupplierCategory(file: File): Promise<CategoryImportResultVO> {
        const form = new FormData()
        form.append('file', file)
        return unwrap((await client.post<Result<CategoryImportResultVO>>('/api/supplier/category/importCategorySupplier', form)).data)
    },
}
