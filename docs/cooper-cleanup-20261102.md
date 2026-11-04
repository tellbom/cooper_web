# Cooper 错误页与遗留文件清理（2026-11-02）

401 页面原先硬编码了红色主题、403 文案和无效管理员邮箱，现改为共用蓝色主题变量，显示 401，并移除邮箱占位。登录过期页同步使用蓝色；404 文案中的旧项目名已改为 Cooper。

刷新深层链接误入 401 的原因是：权限菜单初始化后，在目标跳转完成前开启 authorized，权限监听将尚在 loading 的地址判为无权限。现在保持原 RBAC 授权判断，等待目标跳转完成后才开启 authorized。实际浏览器验证了搜索页刷新可进入、有权限的查询正常展示、未下发的地址仍进入 401，以及首页返回按钮。

## 清理依据与范围

先执行 Vite 实际构建并读取 Rollup 模块依赖图，再补查 Sass @use、路由动态 glob 和源码引用。类型声明文件即便未进入运行时模块图仍保留。删除候选均为已跟踪且没有未提交修改的文件，未删除既有工作中的改动。

已删除 51 个文件，共 275355 字节：37 个旧 Cochain 页面及配套服务/组件、2 个未接入的旧日志页面、9 个旧后台布局文件、未引用工具、重复 401 页面和旧 Cochain 专用样式各 1 个。仍在使用的主题变量更名为 tokens.scss，共用权限表格、Keycloak/RBAC、Cooper Mock、字体和 Figma 原型来源保留。清除失效的 Cochain Mock 环境变量与 tsconfig 排除项，包名和锁文件同步为 cooper-web。

删除前已备份至本地忽略目录 `.tmp/cleanup/unused-source-backup.zip`；对应 SHA-256 与大小清单位于 `.tmp/cleanup/removed-manifest.json`。压缩包完整性、51 项逐项存在及删除后源文件不存在均已检查。重命名的主题文件不计入删除数量。

## 验证

- Node 16.20.2 类型检查通过。
- 25 个 Cooper Vue 模板检查通过，22 项门户接口契约检查通过。
- Vite 4.5.14 生产构建通过；Vue 和 Element Plus 版本保持原值。
- 实际浏览器访问原门户网关：普通搜索返回 results，按日接口返回 days[].items，两类响应字段和 X-Search-Trace-ID 检查通过。
- 搜索页真实请求返回 10 条 News；已授权页面刷新及未下发地址的访问控制分别验证。
- 401 主按钮实际计算色为 rgb(0, 102, 204)，背景 rgb(245, 245, 247)，无无效管理员邮箱链接。
- Git 空白检查通过，未提交或推送 Git。

## 已删除文件清单

- `src/features/cochain/components/CochainPage.vue`
- `src/features/cochain/components/DataState.vue`
- `src/features/cochain/components/DataSurface.vue`
- `src/features/cochain/components/ManagedResourcePage.vue`
- `src/features/cochain/components/ResourceTablePage.vue`
- `src/features/cochain/components/StatusTag.vue`
- `src/features/cochain/contracts/index.ts`
- `src/features/cochain/mock/data.ts`
- `src/features/cochain/permissions/fixture.ts`
- `src/features/cochain/services/download.ts`
- `src/features/cochain/services/httpAdapter.ts`
- `src/features/cochain/services/httpClient.ts`
- `src/features/cochain/services/index.ts`
- `src/features/cochain/services/mockAdapter.ts`
- `src/features/cochain/services/resourceCatalog.ts`
- `src/features/cochain/services/resultUtils.ts`
- `src/features/cochain/services/subcontractBatch.ts`
- `src/features/cochain/services/supplierActions.ts`
- `src/features/cochain/services/types.ts`
- `src/layouts/backend/components/aside.vue`
- `src/layouts/backend/components/closeFullScreen.vue`
- `src/layouts/backend/components/header.vue`
- `src/layouts/backend/components/logo.vue`
- `src/layouts/backend/components/menus/menuVertical.vue`
- `src/layouts/backend/components/navBar/classic.vue`
- `src/layouts/backend/components/navMenus.vue`
- `src/layouts/backend/container/classic.vue`
- `src/layouts/backend/router-view/main.vue`
- `src/styles/cochain-figma.scss`
- `src/utils/useCurrentInstance.ts`
- `src/views/backend/auth/adminLog/index.vue`
- `src/views/backend/auth/adminLog/info.vue`
- `src/views/backend/cochain/left/right-manual/index.vue`
- `src/views/backend/cochain/left/right-rule/index.vue`
- `src/views/backend/cochain/operation/log/index.vue`
- `src/views/backend/cochain/package/part/index.vue`
- `src/views/backend/cochain/package/supplier-recommendation/index.vue`
- `src/views/backend/cochain/part/batch-part/index.vue`
- `src/views/backend/cochain/part/category-master/index.vue`
- `src/views/backend/cochain/part/history-supplier/index.vue`
- `src/views/backend/cochain/part/type-package-config/index.vue`
- `src/views/backend/cochain/round/robin-cursor/index.vue`
- `src/views/backend/cochain/special/category-config/index.vue`
- `src/views/backend/cochain/subcontract/batch/index.vue`
- `src/views/backend/cochain/supplier/category/index.vue`
- `src/views/backend/cochain/supplier/performance/index.vue`
- `src/views/backend/cochain/supplier/ranking-snapshot/index.vue`
- `src/views/backend/cochain/supplier/supplier/index.vue`
- `src/views/backend/cochain/system/operate-log/index.vue`
- `src/views/backend/cochain/work/package/index.vue`
- `src/views/common/error/401.vue`
