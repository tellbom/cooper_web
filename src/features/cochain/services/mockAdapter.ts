import type { BaseEntity, EntityId, PageData, PageQuery, ResourceKey, ResourceTypeMap } from '../contracts'
import { mockData } from '../mock/data'
import type { MockScenario, ResourceService } from './types'

const stores = new Map<ResourceKey, BaseEntity[]>()
let scenario: MockScenario = 'normal'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))

export const setMockScenario = (next: MockScenario) => {
    scenario = next
}

const beforeRequest = async () => {
    if (scenario === 'error') throw new Error('Mock 场景：服务暂时不可用')
    await wait(scenario === 'slow' ? 1200 : 120)
}

const getStore = <K extends ResourceKey>(key: K): ResourceTypeMap[K][] => {
    if (!stores.has(key)) stores.set(key, clone(mockData[key]) as BaseEntity[])
    return stores.get(key)! as ResourceTypeMap[K][]
}

const matches = (item: Record<string, unknown>, query: PageQuery) => {
    const ignored = new Set(['pageNo', 'pageSize'])
    return Object.entries(query).every(([field, value]) => {
        if (ignored.has(field) || value === undefined || value === null || value === '') return true
        return String(item[field] ?? '')
            .toLowerCase()
            .includes(String(value).toLowerCase())
    })
}

export const createMockResourceService = <K extends ResourceKey>(key: K): ResourceService<ResourceTypeMap[K]> => ({
    async page(query = {}) {
        await beforeRequest()
        const pageNo = Math.max(1, query.pageNo ?? 1)
        const pageSize = Math.max(1, query.pageSize ?? 20)
        const filtered = scenario === 'empty' ? [] : getStore(key).filter((item) => matches(item as unknown as Record<string, unknown>, query))
        const list = filtered.slice((pageNo - 1) * pageSize, pageNo * pageSize)
        return {
            list: clone(list),
            total: filtered.length,
        } as PageData<ResourceTypeMap[K]>
    },
    async list(query = {}) {
        await beforeRequest()
        return scenario === 'empty' ? [] : clone(getStore(key).filter((item) => matches(item as unknown as Record<string, unknown>, query)))
    },
    async get(id) {
        await beforeRequest()
        const item = getStore(key).find((row) => row.id === id)
        if (!item) throw new Error('记录不存在或已被删除')
        return clone(item)
    },
    async create(input) {
        await beforeRequest()
        const comparable = JSON.stringify(input)
        const duplicated = getStore(key).some(
            (row) => JSON.stringify(Object.fromEntries(Object.entries(row).filter(([field]) => field !== 'id'))) === comparable
        )
        if (duplicated) throw new Error('已存在相同记录，请勿重复提交')
        const id = `MOCK-${Date.now()}`
        getStore(key).unshift({ ...clone(input), id } as ResourceTypeMap[K])
        return id
    },
    async update(input) {
        await beforeRequest()
        const rows = getStore(key)
        const index = rows.findIndex((row) => row.id === input.id)
        if (index < 0) return false
        rows[index] = clone(input)
        return true
    },
    async remove(id: EntityId) {
        await beforeRequest()
        const rows = getStore(key)
        const index = rows.findIndex((row) => row.id === id)
        if (index < 0) return false
        rows.splice(index, 1)
        return true
    },
    async removeMany(ids: EntityId[]) {
        await beforeRequest()
        const idSet = new Set(ids)
        stores.set(
            key,
            getStore(key).filter((row) => !idSet.has(row.id))
        )
        return true
    },
    async exportXls() {
        await beforeRequest()
        const blob = new Blob(['Mock 导出：当前为 Mock 模式，未连接真实后端。'], { type: 'application/vnd.ms-excel' })
        const blobUrl = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = `${key}-mock-导出.xlsx`
        link.click()
        URL.revokeObjectURL(blobUrl)
    },
    async importXls() {
        await beforeRequest()
        return { totalRows: 0, successCount: 0, errorCount: 0, errors: [] }
    },
})
