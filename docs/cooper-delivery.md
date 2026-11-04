# 协同工作平台前端交付说明

## 运行与版本

主工程保留 Vue 3.4.38、Vite 4.5.14（原锁文件实际版本）和 Element Plus 2.7.8。新增组件选用 Element Plus Carousel/Skeleton/Dialog/RadioGroup、FullCalendar 6.1.15、Lucide Vue、MQTT.js 4.3.7、DOMPurify 3.2.7 和官方 OnlyOffice Vue 组件 1.4.0。

执行 `npm ci`、`npm run dev`。默认开发端口为 1919。`npm run build` 构建真实接口模式；`npm run build:mock` 构建带业务 Mock 的演示包。两种模式都继续使用真实 Keycloak 和 RBAC。

Node 16.20.2 用于构建与类型检查；浏览器输出目标为 Chrome 109。Win7 需要支持该内核的浏览器，未在本次工作中进行 Win7 真机验收。

浏览器验收工具固定为 Playwright Core 1.41.2，直接使用本机 Chrome，验收脚本也可在 Node 16 执行。原脚手架的 ESLint 9 工具链声明要求 Node 18 以上，本次保留该既有配置；构建、类型检查、模板检查及下述验收均不依赖 ESLint。

## 原型与页面

设计依据为 `figma/src` 的本地导出稿，主应用不引入 React 或 Tailwind。Noto Sans SC 和 Noto Serif SC 字体及原型演示图片已本地化；字体许可保存在 `public/fonts`。页面包含首页、新闻列表/详情、按日资讯检索、应用中心、值班、危险作业、故障及日程的二级界面。

原型顶部另外五个看板只有导航外观，没有提供其页面设计与完整外部链接。保留既有 iframe 形式的入口，地址通过 RBAC 对应菜单的 `url` 字段颁发；未配置时显示明确的空态。应用中心“更多资源”提供软件下载、表格下载；按本轮要求移除关注订阅入口。荣誉墙不再打开本地弹窗，直接跳转外部网站，地址在 `src/features/cooper/components/OperationsPanels.vue` 的 `honorSiteUrl` 常量中填写，不新增环境配置项。

## 身份、菜单与数据库

沿用 Keycloak -> RBAC 登录桥接 -> `/api/admin/index` -> `handleAdminRoute` 的原链路。客户端和 `X-Project` 为 `cooper`。门户规则与现有权限中心规则写入 cooper 项目；管理员、权限组、菜单规则、接口映射与项目授权页面复用原有代码。

生产菜单导入使用 `sql/cooper-production-dm.sql`，独立初始化 40 条规则和 33 条 API 映射，不依赖其他项目，也不导入用户、权限组成员或项目授权。已有菜单仅调整三个预览时使用 `sql/cooper-preview-hidden-dm.sql`。正式账号继续通过现有 RBAC 授权；执行顺序、历史脚本区别及达梦实测记录见 `sql/README.md`。

三个预览节点均为 `add_rules_only` 隐藏规则，通过 Link 地址映射到静态预览路由，仍根据 RBAC 当前颁发的路径进行访问检查。新账号、菜单权限和接口访问权限继续由已有鉴权中心管理。

初次初始化为 31 条菜单/按钮规则。2026-11-02 通过 `sql/cooper-rbac-ui-dm.sql` 补齐 9 个原本缺失的按钮节点，回读为 40 条，真实 `/api/admin/index` 已颁发新增节点；cooper 权限组和项目授权记录数量均保持 2 条。脚本只写 cooper 规则和 MenuChanged Outbox，不修改用户、权限组或项目授权，新闻详情可见性使用 RBAC 的 `add_rules_only`。详见 `docs/cooper-rbac-duty-verification.md`。

## API 与 Mock

API 位于 `src/features/cooper/api.ts`，DTO 保留文档大小写。Mock 在原始响应层返回直返数组/对象、`code=1/data`、`arr/count`、`data.list` 或 `items`，再由各接口按文档解包。RBAC 客户端保持原有 `code=0` 协议，不参与业务 Mock。

`VITE_COOPER_USE_MOCK=true` 启用演示数据，`VITE_COOPER_MOCK_DELAY` 默认为 850ms，另加 0–250ms 抖动。开发页面加 `?mockDelay=3000` 可检查慢加载；`?mockError=all` 或 `?mockError=/api/app/news` 可检查整体/单模块失败。

API 文档未给出点赞、记录浏览的 POST 请求体，采用原型中的 `{ newsId }`，集中在 `likeFeatureBody` 适配器，须在真实后端联调时确认。预览 HTML 返回 DTO 等文档未明确的部分不宣称已完成后端验收。生产值班结构已按用户补充对齐 `data.colums/list/remark/total`，真实业务接口仍须内网联调。

开发模式可通过以下变量配置各业务网关。值填完整的上游网关地址，Vite 代理去掉本地前缀后转发；生产部署需在 Web 服务器配置同等反向代理。业务服务地址尚未确认时使用延迟 Mock，不将开发代理当作已完成的后端联调。

| 本地前缀 | 上游配置变量 |
| --- | --- |
| `/cooperRouter` | `VITE_COOPER_API_TARGET` |
| `/newOARouter` | `VITE_NEW_OA_API_TARGET` |
| `/processRouter` | `VITE_PROCESS_API_TARGET` |
| `/MessageCenter` | `VITE_MESSAGE_API_TARGET` |
| `/likeFeatureUrl` | `VITE_LIKE_API_TARGET` |
| `/YiyanQC` | `VITE_QUALITY_API_TARGET` |
| `/aurasearchserviceUrl` | `VITE_AURA_URL` |

## 公告与预览

公告控制器仅挂载一次，以当前账号的跨标签页租约协调 `window.open(url, '_blank', features)` 独立窗口。子 iframe、预览页面和公告窗口本身不会再次打开公告。窗口按最新要求调整至 500×500，正文和署名保持 20px、红色标题 26px，使用紧凑内边距和行距。进入主界面即尝试弹出，已有有效窗口时不再新建。独立窗口调用 `POST /api/app/notice/popup-notice`（无参数，直接返回 `CooperNotice[]`），全部公告在同一页面纵向滚动展示，`IsTop=1` 的公告排在前面并显示“置顶”，同组保持接口顺序。保留红色标题、黑色正文、署名及日期；没有已阅、下一条、阅读进度或本地已阅过滤。`IsTopTime` 未在文档中解释时效含义，前端不据此隐藏公告。浏览器阻止自动弹窗时提供“点击查看”的用户操作入口。

- `/preview/news?id=<新闻ID>`：已保存新闻预览。
- `/preview/notice?id=<公告ID>`：已保存公告预览。
- `/preview/news?ID=<预览ID>` / `/preview/notice?ID=<预览ID>`：调用文档中的 `get-html-data`；当前接受直返 HTML 字符串，其他 DTO 需联调确认。
- `/preview/office?url=<编码后的文档URL>&fileType=docx&title=<标题>&version=<版本>`：独立全屏 OnlyOffice 只读预览。新闻正文中的 Office 附件链接自动进入此页。

`VITE_ONLYOFFICE_URL` 指向已有 Document Server。文档 URL 必须能被 Document Server 访问；本地 Mock 附件可通过 `VITE_COOPER_PUBLIC_URL` 指定服务可访问的前端地址。现有测试服务已关闭 JWT；如目标服务启用 JWT，应由后端提供签名配置，前端不保存签名密钥。

## 实时连接

`VITE_PROXY_MQTT` 配置真实 WS/WSS Broker（已核实当前 EMQX 的 WS 路径为 `/mqtt`）。协议为 MQTT v3.1.1，订阅 `cooper/publish`，250ms 内消息合并后刷新首页新闻、当前栏目列表、当前新闻详情及公告；用户主题用于退出登录。显式配置 Broker 后，业务 HTTP 使用 Mock 时也能接入真实 MQTT；Mock 日历仍不启动 SSE。退出或用户改变时释放连接。2026-11-04 完成真实 EMQX、TCP 发布端、浏览器 WS 订阅端和临时 HTTP 后端的 13 项联调检查；正式内网业务后端及踢人消息未纳入本次测试。详见 `docs/cooper-mqtt-verification.md`。

Calendar 保持独立 fetch 客户端及 SSE 端点，包含 Bearer、分帧解析、取消、退避重连、日程刷新和提醒处理。Mock 下不连接内网 Broker/SSE，日程修改仍走相同 API 层。

## 验证命令

- `node scripts/verify-calendar-ranges.mjs`：14 项日期时间区间检查，覆盖 Element Plus 原有区间组件、跨日/跨月/跨年创建与编辑、日列表/点标记、FullCalendar 周/月/年展示、午夜边界、时区和 ISO 秒数；凭据仍通过本地环境变量提供。

- `npm run typecheck`：TypeScript/Vue 检查。
- `node scripts/check-portal.mjs`：编译检查所有新 Vue 模板。
- `node scripts/check-portal-contracts.mjs`：原始响应、分页、延迟、失败、日程 CRUD 与网关隔离检查。
- `node scripts/verify-portal-ui.mjs`：真实 SSO/RBAC、Mock 业务页面及真实 OnlyOffice 的浏览器检查；通过本地环境变量提供 `COOPER_TEST_USER`、`COOPER_TEST_PASSWORD`、可选 `CHROME_PATH`。截图和原始结果保存在忽略的 `.tmp/portal-qa`，不要将账号、令牌、原始终端记录放入 Git。
- `node scripts/verify-notice-window.mjs`：12 项公告专用检查，覆盖专用 API 数据、置顶、连续滚动、旧已阅缓存不再过滤、父子页面窗口唯一性及消息刷新。
- `node scripts/verify-portal-refinements.mjs`：11 项交互检查，覆盖当日日程抽屉、编辑保存、故障间距、资源菜单、荣誉外链入口及新闻/公告不同的正文呈现。
- `node scripts/verify-portal-extras.mjs`：时间轴累加、地址栏筛选恢复、公告富文本、失败重试、跨父页面及 iframe 公告协调、实时消息处理与骨架屏几何检查，使用同一组本地环境变量。

## 本轮设计修正与验证

按原型代码复核首页卡片、标题字重、字号、行高和间距；统一分段按钮的选中态。新闻与荣誉轮播使用 Element Plus Carousel，浏览量使用 Eye 图标；先进科技恢复图片与文字分栏。危险作业、故障、常用系统和值班二级界面重新按导出稿布局，个人日程以 FullCalendar 实现七日、月及年视图，并支持新增、修改和删除。当日日程提供完整高度的侧边抽屉；详情以日期和时间区块建立重心，“编辑日程”为主按钮，编辑器打开后聚焦日程主题。故障弹窗标题、筛选、统计卡片和表格的左右边界统一。

首屏 loading 重做为品牌轨道动画和分步加载提示；各业务骨架屏分别表达图片、标题、元信息、表格、应用图标和日程。修正骨架头像被拉宽、封面与标题占位重叠的问题。资讯检索按原型累加较早日期，切换筛选重置分页，新闻列表页移除搜索表单，统一进入资讯搜索。新闻摘要按纯文本呈现；公告摘要保留净化后的 HTML，列表限制预览高度，点开后显示未截断的完整公告正文。

已完成 Node 16 类型检查、23 个新 Vue 模板编译、22 项 API/Mock 契约检查，以及生产包 `dist` 和业务 Mock 包 `dist-mock` 构建。本轮浏览器验收通过 28 项主流程、12 项公告、16 项截图与交互检查，以及 6 项关闭 Mock 的生产边界检查；覆盖真实登录/菜单、窗口去重、各二级界面、日程操作、附件到真实 OnlyOffice、慢加载、故障字段、消息跳转、接口空态和失败。生产边界使用受控 HTTP 响应，不代表真实内网业务服务联调。此前另有 15 项补充及 11 项交互检查，属于上一轮记录。

上述业务页面交互使用延迟 Mock；身份、菜单和 OnlyOffice 使用现有真实服务。真实业务 API、SSE 网络连接及 Win7 真机尚未验收；MQTT 后续联调结果见上述专项记录。顶部五个外部看板的内容设计与服务链接仍需由对应系统提供。

数据来源逐项核查、用户核正的故障字段/路径及内网切换说明见 `docs/cooper-data-audit.md`。

新闻资讯排版进一步调整：列表扩大文字区域，标题沿用首页 Noto Serif SC、正文沿用 Noto Sans SC。详情正文默认 17px、行高 34px、段距 1.5em，并加入少量字距；作者等元信息与字号、复制、预览操作分行。1366 和 1920 宽度的页面无横向溢出，字号切换正常。

新闻前后篇使用 `get-context` 的 `Page/Limit` 分页，每页 50 条，跨边界时补取相邻页并缓存。列表链接携带记录位置提示；直接打开详情或提示已过期时，按页定位实际新闻。以接口 `count` 判断真实首尾，加载和失败均显示独立状态，不提前显示“第一篇/最后一篇”。`scripts/check-news-pagination.mjs` 检查边界、缓存、深链接和错误重试；`scripts/verify-news-pagination.mjs` 使用延迟 Mock 执行浏览器跨页检查。

2026-11-02 本次调整验证：Node 16 类型检查、23 个 Vue 模板和 22 项既有 Mock 契约通过；新增分页逻辑 17 项、真实 SSO 配合延迟 Mock 的新闻分页浏览器检查 11 项通过；公告浏览器检查 14 项通过，覆盖 440×430 窗口、20px 正文与署名、26px 标题、无横向溢出、完整滚动、置顶与单窗口去重。生产与 Mock 包均重新构建。业务 API 和 Win7 的真实内网验收仍需在目标环境完成。

公告尺寸后续按用户反馈调整至 500×500，保留 20px 正文和署名、26px 标题；重新执行的 14 项公告浏览器检查通过。

新闻资讯骨架屏改用与页面对应的频道、头条图文、列表、快报及详情双列布局。继续使用 Element Plus Skeleton，通过自定义模板提供标题、正文、元信息、摘要、图片和操作区的分层占位；不生成业务记录。详情加载时保留正文及推荐栏的位置、宽度，相关列表的后续请求也有独立骨架。动画尊重系统的减少动态效果设置。Node 16 类型检查、24 个 Vue 模板检查及 21 项慢加载浏览器检查通过，覆盖 1366/1920 宽度、图片比例、加载前后列位置、后续分页、空态和失败重试。
