# RBAC 与生产值班结构核查

本轮沿用既有 Keycloak → RBAC bridge → `/api/admin/index` → 动态路由与 `auth()` 链路。没有新建 RBAC 模型，没有增加用户授权或设置 super，没有扩大来源白名单。Vite、Element Plus 与 Node 16 约束保持不变。

## 服务器证据与处理

实际日志中的登录 500 为达梦驱动建立连接时抛出的 `DmException 6001 / Name or service not known`，调用经过项目授权读取器，不是已确认的用户授权拒绝。相同账号后续真实登录及菜单请求均返回 HTTP 200 / code=0。容器 TCP 端口探测正常，独立新进程连接诊断共 24 次查询成功；名称反查失败与数据库异常之间尚未证实因果关系，不能据此修改 DNS 或宣称永久修复。未重启或更换服务镜像，临时诊断文件已清理。若再次出现 500，应继续追踪驱动连接异常；前端已将服务不可用与权限拒绝分别显示。

通过指定 DIsql 执行 `sql/cooper-rbac-ui-dm.sql`：补齐 API 映射、项目授权、权限组状态/规则及菜单规则状态共 9 个按钮节点，使用原已存在的 permissionCode；新闻详情改为 `add_rules_only`。cooper 规则从 31 条变为 40 条，权限组和项目授权记录均保持 2 条。MenuChanged Outbox 已成功处理，真实菜单接口已返回新增的全部节点。没有写用户、权限组成员或项目授权表。

## 前端修复

- 顶部导航不再根据本地固定名称筛选、改放账户菜单或替换图标；菜单名称、顺序、层级、图标、隐藏属性均来自当前 RBAC 返回值。Element Plus 水平菜单自动折叠，递归展示子菜单。
- 更新权限前清空旧路由、菜单、按钮节点及已打开页状态；未颁发的动态路径和预览路径不能继续访问。权限加载失败关闭旧业务页面，允许重新加载恢复。
- 管理员、权限组、规则、API 映射及项目授权操作按钮和提交动作使用现有 `auth()` 节点，移除前端仅凭 super 决定按钮的替代判断。最终授权仍由原 RBAC API 执行。
- iframe 地址读取 RBAC 菜单 `url`，不再用环境地址覆盖服务颁发的地址。

## 生产值班结构

按用户确认的数据结构保留 `Count/arr/code/data/msg/time` 外壳。`data.colums/list/remark/total` 中，列定义为 `align/label/operatortype/prop/render/width`，记录字段为 `OnDutyTime/gongduan/gongyi/shebei/weixiu/xietiaozhongxin/zhuanyechang`。首页与弹窗读取列定义，不从首行推断列名，也不依赖“日期/星期/值班领导”等中文键。

我的值班与全部值班共用解析，分别发送 `isMySelf=true/false`。全部值班按服务端分页、搜索；我的值班超过 100 条提供分页，统计注明本页范围。缺失日期进入“日期待确认”，缺失人员显示占位，不生成正式业务值。复用 Element Plus 表格处理动态列和滚动，Mock 保留网络延迟，并同步生产字段。未知 `render` 作为元数据保留，不执行后端字符串代码。

## 可复核验证

- `node scripts/check-duty-contracts.mjs`：13 项，覆盖生产字段/元数据、我的与全部结构一致、查询、分页、动态列顺序、跨年及缺失值。
- `node scripts/check-portal-contracts.mjs`：22 项原有 API/Mock 契约。
- `node scripts/verify-rbac-permissions.mjs`：18 项通过，开发 Mock 模式运行；通过环境变量提供 `COOPER_TEST_USER/COOPER_TEST_PASSWORD`，可选 `CHROME_PATH/COOPER_PORTAL_URL`。使用真实 Keycloak SSO 与受控 RBAC 返回值检查菜单、按钮、旧路由撤回、失败关闭及服务错误分类；拦截所有管理写入，不代表真实后端负向授权验收。
- 真实 Keycloak/RBAC 与延迟 Mock 业务页面浏览器检查 12 项：新增节点实际颁发、动态值班列、我的值班、全部值班分页与空搜索、普通账号操作入口、1366/1920 布局；无运行时异常。

原始日志、截图与浏览器结果仅保存在忽略目录 `.tmp/portal-qa`。真实生产值班服务尚未在此环境实连，当前业务验证依据用户提供的生产字段；内网业务接口与 Win7 真机验收仍需分别进行。

最终构建与源代码检查：Node 16.20.2 类型检查通过，25 个 Vue 模板无编译错误，生产 `dist` 和演示 `dist-mock` 均构建成功。生产包已关闭业务 Mock，动态 Mock 传输模块只存在于演示包。开发服务继续运行在原端口。
