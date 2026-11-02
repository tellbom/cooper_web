/**
 * 首页 API 层 —— 严格按《协同工作平台 前端首页 API 接口整理文档》定义。
 * 每个函数注明：方法 / 路径 / 网关 / 读取位置。仅使用文档中出现的字段。
 * 原型阶段默认使用 mock（数据结构与 DTO 一致）；设置 VITE_USE_MOCK=false 走真实网关。
 */
import * as mock from './mock';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export const GATEWAY = {
  Cooper: '/cooperRouter',
  newOA: '/newOARouter',
  processRouter: '/processRouter',
  MessageCenter: '/MessageCenter',
  likeFeatureUrl: '/likeFeatureUrl',
  aura: '/aurasearchserviceUrl', // → VITE_AURA_URL
} as const;
type Gateway = keyof typeof GATEWAY;

async function http<T>(
  gw: Gateway,
  path: string,
  init: { method?: string; query?: Record<string, unknown>; body?: unknown } = {},
): Promise<T> {
  const qs = init.query
    ? '?' +
      new URLSearchParams(
        Object.entries(init.query)
          .filter(([, v]) => v !== undefined && v !== null)
          .map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : String(v)]),
      ).toString()
    : '';
  const res = await fetch(GATEWAY[gw] + path + qs, {
    method: init.method ?? 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  if (res.status === 204) return undefined as T;
  return res.json();
}
const delay = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(structuredClone(v)), 150));

/* ---------------- DTO（照录文档字段） ---------------- */
export interface NewsKuaiBaoDto { Id: string; Title: string; Author: string; Content: string; CreateTime: string }
export interface NewsListDto {
  Id: string; DxE_id: number; Title: string; Content: string; Abstract: string; ChannelID: number;
  ChannelTitle: string; IsTop: number; Author: string; CreateTime: string; Hits: number; Cover: string;
  Creater: string; Type: number; ApproveState: string;
}
export interface NewsContextDto {
  Id: string; Title: string; Content: string; Abstract: string; ChannelID: string; ChannelTitle: string;
  IsTop: number; Author: string; CreateTime: string; Hits: number; Cover: string; isImage: boolean;
}
export interface NewsDto {
  DxE_id: number; Id: string; Title: string; Subheading: string; Abstract: string; Content: string;
  ChannelID: string; ChannelTitle: string; IsTop: number; Author: string; Creater: string;
  CreateTime: string; Hits: number; Type: string; Cover: string;
}
export interface ChannelChildrenDto {
  Id: string; DxE_id: number; Parentid: number; Selfid: number; weigh: number; Title: string;
  CreateTime: string; Describe: string; Icon: string; children: ChannelChildrenDto[];
}
export interface MeetingInfo { meetingTitle: string; roomName: string; startTime: string; endTime: string }
export interface OnDutyTableResult { total: number; list: Array<Record<string, string>>; columns: unknown[]; remark: string }
export interface FaultDto {
  SBMC: string; GZFS_SJ: string | null; GS_GZNR: string; CBGZPC_SJ: string | null; TWO_PC_SJ: string | null;
  GD_PC_SJ: string | null; GZPC_SJ: string | null; State: string;
}
export interface ZZPWTDto { JX: string; LJTH: string; DQZT: string; ZRXM: string; TCSJ: string }
export interface CommonSystemOutDto {
  DxE_id: number; Id: string; Name: string; Icon: string; JumpLink: string; Details: string;
  CreateTime: string; isIE: string; isToken: string;
}
export interface HotWorkDto {
  Id: string; plant: string; workType: string; hazardousWorkArea: string; className: string;
  screateTime: string; ecreateTime: string; userName: string; phone: string;
}
export interface HonorDto { Id: string; weigh: number; DxE_id: number; Title: string; Awardee: string; Avatar: string; CreateTime: string }
export interface LeaderSchedule { leaderName: string; leaderID: string; startTime: string; endTime: string; activity: string }
export interface CalendarEventDto {
  id: string; title: string; description: string | null; location: string | null;
  startAt: string; endAt: string; reminderMinutes: number; source: 'USER' | 'AGENT';
}
export type CreateEventPayload = Omit<CalendarEventDto, 'id' | 'source'>;
export interface PendingTaskItem {
  taskId: string; businessType: string; businessTitle: string; taskName: string;
  actionDescription: string; createTime: string; businessId: string;
}
export interface MessageCenterItem { messageId: string; sourceSystem: string; content: string; createdAt: string; url: string }
interface HttpCode<T> { code: number; msg: string; time: number; count: number; data: T; arr: T[] }

/* ---------------- 新闻（3.1） ---------------- */
/** GET /api/app/news · Cooper · 直接返回数组 */
export const getnewsimgApi = (p: { Type: '0' | '1'; Pageindex: number; Pagesize: number }) =>
  USE_MOCK ? delay(mock.imgNews) : http<NewsListDto[]>('Cooper', '/api/app/news', { query: p });
/** GET /api/app/news-kuai-bao/get-news-kuai-bao · Cooper · 直接返回数组 */
export const getNewsKuaiBao = (num = 10) =>
  USE_MOCK ? delay(mock.kuaibao.slice(0, num)) : http<NewsKuaiBaoDto[]>('Cooper', '/api/app/news-kuai-bao/get-news-kuai-bao', { query: { num } });
/** GET /api/app/news-center · Cooper · res.data */
export const getnewscenterapi = async () =>
  USE_MOCK ? delay(mock.channels) : (await http<HttpCode<ChannelChildrenDto[]>>('Cooper', '/api/app/news-center')).data;
/** GET /api/app/news-center/get-context · Cooper · res.arr + res.count */
export const getNewsDetail = async (p: { ChannelID: number; Page: number; Limit: number; search?: string }) => {
  if (USE_MOCK) return delay(mock.queryChannel(p));
  const r = await http<HttpCode<NewsContextDto>>('Cooper', '/api/app/news-center/get-context', { query: p });
  return { arr: r.arr, count: r.count };
};
/** GET /api/app/news/detail?id= · Cooper · 直接返回对象 */
export const getNewsDetailitemapi = (id: string) =>
  USE_MOCK ? Promise.resolve().then(() => mock.newsDetail(id)).then(delay) : http<NewsDto>('Cooper', '/api/app/news/detail', { query: { id } });

/** POST /api/app/channel/tree-channel · Cooper · res.data 树形 */
export const getallfocussubscription = async (search?: string) =>
  USE_MOCK
    ? delay(mock.channels.filter((c) => !search || JSON.stringify(c).includes(search)))
    : (await http<HttpCode<ChannelChildrenDto[]>>('Cooper', '/api/app/channel/tree-channel', { method: 'POST', body: { search } })).data;

/* ---------------- 点赞 / 浏览（3.14，likeFeatureUrl） ---------------- */
/** GET /api/views/count?newsId= · res.data 浏览数 */
export const countviews = async (newsId: string) =>
  USE_MOCK ? delay(mock.views[newsId] ?? 0) : (await http<{ data: number }>('likeFeatureUrl', '/api/views/count', { query: { newsId } })).data;
/** GET /api/likes/status?newsId= · res.data 是否已赞 */
export const likesstatus = async (newsId: string) =>
  USE_MOCK ? delay(!!mock.liked[newsId]) : (await http<{ data: boolean }>('likeFeatureUrl', '/api/likes/status', { query: { newsId } })).data;
/** GET /api/likes/count?newsId= · res.data 点赞数 */
export const likescount = async (newsId: string) =>
  USE_MOCK ? delay(mock.likes[newsId] ?? 0) : (await http<{ data: number }>('likeFeatureUrl', '/api/likes/count', { query: { newsId } })).data;
/**
 * 原文 countrecord / likestoggle 仅写“body 数据（原文未给字段）”，返回 “-”。
 * 请求体统一由此构造，字段【待核实】—— 联调时以源码 / 抓包为准只改这一处。
 */
export const likeFeatureBody = (newsId: string): Record<string, unknown> => ({ newsId });
/** POST /api/views/record · 记录浏览 */
export const countrecord = (newsId: string) => {
  if (USE_MOCK) { mock.views[newsId] = (mock.views[newsId] ?? 0) + 1; return delay(undefined); }
  return http<unknown>('likeFeatureUrl', '/api/views/record', { method: 'POST', body: likeFeatureBody(newsId) });
};
/** POST /api/likes/toggle · 点赞 / 取消 */
export const likestoggle = (newsId: string) => {
  if (USE_MOCK) {
    mock.liked[newsId] = !mock.liked[newsId];
    mock.likes[newsId] = (mock.likes[newsId] ?? 0) + (mock.liked[newsId] ? 1 : -1);
    return delay(undefined);
  }
  return http<unknown>('likeFeatureUrl', '/api/likes/toggle', { method: 'POST', body: likeFeatureBody(newsId) });
};

/* ---------------- 值班与会议（3.5） ---------------- */
/** GET /api/app/on-duty/get-list · Cooper · res.data.list / res.data.columns */
export interface OnDutyQuery { isMySelf?: boolean; context?: string; page?: number; limit?: number }
/** 首页传 null；二级弹窗：isMySelf=true 查我的值班，context 关键字、page/limit 分页查全部 */
export const getOnDutyList = async (p: OnDutyQuery | null = null) =>
  USE_MOCK
    ? delay(mock.queryOnDuty(p))
    : (await http<HttpCode<OnDutyTableResult>>('Cooper', '/api/app/on-duty/get-list', p ? { query: p as Record<string, unknown> } : {})).data;
/** GET /api/app/apply-meeting/passed-room · newOA · res.data[] */
export const getmeetingInfos = async () =>
  USE_MOCK ? delay(mock.meetings) : (await http<HttpCode<MeetingInfo[]>>('newOA', '/api/app/apply-meeting/passed-room')).data;

/* ---------------- 故障与制造问题（3.6） ---------------- */
/** GET /api/app/fault/get-fault-table-message · Cooper · 直接返回数组 */
export const getFaultTableMessageapi = () =>
  USE_MOCK ? delay(mock.faults) : http<FaultDto[]>('Cooper', '/api/app/fault/get-fault-table-message');
/** GET /api/app/z-ZPWT/get-ZZPWTMessage · Cooper · 直接返回数组（路径大小写待核实） */
export const getZZPWTMessageapi = () =>
  USE_MOCK ? delay(mock.zzpwt) : http<ZZPWTDto[]>('Cooper', '/api/app/z-ZPWT/get-ZZPWTMessage');

/* ---------------- 常用系统（3.7 / 3.10） ---------------- */
/** GET /api/app/customization/index · Cooper · res.data.list */
export const getcustomizationapi = async () =>
  USE_MOCK
    ? delay(mock.systems)
    : (await http<HttpCode<{ list: CommonSystemOutDto[] }>>('Cooper', '/api/app/customization/index', { query: { search: [], limit: 100 } })).data.list;
/** GET /api/app/personal/common-system-show-list · Cooper · 直接返回数组 */
export const getmypersonalapi = (UserID: string) =>
  USE_MOCK ? delay(mock.systems.filter((s) => mock.myIds.includes(s.Id))) : http<CommonSystemOutDto[]>('Cooper', '/api/app/personal/common-system-show-list', { query: { UserID } });
/** POST /api/app/personal/update-common-system?UserID= · Cooper · body string[] */
export const postmypersonalapi = (UserID: string, ids: string[]) => {
  if (USE_MOCK) {
    mock.myIds.splice(0, mock.myIds.length, ...ids);
    return delay(mock.systems.filter((s) => ids.includes(s.Id)));
  }
  return http<CommonSystemOutDto[]>('Cooper', `/api/app/personal/update-common-system?UserID=${encodeURIComponent(UserID)}`, { method: 'POST', body: ids });
};

/* ---------------- 技改协调 → 热点工作接口（3.4） ---------------- */
/** GET /api/app/hot-work · Cooper · res.data.list（BaTableDto） */
export const getHotwork = async (p: { pageNo: number; pageSize: number; userName?: string }) =>
  USE_MOCK
    ? delay(mock.hotWork)
    : (await http<HttpCode<{ total: number; list: HotWorkDto[]; remark: string }>>('Cooper', '/api/app/hot-work', { query: p })).data.list;

/* ---------------- 荣誉墙（3.8） ---------------- */
/** GET /api/app/honor · Cooper · res.data */
export const getHonorapi = async (Limit = 24) =>
  USE_MOCK ? delay(mock.honors) : (await http<HttpCode<HonorDto[]>>('Cooper', '/api/app/honor', { query: { Limit } })).data;

/* ---------------- 日程（3.11 / 8） ---------------- */
/** GET /api/app/leader-schedule/by-time · newOA · res.data[] */
export const getLeadershipAgenda = async () =>
  USE_MOCK ? delay(mock.leaderSchedule) : (await http<HttpCode<LeaderSchedule[]>>('newOA', '/api/app/leader-schedule/by-time')).data;
/** GET /api/calendar/events?start=&end= · Portal 日历(/cooperRouter) · CalendarEventDto[] */
export const listCalendarEvents = (start: string, end: string) =>
  USE_MOCK
    ? delay(mock.calendar.filter((e) => e.startAt < end && e.endAt > start))
    : http<CalendarEventDto[]>('Cooper', '/api/calendar/events', { query: { start, end } });
/** POST /api/calendar/events · CalendarEventDto */
export const createCalendarEvent = (p: CreateEventPayload) => {
  if (USE_MOCK) {
    const e: CalendarEventDto = { ...p, id: crypto.randomUUID(), source: 'USER' };
    mock.calendar.push(e);
    return delay(e);
  }
  return http<CalendarEventDto>('Cooper', '/api/calendar/events', { method: 'POST', body: p });
};
/** DELETE /api/calendar/events/{id} · 204 */
export const deleteCalendarEvent = (id: string) => {
  if (USE_MOCK) {
    const i = mock.calendar.findIndex((e) => e.id === id);
    if (i >= 0) mock.calendar.splice(i, 1);
    return delay(undefined);
  }
  return http<void>('Cooper', `/api/calendar/events/${id}`, { method: 'DELETE' });
};

/* ---------------- 待办 / 消息（3.12） ---------------- */
/** GET /api/tasks/pending · processRouter · res.data.items */
export const mytodo = async (employeeId: string) =>
  USE_MOCK
    ? delay(mock.todos)
    : (await http<HttpCode<{ items: PendingTaskItem[] }>>('processRouter', '/api/tasks/pending', { query: { employeeId, pageIndex: 1, pageSize: 20 } })).data.items;
/** GET /api/message-center/my?view=unread&page=1&limit=100 · MessageCenter · res.items */
export const myMessages = async () =>
  USE_MOCK ? delay(mock.messages) : (await http<{ items: MessageCenterItem[] }>('MessageCenter', '/api/message-center/my?view=unread&page=1&limit=100')).items;
/** POST /api/message-center/messages/{id}/read · MessageCenter */
export const readMessage = (id: string) => {
  if (USE_MOCK) {
    const i = mock.messages.findIndex((m) => m.messageId === id);
    if (i >= 0) mock.messages.splice(i, 1);
    return delay(undefined);
  }
  return http<void>('MessageCenter', `/api/message-center/messages/${id}/read`, { method: 'POST' });
};

/* ---------------- AURA 搜索（第九章，原生 fetch 直连，非 Axios） ---------------- */
export type SourceType = 'News' | 'Announcement';
export interface DayGroupedSearchRequest {
  query: string; sourceTypes: SourceType[]; publishTimeFrom?: string; publishTimeTo?: string; page: number; pageSize: number;
}
export interface SearchItem {
  newsId: string; title: string; highlight: string | null; publisher: string; author: string; sourceType: SourceType;
  publishTime: string; summary: string | null; contentHtml: string | null; cover: string | null;
}
export interface SearchDayGroup { date: string; items: SearchItem[] }
interface SearchMeta { searchTraceId: string; searchMode: string; degraded: boolean; degradationMode: string | null; maxDepthReached: boolean; page: number; pageSize: number }
export interface DayGroupedSearchResponse extends SearchMeta {
  totalDays: number; totalPages: number; totalItems: number; newsItems: number; announcementItems: number; days: SearchDayGroup[];
}
export interface SearchResponse extends SearchMeta { results: SearchItem[] }
export class AuraSearchError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
async function aura<T>(path: string, body: DayGroupedSearchRequest): Promise<T> {
  let res: Response;
  try {
    res = await fetch(GATEWAY.aura + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  } catch {
    throw new AuraSearchError(0, '网络不可达');
  }
  if (res.status === 503) throw new AuraSearchError(503, '搜索服务暂时不可用');
  if (!res.ok) throw new AuraSearchError(res.status, `${res.status}`);
  return res.json();
}
/** POST /api/search/day-grouped · 按日分组（空串 = 按日浏览） */
export const dayGroupedSearch = (req: DayGroupedSearchRequest) =>
  USE_MOCK ? delay(mock.auraDayGrouped(req)) : aura<DayGroupedSearchResponse>('/api/search/day-grouped', req);
/** POST /api/search/search · 关键字搜索 */
export const keywordSearch = (req: DayGroupedSearchRequest) =>
  USE_MOCK ? delay(mock.auraSearch(req)) : aura<SearchResponse>('/api/search/search', req);
/**
 * 统一入口（文档 9.3 searchNews）：query 为空 → day-grouped；否则 → search。
 * 原文 SearchViewResponse 完整字段未列出，这里仅以 displayMode 区分两种原始响应，不改写其字段。
 */
export type SearchView = { displayMode: 'days'; data: DayGroupedSearchResponse } | { displayMode: 'results'; data: SearchResponse };
export const searchNews = async (req: DayGroupedSearchRequest): Promise<SearchView> =>
  req.query.trim() === ''
    ? { displayMode: 'days', data: await dayGroupedSearch({ ...req, query: '' }) }
    : { displayMode: 'results', data: await keywordSearch(req) };

/** 新闻/公告 HTML 需净化（文档 15.2） */
export function sanitizeHtml(html: string) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script,style,iframe,object,embed').forEach((n) => n.remove());
  doc.querySelectorAll('*').forEach((el) =>
    [...el.attributes].forEach((a) => {
      if (a.name.startsWith('on') || /^\s*javascript:/i.test(a.value)) el.removeAttribute(a.name);
    }),
  );
  return doc.body.innerHTML;
}
export const htmlText = (html: string) => new DOMParser().parseFromString(html, 'text/html').body.textContent ?? '';
