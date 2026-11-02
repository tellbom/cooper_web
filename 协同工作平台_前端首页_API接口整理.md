# 协同工作平台 — 前端首页 API 接口整理文档

> **资料来源**：用户提供的《协同工作平台 — 前端首页 API 接口文档》纸质照片，共 **35 页 / 4 批**。  
> **整理日期**：2026-10-27。  
> **用途**：前端重构、后端接口联调、Claude / Codex / GLM 代码开发交接。  
> **说明**：本文为图片内容的结构化整理，不是运行环境实测结果。保留原始接口大小写、路径、特殊响应位置；照片模糊、字段未列出或原文仅写“返回对象”的地方，一律标记 **「待核实」**，禁止直接假定。开发时以实际代码、Swagger/OpenAPI 或抓包为最终依据。

## 阅读导航

1. [前端请求架构、网关及响应](#一前端请求架构网关及响应)
2. [首页组件结构](#二首页组件结构)
3. [首页业务 REST API](#三首页业务-rest-api)
4. [iframe 外部系统嵌入](#四iframe-外部系统嵌入)
5. [前端重构要点](#五前端重构要点)
6. [MQTT 实时消息协议](#六mqtt-实时消息协议)
7. [SSE 日历实时订阅](#七sse-日历实时订阅)
8. [Portal 日历 REST API](#八portal-日历-rest-api)
9. [AURA 搜索 API](#九aura-搜索-api)
10. [RBAC 认证 API](#十rbac-认证-api)
11. [找茬平台 Nitpick API](#十一找茬平台-nitpick-api)
12. [Notifications REST / SOAP](#十二notifications-rest--soap)
13. [下线/踢人 API](#十三下线踢人-api)
14. [其他补充接口](#十四其他补充接口)
15. [协议与联调核对清单](#十五协议与联调核对清单)

---

## 一、前端请求架构、网关及响应

### 1.1 Axios 封装与接口地址映射

- 前端封装：`src/utils/axiosDXE.ts` 中 `createDXEAxios()`。
- `getUrl(name)` 将接口名映射到 URL 前缀；未命中默认 `/controlRouter`（原文指出 `axiosDXE.ts:76-151`）。
- `createDXEAxios(config, options)` 的 `options.interfaceAddress` 决定使用的请求前缀。
- `options.reductDataFormat` 默认 `true`，**通常直接返回 `response.data`**（即 `ApiResponse` 对象），业务数据通常位于其 `data` 字段。部分接口直返数组/对象，见各节。

| interfaceAddress / 客户端 | 前端请求前缀 | 原文生产代理或后端地址（仅作配置参考） |
|---|---|---|
| `Cooper` | `/cooperRouter` | `http://172.16.29.162:8080/cooperRouter`（标注 dmc.cac.com） |
| `Control`（默认） | `/controlRouter` | `http://172.16.29.162:8085` |
| `YiyanQC` | `/YiyanQC` | `http://172.16.127.223:31185` |
| `processRouter` | `/processRouter` | `http://172.16.29.162:8080/processv3` |
| `MessageCenter` | `/MessageCenter` | `http://172.16.29.162:8080/novu` |
| `likeFeatureUrl` | `/likeFeatureUrl` | `http://172.16.29.162:8080/likefeature` |
| `newOA` | `/newOARouter` | `http://api.skc.cac.com:8109/` |
| `OA` | `/oaRouter` | `http://172.16.29.162:8151/` |
| `Notifications` | `/notificationRouter` | `http://portal.skc.cac.com:8080/` |
| `mms` | `/mms` | `http://dnc2.skc.cac.com:8083/` |
| `Production` | `/Production` | `http://172.16.129.82:5050` |
| `CropDir` | `/CropDir` | `http://172.16.129.60:10008` |
| `Token` | `/tokenRouter` | `http://portal.skc.cac.com` |
| `LogoutSync` | `/LogoutSync` | `http://172.16.29.162:8080/cooperRouter`（同 Cooper） |
| `AURA 搜索` | `/aurasearchserviceUrl` | `VITE_AURA_URL`（Vespa 向量检索服务） |
| `RBAC` | 直接 `VITE_RBAC_BASE_URL` | 原文 `http://172.16.29.162:8085`，**独立 Axios 客户端** |
| `Portal 日历` | `/cooperRouter` | 同 Cooper，**独立 fetch 客户端** |

**重要：** 表中内网域名及地址是原始资料的环境配置，不能将其当作外网可访问地址，部署时使用环境变量/反向代理维护；“前缀”和“业务路径”拼接后的完整 URL 不等于表中服务器根地址。

### 1.2 统一响应及异常形态

**前端：** `types/global.d.ts:21-28`

```ts
interface ApiResponse<T = any> {
  code: number;  // 1 = 成功；409 = 令牌失效（按原文注释）
  data: T;        // 业务数据（对象或数组）
  msg: string;    // 提示消息
  time: number;   // 时间戳
}
```

**Cooper 后端：** `Domain.Shared/HttpPackage/HttpCode.cs`（原文结构）

```ts
interface HttpCode<T> {
  code: number;   // 1 = 成功
  msg: string;
  time: number;
  count: number;  // 列表总数
  data: T;        // 对象型数据
  arr: T[];       // 数组型数据
}
```

> 不能一刀切地用 `res.data`：有的接口直接返回 `T[]`，有的返回 `res.arr`，有的返回 `res.data.list` / `res.data.columns`，MessageCenter 则可能在 `res.items`。每个接口在下文注明实际访问位置。

### 1.3 筛选/分页通用参数

后端 `BaTableUtils/FilterInput.cs`（按原文字段大小写整理）：

```ts
interface FilterInput {
  quick_search?: string;
  search?: Array<{
    val: string;
    field: string;        // 如 Title、CreateTime
    operatortype: string; // 如 LIKE、RANGE
    render?: string;      // 如 'datetime'
  }>;
  UserId?: string;
  page?: number;   // 默认 1
  limit?: number;  // 默认 10
}

interface BaTableDto<T> {
  total: number;
  list: T;
  remark: string;
}
```

注：`BaTableDto<T>` 的 `list` 在实际接口中经常是数组，调用端需结合泛型 `List<...>` 验证。原始接口还有 `Pageindex/Pagesize`、`pageNo/pageSize`、`pageIndex/pageSize` 等 **不同分页命名**，不得擅自统一请求字段。

### 1.4 认证

- `/api/app/*` 等业务接口通常携带 `Authorization: Bearer <token>`（Keycloak / OIDC）；由 Axios 请求拦截器注入，401 自动刷新令牌并重试（原文策略）。
- **RBAC** 独立客户端和响应协议，成功码 `0`，额外携带 `X-Project`；详见第十章。
- **Portal 日历** 独立 `fetch`，SSE 同样通过 headers 携带 Bearer 令牌。
- **SOAP / MQTT / iframe** 不要按普通 JSON REST 请求处理。

---

## 二、首页组件结构

首页入口：`src/views/backend/dashboard.vue`

```text
dashboard.vue
├── News.vue               新闻、质量看板、热点工作、公告
├── Often.vue              值班、故障、报站（包含 iframe）
├── Leisure.vue            日历、常用系统、报告等
│   ├── Calendar.vue       日历（含 my-schedule Portal 日历 + SSE）
│   ├── CommonSystems.vue  常用系统
│   └── TaskInboxView.vue  待办/消息
├── DataIndicators.vue     数据指标（图表 + iframe）
└── CommonLinks.vue        常用链接、软件下载
```

其他依次涉及 `Newsstand.vue`、`QualityBoard.vue`、`HotWork.vue`、`OnDuty.vue`、`Fault.vue`、`HonorWall.vue`、`TableDownload.vue`、`qc.vue`、`focusnewsdetail`、`dayGroupedSearch` 等。组件名保留纸质原文，项目实际文件大小写应核实。

---

## 三、首页业务 REST API

> 默认网关：本章若未特别写明，大多数接口使用 `Cooper`（`/cooperRouter`）。**仅凭 URL `/api/*` 不可推断网关，必须按“前缀”列选择。**  
> `直返` 表示接口返回值即为目标对象/数组，**不是** `res.data`；`HttpCode` 表示要遵从封装结构。

### 3.1 新闻模块（`News.vue` / `Newsstand.vue`）

| 功能 / 原始接口名 | 方法 | URL（不含网关） | 网关 | 参数 | 返回/读取位置 |
|---|---|---|---|---|---|
| 文字新闻（快报）`getNewsKuaiBao` | GET | `/api/app/news-kuai-bao/get-news-kuai-bao` | Cooper | `{ num?: number }`（默认 10） | **直接返回数组** `NewsKuaiBaoDto[]` |
| 图片新闻 `getnewsimgApi` | GET | `/api/app/news` | Cooper | `NewsListInputDto` | **直接返回数组** `NewsListDto[]` |
| 频道新闻列表 `getNewsDetail` | GET | `/api/app/news-center/get-context` | Cooper | `{ ChannelID: number; Page: number; Limit: number; search?: string }` | `HttpCode<NewsContextDto>`，`res.arr` 和 `res.count` |
| 新闻详情 `getNewsDetailitemapi` | GET | `/api/app/news/detail` | Cooper | query `{ id: string }` | **直接返回对象** `NewsDto` |
| 新闻频道树 `getallfocussubscription` | POST | `/api/app/channel/tree-channel` | Cooper | `{ search?: string }` | `res.data` 树形 `ChannelChildrenDto[]` |
| 新闻中心频道 `getnewscenterapi` | GET | `/api/app/news-center` | Cooper | 无 | `res.data`，`ChannelChildrenDto[]` |

**新闻类型：**

```ts
interface NewsKuaiBaoDto {
  Id: string;
  Title: string;
  Author: string;
  Content: string;     // HTML 字符串
  CreateTime: string;  // ISO 时间
}

interface NewsListInputDto {
  Channel?: string;
  Type?: string;       // '0' = 图；'1' = 文
  Pageindex?: number;
  Pagesize?: number;
  Inputword?: string;
  StartTime?: string;
  EndTime?: string;
  FilterChannelIds?: number[]; // 排除频道，如 [128]
  Search?: string;
  isRecursion?: boolean;
}

interface NewsListDto {
  Id: string;
  DxE_id: number;
  Title: string;
  Content: string;     // HTML
  Abstract: string;
  ChannelID: number;
  ChannelTitle: string;
  IsTop: number;
  Author: string;
  CreateTime: string;
  Hits: number;
  Cover: string;       // 封面图 URL
  Creater: string;
  Type: number;        // 0=图，1=文
  ApproveState: string;
}

interface NewsContextDto {
  Id: string;
  Title: string;
  Content: string;     // HTML
  Abstract: string;
  ChannelID: string;
  ChannelTitle: string;
  IsTop: number;
  Author: string;
  CreateTime: string;
  Hits: number;
  Cover: string;
  isImage: boolean;
}

interface NewsDto {
  DxE_id: number;
  Id: string;
  Title: string;
  Subheading: string;
  Abstract: string;
  Content: string;
  ChannelID: string;
  ChannelTitle: string;
  IsTop: number;
  Author: string;
  Creater: string;
  CreateTime: string;
  Hits: number;
  Type: string;
  Cover: string;
}

interface ChannelChildrenDto {
  Id: string;
  DxE_id: number;
  Parentid: number;
  Selfid: number;
  weigh: number;
  Title: string;
  CreateTime: string;
  Describe: string;
  Icon: string;
  children: ChannelChildrenDto[];
}
```

**注意：** `DxE_id`、`Parentid`、`Selfid`、`weigh`、`Creater` 等名称为原文拼写，不做“纠错”。图片新闻的 `NewsAppService.GetList` 原文注明直接返回 `List<NewsListDto>`。

### 3.2 公告模块（`News.vue`）

| 功能 / 接口名 | 方法 | URL | 前缀 | 参数 | 返回 |
|---|---|---|---|---|---|
| 弹窗公告 `getPopupnoticeapi` | POST | `/api/app/notice/popup-notice` | Cooper | 无 | **直接返回数组** `CooperNotice[]` |
| 公告列表 `getnoticesApi` / `getnoticesListapi` | GET | `/api/app/notice` | Cooper | `{ Pageindex: number; Pagesize: number; startTime?: string; endTime?: string; keyword?: string }` | `HttpCode<List<CooperNotice>>`，`res.data` 数组 |

```ts
interface CooperNotice {
  DxE_id?: number;           // 公告列表接口有；弹窗原文未列
  Id: string;
  Title: string;
  Context: string;          // HTML
  IsTop: number;
  PublishSpan: string;
  PublicityPeriod: string;
  From: string;
  Creater: string;
  CreateTime: string;
  ApproveTreeId?: number | null;
  Urls?: string[];
  ApproveState?: string;
  IsTopTime?: string | null;
}
```

### 3.3 质量看板（`News.vue → QualityBoard.vue`）

本节接口使用 **`YiyanQC`**（`/YiyanQC`，`http://172.16.127.223:31185`），**但 `getTodayKeyFocus` 的原文没有明确标出前缀，需按实际调用核对**。

| 编号 | 原始接口名 | 方法 | URL | 参数 | 返回数据 |
|---|---|---|---|---|---|
| 今日评分汇总 | `todayscore` | GET | `/api/quality/quality-issue-detail/today-score` | 本月无；今日 `{ date: 'YYYY-MM-DD,YYYY-MM-DD' }` | `res.data` `{ auditScore, checkScore, physicalScore }`，均 `number` |
| 项目评分列表 | `projectscore` | GET | `/api/quality/quality-issue-detail/project-score` | 无 | `res.data[]` `{ statObject: string; statScore: number; todayScore: number }` |
| 干部/专家评分 | `leaderscore` | GET | `/api/quality/quality-issue-detail/leader-score` | 无 | 同 `projectscore` |
| 部门/班组评分 | `departmentscore` | GET | `/api/quality/quality-issue-detail/department-score` | 无 | 同 `projectscore` |
| 质量问题明细列表 | `qualityissuedetaillist` | GET | `/api/quality/quality-issue-detail/list` | `{ happendDate?: string; projectName?: string; leader?: string; dutyDept?: string }` | `res.data[]`，字段见下 |
| 质量问题日期评分趋势 | `qualityissuedetaildatescore` | GET | `/api/quality/quality-issue-detail/date-score` | `[monthStart, today]`（两个日期字符串的数组） | `res.data[]` `{ statObject: string; statScore: number }` |
| 质量点赞列表 | `qualitytolikelist` | GET | `/api/quality/quality-to-like/list` | `{ statDate: string }`（今日或月区间） | `res.data[]` `{ id, toLikeObject, statDate, matterDetail }` 均 `string` |
| 今日重点聚焦 | `todaykeyfocuslist` | GET | `/api/today/today-key-focus/list` | `{ statDate: string }` | `res.data[]` `{ statDate, issueType, issueObject, issueDesc }` 均 `string` |
| 质量问题分页 | `qualityissuepage` | GET | `/api/quality/quality-issue-detail/page` | `{ pageNo: number; pageSize: number; happendDate?: string }` | `res.data` `{ list: QualityIssueDetail[]; total: number }` |
| 流程逾期统计（`qc.vue`） | `getProcessOverdueStat` / `getChargPersonOverdueStat` / `getChargDepartmentOverdueStat` | GET | `/api/failure/failure-form-trace/processOverdueStat`（另外两种以对应方法名替换末段） | 无 | `res.data[]` `{ statObject: string; statValue: number }`；**网关 YiyanQC** |

```ts
interface QualityIssueDetail {
  happendDate: string;
  projectType: string;
  projectName: string;
  event: string;
  projectScores: number;
  issueNo: string;
  reason: string;
  dutyPerson: string;
  dutyDept: string;
  deptPreScores: number;
  leader: string;
  leaderPreScores: number;
}
```

**数据注意：** 原文日期拼作 `happendDate`（不是 `happenedDate`）。`today-score` 各值分别为审核分、检查分、实物分。质量问题明细跨页列出的所有字段已合并。

### 3.4 热点工作 / 危险作业（`News.vue → HotWork.vue`）

> 2026-11-01 用户核正：本模块是危险作业，不是技改项目。`workType` 为作业类型，`hazardousWorkArea` 为危险作业区域。

- 接口：`getHotwork`
- 方法：`GET`
- URL：`/api/app/hot-work`
- 网关：`Cooper`
- 参数：`{ pageNo: number; pageSize: number; plant?: string; workType?: string; hazardousWorkArea?: string; userName?: string; createTimeRange?: string }`
- 返回：`HttpCode<BaTableDto<List<HotWorkDto>>>`，读取 `res.data.list`。

```ts
interface HotWorkDto {
  Id: string;
  plant: string;             // 分厂
  workType: string;          // 作业类型
  hazardousWorkArea: string;// 危险作业区域
  className: string;
  screateTime: string;       // 开始时间
  ecreateTime: string;       // 结束时间
  userName: string;
  phone: string;
}
```

### 3.5 值班与会议（`Often.vue → OnDuty.vue`）

| 功能 / 接口 | 方法 | URL | 网关 | 参数 | 返回 |
|---|---|---|---|---|---|
| 值班列表 `getOnDutyList` | GET | `/api/app/on-duty/get-list` | Cooper | `{ isMySelf?: boolean; context?: string; page?: number; limit?: number }`（首页传 `null`） | `HttpCode<BaAutoColumnTableDto<List<Dictionary<string,string>>>>`，`res.data.list` 与 `res.data.columns` |
| 会议信息 `getmeetingInfos` | GET | `/api/app/apply-meeting/passed-room` | newOA（`/newOARouter`） | 无 | `res.data[]` `{ meetingTitle, roomName, startTime, endTime }` 均 `string` |

值班列表返回结构：

```ts
interface OnDutyTableResult {
  total: number;
  list: Array<Record<string, string>>; // 每行字段动态
  columns: Array<unknown>;            // 列定义，原文未展开
  remark: string;
}
```

### 3.6 故障与制造问题（`Often.vue → Fault.vue`）

> 2026-11-01 用户核正：设备名称为 `SMBC`、故障说明为 `SS_GZNR`，故障列表读取 `list` 数组；制造问题路径按下表大小写，`LJTH` 是零件图号。此处核正优先于早先照片辨读。制造问题响应外壳仍需内网确认，前端接受直返数组或 `{ list: [...] }`，不为缺失字段编造数据。

| 功能 / 接口 | 方法 | URL | 网关 | 参数 | 返回 |
|---|---|---|---|---|---|
| 故障信息 `getFaultTableMessageapi` | GET | `/api/app/fault/get-fault-table-message` | Cooper | 无 | `{ list: FaultDto[] }`；兼容直返数组 |
| 制造问题（ZZPWT）`getZZPWTMessageapi` | GET | `/api/app/z-zPWT/get-zZPWTMessage` | Cooper | 无 | 直接返回数组 `ZZPWTDto[]` |

```ts
interface FaultDto {
  SMBC: string;            // 设备名称
  GZFS_SJ: string | null; // 故障发生时间
  SS_GZNR: string;        // 故障内容
  CBGZPC_SJ: string | null;
  TWO_PC_SJ: string | null;
  GD_PC_SJ: string | null;
  GZPC_SJ: string | null;
  State: string;           // 未响应/处理中/已处理/未确认/已归零
}

interface ZZPWTDto {
  JX: string;   // 机型
  LJTH: string; // 零件图号
  DQZT: string; // 当前状态
  ZRXM: string; // 责任姓名
  TCSJ: string; // 提出时间
}
```

> `ZZPWT` URL 原始大小写较特殊，建议联调时与调用源码逐字符核对。

### 3.7 常用链接（`CommonLinks.vue`）

| 功能 / 接口 | 方法 | URL | 网关 | 参数 | 返回位置 |
|---|---|---|---|---|---|
| 常用系统 `getcustomizationapi` | GET | `/api/app/customization/index` | Cooper | `{ search: []; limit: 100; quick_search?: string }`（FilterInput） | `HttpCode<BaTableDto<List<CommonSystemOutDto>>>`；`res.data.list` |
| 软件下载 `getallpersonal` | GET | `/api/app/software-download/index` | Cooper | `{ search: []; limit: 100; quick_search?: string }` | `HttpCode<BaTableDto<List<SoftwareDownloadOutDto>>>`；`res.data.list` |

```ts
interface CommonSystemOutDto {
  DxE_id: number;
  Id: string;
  Name: string;
  Icon: string;
  JumpLink: string;
  Details: string;
  CreateTime: string;
  isIE: string;
  isToken: string;
}

interface SoftwareDownloadOutDto {
  Id: string;
  DxE_id: number;
  Icon: string;
  url: string;
  Title: string;
  CreateTime: string;
}
```

### 3.8 荣誉墙（`HonorWall.vue`）

- 接口：`getHonorapi`
- 方法：`GET`
- URL：`/api/app/honor`
- 网关：`Cooper`
- 参数：`{ Limit?: number }`（首页传 24）
- 返回：`HttpCode<List<HonorDto>>`，`res.data` 数组。

```ts
interface HonorDto {
  Id: string;
  weigh: number;
  DxE_id: number;
  Title: string;
  Awardee: string;
  Avatar: string;
  CreateTime: string;
}
```

### 3.9 表格下载（`TableDownload.vue`）

- 接口：`gettablesdownloadapi`
- 方法：`GET`
- URL：`/api/app/tables-download/index`
- 网关：`Cooper`
- 参数：`{ search: []; quick_search?: string }`
- 返回：`HttpCode<BaTableDto<List<TablesDownloadChildrenDto>>>`，读取 `res.data.list`（树形）。

```ts
interface TablesDownloadChildrenDto {
  Id: string;
  DxE_id: number;
  pId: number;
  ColumnTitle: string;
  DownloadLink: string;
  Icon: string;
  CreateTime: string;
  children: TablesDownloadChildrenDto[];
}
```

### 3.10 我的常用系统 / 关注订阅（`Leisure.vue` 弹窗）

| 功能 / 接口 | 方法 | URL | 网关 | 参数 | 返回 |
|---|---|---|---|---|---|
| 我的常用系统列表 `getmypersonalapi` | GET | `/api/app/personal/common-system-show-list` | Cooper | `{ UserID: string }` | 直接返回数组 `CommonSystemOutDto[]` |
| 保存我的常用系统 `postmypersonalapi` | POST | `/api/app/personal/update-common-system?UserID=<id>` | Cooper | body `string[]`（CommonSystemID 数组） | `CommonSystemOutDto[]` |
| 我的订阅列表 `getfocussubscription` | GET | `/api/app/focus-subscription/focus-subscription-list` | Cooper | `{ UserID: string }` | 直接返回数组 `ShowFocusSubscriptionListDto[]` |
| 保存订阅 `postfocussubscriptionapi` | POST | `/api/app/focus-subscription/update-focus-subscription?UserID=<id>` | Cooper | body `string[]`（FocusSubscriptionID 数组） | `string` |

```ts
interface ShowFocusSubscriptionListDto {
  Id: string;
  Title: string;
  Number: string;
}
```

### 3.11 原首页日程（`Leisure → Calendar.vue`）

> 本节是原首页 `Leisure` 层的领导/个人日程读取接口。**区别于第八章独立的 my-schedule Portal 日历 CRUD**，不可混同。

| 功能 / 接口 | 方法 | URL | 网关 | 参数 | 返回 |
|---|---|---|---|---|---|
| 领导日程 `getLeadershipAgenda` | GET | `/api/app/leader-schedule/by-time` | newOA | 无 | `res.data[]` `{ leaderName, leaderID, startTime, endTime, activity }`，均 `string` |
| 个人日程 `getsobtainscheduleapi` | POST | `/api/app/schedule/get-personal-schedule` | Cooper | `{ userID: string }` | 直接返回数组 `ScheduleDto[]` |

```ts
interface ScheduleDto {
  Id: string;
  Type: string;
  Title: string;
  Context: string;
  BeginTime: string;
  EndTime: string;
  RemindTime: string;
  IsPublic: number;
  IsReminded: number;
  Creater: string;
  CreateTime: string;
  Url: string;
}
```

### 3.12 待办 / 消息（`Leisure → TaskInboxView.vue`）

| 功能 / 接口名 | 方法 | URL | 网关 | 参数 | 返回 |
|---|---|---|---|---|---|
| 待办任务 `mytodo` | GET | `/api/tasks/pending` | processRouter | `{ employeeId: string; pageIndex: number; pageSize: number }` | `res.data` 对象，`items` 为列表 |
| 我的消息 `my` | GET | `/api/message-center/my?view=unread&page=1&limit=100` | MessageCenter | 无（query 已写在 URL） | `res.items[]` |
| 信息公告（未读）`getinfonoticeapi` | GET | `/InfoNotice/GetUnSeen` | Notifications | `{ userId: string }` | `res.rows[]` |
| 标记已读 `read` | POST | `/api/message-center/messages/{id}/read` | MessageCenter | URL 路径含 `id` | 无 |

```ts
interface PendingTaskItem {
  taskId: string;
  businessType: string;
  businessTitle: string;
  taskName: string;
  actionDescription: string;
  createTime: string;
  businessId: string;
}
interface PendingTaskResult {
  items: PendingTaskItem[];
  // 分页总数字段原文未列出，待核实
}
interface MessageCenterItem {
  messageId: string;
  sourceSystem: string;
  content: string;
  createdAt: string;
  url: string;
}
interface UnseenInfoNotice {
  InformationId: string;
  Title: string;
  SenderDate: string;
  Url: string;
}
```

### 3.13 数据指标（`DataIndicators.vue → dataIndicators/*`）

本节除明确写出的 `mms`、`Production` 等特例外，均走 `Cooper`（`/cooperRouter`）。

| 编号 / 业务 | 接口名 | 方法 | URL | 参数/特殊说明 |
|---|---|---|---|---|
| ① 工时计划（`one.vue`） | `getWorkingHourapi` | GET | `/api/app/data-center-station/get-working-hour-plan` | 直接返回对象 `{ Time: string; Month: string[]; ManHour: number[]; ManHourRate: number[] }` |
| ② 制造周期（`two.vue`） | `getSectionWorkingHourapi` | GET | `/api/app/data-center-station/get-section-working-hour-plan` | 直接返回对象，结构同① |
| ③ 制造项目（`two.vue`） | `getSectionItemapi` | GET | `/api/app/data-center-station/get-section-item` | 直接返回数组；元素结构未列出 |
| ④ 制造项目工时（`two.vue`） | `getSectionItemWorkingapi` | GET | `/api/app/data-center-station/get-section-itemworking-hour-plan` | `{ SectionItem: string }`；直接返回对象（字段待核实） |
| ⑤ 系统名称流程（`process.vue` / `processtwo.vue`） | `getprocesssysName` | GET | `/api/app/data-center-station/get-sys-name` | `{ sysName: string }`，如 `CEMOP` / `NICE` / `OA` / `SERP`；直接返回数组，字段见下 |
| ⑥ 科技创新（`three.vue`） | `getCreation` | GET | `/api/app/data-center-station/get-creation` | 直接返回对象，字段见下 |
| ⑦ 文本数据（`textual.vue`） | `getDataCenterStation` | GET | `/api/app/data-center-station-text/index` | `{ search: []; quick_search?: string }`；`HttpCode<BaTableDto<List<DataCenterStationTextDto>>>`，`res.data.list` |
| ⑧ 制造周期（`mms` / `equipIntactRate.vue`） | `getDataCenterStationCycleDto` | GET | `/stats/getDataCenterStationCycleDto` | 网关 `mms`；原文注“当前组件中调用被注释，未实际使用”；`res` 结构待核实 |
| ⑨ 制造周期（Cooper） | `getcycleapi` | GET | `/api/app/data-center-station/get-cycle` | 直接返回对象 `{ Month: string[]; Cycle: number[]; CycleYearNorm: number }` |
| ⑩ 设备 | `getEquipmentapi` | GET | `/api/app/data-center-station/get-equipment` | 直接返回对象，字段见下 |
| ⑪ 在制品率 | `getInProductRateapi` | GET | `/api/app/data-center-station/get-in-product-rate` | 直接返回对象，字段见下 |
| ⑫ 工时 | `getManHourapi` | GET | `/api/app/data-center-station/get-man-hour` | 直接返回对象，字段见下 |
| ⑬ 制造周期（P23） | `getP23Planapi` | GET | `/api/app/data-center-station/get-p23Plan` | 直接返回对象，字段见下 |
| ⑭ 制造周期（Production） | `getZZZQapi` | GET | `/api/xttpzq/monthzzzq` | 网关 `Production`；返回 `res.result[]` |

```ts
interface ProcessSysNameItem {
  PROCESS_NAME: string;
  TASK_TITLE: string;
  AUTHOR_NAME: string;
  AUTHOR_CODE: string;
  DbCreateDate: string;
  StayingDate: string;
}
interface CreationStats {
  Month: string[];
  Patent: number[];
  PatentYearNorm: number;
  Paper: number[];
  PaperYearNorm: number;
}
interface DataCenterStationTextDto {
  Id: string;
  DxE_id: number;
  Month: string;
  Text: string;          // JSON 字符串
  CreateTime: string;
}
interface EquipmentStats {
  Month: string[];
  Integrated: number[];
  IntegratedYearNorm: number;
  Keyequipment: number[];
  KeyequipmentNorm: number;
}
interface InProductRateStats {
  Month: string[];
  InProduct: number[];
  InProductRate: number[];
  InProductYearNorm: number;
}
interface ManHourStats {
  Month: string[];
  ManHourRate: number[];
  ManHour: number[];
  Time: string;
}
interface P23PlanStats {
  Month: string[];
  P21A: number[];
  P21B: number[];
  P21C: number[];
}
interface ProductionCycleItem {
  month: string;
  datatype: string;
  zzzq: number;
}
```

**注意：** 原文标题为 `P23`，返回键却写作 `P21A/P21B/P21C`，这里照录，属于联调检查项；`get-section-itemworking-hour-plan`、`get-p23Plan` 大小写照录。

### 3.14 点赞 / 浏览（新闻详情页 `focusnewsdetail`）

前缀统一：`likeFeatureUrl`（`/likeFeatureUrl → http://172.16.29.162:8080/likefeature`）。

| 接口名 | 方法 | URL | 参数 | 返回读取 |
|---|---|---|---|---|
| `countviews` | GET | `/api/views/count?newsId=` | query `{ newsId }` | `res.data` 浏览数 |
| `countrecord` | POST | `/api/views/record` | body 数据（原文未给字段） | 原文 `-` |
| `likesstatus` | GET | `/api/likes/status?newsId=` | query `{ newsId }` | `res.data` 是否已赞 |
| `likescount` | GET | `/api/likes/count?newsId=` | query `{ newsId }` | `res.data` 点赞数 |
| `likestoggle` | POST | `/api/likes/toggle` | body 数据（原文未给字段） | 原文 `-` |

### 3.15 其他首页相关接口

下列接口来自原文第 21～23 页“其他首页相关接口”。原文没有展开的请求参数、返回结构 **待核实**。

| 功能 / 接口 | 方法 | URL | 网关 | 参数/结果 |
|---|---|---|---|---|
| 通讯录组织 `getSkcOrgApi` | GET | `/api/app/skc-tXL/get-skc-org` | Cooper | 未列 |
| 通讯录详情 `getTXLContextApi` | GET | `/api/app/skc-tXL/get-context` | Cooper | 未列 |
| 皮肤 `getskinapi` | GET | `/api/app/skin` | Cooper | 未列 |
| 领导团队 `leaderTeamList` | GET | `/api/app/leader-team/index` | Cooper | `{ search: []; limit?: number }`，`HttpCode<BaTableDto<List<LeaderTeamOutDto>>>` |
| 文件管理 `getfileManagementapi` | GET | `/api/app/file-management/index` | Cooper | 未列 |
| 指定频道新闻 `channelToNewsList` | GET | `/api/app/news-center/channel-to-news-list?ChannelID=<id>` | Cooper | `ChannelID`，其余未列 |
| 新闻排行榜 `getRanking` | GET | `/api/app/news/get-ranking` | Cooper | 未列 |
| 搜索 `getSearchapi` | POST | `/api/app/search/search` | Cooper | 未列；注意与第九章 AURA 搜索不同 |
| 自动补全 `autoComplete` | POST | `/api/app/search/auto-complete` | Cooper | 未列 |

```ts
interface LeaderTeamOutDto {
  DxE_id: number;
  Id: string;
  CreateTime: string;
  UserName: string;
  JobTitle: string;
  Context: string;
  AB: string;
  Avatar: string;
  weigh: number;
}
```

---
## 四、iframe 外部系统嵌入

以下组件通过 `<iframe>` 直接嵌入外部系统，不经过 Axios；页面加载性能、鉴权、CSP、跨域、嵌套滚动及退出登录清理需要单独设计。

| 组件 | 原文 iframe 地址 / 来源 | 备注 |
|---|---|---|
| `Often.vue` | `http://172.16.127.51/default3.asp?Token=<token>` | 通过 URL Token 打开外部系统；Token 参数大小写照录 |
| `DataIndicators.vue` | `http://dnc2.skc.cac.com:8081/kanban/ssg2/chart...`、`http://oa.skc.cac.com:8093/` | 表格中包含 `chart1`、`chart2`、`form` 等图表地址，原页文本较小，完整页面路径 **待核实** |

> **风险提示**：URL 中传递 Token 可能进入浏览器历史、代理日志、Referer 等。原文用法仅供兼容既有系统，重构应评估令牌范围、有效期及跳转安全，不应直接复用高权限主令牌。

---

## 五、前端重构要点

以下 9 项依据原文第 23～24 页“给前端 AI 的重构要点”整理：

1. **返回结构不同**：必须区别 `直返数组/对象` 与 `HttpCode` 的 `res.data` / `res.arr`；错误解包会变成 `undefined`。
2. **网关前缀不同**：`Cooper`、`YiyanQC`、`newOA`、`MessageCenter`、`likeFeatureUrl`、`Production`、`mms`、`Notifications`、`processRouter`、`LogoutSync`、`CropDir`、`OA` 等必须显式传给 `createDXEAxios(options.interfaceAddress)`。RBAC、Portal 日历独立 HTTP 客户端。
3. **认证**：请求默认携带 Bearer JWT。原文说明 401 自动刷新；重构时务必核实刷新失败后的退出处理，避免重复并发刷新。
4. **首页数据流**：`News.vue` 是聚合框架，质量看板、热点数据应分发到 `QualityBoard.vue`、`HotWork.vue`；重构应将接口装载和状态管理分离。
5. **并发请求**：`News.vue` 通过 `Promise.all` 并发拉取项目/干部/班组详情；重构关注部分接口失败的容错（原文提及单个失败时返回空数组的兜底）。
6. **时间格式**：后端返回 ISO 时间字符串，前端使用 `dayjs` 格式化，如 `YYYY-MM-DD HH:mm:ss`；保留时区语义。
7. **HTML 内容**：新闻/公告 `content/Context` 为 HTML，使用 `DOMPurify` 净化；原文还提及移除 `font-family`、统一行高。**不要简单把 HTML 直接 `v-html` 渲染未经净化的数据**。
8. **多种实时协议**：首页同时使用 HTTP REST、MQTT、SSE、SOAP、iframe。重构时分别处理连接、订阅、重连及生命周期清理。
9. **RBAC 独立客户端**：RBAC 采用单独 Axios 实例 `rbacClient`，成功条件为 `code === 0`（并非 `code === 1`），需 `X-Project` 请求头。

---

## 六、MQTT 实时消息协议

客户端：前端 `mqtt` 库，协议 **MQTT v3.1.1**，使用 WebSocket 连接 EMQX Broker，实现实时消息推送及被踢下线事件。

### 6.1 连接配置

| 配置 | 原文值 |
|---|---|
| Broker 地址 | `import.meta.env.VITE_PROXY_MQTT`（开发环境代理到 EMQX） |
| 协议 | MQTT v3.1.1（`protocolId: 'MQTT'`，`protocolVersion: 4`） |
| ClientId | `mqttjs_<userId>_<8位随机hex>` |
| Keepalive | `60s` |
| Clean Session | `true` |
| 重连 | 自动重连，间隔 `1000ms` |
| 连接超时 | `15s` |
| MQTT 认证 | 无 `username/password`（依赖网络隔离；该特性不等于可安全暴露公网） |

### 6.2 业务消息通道（`mqttStore`）

- Store：`src/stores/mqttStore.ts` → `useMqttStore`
- 订阅主题：`cooper/publish`
- 消息：MQTT 原始 payload 是 JSON 字符串；前端解析后触发数据刷新。

| 消费组件 | 消息到达后的操作 |
|---|---|
| `News.vue` | `getfontNews()`、`getnewsimg()`、`getnotices()` 等，刷新新闻/公告（第一个函数名称原图可能需与源码核对） |
| `windowPopup/index.vue` | `getnotices()`，刷新公告弹窗 |
| `Newsstand.vue` | `getnewsimgApi()`，刷新图片新闻 |

### 6.3 踢人下线通道（`mqttLogoutStore`）

- Store：`src/stores/mqttLogoutStore.ts` → `useMqttLogoutStore`
- 订阅主题：`<userId>/publish`（每位用户独立主题）
- ClientId：`logout_<userId>_<old_client_id>_<8位随机hex>`；**`old_client_id` 来源和准确格式请按源码核验**。
- `reconnectPeriod: 0`：被踢后禁止自动重连。
- 收到消息后先执行登出跳转，不再重连。

### 6.4 初始化、消息处理流程

```text
App.vue onMounted
├── mqttStore.initializeConnection()
│   ├── mqtt.connect(VITE_PROXY_MQTT, options)
│   ├── on('connect') → subscribe('cooper/publish')
│   └── on('message') → 各组件监听并刷新
└── mqttLogoutStore.initializeConnection()
    ├── mqtt.connect(VITE_PROXY_MQTT, options)
    ├── on('connect') → subscribe('<userId>/publish')
    └── on('message') → 执行登出逻辑
```

**重构建议（区别于原文约束）：** 全局连接由 App/Store 管理，页面组件只订阅消息事件；避免不同组件各建 MQTT 连接。登出时释放连接并取消订阅；新闻刷新考虑节流/去重，防止多条推送引发首页瞬间重复请求。

---

## 七、SSE 日历实时订阅

### 7.1 连接配置

日历模块使用基于 **`fetch + ReadableStream`** 的 SSE 连接，而非 `EventSource`（原文理由：需要携带 `Authorization` 请求头）。

| 项目 | 原文配置 |
|---|---|
| SSE 端点 | `/api/calendar/events/stream` |
| Base URL | `/cooperRouter`（同 Calendar REST API） |
| Header `Authorization` | `Bearer <token>` |
| Header `Accept` | `text/event-stream` |
| Cache | `no-store` |

### 7.2 SSE 事件类型

| SSE event | 含义 | 前端行为 |
|---|---|---|
| `calendar.event.created` | 日程创建 | 延迟 `250ms`，`refreshTick++`，重新获取日程列表 |
| `calendar.event.updated` | 日程更新 | 同上 |
| `calendar.event.deleted` | 日程删除 | 同上 |
| `calendar.reminder.fired` | 日程提醒触发 | 解析 `data` 中的 `PortalNotificationDto`，加入提醒弹窗队列 |

### 7.3 断线重连

- 最小退避：`3s`
- 最大退避：`15s`
- 退避序列：`3s → 6s → 12s → 15s → 15s…`
- 心跳注释：以 `ping` 检测连接（原文未列完整 payload）。

### 7.4 数据流

```text
useScheduleStore.start()
├── createCalendarStream({ path: '/api/calendar/events/stream', ... })
│   ├── fetch(baseUrl + path, { headers: { Authorization, Accept } })
│   └── ReadableStream 逐帧解析
│       ├── calendar.event.* → refreshTick++ → loadWidgetRange()
│       └── calendar.reminder.fired → enqueueAlert()
├── loadWidgetRange()          // 初始加载
└── loadMissedReminders()      // 补看离线提醒
```

**联调重点：** SSE 用 `fetch` 自行解帧，需正确处理 `event:` / `data:`、多行数据、流式分包、断开取消、登录态变化；避免连接泄露或将心跳当作业务事件。

---

## 八、Portal 日历 REST API

来源：`my-schedule` 模块。采用**独立 fetch 客户端（非 Axios）**，通过 `configureCalendarClient` 注入 `baseUrl` 和 token 获取函数。原文配置：

```ts
configureCalendarClient({
  baseUrl: '/cooperRouter',
  getAccessToken: () => admininfo.token,
});
```

以下 8 个接口统一由 Portal 后端处理。除特别注明外，API path 均相对于 `/cooperRouter`。

### 8.1 日程 CRUD

> 创建和更新的 `startAt`、`endAt` 是两个独立的完整日期时间，允许跨日、跨月、跨年。前端不得把两者绑定到同一个年月日，也不能仅比较时分大小；提交值保留本地 UTC 偏移。

| 功能 | 方法 | 路径 | 请求 | 响应 |
|---|---|---|---|---|
| 查询日程列表 | GET | `/api/calendar/events?start=<ISO>&end=<ISO>` | `start/end` 为带本地偏移的 ISO 时间字符串 | `CalendarEventDto[]` |
| 创建日程 | POST | `/api/calendar/events` | `CreateEventPayload` JSON | `CalendarEventDto` |
| 获取单个日程 | GET | `/api/calendar/events/{id}` | path `id` | `CalendarEventDto` |
| 更新日程 | PATCH | `/api/calendar/events/{id}` | `UpdateEventPayload`（原文注明同 `CreateEventPayload`） | `CalendarEventDto` |
| 删除日程 | DELETE | `/api/calendar/events/{id}` | path `id` | HTTP `204 No Content` |

```ts
interface CalendarEventDto {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: string;       // ISO 时间
  endAt: string;         // ISO 时间
  reminderMinutes: number;
  source: 'USER' | 'AGENT';
}

interface CreateEventPayload {
  title: string;
  description: string | null;
  location: string | null;
  startAt: string;
  endAt: string;
  reminderMinutes: number;  // 0=不提醒；5/10/15/30/60/1440 等
}

type UpdateEventPayload = CreateEventPayload;
```

### 8.2 提醒通知

| 功能 | 方法 | 路径 | 参数 | 返回 |
|---|---|---|---|---|
| 未读提醒列表 | GET | `/api/calendar/notifications/unread` | 无 | `PortalNotificationDto[]` |
| 标记单条已读 | POST | `/api/calendar/notifications/{id}/read` | path `id` | HTTP `204 No Content` |
| 标记全部已读 | POST | `/api/calendar/notifications/read-all` | 无 | HTTP `204 No Content` |

```ts
interface PortalNotificationDto {
  id: string;
  type: string;       // 如 'calendar.reminder.fired'
  sourceId: string;   // 关联日程 ID
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}
```

### 8.3 错误处理

客户端抛出 `CalendarApiError`，包含 `status`（HTTP 状态码）和 `message`：

- `status === 0`：网络不可达或者请求配置异常。
- 其他状态：HTTP 错误码 + 后端返回的 `message` / `title` / `error` 字段。

**重点区别：** Calendar REST 响应是 `CalendarEventDto` / `CalendarEventDto[]`（原文如此描述），不能默认按 `HttpCode<T>` 解包；`DELETE`/已读接口的 `204` 不应调用 `response.json()`。

---

## 九、AURA 搜索 API（`dayGroupedSearch`）

搜索模块使用原生 `fetch`（**非 Axios**）直连 AURA 搜索服务（原文称 Vespa 向量检索）。代理配置：`vite.config.ts` 的 `/aurasearchserviceUrl → VITE_AURA_URL`。

### 9.1 按日分组搜索

- 方法：`POST`
- URL：`<aurasearchserviceUrl>/api/search/day-grouped`
- 端点来源：`SearchEndpoints.dayGroupedEndpoint`

```ts
interface DayGroupedSearchRequest {
  query: string;                     // 搜索关键字（空串 = 按日浏览）
  sourceTypes: SourceType[];         // ['News','Announcement']
  publishTimeFrom?: string;          // ISO 日期
  publishTimeTo?: string;            // ISO 日期
  page: number;
  pageSize: number;
}
type SourceType = 'News' | 'Announcement';

interface DayGroupedSearchResponse {
  searchTraceId: string;
  searchMode: string;
  degraded: boolean;                 // 是否降级
  degradationMode: string | null;
  maxDepthReached: boolean;
  page: number;
  pageSize: number;
  totalDays: number;
  totalPages: number;
  totalItems: number;
  newsItems: number;
  announcementItems: number;
  days: SearchDayGroup[];
}
interface SearchDayGroup {
  date: string;
  items: SearchItem[];
}
interface SearchItem {
  newsId: string;
  title: string;
  highlight: string | null;          // 高亮摘要
  publisher: string;
  author: string;
  sourceType: 'News' | 'Announcement';
  publishTime: string;
  summary: string | null;
  contentHtml: string | null;
  cover: string | null;
}
```

### 9.2 关键字搜索

- 方法：`POST`
- URL：`<aurasearchserviceUrl>/api/search/search`
- 端点来源：`SearchEndpoints.searchEndpoint`
- 参数：同 `DayGroupedSearchRequest`。

```ts
interface SearchResponse {
  searchTraceId: string;
  searchMode: string;
  degraded: boolean;
  degradationMode: string | null;
  maxDepthReached: boolean;
  page: number;
  pageSize: number;
  results: SearchItem[];
}
```

### 9.3 统一视图封装

前端通过 `searchNews()` 根据 `query` 是否为空自动选择端点：

- `query === ''` → 调用 `dayGroupedEndpoint`（按日分组浏览）。
- `query` 非空 → 调用 `searchEndpoint`（关键字搜索）。
- 两种响应统一转换为 `SearchViewResponse`，字段 `displayMode: 'days' | 'results'`（原文 `SearchViewResponse` 的完整字段未列出）。

### 9.4 错误处理

- HTTP `503`：搜索服务暂时不可用。
- 其他 HTTP 错误：抛出带状态码的异常，如 `${status}`。
- 需要根据 `degraded`、`degradationMode` 和 `maxDepthReached` 反馈真实搜索状态，不要把降级搜索当完整结果。

---

## 十、RBAC 认证 API

> `rbacClient` **独立 Axios 实例**，与 `createDXEAxios` 完全隔离。

- `baseURL: VITE_RBAC_BASE_URL`，原文默认 `http://172.16.29.162:8085`。
- 项目标识：`VITE_RBAC_PROJECT`，默认 `cooper`。
- 请求头：`Authorization: Bearer <adminInfo.token>` 和 `X-Project: cooper`。
- 成功条件：`code === 0`（不是 `code === 1`）。
- 响应拦截器自动解包 `data` 层，调用方直接拿业务数据；失败抛出 `RbacApiError`。

### 10.1 RBAC 统一返回

```ts
interface RbacResponse<T = unknown> {
  code: number; // 0 = 成功，非 0 = 错误
  msg: string;
  data: T;
  time: number;
}
```

### 10.2 认证 / 初始化

| 功能 | 方法 | URL | 请求 | 返回 |
|---|---|---|---|---|
| RBAC 登录验证 | POST | `/api/auth/login` | Header `Authorization: Bearer <token>`、`X-Project: cooper`；无 body（只验证当前 JWT 用户是否允许进入 project） | `LoginResult` |
| 后台初始化（菜单 + 用户） | GET | `/api/admin/index` | 请求头同上 | `BackendIndexResult` |

```ts
interface LoginResult {
  token: string;
  adminInfo: RbacAdminInfo;
  routePath: string;
}
interface RbacAdminInfo {
  id: number;
  userid: string;
  username: string;
  project: string;
  super: boolean;
  loginIp: string;
}
interface BackendIndexResult {
  adminInfo: RbacAdminInfo;
  menus: MenuNode[];
  routePath: string;
}
interface MenuNode {
  id: string;
  pid: string;
  title: string;
  name: string;
  path: string;
  icon: string;
  type: string;
  children: MenuNode[];
}
```

### 10.3 管理员 CRUD

| 功能 | 方法 | URL | 请求参数 / 表单 | 返回 |
|---|---|---|---|---|
| 管理员列表 | GET | `/api/admin/list` | `AdminListQuery` | `PagedData<AdminItem>` |
| 新增管理员 | POST | `/api/admin` | `AdminCreateForm` | `{ userid: string }` |
| 编辑管理员 | PUT | `/api/admin/{userid}` | `AdminUpdateForm` | `void` |
| 启用 / 禁用 | PUT | `/api/admin/{userid}/status` | `AdminStatusForm` | `void` |
| 更新用户名 | PUT | `/api/admin/{userid}/username` | `AdminUsernameForm` | `void` |
| 删除管理员 | DELETE | `/api/admin/{userid}` | path `userid` | `void` |

> `AdminListQuery`、`AdminItem`、`AdminCreateForm`、`AdminUpdateForm`、`AdminStatusForm`、`AdminUsernameForm` 在照片中仅出现**类型名称**，具体字段未列出。不得自拟结构。

### 10.4 RBAC 桥接流程

```text
OIDC 登录成功 → adminInfo.setToken(token)
  └── initRbacBridge()
        ├── rbacApiLogin() → 验证用户并写入 RbacAdminInfo
        └── loadRbacBackendIndex()
              └── getBackendIndex() → 获取菜单树 + 用户信息

页面刷新 → ensureRbacState()
  └── token 存在但 userid 为空 → loadRbacBackendIndex() 补全状态
```

**注意：** RBAC 返回的 `token` 与外部 Keycloak/OIDC JWT 的关系需以现有桥接代码为准，不能据此直接推断为同一种签发令牌或可互换令牌。

---

## 十一、找茬平台 API（Nitpick）

统一网关：`Cooper`（`/cooperRouter`）。原文第 32 页以表格提供以下接口；返回类型仅前两项明确为 `HttpCode<BaTableDto<...>>`，其他待核实。

| 接口名（按原文） | 方法 | URL | 参数 | 返回 |
|---|---|---|---|---|
| `getNitpickapi` | GET | `/api/app/nitpick/get-parent-index` | `FilterInput` | `HttpCode<BaTableDto<...>>`（泛型元素未列） |
| `getNitpickrepliesapi` | GET | `/api/app/nitpick/get-children-index` | `{ parentid }` | `HttpCode<BaTableDto<...>>`（泛型元素未列） |
| `getNitpickAdd` | POST | `/api/app/nitpick/add` | body：找茬内容 | 未列 |
| `getNitpickEdit` | PUT | `/api/app/nitpick/update` | body：编辑内容 | 未列 |
| `getNitpickDel` | POST | `/api/app/nitpick/del` | `{ id }` | 未列 |
| `getNitpickHidden` | POST | `/api/app/nitpick/hidden` | `{ id }` | 未列 |
| `getNitpickLike` | POST | `/api/app/nitpick/like` | `{ id }` | 未列 |
| `getNitpickCancelLike` | POST | `/api/app/nitpick/cancel-like` | `{ id }` | 未列 |

> 此处的大小写由纸质表格辨读，应用到代码时建议对照接口导出符号进行核实。

---

## 十二、Notifications REST / SOAP

网关：`Notifications`（`/notificationRouter → http://portal.skc.cac.com:8080/`）。**本模块同时使用 REST 和 SOAP**，不可把 SOAP XML 当 JSON 处理。

### 12.1 REST 接口

| 功能 / 接口 | 方法 | URL | 参数 | 返回 |
|---|---|---|---|---|
| 查询未读通知 `getInfoNoticeapi` | GET | `/InfoNotice/GetUnSeen` | `{ userId: string }` | `res.rows[]`，字段见下 |
| 销毁通知 `getUpdateSeenForObjapi` | POST | `/api/MessageService/Finish` | `{ informationid, userid }` | 无 |

```ts
interface InfoNoticeItem {
  InformationId: string;
  Title: string;
  SenderDate: string;
  Url: string;
}
```

> 首个未读接口已在 3.12 重复引用，这里是通知服务的正式归类。

### 12.2 SOAP 接口 — 标记已读

- 接口名：`unreadInfonoticeapi`
- 方法：`POST`
- URL：`/ws_Information.asmx?op=DealWithFinish`
- `Content-Type: text/xml; charset=utf-8`
- 请求体：SOAP Envelope XML
- 响应：SOAP XML（不能直接视作 `ApiResponse`）。

```xml
<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema"
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <DealWithFinish xmlns="http://www.cac.com.cn/">
      <informationId>{informationId}</informationId>
      <userId>{userId}</userId>
    </DealWithFinish>
  </soap:Body>
</soap:Envelope>
```

> SOAP body 内的 `{informationId}`、`{userId}` 为占位符；与 REST 接口的参数大小写不同。XML 命名空间以原图为准；联调建议直接用 WSDL 验证。

---

## 十三、下线 / 踢人 API

前缀：`LogoutSync`（`/LogoutSync`），代理到后端同步服务；原表中 `/api/app/*` 路径如下。

| 接口名 | 方法 | URL | 参数 | 返回/作用 |
|---|---|---|---|---|
| `logoutuserid` | POST | `/api/app/mqtt-sync/mqtt-logout` | `{ userId }` | 移除当前用户消息 Tab 下线（原图文字稍模糊；具体行为待核实） |
| `logoutmatt`（原图疑似 `logoutmatt` / `logoutmqtt`） | POST | `/api/app/keycloak-sync/keycloak-client-logout` | `{ userId }` | 远程踢人下线（Keycloak session 注销） |

> 由于第二条方法名照片清晰度不足，这里保留可能的两种拼写，不应直接拿疑似方法名生成客户端；**URL 路径比方法名更可靠，但同样须与源码核对**。

---

## 十四、其他补充接口

### 14.1 流程管理（`processRouter`）

| 接口名 | 方法 | URL | 参数 | 返回 |
|---|---|---|---|---|
| `completeTask` | POST | `/api/app/process-management/complete-task` | body：任务数据 | 原图未给具体 DTO |
| `pendingprogress` | GET | `/api/app/process-management/progress-progress/{businessId}` | 路径参数 `businessId` | 流程进度 |
| `pendingtasksByloweid`（接口名原图不清） | GET | `/api/app/process-management/pending-tasks` | `{ employeeId }` | 待办任务列表 |

> 上表第二项地址在纸质原图上较小，`progress-progress` / `process-progress` 存在辨读歧义，**需以实际接口源码为准**。待办任务同时见 3.12 的 `/api/tasks/pending`，两者不是同一路径。

### 14.2 用户状态 / 头像（`CropDir`）

| 功能 / 接口名 | 方法 | URL | 参数 | 返回 |
|---|---|---|---|---|
| 在线状态 `onlinestatus` | POST | `/api/onlinestatus/search` | body `string[]`（用户 ID 数组） | 在线状态 |
| 用户头像 `getAvatar` | GET | `/org/cac/addressbookbackend/mrorganizationinfo/getEmpPhoto` | `{ empno }` | 用户头像 |

### 14.3 生产安全值班（`OA`）

- 接口：`getproductionsafetywatchInfos`
- 方法：`GET`
- URL：`/ProductionSafetyWatch/GetProductionSafetyWatchInfos`
- 前缀：`OA`（`/oaRouter → http://172.16.29.162:8151/`）
- 参数：无。
- 返回：生产安全值班信息（原文未列字段 DTO）。

### 14.4 实时在线表格

- 接口：`compression`
- 方法：`GET`
- URL：`/api/app/compression?TargetID=<id>`
- 前缀：`Cooper`
- 参数：`{ TargetID: string }`
- 返回：实时在线压缩数据（原文未列具体类型）。

### 14.5 预览数据

- 接口：`getPreviewDetailitemapi`
- 方法：`GET`
- URL：`/api/app/prev-view/get-html-data?ID=<id>`
- 前缀：`Cooper`
- 参数：`{ ID: string }`
- 返回：HTML 预览数据（原文未列 DTO）。

### 14.6 上传文档

- 接口：`uploadOffice`
- 方法：`POST`
- URL：`/api/app/file-common/upload-office-file`
- 前缀：`Cooper`
- 请求 Content-Type：`multipart/form-data`
- 请求 body：`FormData`（文件）
- 返回：上传结果（原文未列类型）。

### 14.7 荣誉墙栏目

- 接口：`getHonorColumn`
- 方法：`GET`
- URL：`/api/app/honor/column-list`
- 前缀：`Cooper`
- 参数：无。
- 返回：栏目列表。

### 14.8 通讯录编辑

- 接口：`postSKTXLEditApi`
- 方法：`POST`
- URL：`/api/app/skc-tXL/edit`
- 前缀：`Cooper`
- 参数：编辑字段（原文未列 DTO）。
- 返回：编辑结果。

---

## 十五、协议与联调核对清单

### 15.1 协议总览

| 协议 | 作用 | 调用方式 | 认证方式 | 主要涉及模块 |
|---|---|---|---|---|
| HTTP REST | 绝大多数业务接口 | `createDXEAxios` / `rbacClient` / 独立 `fetch` | 多数 Bearer JWT，RBAC 另加 `X-Project` | 全部业务模块 |
| MQTT v3.1.1 | 实时消息推送、踢人下线 | `mqtt.connect(WS)` | 原文无 username/password（网络隔离） | News、windowPopup、登出 |
| SSE | 日程变更实时推送、提醒 | `fetch + ReadableStream` | Bearer JWT（headers） | Calendar / my-schedule |
| SOAP XML | 通知标记已读 | `createDXEAxios`（`text/xml`） | 原文未明确 | Notifications |
| iframe | 外部系统嵌入 | `<iframe src>` | URL Token（依具体系统） | Often、DataIndicators |

### 15.2 必须保持的原始语义

- **响应解包**：`HttpCode` 成功码 `1`，RBAC 成功码 `0`；另外存在直返对象/数组、`res.arr`、`res.result[]`、`res.rows[]`、`res.items[]`、`res.data.list`、`res.data.columns`。
- **请求字段大小写**：`UserID` 与 `userID`、`ChannelID`、`Pageindex`、`Pagesize`、`Page`、`Limit`、`pageNo`、`pageSize`、`statDate`、`happendDate`、`TargetID` 等不能随意改名。
- **网页结构**：`dashboard.vue` 聚合多组件；移交给 AI 开发时应当明确接口属于哪个 Vue 组件，以免重构时误删子组件加载逻辑。
- **认证隔离**：普通业务 JWT、RBAC 项目标识、Portal Calendar 独立客户端与 AURA 服务的错误模型不同。
- **HTML 安全**：新闻/公告/预览 HTML 需要内容净化；搜索结果 `contentHtml` / `highlight` 也可能是 HTML，不应直接信任。
- **实时连接清理**：MQTT 的消息订阅和踢人主题、SSE 的取消与重连、切换用户或登出后的清理须处理好。
- **日期/时区**：多数返回 ISO 字符串，日历 `start/end` 要包含本地时区偏移；各模块的日期区间语义不能自动混用。

### 15.3 待核实 / 无法从照片完整恢复的细节

以下条目在纸质照片里未给出、文本较模糊或与同章其他接口存在差异，**不是已确认错误**：

| 类别 | 待核实问题 | 建议核对来源 |
|---|---|---|
| 图片新闻 | `/api/app/news` 是否每种查询场景均直接返回数组，筛选 DTO 实际大小写 | `getnewsimgApi` 实现及后端接口 |
| 制造问题 | `ZZPWT` 路由大小写与连字符 | `getZZPWTMessageapi` 源码/抓包 |
| 质量问题 | `todaykeyfocuslist` 的网关；`happendDate` 返回/过滤格式 | Axios `interfaceAddress` 与后端签名 |
| 流程统计 | `/processOverdueStat` 之外两个统计端点的确切 URL | `qc.vue` API 文件 |
| 数据指标 | `getSectionItemapi` 等未列出的具体 DTO，P23 vs P21A/P21B/P21C | DataIndicators 子组件、接口响应 |
| 新闻及质量日期 | `YYYY-MM-DD,YYYY-MM-DD` 和日期字符串数组的数据编码方式 | 调用参数构造代码 |
| iframe | DataIndicators 的全部图表 URL、Token 传参方式 | iframe src 与部署配置 |
| Portal 日历 | 创建/更新是否支持额外字段、`PATCH` 与 `204` 行为、SSE 的心跳帧 | my-schedule 模块 API |
| MQTT | Broker WS 路径、踢人消息 payload、旧 ClientId 规则 | Store 与 EMQX 配置 |
| RBAC | 管理员各表单的字段定义、与 Keycloak token 的桥接细节 | RBAC API schema/代码 |
| 找茬 Nitpick | 多个请求体 DTO 和详细响应泛型 | Nitpick 后端 Controller |
| Notifications | SOAP Namespace / SOAPAction、`Finish` 参数名 | WSDL / Network 抓包 |
| 下线踢人 | 原表第二个函数名可能是 `logoutmqtt`；实际业务语义 | LogoutSync API 文件 |
| 流程管理 | `pendingprogress` 的精确路径、第三个函数名 | processRouter API 文件 |
| 环境 | 生产代理地址、HTTP/HTTPS、CORS、端口是否依旧有效 | `vite.config.ts` 与现网环境变量 |

### 15.4 面向前端开发 / AI Agent 的交付使用原则

1. **先建立独立 API 层**：按 `Cooper / YiyanQC / processRouter / MessageCenter / Notifications / newOA / Production / OA / RBAC / Calendar / AURA` 划分客户端，不要靠 URL 猜网关。
2. **每个接口明确 `unwrap` 策略**：接口定义应包含响应路径（直返、`data`、`arr`、`items` 等）；禁用全局无条件 `return res.data.data`。
3. **对照实际网络数据**：本文属于纸质文档转录，不代表接口已通过运行验证；对“待核实”项先抓包核验，再编写强类型 DTO。
4. **减少首页重复加载**：统一缓存与请求生命周期，实时消息只触发必要模块增量刷新；不要收到一条 MQTT 就全首页重拉。
5. **兼容存量页面**：不要在 API 重构期间擅自修改 RBAC 菜单、流程发起方式或门户业务权限；用适配层隔离旧接口的历史字段。
6. **保留错误证据**：联调失败时记录请求方法、网关、路径、参数结构、状态码及响应 schema，避免记录完整 token、个人敏感数据或大段正文。

---

## 附录 A：按原文章节对照页码

| 原文章节 | 页码（按图片出现顺序） |
|---|---|
| 一 前端请求架构、二 首页结构、三 首页 API 接口清单 | 1–23 |
| 四 iframe、五 重构要点 | 23–24 |
| 六 MQTT | 24–25 |
| 七 SSE | 25–26 |
| 八 Portal 日历 REST API | 26–28 |
| 九 AURA 搜索 | 28–30 |
| 十 RBAC 认证 API | 30–32 |
| 十一 Nitpick、十二 Notifications | 32–33 |
| 十三 下线/踢人、十四 其他补充接口 | 33–35 |
| 十五 协议总览 | 35 |

> **本整理文档性质**：接口清单 + 关键 DTO + 请求/响应规则 + 前端集成注意事项。对原照片没有提供完整 DTO 的接口，只保留可确认信息，绝不自动补写不存在的字段。
