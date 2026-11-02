<template>
    <template v-if="authorized"><router-view v-if="route.meta.fullscreen" /><Classic v-else /></template>
    <div v-else class="portal-state" role="status">
        <p>{{ loadError || '正在验证身份与菜单权限…' }}</p>
        <el-button v-if="loadError" @click="init">重新加载</el-button>
    </div>
</template>

<script setup lang="ts">
import { reactive, nextTick, ref, watch } from 'vue'
import { useConfig } from '/@/stores/config'
import { useNavTabs } from '/@/stores/navTabs'
import { useAdminInfo } from '/@/stores/adminInfo'
import { useRoute } from 'vue-router'
import Classic from '/@/features/cooper/components/PortalShell.vue'
import { onMounted, onBeforeMount } from 'vue'
import { Session } from '/@/utils/storage'
import { handleAdminRoute, getFirstRoute, getMenuPaths, routePush } from '/@/utils/router'
import router from '/@/router/index'
import { adminBaseRoutePath } from '/@/router/static/adminBase'
import { useEventListener } from '@vueuse/core'
import { BEFORE_RESIZE_LAYOUT } from '/@/stores/constant/cacheKey'
import { isEmpty } from 'lodash-es'
import { setNavTabsWidth } from '/@/utils/layout'
import { ensureKeycloakSession } from '/@/utils/keycloak'

const authorized = ref(false)
const loadError = ref('')
const navTabs = useNavTabs()
const config = useConfig()
const route = useRoute()
const adminInfo = useAdminInfo()

const state = reactive({
    autoMenuCollapseLock: false,
})

onMounted(async () => {
    if (!adminInfo.token) return router.push({ name: 'adminLogin' })
    const authenticated = await ensureKeycloakSession()
    if (!authenticated) return router.push({ name: 'adminLogin' })

    await init()
    setNavTabsWidth()
    useEventListener(window, 'resize', setNavTabsWidth)
})
onBeforeMount(() => {
    onAdaptiveLayout()
    useEventListener(window, 'resize', onAdaptiveLayout)
})

const init = async () => {
    loadError.value = ''
    const { loadRbacBackendIndex } = await import('/@/api/backend/rbac/bridge')
    const rbacIndex = await loadRbacBackendIndex()

    if (!rbacIndex || !rbacIndex.menus?.length) {
        loadError.value = '未能取得项目菜单，请检查网络或联系管理员'
        return
    }

    // 将后端 type 字段统一转换：menudir → menu_dir
    const normalizeMenuType = (nodes: any[]): any[] =>
        nodes.map((node) => ({
            ...node,
            type: node.type === 'menudir' ? 'menu_dir' : node.type,
            children: node.children?.length ? normalizeMenuType(node.children) : [],
        }))

    const menus = normalizeMenuType(rbacIndex.menus)

    handleAdminRoute(menus)

    const paths = new Set(getMenuPaths(navTabs.state.tabsViewRoutes))
    if (route.meta.permissionPath && !paths.has(String(route.meta.permissionPath))) {
        router.replace('/401')
        return
    }
    authorized.value = true
    nextTick(() => {
        if (route.name !== 'adminMainLoading' && route.name !== 'admin') return
        const visibleMenuPaths = new Set(getMenuPaths(navTabs.state.tabsViewRoutes))
        // 预跳转到上次路径
        if (route.params.to) {
            try {
                const lastRoute = JSON.parse(route.params.to as string)
                if (lastRoute.path !== adminBaseRoutePath && visibleMenuPaths.has(lastRoute.path)) {
                    const query = !isEmpty(lastRoute.query) ? lastRoute.query : {}
                    routePush({ path: lastRoute.path, query })
                    return
                }
            } catch (error) {
                console.warn('[layout] ignored invalid restored route', error)
            }
        }

        // 跳转到第一个菜单
        const firstRoute = getFirstRoute(navTabs.state.tabsViewRoutes)
        if (firstRoute) {
            routePush(firstRoute.path)
        }
    })
}

watch(() => route.meta.permissionPath, path => {
    if(authorized.value && path && !new Set(getMenuPaths(navTabs.state.tabsViewRoutes)).has(String(path))) router.replace('/401')
})

const onAdaptiveLayout = () => {
    let defaultBeforeResizeLayout = {
        menuCollapse: config.layout.menuCollapse,
    }
    let beforeResizeLayout = Session.get(BEFORE_RESIZE_LAYOUT)
    if (!beforeResizeLayout) Session.set(BEFORE_RESIZE_LAYOUT, defaultBeforeResizeLayout)

    const clientWidth = document.body.clientWidth
    if (clientWidth < 1024) {
        /**
         * 锁定窗口改变自动调整 menuCollapse
         * 避免已是小窗且打开了菜单栏时，意外的自动关闭菜单栏
         */
        if (!state.autoMenuCollapseLock) {
            state.autoMenuCollapseLock = true
            config.setLayout('menuCollapse', true)
        }
        config.setLayout('shrink', true)
    } else {
        state.autoMenuCollapseLock = false
        let beforeResizeLayoutTemp = beforeResizeLayout || defaultBeforeResizeLayout

        config.setLayout('menuCollapse', beforeResizeLayoutTemp.menuCollapse)
        config.setLayout('shrink', false)
    }
}
</script>
