// 原型 mock：字段与文档 DTO 一一对应，内容为演示数据。
import type {
    NewsListDto,
    NewsKuaiBaoDto,
    ChannelChildrenDto,
    NewsContextDto,
    NewsDto,
    OnDutyTableResult,
    MeetingInfo,
    FaultDto,
    ZZPWTDto,
    CommonSystemOutDto,
    HonorDto,
    HotWorkDto,
    LeaderSchedule,
    CalendarEventDto,
    PendingTaskItem,
    MessageCenterItem,
    SearchItem,
    DayGroupedSearchRequest,
    DayGroupedSearchResponse,
    SearchResponse,
} from './types'
import { addDays, ymd } from './date'

// Keep current-day demos in the Mock layer. Components always use the real clock.
const demoOffset = Math.round((new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime() - new Date(2026, 9, 27).getTime()) / 864e5)
const demoDate = (value: string) => ymd(addDays(new Date(Number(value.slice(0, 4)), Number(value.slice(5, 7)) - 1, Number(value.slice(8, 10))), demoOffset)) + value.slice(10)

const u = (id: string, _w = 1200) => `/mock-images/${id}.jpg`
export const IMG = {
    building: u('photo-1486406146926-c627a92ad1ab'),
    office: u('photo-1497366216548-37526070297c'),
    meeting: u('photo-1552664730-d307ca884978'),
    meeting2: u('photo-1517245386807-bb43f82c33c4'),
    factory: u('photo-1565043666747-69f6646db940'),
    tech: u('photo-1581091226825-a6a2a5aee158'),
    team: u('photo-1531482615713-2afd69097998'),
    lab: u('photo-1532094349884-543bc11b234d'),
    robot: u('photo-1485827404703-89b55fcc595e'),
    trophy: u('photo-1567427017947-545c5f8d16ad'),
}

const body = (t: string, cover?: string) =>
    `<p>${t}。本次活动由公司相关部门牵头组织，各单位负责人及业务骨干参加，围绕年度重点任务进行了深入交流与部署。</p>` +
    `<h3>聚焦重点，压实责任</h3><p>会议强调，各单位要坚持目标导向和问题导向，聚焦关键节点，压实责任链条，确保各项任务按期高质量完成。要以更高标准、更实举措推进重点项目建设，切实把部署要求转化为工作成效。</p>` +
    (cover ? `<figure><img src="${cover.replace('w=1200', 'w=1000')}" alt="" /><figcaption>活动现场</figcaption></figure>` : '') +
    `<p>与会人员结合分管工作，逐项梳理了当前存在的短板与风险，提出了针对性的改进措施，并就跨部门协同事项形成了明确分工。</p>` +
    `<h3>协同推进，久久为功</h3><p>下一步，公司将持续深化协同机制，推动管理提升与业务创新双轮驱动，以优异成绩完成全年各项目标任务。</p>`

const imgSeed: [string, string, string, number][] = [
    ['公司召开2026年第三季度经营分析会', IMG.building, '2026-10-26T09:00:00', 1236],
    ['公司召开数字化转型专题培训会', IMG.meeting, '2026-10-24T10:00:00', 892],
    ['公司与高校开展产学研合作交流', IMG.office, '2026-10-22T14:00:00', 680],
    ['公司召开安全生产工作专题会议', IMG.factory, '2026-10-20T09:30:00', 753],
    ['新生产基地项目建设稳步推进', IMG.team, '2026-10-18T16:00:00', 615],
    ['研发中心开展新材料联合攻关', IMG.lab, '2026-10-17T10:30:00', 532],
    ['智能装备试验平台完成阶段验收', IMG.robot, '2026-10-16T14:00:00', 486],
]
export const imgNews: NewsListDto[] = imgSeed.map(([Title, Cover, CreateTime, Hits], i) => ({
    Id: `img-${i}`,
    DxE_id: 100 + i,
    Title,
    Content: body(Title, Cover),
    Abstract: `${Title.replace('公司', '')}，全面总结阶段工作情况，部署下一阶段重点任务，推动公司高质量发展。`,
    ChannelID: 11,
    ChannelTitle: '公司要闻',
    IsTop: i === 0 ? 1 : 0,
    Author: '党群工作部',
    CreateTime,
    Hits,
    Cover,
    Creater: '宣传处',
    Type: 0,
    ApproveState: '已发布',
}))

const kbSeed: [string, string, string][] = [
    ['公司发布《2026年度质量提升行动方案》', '质量管理部', '2026-10-27T08:30:00'],
    ['生产系统完成四季度排产计划评审', '生产管理部', '2026-10-26T17:10:00'],
    ['信息化中心协同办公平台完成版本升级', '信息化中心', '2026-10-25T11:20:00'],
    ['公司组织开展秋季消防安全演练', '安全环保部', '2026-10-24T15:00:00'],
    ['人力资源部启动年度青年人才选拔工作', '人力资源部', '2026-10-23T09:00:00'],
    ['财务部开展预算执行情况专项检查', '财务部', '2026-10-21T10:40:00'],
]
export const kuaibao: NewsKuaiBaoDto[] = kbSeed.map(([Title, Author, CreateTime], i) => ({
    Id: `kb-${i}`,
    Title,
    Author,
    CreateTime,
    Content: body(`${Title}。本次工作由${Author}牵头组织，覆盖各主要业务单元，明确了时间节点与责任分工，为全年目标收官奠定坚实基础。`),
}))

const ch = (DxE_id: number, Title: string, Describe = '', children: ChannelChildrenDto[] = [], Parentid = 0): ChannelChildrenDto => ({
    Id: `ch-${DxE_id}`,
    DxE_id,
    Parentid,
    Selfid: DxE_id,
    weigh: 0,
    Title,
    CreateTime: '2026-01-01T00:00:00',
    Describe,
    Icon: '',
    children,
})
export const channels: ChannelChildrenDto[] = [
    ch(11, '公司要闻', '公司重大会议、重要活动与经营动态'),
    ch(12, '基层动态', '各单位一线工作与基层风采', [
        ch(121, '生产一线', '车间班组与生产现场', [], 12),
        ch(122, '研发中心', '研发项目与技术团队', [], 12),
    ]),
    ch(13, '党建工作', '党建引领与群团工作'),
    ch(21, '先进科技', '新技术、新工艺与创新成果'),
    ch(22, '质量快报', '质量周报、巡检通报与案例'),
]

const ctx = (cid: number, cTitle: string, author: string, rows: [string, string | '', string][]): NewsContextDto[] =>
    rows.map(([Title, Cover, CreateTime], i) => ({
        Id: `c${cid}-${i}`,
        Title,
        Content: body(Title, Cover || undefined),
        Abstract: `${Title}，相关工作已取得阶段性成效，为下一步全面推进奠定了坚实基础。`,
        ChannelID: String(cid),
        ChannelTitle: cTitle,
        IsTop: 0,
        Author: author,
        CreateTime,
        Hits: 300 + ((i * 137) % 900),
        Cover,
        isImage: !!Cover,
    }))
export const channelNews: Record<number, NewsContextDto[]> = {
    11: [
        ...imgNews.map((n): NewsContextDto => ({ ...n, ChannelID: String(n.ChannelID), isImage: true })),
        ...ctx(11, '公司要闻', '党群工作部', [
            ['公司召开四季度安全生产工作部署会', '', '2026-10-16T09:00:00'],
            ['公司领导赴基层单位开展专题调研', IMG.meeting2, '2026-10-14T10:00:00'],
            ['公司与合作伙伴签署战略合作协议', IMG.office, '2026-10-12T15:00:00'],
            ['公司召开干部大会传达上级会议精神', '', '2026-10-10T09:00:00'],
            ['公司2026年职工技能大赛圆满落幕', IMG.team, '2026-10-08T16:00:00'],
            ['公司开展“质量月”主题宣传活动', '', '2026-10-05T09:00:00'],
            ['公司召开科技创新大会表彰先进', IMG.lab, '2026-09-28T09:30:00'],
            ['公司召开三季度党委理论学习中心组学习会', '', '2026-09-25T14:00:00'],
            ['新一代协同办公平台正式上线运行', IMG.building, '2026-09-22T10:00:00'],
        ]).map((n, i) => ({ ...n, Id: `c11-${i}` })),
    ],
    12: ctx(12, '基层动态', '各单位通讯员', [
        ['机加车间开展“比学赶超”劳动竞赛', IMG.factory, '2026-10-25T10:00:00'],
        ['总装班组创新工作法提升装配效率', '', '2026-10-21T09:00:00'],
        ['物流中心完成仓储系统智能化升级', IMG.robot, '2026-10-17T14:00:00'],
    ]),
    121: ctx(121, '生产一线', '生产管理部', [
        ['动火作业完成试装', IMG.factory, '2026-10-25T08:30:00'],
        ['涂装车间开展温控专项攻关', '', '2026-10-22T09:00:00'],
        ['夜班班组安全承诺签名活动', IMG.team, '2026-10-19T19:00:00'],
    ]),
    122: ctx(122, '研发中心', '研发中心', [
        ['研发中心召开年度技术路线评审会', IMG.meeting, '2026-10-24T09:00:00'],
        ['青年技术骨干开展跨专业交流', '', '2026-10-15T15:00:00'],
    ]),
    13: ctx(13, '党建工作', '党群工作部', [
        ['公司党委开展主题党日活动', IMG.meeting2, '2026-10-23T09:00:00'],
        ['基层党支部书记培训班开班', '', '2026-10-18T09:00:00'],
        ['青年志愿者服务队走进社区', IMG.team, '2026-10-11T09:00:00'],
    ]),
    21: ctx(21, '先进科技', '科技发展部', [
        ['智能装配机器人在总装线完成首轮应用验证', IMG.robot, '2026-10-25T09:00:00'],
        ['复合材料自动铺放工艺取得关键突破', IMG.lab, '2026-10-22T10:00:00'],
        ['数字孪生车间平台通过阶段评审', '', '2026-10-20T14:00:00'],
        ['公司两项发明专利获国家知识产权局授权', '', '2026-10-17T11:00:00'],
    ]),
    22: ctx(22, '质量快报', '质量管理部', [
        ['10月第四周质量快报', IMG.factory, '2026-10-26T08:00:00'],
        ['关键工序质量巡检通报', IMG.tech, '2026-10-23T08:00:00'],
        ['质量月活动优秀案例展示', IMG.team, '2026-10-19T08:00:00'],
        ['供应商来料质量分析', IMG.lab, '2026-10-16T08:00:00'],
        ['QC小组成果发布会集锦', IMG.meeting2, '2026-10-12T08:00:00'],
        ['10月第二周质量快报', IMG.robot, '2026-10-12T08:00:00'],
    ]),
}
/** 频道新闻列表：search 关键字 + Page/Limit 分页（对应 res.arr / res.count） */
export function queryChannel(p: { ChannelID: number; Page: number; Limit: number; search?: string }) {
    const all = (channelNews[p.ChannelID] ?? []).filter((n) => !p.search || n.Title.includes(p.search) || n.Abstract.includes(p.search))
    return { arr: all.slice((p.Page - 1) * p.Limit, p.Page * p.Limit), count: all.length }
}
export const views: Record<string, number> = {}
export const likes: Record<string, number> = {}
export const liked: Record<string, boolean> = {}

export function newsDetail(id: string): NewsDto {
    const src = [...imgNews, ...kuaibao, ...Object.values(channelNews).flat()].find((n) => n.Id === id) as
        | (NewsKuaiBaoDto & Partial<Pick<NewsContextDto, 'Abstract' | 'ChannelTitle' | 'Hits' | 'Cover'>> & { ChannelID?: string | number })
        | undefined
    if (!src) throw new Error('404')
    views[id] ??= src.Hits ?? 120
    likes[id] ??= Math.round((src.Hits ?? 120) / 23)
    return {
        DxE_id: 0,
        Id: src.Id,
        Title: src.Title,
        Subheading: src.Cover ? '凝心聚力抓落实 · 奋楫扬帆再出发' : '',
        Abstract: src.Abstract ?? '',
        Content: src.Content,
        ChannelID: String(src.ChannelID ?? ''),
        ChannelTitle: src.ChannelTitle ?? '文字快报',
        IsTop: 0,
        Author: src.Author,
        Creater: '宣传处',
        CreateTime: src.CreateTime,
        Hits: src.Hits ?? 0,
        Type: '',
        Cover: src.Cover ?? '',
    }
}

// 值班排班：2026-10-01 ~ 12-31，带班领导 7 日轮换；当前用户“张三”每 7 天带班一次，另有若干天为值班人员
const LEADERS = ['李明', '张三', '陈雪', '孙磊', '李芳', '王五', '刘伟']
const STAFF: [string, string][] = [
    ['王洁', '138****8888'],
    ['赵敏', '138****6666'],
    ['刘丽', '138****9999'],
    ['周阳', '138****7777'],
    ['黄伟', '138****5555'],
    ['钱程', '139****1212'],
    ['孙丽', '137****3434'],
    ['吴迪', '136****5656'],
]
const WK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const p2 = (n: number) => String(n).padStart(2, '0')
const dutyColums: OnDutyTableResult['colums'] = [
    ['OnDutyTime', '值班日期', 110], ['gongduan', '工段', 110], ['gongyi', '工艺', 110],
    ['shebei', '设备', 110], ['weixiu', '维修', 110], ['xietiaozhongxin', '协调中心', 130], ['zhuanyechang', '专业厂', 120],
].map(([prop, label, width]) => ({ prop: String(prop), label: String(label), width, align: 'left', operatortype: '', render: '' }))
const dutyAll: Record<string, string>[] = Array.from({ length: 92 }, (_, i) => {
    const d = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 30 + i)
    return {
        OnDutyTime: `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T00:00:00`,
        gongduan: LEADERS[(i + 3) % 7], gongyi: STAFF[(i * 3) % STAFF.length][0],
        shebei: STAFF[(i + 1) % STAFF.length][0], weixiu: STAFF[(i + 2) % STAFF.length][0],
        xietiaozhongxin: STAFF[(i + 3) % STAFF.length][0], zhuanyechang: STAFF[(i + 4) % STAFF.length][0],
    }
})
export function queryOnDuty(p: { isMySelf?: boolean; context?: string; page?: number; limit?: number } | null, username = '张三'): OnDutyTableResult {
    const personalized = dutyAll.map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, value === '张三' ? username : value])))
    if (!p) {
        const list = personalized.slice(27, 35)
        return { total: list.length, list, colums: dutyColums, remark: '' }
    }
    let rows = personalized
    if (p.isMySelf) rows = rows.filter(r => Object.values(r).includes(username))
    if (p.context) rows = rows.filter(r => Object.values(r).some(v => v.includes(p.context!)))
    const page = p.page ?? 1, limit = p.limit ?? 10
    return { total: rows.length, list: rows.slice((page - 1) * limit, page * limit), colums: dutyColums, remark: '' }
}

export const meetings: MeetingInfo[] = [
    ['研发周例会', 'A栋3楼 会议室1', '2026-10-27 09:00', '2026-10-27 10:30'],
    ['产品需求评审会', 'B栋2楼 会议室3', '2026-10-27 14:00', '2026-10-27 15:30'],
    ['设计方案讨论', '线上会议', '2026-10-28 10:00', '2026-10-28 11:00'],
    ['项目进度同步会', 'A栋1楼 会议室2', '2026-10-28 15:30', '2026-10-28 16:30'],
    ['月度工作总结', '会议室3', '2026-10-29 09:30', '2026-10-29 11:30'],
    ['质量月度分析会', 'B栋5楼 会议室1', '2026-10-29 14:00', '2026-10-29 15:30'],
    ['安全生产例会', 'A栋2楼 会议室2', '2026-10-30 09:00', '2026-10-30 10:00'],
    ['供应商座谈会', '一楼接待室', '2026-10-30 14:30', '2026-10-30 16:00'],
    ['信息化建设评审', '线上会议', '2026-10-31 10:00', '2026-10-31 11:30'],
    ['研发周例会', 'A栋3楼 会议室1', '2026-11-03 09:00', '2026-11-03 10:30'],
].map(([meetingTitle, roomName, startTime, endTime]) => ({ meetingTitle, roomName, startTime: demoDate(startTime), endTime: demoDate(endTime) }))

export const faults: FaultDto[] = [
    ['仓储物流系统', '2026-10-25 08:12', '仓储管理系统偶发性故障', '处理中'],
    ['生产车间两联机', '2026-10-24 13:40', '联机通讯中断，产线停机12分钟', '未响应'],
    ['数控加工中心 #3', '2026-10-23 10:05', '主轴温升异常报警', '已处理'],
    ['涂装线烘干炉', '2026-10-22 16:20', '温控模块读数漂移', '未确认'],
    ['总装线AGV', '2026-10-20 09:30', '导航定位偏差', '已归零'],
].map(([SMBC, GZFS_SJ, SS_GZNR, State]) => ({ SMBC, GZFS_SJ, SS_GZNR, State }))

export const zzpwt: ZZPWTDto[] = [
    ['XK-21A', 'XK21-102-01', '处理中', '王强', '2026-10-25'],
    ['XK-21B', 'XK21-203-06', '待处理', '刘洋', '2026-10-24'],
    ['ZT-30', 'ZT30-077-12', '已完成', '陈晨', '2026-10-22'],
    ['ZT-32', 'ZT32-011-03', '处理中', '赵磊', '2026-10-21'],
].map(([JX, LJTH, DQZT, ZRXM, TCSJ]) => ({ JX, LJTH, DQZT, ZRXM, TCSJ }))

const sys = (i: number, Name: string, Details: string): CommonSystemOutDto => ({
    DxE_id: i,
    Id: `sys-${i}`,
    Name,
    Icon: '',
    JumpLink: '#',
    Details,
    CreateTime: '2026-01-01',
    isIE: '0',
    isToken: '1',
})
export const systems: CommonSystemOutDto[] = [
    sys(1, 'OA办公', '公文、审批与协同办公'),
    sys(2, '集团邮箱', '集团统一企业邮箱'),
    sys(3, '公司门户', '公司信息发布与服务入口'),
    sys(4, '智慧党群', '党建、工会与群团工作'),
    sys(5, '生产制造', '计划排产与生产执行'),
    sys(6, '工艺集成', '工艺设计与数据集成'),
    sys(7, '流程中心', '统一流程发起与跟踪'),
    sys(8, '质量管理', '质量问题闭环管理'),
    sys(9, '人事系统', '组织、人员与考勤'),
    sys(10, '财务系统', '报销、预算与核算'),
    sys(11, '采购管理', '采购申请与供应商'),
    sys(12, '项目管理', '项目计划与里程碑'),
    sys(13, '设备管理', '设备台账与维保'),
    sys(14, '档案管理', '电子档案归档检索'),
    sys(15, '知识中心', '制度、标准与知识库'),
]
export const myIds = ['sys-1', 'sys-2', 'sys-3', 'sys-4', 'sys-5', 'sys-6', 'sys-7', 'sys-8']

export const hotWork: HotWorkDto[] = [
    [
        '动火作业',
        '机加分厂 2 号产线检修区',
        '2026-10-27T08:00:00',
        '2026-10-27T12:00:00',
        '王强',
        '138****2316',
    ],
    ['有限空间作业', '总装车间地下设备间', '2026-10-27T09:00:00', '2026-10-27T11:00:00', '刘洋', '139****0582'],
    ['高处作业', '空压站屋面管网区', '2026-10-28T08:30:00', '2026-10-28T17:30:00', '陈晨', '137****7745'],
    ['吊装作业', '冲压车间设备安装区', '2026-10-26T08:00:00', '2026-10-26T12:00:00', '赵磊', '136****9021'],
    ['临时用电作业', '厂区东侧配电施工区', '2026-10-27T14:00:00', '2026-10-27T17:00:00', '孙悦', '135****6638'],
    ['检维修作业', '涂装车间烘干炉检修区', '2026-10-27T13:00:00', '2026-10-27T16:00:00', '周涛', '133****4170'],
].map(([workType, hazardousWorkArea, screateTime, ecreateTime, userName, phone], i) => ({
    Id: `hw-${i}`,
    plant: ['机加分厂', '总装分厂', '动力分厂', '冲压分厂', '动力分厂', '涂装分厂'][i],
    className: '设备检修班',
    workType,
    hazardousWorkArea,
    screateTime: demoDate(screateTime),
    ecreateTime: demoDate(ecreateTime),
    userName,
    phone,
}))

export const honors: HonorDto[] = [
    ['2026年度优秀团队', '智能制造事业部', IMG.trophy],
    ['2025年度先进集体', '总装车间', IMG.team],
    ['技术创新一等奖', '研发中心', IMG.lab],
    ['质量标杆班组', '机加二班', IMG.factory],
    ['安全生产先进单位', '安全环保部', IMG.building],
    ['优秀项目团队', '数字化项目组', IMG.meeting],
].map(([Title, Awardee, Avatar], i) => ({
    Id: `h-${i}`,
    weigh: i,
    DxE_id: i,
    Title,
    Awardee,
    Avatar,
    CreateTime: ['2026-10-26', '2026-10-24', '2026-10-22', '2026-10-18', '2026-10-12', '2026-10-08'][i],
}))

export const leaderSchedule: LeaderSchedule[] = [
    ['李明', 'L01', '2026-10-27 09:00', '2026-10-27 10:30', '经营分析会（A栋3楼 会议室1）'],
    ['张三', 'L02', '2026-10-27 10:30', '2026-10-27 12:00', '重点项目推进会（B栋2楼 会议室3）'],
    ['陈雪', 'L03', '2026-10-27 14:00', '2026-10-27 15:30', '安全生产专题会（线上会议）'],
    ['李明', 'L01', '2026-10-27 16:00', '2026-10-27 17:30', '研发项目评审（A栋1楼 会议室2）'],
    ['孙磊', 'L04', '2026-10-28 09:00', '2026-10-28 11:00', '供应商质量座谈会'],
    ['张三', 'L02', '2026-10-28 14:30', '2026-10-28 16:00', '季度预算审议'],
    ['陈雪', 'L03', '2026-10-26 15:00', '2026-10-26 16:00', '新员工座谈'],
].map(([leaderName, leaderID, startTime, endTime, activity]) => ({ leaderName, leaderID, startTime: demoDate(startTime), endTime: demoDate(endTime), activity }))

const ev = (
    id: string,
    title: string,
    d: string,
    s: string,
    e: string,
    location: string | null,
    source: 'USER' | 'AGENT' = 'USER'
): CalendarEventDto => ({
    id,
    title,
    description: null,
    location,
    startAt: `${d}T${s}:00+08:00`,
    endAt: `${d}T${e}:00+08:00`,
    reminderMinutes: 15,
    source,
})
export const calendar: CalendarEventDto[] = [
    ev('e1', '产品需求评审', '2026-10-27', '14:00', '15:30', 'B栋2楼 会议室3'),
    ev('e2', '周报整理', '2026-10-27', '17:00', '17:30', null, 'AGENT'),
    ev('e3', '设计方案讨论', '2026-10-28', '10:00', '11:00', '线上会议'),
    ev('e4', '客户来访接待', '2026-10-29', '09:30', '11:00', '一楼接待室'),
    ev('e5', '月度工作总结', '2026-10-30', '15:00', '16:30', '会议室3'),
    ev('e6', '部门例会', '2026-10-20', '09:00', '10:00', 'A栋3楼'),
    ev('e7', '培训：数据安全', '2026-10-22', '14:00', '16:00', '培训中心', 'AGENT'),
    ev('e8', '项目复盘', '2026-10-15', '10:00', '11:30', 'A栋1楼'),
    ev('e9', '体检', '2026-10-09', '08:00', '10:00', '职工医院'),
    ev('e10', '季度述职', '2026-11-03', '09:00', '12:00', '大会议室'),
    ev('e11', '工艺评审', '2026-10-28', '14:00', '15:30', 'B栋2楼'),
    ev('e12', '读书分享会', '2026-10-31', '15:00', '16:30', '职工书屋'),
    // 全年分布的历史/计划日程（用于月、年视图）
    ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12].flatMap((m) =>
        [4, 9, 13, 18, 22, 26]
            .slice(0, 3 + (m % 4))
            .map((d, i) =>
                ev(
                    `y${m}-${d}`,
                    ['部门例会', '项目周报评审', '专题培训', '客户拜访', '月度复盘', '技术交流'][(m + i) % 6],
                    `2026-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
                    ['09:00', '10:30', '14:00', '15:30'][i % 4],
                    ['10:00', '11:30', '15:00', '17:00'][i % 4],
                    ['A栋3楼', null, '培训中心', '线上会议'][i % 4],
                    i % 5 === 4 ? 'AGENT' : 'USER'
                )
            )
    ),
]

// Only seeded current-week events move with the demo date; the remaining year-view fixtures are historical data.
calendar.filter(event => /^e\d+$/.test(event.id)).forEach(event => {
    event.startAt = demoDate(event.startAt)
    event.endAt = demoDate(event.endAt)
})

export const todos: PendingTaskItem[] = [
    ['产品需求评审审批', '流程审批', '2026-10-26 09:30'],
    ['设计方案讨论会签', '会签', '2026-10-26 14:00'],
    ['安全生产月活动方案', '流程审批', '2026-10-26 16:00'],
    ['设备采购申请', '采购', '2026-10-27 09:30'],
    ['月度工作总结', '待阅', '2026-10-27 11:00'],
    ['差旅报销单审核', '财务', '2026-10-27 13:20'],
].map(([businessTitle, businessType, createTime], i) => ({
    taskId: `t${i}`,
    businessType,
    businessTitle,
    taskName: '部门负责人审批',
    actionDescription: '请审批',
    createTime,
    businessId: `b${i}`,
}))
export const messages: MessageCenterItem[] = [
    ['OA', '您有一份新的公文待阅：《关于做好四季度安全生产工作的通知》', '2026-10-27 08:45'],
    ['会议管理', '会议「产品需求评审会」将于 14:00 开始', '2026-10-27 13:45'],
    ['流程中心', '您发起的「设备采购申请」已通过审批', '2026-10-26 17:20'],
    ['质量管理', '质量问题 QI-2026-1023 已分派至您处理', '2026-10-26 10:02'],
].map(([sourceSystem, content, createdAt], i) => ({ messageId: `m${i}`, sourceSystem, content, createdAt, url: i === 0 ? '/preview/notice?id=ann-0' : '' }))

/* ---------------- AURA 搜索：新闻 + 公告 ---------------- */
const strip = (h: string) => h.replace(/<[^>]+>/g, '')
const NOTICES: [string, string, string][] = [
    ['关于开展四季度安全生产大检查的通知', '安全环保部', '2026-10-27T10:30:00'],
    ['关于加强冬季防火工作的通知', '安全环保部', '2026-10-26T15:00:00'],
    ['关于协同办公平台升级维护的公告', '信息化中心', '2026-10-25T18:00:00'],
    ['关于组织2026年度职工体检的通知', '工会', '2026-10-22T09:00:00'],
    ['关于调整厂区班车运行时刻的通知', '行政部', '2026-10-20T08:00:00'],
    ['关于报送四季度培训需求的通知', '人力资源部', '2026-10-18T14:00:00'],
    ['关于表彰2026年度技能大赛获奖人员的决定', '党群工作部', '2026-10-12T16:00:00'],
    ['关于国庆节后复工安全检查的通知', '办公室', '2026-10-08T09:00:00'],
    ['关于开展质量月主题活动的通知', '质量管理部', '2026-10-05T09:00:00'],
    ['关于2026年度预算编制工作的通知', '财务部', '2026-09-28T10:00:00'],
]
export const auraItems: SearchItem[] = [
    ...Object.values(channelNews)
        .flat()
        .map(
            (n): SearchItem => ({
                newsId: n.Id,
                title: n.Title,
                highlight: null,
                publisher: n.ChannelTitle,
                author: n.Author,
                sourceType: 'News',
                publishTime: n.CreateTime,
                summary: n.Abstract,
                contentHtml: n.Content,
                cover: n.Cover || null,
            })
        ),
    ...kuaibao.map(
        (n): SearchItem => ({
            newsId: n.Id,
            title: n.Title,
            highlight: null,
            publisher: '文字快报',
            author: n.Author,
            sourceType: 'News',
            publishTime: n.CreateTime,
            summary: strip(n.Content).slice(0, 80),
            contentHtml: n.Content,
            cover: null,
        })
    ),
    ...NOTICES.map(
        ([title, publisher, publishTime], i): SearchItem => ({
            newsId: `ann-${i}`,
            title,
            highlight: null,
            publisher,
            author: publisher,
            sourceType: 'Announcement',
            publishTime,
            summary: `${title.replace(/^关于|的(通知|公告|决定)$/g, '')}，请各单位认真组织落实，并按时反馈相关情况。`,
            contentHtml: `<p>各部门、各单位：</p><p>${title.replace(/^关于|的(通知|公告|决定)$/g, '')}相关事项现通知如下，请认真组织落实。</p><h3>一、工作要求</h3><p>各单位要高度重视，明确责任人和完成时限，确保工作落实到位。</p><h3>二、时间安排</h3><p>请于规定时间内将落实情况报送${publisher}。</p><p style="text-align:right">${publisher}<br/>${publishTime.slice(0, 10)}</p>`,
            cover: null,
        })
    ),
]
const trace = () => Math.random().toString(16).slice(2, 14)
function auraFilter(req: DayGroupedSearchRequest) {
    return auraItems
        .filter(
            (i) =>
                req.sourceTypes.includes(i.sourceType) &&
                (!req.publishTimeFrom || i.publishTime.slice(0, 10) >= req.publishTimeFrom.slice(0, 10)) &&
                (!req.publishTimeTo || i.publishTime.slice(0, 10) <= req.publishTimeTo.slice(0, 10))
        )
        .sort((a, b) => b.publishTime.localeCompare(a.publishTime))
}
export function auraDayGrouped(req: DayGroupedSearchRequest): DayGroupedSearchResponse {
    const items = auraFilter(req)
    const map = new Map<string, SearchItem[]>()
    items.forEach((i) => map.set(i.publishTime.slice(0, 10), [...(map.get(i.publishTime.slice(0, 10)) ?? []), i]))
    const days = [...map].map(([date, list]) => ({ date, items: list }))
    return {
        searchTraceId: trace(),
        searchMode: 'day-browse',
        degraded: false,
        degradationMode: null,
        maxDepthReached: false,
        page: req.page,
        pageSize: req.pageSize,
        totalDays: days.length,
        totalPages: Math.max(1, Math.ceil(days.length / req.pageSize)),
        totalItems: items.length,
        newsItems: items.filter((i) => i.sourceType === 'News').length,
        announcementItems: items.filter((i) => i.sourceType === 'Announcement').length,
        days: days.slice((req.page - 1) * req.pageSize, req.page * req.pageSize),
    }
}
export function auraSearch(req: DayGroupedSearchRequest): SearchResponse {
    const q = req.query.trim()
    const hit = auraFilter(req).filter((i) => i.title.includes(q) || (i.summary ?? '').includes(q) || strip(i.contentHtml ?? '').includes(q))
    const mark = (t: string) => t.split(q).join(`<em>${q}</em>`)
    return {
        searchTraceId: trace(),
        searchMode: 'hybrid',
        degraded: false,
        degradationMode: null,
        maxDepthReached: false,
        page: req.page,
        pageSize: req.pageSize,
        results: hit.slice((req.page - 1) * req.pageSize, req.page * req.pageSize).map((i) => ({
            ...i,
            title: i.title,
            highlight: (i.summary ?? '').includes(q)
                ? mark(i.summary!)
                : i.title.includes(q)
                  ? mark(i.title)
                  : mark(strip(i.contentHtml ?? '').slice(0, 90)),
        })),
    }
}

export const notices = auraItems
    .filter((i) => i.sourceType === 'Announcement')
    .map((i, n) => ({
        Id: i.newsId,
        Title: i.title,
        Context: (i.contentHtml || '').replace(/<p style="text-align:right">[\s\S]*?<\/p>/, ''),
        IsTop: n === 0 ? 1 : 0,
        PublishSpan: '全公司',
        PublicityPeriod: '2026-10-27 至 2026-11-30',
        From: i.publisher,
        Creater: i.author,
        CreateTime: i.publishTime,
        Urls: [],
        ApproveState: '已发布',
    }))
export const reminders: import('./types').PortalNotificationDto[] = []

// Office attachment for the preview navigation smoke check.
imgNews[0].Content += '<p>附件：<a href="/mock-assets/office-sample.docx">工作资料.docx</a></p>'

// 权限中心选人演示数据仅通过统一 Mock 传输层提供。
export const directoryOrganizations = [
  { id: 'org-1',   pid: null,    name: '总公司' },
  { id: 'org-1-1', pid: 'org-1', name: '技术部' },
  { id: 'org-1-2', pid: 'org-1', name: '运营部' },
  { id: 'org-1-3', pid: 'org-1', name: '财务部' },
  { id: 'org-2',   pid: null,    name: '分公司' },
  { id: 'org-2-1', pid: 'org-2', name: '市场部' },
]

export const directoryPeople = [
  { id: 'u001', name: '张三',   workNo: '196001', phone: '13800000001', position: '前端工程师', orgId: 'org-1-1' },
  { id: 'u002', name: '李四',   workNo: '196002', phone: '13800000002', position: '后端工程师', orgId: 'org-1-1' },
  { id: 'u003', name: '王五',   workNo: '196003', phone: '13800000003', position: '产品经理',   orgId: 'org-1-2' },
  { id: 'u004', name: '赵六',   workNo: '196004', phone: '13800000004', position: '运营专员',   orgId: 'org-1-2' },
  { id: 'u005', name: '孙七',   workNo: 'EMP005', phone: '13800000005', position: '财务主管',   orgId: 'org-1-3' },
  { id: 'u006', name: '周八',   workNo: 'EMP006', phone: '13800000006', position: '市场总监',   orgId: 'org-2-1' },
  { id: 'u007', name: '吴九',   workNo: 'EMP007', phone: '13800000007', position: '架构师',     orgId: 'org-1-1' },
  { id: 'u008', name: '郑十',   workNo: 'EMP008', phone: '13800000008', position: '测试工程师', orgId: 'org-1-1' },
  { id: 'u009', name: '陈一一', workNo: 'EMP009', phone: '13800000009', position: '数据分析师', orgId: 'org-1-2' },
  { id: 'u010', name: '冯一二', workNo: 'EMP010', phone: '13800000010', position: '客户经理',   orgId: 'org-2-1' },
]

