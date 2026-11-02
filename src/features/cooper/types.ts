export interface NewsListDto {
    Id: string
    DxE_id: number
    Title: string
    Content: string
    Abstract: string
    ChannelID: number
    ChannelTitle: string
    IsTop: number
    Author: string
    CreateTime: string
    Hits: number
    Cover: string
    Creater: string
    Type: number
    ApproveState: string
}
export interface NewsContextDto {
    Id: string
    Title: string
    Content: string
    Abstract: string
    ChannelID: string
    ChannelTitle: string
    IsTop: number
    Author: string
    CreateTime: string
    Hits: number
    Cover: string
    isImage: boolean
}
export interface NewsDto {
    DxE_id: number
    Id: string
    Title: string
    Subheading: string
    Abstract: string
    Content: string
    ChannelID: string
    ChannelTitle: string
    IsTop: number
    Author: string
    Creater: string
    CreateTime: string
    Hits: number
    Type: string
    Cover: string
}
export interface ChannelChildrenDto {
    Id: string
    DxE_id: number
    Parentid: number
    Selfid: number
    weigh: number
    Title: string
    CreateTime: string
    Describe: string
    Icon: string
    children: ChannelChildrenDto[]
}
export interface MeetingInfo {
    meetingTitle: string
    roomName: string
    startTime: string
    endTime: string
}
export interface OnDutyTableResult {
    total: number
    list: Array<Record<string, string>>
    columns: unknown[]
    remark: string
}
export interface FaultDto {
    SMBC: string
    GZFS_SJ: string | null
    SS_GZNR: string
    State: string
}
export interface ZZPWTDto {
    JX: string
    LJTH: string
    DQZT: string
    ZRXM: string
    TCSJ: string
}
export interface CommonSystemOutDto {
    DxE_id: number
    Id: string
    Name: string
    Icon: string
    JumpLink: string
    Details: string
    CreateTime: string
    isIE: string
    isToken: string
}
export interface HotWorkDto {
    Id: string
    plant: string
    workType: string
    hazardousWorkArea: string
    className: string
    screateTime: string
    ecreateTime: string
    userName: string
    phone: string
}
export interface HonorDto {
    Id: string
    weigh: number
    DxE_id: number
    Title: string
    Awardee: string
    Avatar: string
    CreateTime: string
}
export interface LeaderSchedule {
    leaderName: string
    leaderID: string
    startTime: string
    endTime: string
    activity: string
}
export interface CalendarEventDto {
    id: string
    title: string
    description: string | null
    location: string | null
    startAt: string
    endAt: string
    reminderMinutes: number
    source: 'USER' | 'AGENT'
}
export type CreateEventPayload = Omit<CalendarEventDto, 'id' | 'source'>
export interface PendingTaskItem {
    taskId: string
    businessType: string
    businessTitle: string
    taskName: string
    actionDescription: string
    createTime: string
    businessId: string
}
export interface MessageCenterItem {
    messageId: string
    sourceSystem: string
    content: string
    createdAt: string
    url: string
}
export interface HttpCode<T> {
    code: number
    msg: string
    time: number
    count: number
    data: T
    arr: T[]
}

export type SourceType = 'News' | 'Announcement'
export interface DayGroupedSearchRequest {
    query: string
    sourceTypes: SourceType[]
    publishTimeFrom?: string
    publishTimeTo?: string
    page: number
    pageSize: number
}
export interface SearchItem {
    url?: string
    vectorResult?: boolean
    newsId: string
    title: string
    highlight: string | null
    publisher: string
    author: string
    sourceType: SourceType
    publishTime: string
    summary: string | null
    contentHtml: string | null
    cover: string | null
}
export interface SearchDayGroup {
    date: string
    items: SearchItem[]
}
export interface SearchMeta {
    searchTraceId: string
    searchMode: string
    degraded: boolean
    degradationMode: string | null
    maxDepthReached: boolean
    page: number
    pageSize: number
}
export interface DayGroupedSearchResponse extends SearchMeta {
    totalDays: number
    totalPages: number
    totalItems: number
    newsItems: number
    announcementItems: number
    days: SearchDayGroup[]
}
export interface SearchResponse extends SearchMeta {
    hasMore?: boolean
    results: SearchItem[]
}

export interface CooperNotice {
    DxE_id?: number
    Id: string
    Title: string
    Context: string
    IsTop: number
    PublishSpan: string
    PublicityPeriod: string
    From: string
    Creater: string
    CreateTime: string
    ApproveTreeId?: number | null
    Urls?: string[]
    ApproveState?: string
    IsTopTime?: string | null
}
export interface PortalNotificationDto {
    id: string
    type: string
    sourceId: string
    title: string
    message: string
    read: boolean
    createdAt: string
}

export interface NewsKuaiBaoDto {
    Id: string
    Title: string
    Author: string
    Content: string
    CreateTime: string
}
export interface SoftwareDownloadOutDto {
    Id: string
    DxE_id: number
    Icon: string
    url: string
    Title: string
    CreateTime: string
}
export interface TablesDownloadChildrenDto {
    Id: string
    DxE_id: number
    pId: number
    ColumnTitle: string
    DownloadLink: string
    Icon: string
    CreateTime: string
    children: TablesDownloadChildrenDto[]
}
export interface ShowFocusSubscriptionListDto {
    Id: string
    Title: string
    Number: string
}
