# 数据来源与切换正式接口核查

本次以根目录 API 文档及 2026-11-02 用户补充为依据，检查 Cooper 当前菜单可达的首页、二级弹窗、新闻、检索、预览和权限中心。内网业务服务未实连；以下描述的是源代码映射及本地受控验证，不代表真实后端已验收。

## 业务数据来源

| 界面 | API / 返回位置 | 页面使用的数据 |
| --- | --- | --- |
| 图片新闻 | `GET /api/app/news`，直返数组 | `Id/Title/Cover/Abstract/CreateTime/Hits`；请求 7 条，前 4 条轮播，后 3 条缩略图，按 ID 去重 |
| 文字新闻 | `GET /api/app/news-kuai-bao/get-news-kuai-bao`，直返数组 | 标题、作者、正文、发布时间 |
| 科技、质量及频道列表 | `GET /api/app/news-center` 的 `data`、`GET /api/app/news-center/get-context` 的 `arr/count` | 频道与新闻数据；没有频道数据时为空，不填演示频道 |
| 新闻详情 | `GET /api/app/news/detail`；独立点赞/浏览 API | 正文、作者、浏览量、点赞状态与数量；点赞未加载显示占位符，浏览接口失败可使用详情 API 的 `Hits`。前后篇按频道 `get-context` 每页 50 条查询，跨页补取相邻记录，以 `count` 判断首尾；失败显示重试 |
| 弹窗公告 | `POST /api/app/notice/popup-notice`，直返数组 | 全部公告、`IsTop/Title/Context/From/Creater/CreateTime/Urls/PublicityPeriod` |
| 资讯检索 | AURA `POST /api/search/day-grouped` 或 `/api/search/search` | 新闻去标签，公告保留净化后的 HTML；页面不生成业务摘要或截断正文 |
| 领导日程 | newOA `GET /api/app/leader-schedule/by-time` 的 `data` | 领导姓名、活动与起止时间 |
| 我的日程 | `/api/calendar/events` 的 GET/POST/PATCH/DELETE | 日程记录及编辑结果；Element Plus 日期时间区间分别提交 `startAt/endAt`，支持跨日、跨月、跨年。新建初始时分属于表单默认值 |
| 常用系统、应用中心 | `/api/app/personal/common-system-show-list`、`/api/app/customization/index` | 名称、描述、图标、跳转地址、个人选择与排序 |
| 值班信息、值班安排 | `GET /api/app/on-duty/get-list` 的 `data.colums/list/remark/total` | 列名、顺序、对齐及宽度来自 `colums`；日期 `OnDutyTime`，人员使用生产岗位字段；动态列及人员信息；“我”使用真实登录用户姓名，组件中没有“张三”默认值 |
| 会议动态 | newOA `GET /api/app/apply-meeting/passed-room` 的 `data` | 会议、地点、起止时间；状态由实际当前时间计算，不使用固定演示日期 |
| 危险作业 | `GET /api/app/hot-work` 的 `data.list/total` | `workType` 作业类型、`hazardousWorkArea` 区域、`plant/className`、时间、责任人和电话；不再包装为技改项目 |
| 右下角设备故障 | `GET /api/app/fault/get-fault-table-message` 的 `list`（兼容直返数组） | `SMBC` 设备名称、`SS_GZNR` 故障说明、`GZFS_SJ` 发生时间、`State` 状态 |
| 右下角制造问题 | `GET /api/app/z-zPWT/get-zZPWTMessage`，接受数组或 `list` | `JX` 机型、`LJTH` 零件图号、`DQZT` 当前状态、`TCSJ` 提出时间、`ZRXM` 责任人 |
| 荣誉墙 | `GET /api/app/honor` 的 `data` | 标题、获奖对象、图片和日期；外站地址仍在 `OperationsPanels.vue` 的 `honorSiteUrl` 直接填写 |
| 软件下载、表格下载 | `/api/app/software-download/index`、`/api/app/tables-download/index` 的 `data.list` | 名称、日期、链接及子目录 |
| 今日待办 | processRouter `GET /api/tasks/pending` 的 `data.items` | 任务标题、类型、节点、创建时间与 ID；每页 100 条，累加去重计数，不假定未记载的 total 字段 |
| 消息中心 | `GET /api/message-center/my` 的 `items`，`POST /api/message-center/messages/{id}/read` | 未读消息及数量；有效 `url` 打开目标，无 `url` 则弹窗显示完整 `content` |
| 管理员选人 | `/api/app/skc-tXL/get-skc-org`、`/api/app/skc-tXL/get-context` | 原组件内嵌的组织和人员已迁入统一 Mock；正式模式只读接口。文档缺少 DTO，`directory.ts` 对现有选人控件字段做严格校验，不匹配时显示错误，不填演示人员 |
| 菜单、管理员、权限组、规则、映射、授权 | 原 Keycloak / RBAC API | 始终真实鉴权，业务 Mock 开关不影响该链路 |

## 已清理的问题

- 页面组件中的 Mock 姓名、固定当前时间已移除。演示记录及动态日期仅存在于 `mock.ts` / `mockTransport.ts`。
- 原制造问题“累计台数”改为“零件图号”；设备字段和制造问题路径按用户核正更新，Mock 同步更新。
- 未配置的外部链接、空字符串和 `#` 不再回退到首页，避免外部看板自嵌套或消息假跳转。
- 生产环境两个 Mock 开关均关闭；遗留 Cochain 服务也必须显式启用 Mock。旧 Cochain 页面不属于当前 Cooper 门户菜单，本次保留其文件。
- 数量来自 API 返回记录或明确的 `count/total`；零值、破折号、空列表、状态枚举、频道标签、图标样式、新建表单默认值属于交互或空态，不充当已有业务记录。

## 内网切换

1. `.env.production` 保持 `VITE_COOPER_USE_MOCK=false`，重新构建。无需删除 Mock 源文件；生产 Cooper 业务请求不会进入 Mock 分支。旧 Cochain Mock 开关及未接入的 Cochain 页面已清理。
2. 使用同域反向代理时保留 `VITE_*_API_BASE_URL` 的本地前缀，并配置 Web 服务器反代。使用直连时，将这些变量填写为 API 文档中对应的完整网关地址；末尾不带 `/api`，代码继续拼接接口路径。`VITE_*_API_TARGET` 只控制开发服务器代理，不能用于替代生产配置。

| 生产变量 | 文档中的完整网关地址参考 |
| --- | --- |
| `VITE_COOPER_API_BASE_URL` | `http://172.16.29.162:8080/cooperRouter` |
| `VITE_NEW_OA_API_BASE_URL` | `http://api.skc.cac.com:8109` |
| `VITE_PROCESS_API_BASE_URL` | `http://172.16.29.162:8080/processv3` |
| `VITE_MESSAGE_API_BASE_URL` | `http://172.16.29.162:8080/novu` |
| `VITE_LIKE_API_BASE_URL` | `http://172.16.29.162:8080/likefeature` |
| `VITE_QUALITY_API_BASE_URL` | `http://172.16.127.223:31185` |
| `VITE_AURA_API_BASE_URL` | 文档未给出固定地址，填写已部署的 AURA 服务地址 |

3. 页面跳转独立填写 `VITE_PROCESS_CENTER_URL`、`VITE_PROCESS_TASK_URL`、`VITE_MESSAGE_CENTER_URL`。任务地址可包含 `{taskId}`、`{businessId}`，自动编码替换；不填任务地址时使用流程中心首页。后端 API 地址不当作前端页面地址。
4. SSE 与日历 REST 共用 Cooper API 前缀。MQTT、OnlyOffice 和既有身份服务分别使用现有配置。直连网关需要服务允许实际前端来源，或采用同域反代。

制造问题外壳、通讯录 DTO、预览 `get-html-data` DTO 以及点赞/浏览 POST 请求体仍需真实内网响应确认。当前未用虚构正式数据掩盖这些未确认项。

## 验证方式

`scripts/verify-portal-data-boundaries.mjs` 检查截图反馈、数量和跳转；提供 `COOPER_PRODUCTION_URL` 时，额外用已关闭 Mock 的生产包在已授权的同一来源（1919）验证 HTTP 传输，再拦截为受控列表、空数组和 503 响应，确认页面渲染接口内容且不会回退演示记录。该模式验证传输与渲染边界，不代表访问了真实业务服务。

生产边界单独验证时，可用环境变量 `COOPER_ONLY_PRODUCTION=true` 和 `COOPER_AUTH_STATE_PATH` 指向工作区之外临时保存的登录状态；完成后删除临时状态。浏览器来源继续使用已授权端口，不为验收扩大 SSO 的来源或重定向范围。

本轮结果：Node 16.20.2 类型检查、23 个 Vue 模板检查、22 项 API/Mock 契约检查，以及生产和 Mock 构建通过。浏览器主流程 28 项、公告 12 项、截图与交互 16 项、关闭 Mock 的生产边界 6 项均通过。开发服务已恢复至 1919；没有扩大 SSO 来源或重定向范围，临时登录状态已删除。

日历区间修正：周/月/年使用已有 FullCalendar 6.1.15，创建和编辑使用 Element Plus 2.7.8 的 `datetimerange`，没有新增依赖。跨日记录按与所选日期的重叠范围展示，月统计和年热力图同时计入持续中的日程。`scripts/verify-calendar-ranges.mjs` 的 14 项延迟 Mock 浏览器检查已通过，覆盖创建/PATCH 回读、跨年、午夜边界、时区及秒数保留。
