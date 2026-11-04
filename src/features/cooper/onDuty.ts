import dayjs from 'dayjs'
import type { OnDutyColumn, OnDutyRow, OnDutyTableResult } from './types'

/** Production spells this property `colums`; older documentation used `columns`. */
export function normalizeOnDuty(raw: unknown): OnDutyTableResult {
    const data = raw as Partial<OnDutyTableResult> & { columns?: OnDutyColumn[] }
    if (!data || !Array.isArray(data.list)) throw new Error('值班接口缺少 data.list')
    const colums = data.colums ?? data.columns ?? []
    if (!Array.isArray(colums) || colums.some(c => !c || typeof c.prop !== 'string' || !c.prop || typeof c.label !== 'string') || new Set(colums.map(c => c.prop)).size !== colums.length) {
        throw new Error('值班接口的 data.colums 格式不正确')
    }
    if (data.list.length && !colums.length) throw new Error('值班接口未返回列定义 data.colums')
    if (data.list.some(row => !row || typeof row !== 'object' || Array.isArray(row))) throw new Error('值班接口的 list 记录格式不正确')
    const total = Number(data.total)
    if (!Number.isFinite(total) || total < 0) throw new Error('值班接口的 data.total 格式不正确')
    return { total, colums, list: data.list, remark: typeof data.remark === 'string' ? data.remark : '' }
}

export const dutyText = (value: unknown) => value == null || value === '' ? '—' : String(value)
export const isDutyPerson = (prop: string) => ['gongduan', 'gongyi', 'shebei', 'weixiu', 'xietiaozhongxin', 'zhuanyechang'].includes(prop)
export function dutyDate(row: OnDutyRow) {
    const value = row.OnDutyTime
    if (!value || !/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(value)) return null
    const parsed = dayjs(value)
    return parsed.isValid() ? parsed : null
}
export function dutyDayDiff(row: OnDutyRow, now = new Date()) {
    return dutyDate(row)?.startOf('day').diff(dayjs(now).startOf('day'), 'day') ?? null
}
export const dutyMonthDay = (row: OnDutyRow) => dutyDate(row)?.format('M月D日') ?? '日期未提供'
export const dutyWeekday = (row: OnDutyRow) => {
    const date = dutyDate(row)
    return date ? ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.day()] : ''
}
export function dutyColumnWidth(column: OnDutyColumn) {
    const width = Number(String(column.width ?? '').replace(/px$/, ''))
    return Number.isFinite(width) && width > 0 ? width : undefined
}
