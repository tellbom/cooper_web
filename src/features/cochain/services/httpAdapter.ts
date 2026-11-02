import type { BaseEntity, EntityId, PageData, PageQuery, ResourceKey, ResourceTypeMap, Result } from '../contracts'
import { downloadBlobResponse } from './download'
import { client } from './httpClient'
import { resourceBasePaths, resourceImportConfig } from './resourceCatalog'
import { unwrap } from './resultUtils'
import type { ResourceService } from './types'

export const createHttpResourceService = <K extends ResourceKey>(key: K): ResourceService<ResourceTypeMap[K]> => {
    const basePath = resourceBasePaths[key]
    const importConfig = resourceImportConfig[key]
    return {
        async page(query: PageQuery = {}) {
            return unwrap((await client.get<Result<PageData<ResourceTypeMap[K]>>>(`${basePath}/page`, { params: query })).data)
        },
        async list(query: PageQuery = {}) {
            return unwrap((await client.get<Result<ResourceTypeMap[K][]>>(`${basePath}/list`, { params: query })).data)
        },
        async get(id: EntityId) {
            return unwrap((await client.get<Result<ResourceTypeMap[K]>>(`${basePath}/${encodeURIComponent(id)}`)).data)
        },
        async create(input: Omit<ResourceTypeMap[K], 'id'>) {
            return unwrap((await client.post<Result<EntityId>>(basePath, input)).data)
        },
        async update(input: ResourceTypeMap[K]) {
            return unwrap((await client.put<Result<boolean>>(basePath, input)).data)
        },
        async remove(id: EntityId) {
            return unwrap((await client.delete<Result<boolean>>(`${basePath}/${encodeURIComponent(id)}`)).data)
        },
        async removeMany(ids: EntityId[]) {
            return unwrap((await client.delete<Result<boolean>>(basePath, { data: ids })).data)
        },
        async exportXls(query: PageQuery = {}) {
            const response = await client.get<Blob>(`${basePath}/export`, { params: query, responseType: 'blob' })
            await downloadBlobResponse(response, `${key}-导出.xlsx`)
        },
        async importXls(file: File) {
            if (!importConfig) throw new Error('该资源未提供通用导入接口')
            const form = new FormData()
            form.append('file', file)
            const response = await client.request<Result<unknown>>({ url: importConfig.path, method: importConfig.method, data: form })
            return unwrap(response.data)
        },
    } as ResourceService<ResourceTypeMap[K] & BaseEntity>
}

