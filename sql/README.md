# Cooper 生产菜单导入

RBAC 和本前端实际识别的隐藏标识是 `add_rules_only`。`add_only_rules` 不是兼容值。隐藏只影响菜单展示，预览访问仍必须由 RBAC 颁发权限。

## 已有 cooper 菜单的内网环境

执行 `cooper-preview-hidden-dm.sql`。它只将新闻、公告、文档三个预览节点设置为 `extend=add_rules_only`，保留 `Link` 类型及 `/preview/news`、`/preview/notice`、`/preview/office` 静态地址。缺少任何一个节点即报错并回滚；请先完成完整初始化。脚本按实际变更写入三类节点各自的 MenuChanged Outbox，重复执行无变更时不重复创建事件。

## 尚未初始化 cooper 的内网环境

在已有 RBAC 数据库结构中执行 **`cooper-production-dm.sql`**。这是独立生产入口：初始化 40 条菜单/按钮规则和 33 条 API 映射，并通过既有 MenuChanged / ApiMapChanged Outbox 更新投影和缓存。不依赖其他项目的数据，三个预览节点从首次插入起就是隐藏节点。

该脚本不创建测试账号，不插入用户、权限组、成员或项目授权，不设置 super，也不修改其他项目。现有规则与接口映射按业务键保留。正式账号的 cooper 项目授权、菜单权限与按钮权限仍在已有 RBAC 中配置；首次使用新项目前，应由已有鉴权中心管理员完成这一步。权限中心的前端按钮节点沿用旧兼容代码，其 permissionCode 与实际 API 映射可能不同；给正式管理员配置权限时，还需按 `rbac_api_permission_map` 的实际 `permission_code/action` 授予对应接口权限，不能仅看到菜单就认为可以操作。隐藏预览需要的 permissionCode 分别为 `menu:cooper.preview.news`、`menu:cooper.preview.notice`、`menu:cooper.preview.office`。

使用已登录的达梦 DIsql 会话执行 `START <SQL文件的绝对路径>`；文件放在普通目录中，避免旧 DIsql 对点号开头目录的路径兼容问题。完整脚本在同一事务内写规则、映射和事件，错误回滚。

`cooper-menu-dm.sql`、`cooper-auth-menu-dm.sql`、`cooper-rbac-ui-dm.sql` 是历史开发初始化/升级记录。历史授权脚本包含用户替换变量，权限中心旧脚本还依赖原项目数据；**生产不要与新的独立入口混合执行**。`cooper-menu-manifest.json` 为门户节点说明，已同步隐藏属性。

## 已验证范围

2026-11-04 使用指定 DIsql 在隔离达梦临时表中执行了完整初始化、重复初始化、错误隐藏标识修正、重复升级、缺少预览节点时失败回滚。临时表有规则业务键、接口业务键和事件 ID 唯一索引，测试后已清理。首次得到 40 条规则、33 条映射、73 条事件；再次执行数量不变。三条预览修正产生 3 条新事件，再次执行数量不变。

当前开发数据库的三个预览节点已应用升级并回读；用户、权限组、成员与项目授权内容保持不变。正式内网数据库尚未执行，需导入后确认 Outbox 已处理，再重新登录检查权限。
