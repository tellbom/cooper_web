import type { BaseEntity, EntityId, PageData, PageQuery } from '../contracts'

export interface ResourceService<T extends BaseEntity, Q extends PageQuery = PageQuery> {
    page(query?: Q): Promise<PageData<T>>
    list(query?: Q): Promise<T[]>
    get(id: EntityId): Promise<T>
    create(input: Omit<T, 'id'>): Promise<EntityId>
    update(input: T): Promise<boolean>
    remove(id: EntityId): Promise<boolean>
    removeMany(ids: EntityId[]): Promise<boolean>
    /** 导出 Excel 并触发浏览器下载；后端未提供该资源导出接口时会 reject。 */
    exportXls(query?: Q): Promise<void>
    /** 导入 Excel；返回后端导入结果（通常含 totalRows/successCount/errorCount/errors）。 */
    importXls(file: File): Promise<unknown>
}

export type MockScenario = 'normal' | 'empty' | 'error' | 'slow' | 'partial-upload'
