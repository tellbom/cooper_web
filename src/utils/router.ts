import router from '/@/router/index'
import { isNavigationFailure, NavigationFailureType } from 'vue-router'
import type { RouteRecordRaw, RouteLocationRaw } from 'vue-router'
import { ElNotification } from 'element-plus'
import { useConfig } from '/@/stores/config'
import { useNavTabs } from '/@/stores/navTabs'
import { closeShade } from '/@/utils/pageShade'
import adminBaseRoute from '/@/router/static/adminBase'
import { i18n } from '/@/lang/index'
import { compact, reverse } from 'lodash-es'

const issuedRouteRemovers = new Set<() => void>()

export function clearAdminRoutes() {
    issuedRouteRemovers.forEach(remove => remove())
    issuedRouteRemovers.clear()
    useNavTabs().clearPermissions()
}

const adminPath = (path: string) => String(path || '').startsWith(adminBaseRoute.path + '/') ? path : adminBaseRoute.path + '/' + String(path || '').replace(/^\/+/, '')
const internalPath = (raw: string) => {
    try { const url = new URL(raw, window.location.origin); return url.origin === window.location.origin ? url.pathname : raw }
    catch { return raw }
}

/** Only paths issued by the current RBAC menu response, including hidden routes. */
export function hasRbacAccess(path: string, permissionPath?: string) {
    const state = useNavTabs().state
    return state.permissionsLoaded && state.issuedPaths.includes(permissionPath || internalPath(path))
}

export function getIssuedRouteByComponent(component: string) {
    const state = useNavTabs().state
    if (!state.permissionsLoaded) return undefined
    return router.getRoutes().find(route => route.meta.sourceComponent === component && state.issuedPaths.includes(route.path))
}

function collectIssuedPaths(nodes: any[]): string[] {
    return nodes.flatMap(node => {
        let path = ''
        if (node.type !== 'button') {
            if (node.menu_type === 'link' && node.url) path = internalPath(node.url)
            else if (node.menu_type === 'iframe' && node.url) path = adminBaseRoute.path + '/iframe/' + encodeURIComponent(node.url)
            else if (node.menu_type === 'tab' && node.component && node.path) path = adminPath(node.path)
        }
        return [...(path ? [path] : []), ...collectIssuedPaths(node.children || [])]
    })
}

/**
 * 导航失败有错误消息的路由push
 * @param to — 导航位置，同 router.push
 */
export const routePush = async (to: RouteLocationRaw) => {
    try {
        const failure = await router.push(to)
        if (isNavigationFailure(failure, NavigationFailureType.aborted)) {
            ElNotification({
                message: i18n.global.t('utils.Navigation failed, navigation guard intercepted!'),
                type: 'error',
            })
        } else if (isNavigationFailure(failure, NavigationFailureType.duplicated)) {
            ElNotification({
                message: i18n.global.t('utils.Navigation failed, it is at the navigation target position!'),
                type: 'warning',
            })
        }
    } catch (error) {
        ElNotification({
            message: i18n.global.t('utils.Navigation failed, invalid route!'),
            type: 'error',
        })
        console.error(error)
    }
}

/**
 * 获取第一个菜单
 */
export const getFirstRoute = (routes: RouteRecordRaw[]): false | RouteRecordRaw => {
    const routerPaths: string[] = []
    const routers = router.getRoutes()
    routers.forEach((item) => {
        if (item.path) routerPaths.push(item.path)
    })
    let find: boolean | RouteRecordRaw = false
    for (const key in routes) {
        if (routes[key].meta?.type == 'menu' && routerPaths.indexOf(routes[key].path) !== -1) {
            return routes[key]
        } else if (routes[key].children && routes[key].children?.length) {
            find = getFirstRoute(routes[key].children!)
            if (find) return find
        }
    }
    return find
}

/**
 * 打开侧边菜单
 * @param menu 菜单数据
 */
export const onClickMenu = (menu: RouteRecordRaw) => {
    switch (menu.meta?.menu_type) {
        case 'iframe':
        case 'tab':
            routePush(menu.path)
            break
        case 'link':
            window.open(menu.path, '_blank')
            break

        default:
            ElNotification({
                message: i18n.global.t('utils.Navigation failed, the menu type is unrecognized!'),
                type: 'error',
            })
            break
    }

    const config = useConfig()
    if (config.layout.shrink) {
        closeShade(() => {
            config.setLayout('menuCollapse', true)
        })
    }
}

/**
 * 处理后台的路由
 */
export const handleAdminRoute = (routes: any) => {
    clearAdminRoutes()
    const viewsComponent = {
        ...import.meta.glob('/src/features/cooper/pages/**/*.vue'),
        ...import.meta.glob('/src/views/backend/auth/**/*.vue'),
    }
    addRouteAll(viewsComponent, routes, adminBaseRoute.name as string)
    const menuAdminBaseRoute = (adminBaseRoute.path as string) + '/'

    // 更新stores中的路由菜单数据
    const navTabs = useNavTabs()
    navTabs.setTabsViewRoutes(handleMenuRule(routes, menuAdminBaseRoute))
    navTabs.fillAuthNode(handleAuthNode(routes, menuAdminBaseRoute))
    navTabs.state.issuedPaths = [...new Set(collectIssuedPaths(routes))]
    navTabs.state.permissionsLoaded = true
}

/**
 * 获取菜单的paths
 */
export const getMenuPaths = (menus: RouteRecordRaw[]): string[] => {
    let menuPaths: string[] = []
    menus.forEach((item) => {
        menuPaths.push(item.path)
        if (item.children && item.children.length > 0) {
            menuPaths = menuPaths.concat(getMenuPaths(item.children))
        }
    })
    return menuPaths
}

/**
 * 后台菜单处理
 */
const handleMenuRule = (routes: any, pathPrefix = '/', type = ['menu', 'menu_dir']) => {
    const menuRule: RouteRecordRaw[] = []
    for (const key in routes) {
        if (routes[key].extend == 'add_rules_only') {
            continue
        }
        if (!type.includes(routes[key].type)) {
            continue
        }
        if (routes[key].type == 'menu_dir' && routes[key].children && !routes[key].children.length) {
            continue
        }
        if (
            ['route', 'menu', 'nav_user_menu', 'nav'].includes(routes[key].type) &&
            ((routes[key].menu_type == 'tab' && !routes[key].component) || (['link', 'iframe'].includes(routes[key].menu_type) && !routes[key].url))
        ) {
            continue
        }
        const currentPath = ['link', 'iframe'].includes(routes[key].menu_type) ? routes[key].url : adminPath(routes[key].path)
        let children: RouteRecordRaw[] = []
        if (routes[key].children && routes[key].children.length > 0) {
            children = handleMenuRule(routes[key].children, pathPrefix, type)
        }
        menuRule.push({
            path: currentPath,
            name: routes[key].name,
            component: routes[key].component,
            meta: {
                id: routes[key].id,
                title: routes[key].title,
                icon: routes[key].icon,
                keepalive: routes[key].keepalive,
                menu_type: routes[key].menu_type,
                type: routes[key].type,
                url: routes[key].url,
                ruleCode: routes[key].ruleCode,
                permissionCode: routes[key].permissionCode,
                extend: routes[key].extend,
            },
            children: children,
        })
    }
    return menuRule
}

/**
 * 处理权限节点
 * @param routes 路由数据
 * @param prefix 节点前缀
 * @returns 组装好的权限节点
 */
const handleAuthNode = (routes: any, prefix = '/') => {
    const authNode: Map<string, string[]> = new Map([])
    assembleAuthNode(routes, authNode, prefix, prefix)
    return authNode
}
const assembleAuthNode = (routes: any, authNode: Map<string, string[]>, prefix = '/', parent = '/') => {
    const authNodeTemp = []
    for (const key in routes) {
        if (routes[key].type == 'button') {
            const name = String(routes[key].name || '')
            const action = name.split('/').filter(Boolean).pop()
            if (action) authNodeTemp.push(parent.replace(/\/$/, '') + '/' + action)
        }
        if (routes[key].children && routes[key].children.length > 0) {
            assembleAuthNode(routes[key].children, authNode, prefix, routes[key].path ? adminPath(routes[key].path) : prefix + routes[key].name)
        }
    }
    if (authNodeTemp && authNodeTemp.length > 0) {
        authNode.set(parent, authNodeTemp)
    }
}

/**
 * 动态添加路由-带子路由
 * @param viewsComponent
 * @param routes
 * @param parentName
 * @param analyticRelation 根据 name 从已注册路由分析父级路由
 */
export const addRouteAll = (viewsComponent: Record<string, any>, routes: any, parentName: string, analyticRelation = false) => {
    for (const idx in routes) {
        if (routes[idx].extend == 'add_menu_only') {
            continue
        }
        if ((routes[idx].menu_type == 'tab' && viewsComponent[routes[idx].component]) || routes[idx].menu_type == 'iframe') {
            addRouteItem(viewsComponent, routes[idx], parentName, analyticRelation)
        }

        if (routes[idx].children && routes[idx].children.length > 0) {
            addRouteAll(viewsComponent, routes[idx].children, parentName, analyticRelation)
        }
    }
}

/*
 * 动态添加路由
 * @param viewsComponent
 * @param route
 * @param parentName
 * @param analyticRelation 根据 name 从已注册路由分析父级路由
 */
export const addRouteItem = (viewsComponent: Record<string, any>, route: any, parentName: string, analyticRelation: boolean) => {
    let path = '',
        component

    if (route.menu_type == 'iframe') {
        path = adminBaseRoute.path + '/iframe/' + encodeURIComponent(route.url)
        component = () => import('/@/layouts/common/router-view/iframe.vue')
    } else {
        // ✅ 修复：正确处理子路由的相对路径
        if (parentName) {
            // 有父路由时，移除开头的 /，使其成为相对路径
            path = adminPath(route.path).slice(String(adminBaseRoute.path).length + 1)
        } else {
            // 没有父路由时，确保是绝对路径
            path = route.path.startsWith('/') ? route.path : '/' + route.path
        }

        component = viewsComponent[route.component]

        // 验证组件是否存在
        if (!component) {
            console.error(`[Router Error] Component not found: ${route.component}`)
            console.error(`[Router Error] Route:`, route)
            return
        }
    }

    if (route.menu_type == 'tab' && analyticRelation) {
        const parentNames = getParentNames(route.name)
        if (parentNames.length) {
            for (const key in parentNames) {
                if (router.hasRoute(parentNames[key])) {
                    parentName = parentNames[key]
                    break
                }
            }
        }
    }

    // 验证父路由是否存在
    if (parentName && !router.hasRoute(parentName)) {
        console.error(`[Router Error] Parent route not found: ${parentName}`)
        return
    }

    const routeBaseInfo: RouteRecordRaw = {
        path: path,
        name: route.name,
        component: component,
        meta: {
            title: route.title,
            extend: route.extend,
            icon: route.icon,
            keepalive: route.keepalive,
            menu_type: route.menu_type,
            type: route.type,
            url: route.url,
            addtab: true,
            rbacManaged: true,
            permissionPath: adminPath(route.path),
            sourceComponent: route.component,
            permissionCode: route.permissionCode,
            ruleCode: route.ruleCode,
        },
    }

    if (route.menu_type === 'iframe') routeBaseInfo.meta!.permissionPath = path

    try {
        if (parentName) {
            issuedRouteRemovers.add(router.addRoute(parentName, routeBaseInfo))
            // console.log(`[Router] Added child route: ${route.name} (path: ${path}) to parent: ${parentName}`)
        } else {
            issuedRouteRemovers.add(router.addRoute(routeBaseInfo))
            // console.log(`[Router] Added root route: ${route.name} (path: ${path})`)
        }
    } catch (error) {
        console.error(`[Router Error] Failed to add route:`, route.name, error)
    }
}

/**
 * 根据name字符串，获取父级name组合的数组
 * @param name
 */
const getParentNames = (name: string) => {
    const names = compact(name.split('/'))
    const tempNames = []
    const parentNames = []
    for (const key in names) {
        tempNames.push(names[key])
        if (parseInt(key) != names.length - 1) {
            parentNames.push(tempNames.join('/'))
        }
    }
    return reverse(parentNames)
}
