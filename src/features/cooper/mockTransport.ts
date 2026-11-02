import * as data from './mock'
import { getActivePinia } from 'pinia'
import { useAdminInfo } from '/@/stores/adminInfo'
import type { Gateway, RequestOptions } from './http'
import type { CalendarEventDto, CreateEventPayload, DayGroupedSearchRequest } from './types'
const envelope = (value: unknown, count = 0, arr: unknown[] = []) => ({ code: 1, msg: '成功', time: Date.now(), count, data: value, arr })
let subscribed = ['ch-11', 'ch-21']
export async function mockRequest(gateway: Gateway, path: string, options: RequestOptions = {}) {
    const query = options.query || {},
        method = options.method || 'GET'
    const params = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search)
    const configured = Number(params.get('mockDelay') ?? import.meta.env.VITE_COOPER_MOCK_DELAY ?? 850)
    const delay = Math.max(100, Math.min(30000, Number.isFinite(configured) ? configured : 850))
    await new Promise<void>((resolve, reject) => {
        const abort = () => {
            clearTimeout(timer)
            reject(new DOMException('Aborted', 'AbortError'))
        }
        const timer = setTimeout(
            () => {
                options.signal?.removeEventListener('abort', abort)
                resolve()
            },
            delay + Math.floor(Math.random() * 250)
        )
        if (options.signal?.aborted) abort()
        else options.signal?.addEventListener('abort', abort, { once: true })
    })
    if (params.get('mockError') === 'all' || params.get('mockError') === path) throw new Error('模拟网络异常，请重试')
    // Match gateway + method + path; return the original wire envelope before each API unwraps it.
    const key = `${gateway} ${method} ${path}`
    switch (key) {
        case 'Cooper GET /api/app/skc-tXL/get-skc-org':
            return data.directoryOrganizations
        case 'Cooper GET /api/app/skc-tXL/get-context':
            return data.directoryPeople
        case 'Cooper GET /api/app/news':
            return data.imgNews
                .filter((n) => !query.Type || String(n.Type) === query.Type)
                .slice((Number(query.Pageindex || 1) - 1) * Number(query.Pagesize || 10), Number(query.Pageindex || 1) * Number(query.Pagesize || 10))
        case 'Cooper GET /api/app/news-kuai-bao/get-news-kuai-bao':
            return data.kuaibao.slice(0, Number(query.num || 10))
        case 'Cooper GET /api/app/news-center':
            return envelope(data.channels)
        case 'Cooper POST /api/app/channel/tree-channel':
            return envelope(data.channels)
        case 'Cooper GET /api/app/focus-subscription/focus-subscription-list':
            return data.channels
                .filter((c) => subscribed.includes(c.Id))
                .map((c) => ({ Id: c.Id, Title: c.Title, Number: String(data.channelNews[c.DxE_id]?.length || 0) }))
        case 'Cooper POST /api/app/focus-subscription/update-focus-subscription':
            subscribed = [...(options.body as string[])]
            return '保存成功'
        case 'Cooper GET /api/app/software-download/index':
            return envelope({
                list: [
                    {
                        Id: 'software-guide',
                        DxE_id: 1,
                        Icon: '',
                        url: '/mock-assets/download-guide.txt',
                        Title: '协同平台使用说明（演示）',
                        CreateTime: '2026-10-27T09:00:00',
                    },
                ],
                total: 1,
                remark: '',
            })
        case 'Cooper GET /api/app/tables-download/index':
            return envelope({
                list: [
                    {
                        Id: 'table-guide',
                        DxE_id: 1,
                        pId: 0,
                        ColumnTitle: '办公表格下载说明（演示）',
                        DownloadLink: '/mock-assets/download-guide.txt',
                        Icon: '',
                        CreateTime: '2026-10-27T09:00:00',
                        children: [],
                    },
                ],
                total: 1,
                remark: '',
            })
        case 'Cooper GET /api/app/news-center/get-context': {
            const r = data.queryChannel(query as never)
            return envelope(null, r.count, r.arr)
        }
        case 'Cooper GET /api/app/news/detail':
            return data.newsDetail(String(query.id))
        case 'Cooper POST /api/app/notice/popup-notice':
            return data.notices.slice(0, 3)
        case 'Cooper GET /api/app/notice': {
            const rows = data.notices.filter(
                (n) =>
                    (!query.keyword || n.Title.includes(String(query.keyword))) &&
                    (!query.startTime || n.CreateTime >= String(query.startTime)) &&
                    (!query.endTime || n.CreateTime.slice(0, 10) <= String(query.endTime).slice(0, 10))
            )
            return envelope(
                rows.slice((Number(query.Pageindex) - 1) * Number(query.Pagesize), Number(query.Pageindex) * Number(query.Pagesize)),
                rows.length
            )
        }
        case 'Cooper GET /api/app/on-duty/get-list':
            return envelope(data.queryOnDuty(options.query as never, getActivePinia() ? (useAdminInfo().nickname || useAdminInfo().username) : undefined))
        case 'newOA GET /api/app/apply-meeting/passed-room':
            return envelope(data.meetings)
        case 'Cooper GET /api/app/fault/get-fault-table-message':
            return { list: data.faults }
        case 'Cooper GET /api/app/z-zPWT/get-zZPWTMessage':
            return data.zzpwt
        case 'Cooper GET /api/app/customization/index':
            return envelope({ list: data.systems, total: data.systems.length, remark: '' })
        case 'Cooper GET /api/app/personal/common-system-show-list':
            return data.systems.filter((s) => data.myIds.includes(s.Id))
        case 'Cooper POST /api/app/personal/update-common-system':
            data.myIds.splice(0, data.myIds.length, ...(options.body as string[]))
            return data.myIds.map((id) => data.systems.find((s) => s.Id === id)!)
        case 'Cooper GET /api/app/hot-work': {
            const rows = data.hotWork.filter((w) => !query.userName || w.userName.includes(String(query.userName)))
            return envelope({
                list: rows.slice((Number(query.pageNo) - 1) * Number(query.pageSize), Number(query.pageNo) * Number(query.pageSize)),
                total: rows.length,
                remark: '',
            })
        }
        case 'Cooper GET /api/app/honor':
            return envelope(data.honors.slice(0, Number(query.Limit || 24)))
        case 'newOA GET /api/app/leader-schedule/by-time':
            return envelope(data.leaderSchedule)
        case 'Cooper GET /api/calendar/events':
            return data.calendar.filter((e) => new Date(e.startAt).getTime() < new Date(String(query.end)).getTime() && new Date(e.endAt).getTime() > new Date(String(query.start)).getTime())
        case 'Cooper POST /api/calendar/events': {
            const item: CalendarEventDto = {
                ...(options.body as CreateEventPayload),
                id: `event-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                source: 'USER',
            }
            data.calendar.push(item)
            return item
        }
        case 'Cooper GET /api/calendar/notifications/unread':
            return data.reminders.filter((n) => !n.read)
        case 'processRouter GET /api/tasks/pending':
            return envelope({ items: data.todos.slice((Number(query.pageIndex || 1) - 1) * Number(query.pageSize || 100), Number(query.pageIndex || 1) * Number(query.pageSize || 100)) })
        case 'MessageCenter GET /api/message-center/my':
            return { items: data.messages.slice((Number(query.page || 1) - 1) * Number(query.limit || 100), Number(query.page || 1) * Number(query.limit || 100)) }
        case 'aura POST /api/search/day-grouped':
            return data.auraDayGrouped(options.body as DayGroupedSearchRequest)
        case 'aura POST /api/search/search':
            return data.auraSearch(options.body as DayGroupedSearchRequest)
        case 'Cooper GET /api/app/prev-view/get-html-data':
            throw new Error('预览接口返回 DTO 待核实，请在联调时配置预览数据解析器')
        case 'likeFeatureUrl GET /api/views/count':
            return { data: data.views[String(query.newsId)] || 0 }
        case 'likeFeatureUrl GET /api/likes/count':
            return { data: data.likes[String(query.newsId)] || 0 }
        case 'likeFeatureUrl POST /api/views/record': {
            const id=String((options.body as {newsId:string}).newsId);data.views[id]=(data.views[id]||0)+1;return
        }
        case 'likeFeatureUrl POST /api/likes/toggle': {
            const id=String((options.body as {newsId:string}).newsId);data.liked[id]=!data.liked[id];data.likes[id]=(data.likes[id]||0)+(data.liked[id]?1:-1);return
        }
        case 'likeFeatureUrl GET /api/likes/status':
            return { data: !!data.liked[String(query.newsId)] }
    }
    const event = path.match(/^\/api\/calendar\/events\/([^/]+)$/)
    if (gateway === 'Cooper' && event) {
        const index = data.calendar.findIndex((e) => e.id === decodeURIComponent(event[1]))
        if (index < 0) throw new Error('日程不存在')
        if (method === 'DELETE') {
            data.calendar.splice(index, 1)
            return
        }
        if (method === 'PATCH') return Object.assign(data.calendar[index], options.body)
        if (method === 'GET') return data.calendar[index]
    }
    const message = path.match(/^\/api\/message-center\/messages\/([^/]+)\/read$/)
    if (gateway === 'MessageCenter' && method === 'POST' && message) {
        const i = data.messages.findIndex((m) => m.messageId === decodeURIComponent(message[1]))
        if (i >= 0) data.messages.splice(i, 1)
        return
    }
    const reminder = path.match(/^\/api\/calendar\/notifications\/([^/]+)\/read$/)
    if (gateway === 'Cooper' && method === 'POST' && reminder) {
        const n = data.reminders.find((r) => r.id === reminder[1])
        if (n) n.read = true
        return
    }
    throw new Error(`未定义的 Mock 接口：${key}`)
}
