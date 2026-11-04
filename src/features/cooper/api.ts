import DOMPurify from 'dompurify'
import { http } from './http'
import type * as T from './types'
import { normalizeOnDuty } from './onDuty'
export * from './types'
type Envelope<T> = { data: T; arr: T[]; count: number }
export const getnewsimgApi = (query: Record<string, unknown>) => http<T.NewsListDto[]>('Cooper', '/api/app/news', { query })
export const getNewsKuaiBao = (num = 10) => http<T.NewsKuaiBaoDto[]>('Cooper', '/api/app/news-kuai-bao/get-news-kuai-bao', { query: { num } })
export const getnewscenterapi = async () => (await http<Envelope<T.ChannelChildrenDto[]>>('Cooper', '/api/app/news-center')).data
export const getNewsDetail = (query: { ChannelID: number; Page: number; Limit: number; search?: string }) =>
    http<Envelope<T.NewsContextDto>>('Cooper', '/api/app/news-center/get-context', { query })
export const getNewsDetailitemapi = (id: string) => http<T.NewsDto>('Cooper', '/api/app/news/detail', { query: { id } })
export const getPopupnoticeapi = () => http<T.CooperNotice[]>('Cooper', '/api/app/notice/popup-notice', { method: 'POST' })
export const getnoticesApi = (query: { Pageindex: number; Pagesize: number; startTime?: string; endTime?: string; keyword?: string }) =>
    http<Envelope<T.CooperNotice[]>>('Cooper', '/api/app/notice', { query })
export const getOnDutyList = async (query?: { isMySelf?: boolean; context?: string; page?: number; limit?: number }) =>
    normalizeOnDuty((await http<Envelope<T.OnDutyTableResult>>('Cooper', '/api/app/on-duty/get-list', { query })).data)
export const getmeetingInfos = async () => (await http<Envelope<T.MeetingInfo[]>>('newOA', '/api/app/apply-meeting/passed-room')).data
function faultRows<T>(raw: T[] | { list: T[] }, fields: string[]): T[] {
    const rows = Array.isArray(raw) ? raw : raw?.list
    if (!Array.isArray(rows)) throw new Error('故障列表返回格式不正确')
    if (rows.some(row => !row || typeof row !== 'object' || fields.some(field => !Object.prototype.hasOwnProperty.call(row, field))))
        throw new Error('故障列表字段与接口约定不一致')
    return rows
}
export const getFaultTableMessageapi = async () => faultRows(await http<T.FaultDto[] | { list: T.FaultDto[] }>('Cooper', '/api/app/fault/get-fault-table-message'), ['SMBC', 'SS_GZNR', 'GZFS_SJ', 'State'])
export const getZZPWTMessageapi = async () => faultRows(await http<T.ZZPWTDto[] | { list: T.ZZPWTDto[] }>('Cooper', '/api/app/z-zPWT/get-zZPWTMessage'), ['JX', 'LJTH', 'DQZT', 'TCSJ', 'ZRXM'])
export const getcustomizationapi = async () =>
    (await http<Envelope<{ list: T.CommonSystemOutDto[] }>>('Cooper', '/api/app/customization/index', { query: { search: [], limit: 100 } })).data
        .list
export const getmypersonalapi = (UserID: string) =>
    http<T.CommonSystemOutDto[]>('Cooper', '/api/app/personal/common-system-show-list', { query: { UserID } })
export const postmypersonalapi = (UserID: string, body: string[]) =>
    http<T.CommonSystemOutDto[]>('Cooper', '/api/app/personal/update-common-system', { method: 'POST', query: { UserID }, body })
export const getSoftwareDownloads = async () =>
    (await http<Envelope<{ list: T.SoftwareDownloadOutDto[] }>>('Cooper', '/api/app/software-download/index', { query: { search: [], limit: 100 } }))
        .data.list
export const getTableDownloads = async () =>
    (await http<Envelope<{ list: T.TablesDownloadChildrenDto[] }>>('Cooper', '/api/app/tables-download/index', { query: { search: [] } })).data.list
export const getSubscriptions = (UserID: string) =>
    http<T.ShowFocusSubscriptionListDto[]>('Cooper', '/api/app/focus-subscription/focus-subscription-list', { query: { UserID } })
export const saveSubscriptions = (UserID: string, body: string[]) =>
    http<string>('Cooper', '/api/app/focus-subscription/update-focus-subscription', { method: 'POST', query: { UserID }, body })
export const getChannelTree = async () =>
    (await http<Envelope<T.ChannelChildrenDto[]>>('Cooper', '/api/app/channel/tree-channel', { method: 'POST', body: {} })).data
export const getHotwork = async (query: {
    pageNo: number
    pageSize: number
    userName?: string
    plant?: string
    workType?: string
    hazardousWorkArea?: string
    createTimeRange?: string
}) => (await http<Envelope<{ list: T.HotWorkDto[]; total: number }>>('Cooper', '/api/app/hot-work', { query })).data
export const getHonorapi = async (Limit = 24) => (await http<Envelope<T.HonorDto[]>>('Cooper', '/api/app/honor', { query: { Limit } })).data
export const getLeadershipAgenda = async () => (await http<Envelope<T.LeaderSchedule[]>>('newOA', '/api/app/leader-schedule/by-time')).data
export const listCalendarEvents = (start: string, end: string) =>
    http<T.CalendarEventDto[]>('Cooper', '/api/calendar/events', { query: { start, end } })
export const createCalendarEvent = (body: T.CreateEventPayload) =>
    http<T.CalendarEventDto>('Cooper', '/api/calendar/events', { method: 'POST', body })
export const updateCalendarEvent = (id: string, body: T.CreateEventPayload) =>
    http<T.CalendarEventDto>('Cooper', `/api/calendar/events/${encodeURIComponent(id)}`, { method: 'PATCH', body })
export const deleteCalendarEvent = (id: string) => http<void>('Cooper', `/api/calendar/events/${encodeURIComponent(id)}`, { method: 'DELETE' })
export const getReminders = () => http<T.PortalNotificationDto[]>('Cooper', '/api/calendar/notifications/unread')
export const readReminder = (id: string) => http<void>('Cooper', `/api/calendar/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' })
// The document exposes items but no total field. Count the actual paged records instead of inventing a total.
async function collectInbox<T>(fetchPage: (page: number) => Promise<T[]>, key: (row: T) => string) {
    const records = new Map<string, T>()
    for (let page = 1; ; page++) {
        const rows = await fetchPage(page), previousSize = records.size
        rows.forEach(row => records.set(key(row), row))
        if (rows.length < 100 || records.size === previousSize) break
    }
    return [...records.values()]
}
export const mytodo = (employeeId: string) => collectInbox(async pageIndex =>
    (await http<Envelope<{ items: T.PendingTaskItem[] }>>('processRouter', '/api/tasks/pending', {
        query: { employeeId, pageIndex, pageSize: 100 },
    })).data.items, row => row.taskId)
export const myMessages = () => collectInbox(async page =>
    (await http<{ items: T.MessageCenterItem[] }>('MessageCenter', '/api/message-center/my', {
        query: { view: 'unread', page, limit: 100 },
    })).items, row => row.messageId)
export const readMessage = (id: string) =>
    http<void>('MessageCenter', `/api/message-center/messages/${encodeURIComponent(id)}/read`, { method: 'POST' })
export type SearchView = { displayMode: 'results'; data: T.SearchResponse } | { displayMode: 'days'; data: T.DayGroupedSearchResponse }
export const searchNews = (body: T.DayGroupedSearchRequest): Promise<SearchView> =>
    body.query.trim()
        ? http<T.SearchResponse>('aura', '/api/search/search', { method: 'POST', body }).then((data) => ({ displayMode: 'results' as const, data }))
        : http<T.DayGroupedSearchResponse>('aura', '/api/search/day-grouped', { method: 'POST', body }).then((data) => ({
              displayMode: 'days' as const,
              data,
          }))
export const getPreviewHtml = (ID: string) => http<unknown>('Cooper', '/api/app/prev-view/get-html-data', { query: { ID } })
export const countviews = async (newsId: string) => (await http<{ data: number }>('likeFeatureUrl', '/api/views/count', { query: { newsId } })).data
export const likescount = async (newsId: string) => (await http<{ data: number }>('likeFeatureUrl', '/api/likes/count', { query: { newsId } })).data
export const likesstatus = async (newsId: string) =>
    (await http<{ data: boolean }>('likeFeatureUrl', '/api/likes/status', { query: { newsId } })).data
// POST DTOs are absent in the document. The prototype assumes {newsId}; verify this adapter during live integration.
const likeFeatureBody = (newsId:string) => ({newsId})
export const recordView = (newsId:string) => http<unknown>('likeFeatureUrl','/api/views/record',{method:'POST',body:likeFeatureBody(newsId)})
export const toggleLike = (newsId:string) => http<unknown>('likeFeatureUrl','/api/likes/toggle',{method:'POST',body:likeFeatureBody(newsId)})
export function sanitizeHtml(html: string) {
    const clean = DOMPurify.sanitize(html, { FORBID_TAGS: ['style', 'iframe', 'form', 'input', 'button'], FORBID_ATTR: ['srcdoc', 'target'] })
    const doc = new DOMParser().parseFromString(clean, 'text/html')
    const allowed = new Set([
        'color',
        'background-color',
        'font-weight',
        'font-style',
        'text-align',
        'text-indent',
        'text-decoration',
        'font-size',
        'line-height',
        'margin',
        'margin-left',
        'margin-right',
        'margin-top',
        'margin-bottom',
        'padding',
        'padding-left',
        'padding-right',
        'border',
        'border-collapse',
        'width',
        'max-width',
        'height',
    ])
    doc.querySelectorAll<HTMLElement>('[style]').forEach((el) => {
        Array.from(el.style).forEach((property) => {
            if (!allowed.has(property) || /url\s*\(|expression\s*\(|@import/i.test(el.style.getPropertyValue(property)))
                el.style.removeProperty(property)
        })
        if (!el.style.length) el.removeAttribute('style')
    })
    return doc.body.innerHTML
}
export const htmlText = (html: string) => new DOMParser().parseFromString(html, 'text/html').body.textContent || ''
