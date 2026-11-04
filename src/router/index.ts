import { createRouter, createWebHistory } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import staticRoutes from '/@/router/static'
import { loading } from '/@/utils/loading'
import { useAdminInfo } from '/@/stores/adminInfo'
import { useNavTabs } from '/@/stores/navTabs'

const router = createRouter({
    history: createWebHistory(),
    routes: staticRoutes,
})

router.beforeEach(async (to, from, next) => {
    NProgress.configure({ showSpinner: false })
    NProgress.start()
    if (!window.existLoading) {
        loading.show()
        window.existLoading = true
    }
    if (to.matched.some(record => record.name === 'admin')) {
        if (!useAdminInfo().token) return next({ name: 'adminLogin' })
        const state = useNavTabs().state
        if (state.permissionsLoaded) {
            if (to.name === 'adminMainLoading' || to.name === 'admin') {
                if (to.params.to) return next('/401')
                const { getFirstRoute } = await import('/@/utils/router')
                const first = getFirstRoute(state.tabsViewRoutes)
                return next(first ? first.path : '/401')
            }
            if (!state.issuedPaths.includes(String(to.meta.permissionPath || to.path))) return next('/401')
        }
    }
    next()
})

// 路由加载后
router.afterEach(() => {
    if (window.existLoading) {
        loading.hide()
    }
    NProgress.done()
})

export default router
