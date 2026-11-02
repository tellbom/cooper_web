import { http } from './http'

export interface Directory {
    organizations: { id: string; pid: string | null; name: string }[]
    people: { id: string; name: string; workNo: string; phone: string; position: string; orgId: string }[]
}
function rows(raw: unknown): Record<string, unknown>[] {
    // Section 3.15 documents the URLs but no DTO. This boundary accepts the existing
    // ContactSelector schema only; adapt it after confirming the intranet response.
    const value = raw as { data?: unknown }
    const list = Array.isArray(raw) ? raw : value?.data
    if (!Array.isArray(list) || list.some(row => !row || typeof row !== 'object')) throw new Error('通讯录数据格式暂不支持，请联系管理员')
    return list
}
function required(row: Record<string, unknown>, key: string) {
    const value = row[key]
    if ((typeof value !== 'string' && typeof value !== 'number') || String(value).trim() === '') throw new Error('通讯录数据字段不完整，请联系管理员')
    return String(value)
}
export async function getDirectory(): Promise<Directory> {
    const [organizations, people] = await Promise.all([
        http<unknown>('Cooper', '/api/app/skc-tXL/get-skc-org'),
        http<unknown>('Cooper', '/api/app/skc-tXL/get-context'),
    ])
    return {
        organizations: rows(organizations).map(row => ({ id: required(row, 'id'), name: required(row, 'name'), pid: row.pid == null ? null : String(row.pid) })),
        people: rows(people).map(row => ({
            id: required(row, 'id'), name: required(row, 'name'), workNo: required(row, 'workNo'),
            orgId: required(row, 'orgId'), phone: String(row.phone || ''), position: String(row.position || ''),
        })),
    }
}
