import type { RouteRecordRaw } from 'vue-router'

/**
 * 后台基础路由路径
 * 您可以随时于后台->系统配置中修改此值，程序可自动完成代码修改，同时建立对应的API入口和禁止admin应用访问
 */
export const adminBaseRoutePath = '/cooper'

/*
 * 后台基础静态路由
 */
const adminBaseRoute: RouteRecordRaw = {
    path: adminBaseRoutePath,
    name: 'admin',
    component: () => import('/@/layouts/backend/index.vue'),
    // 直接重定向到 loading 路由
    redirect: adminBaseRoutePath + '/loading',
    meta: {
        title: `pagesTitle.admin`,
    },
    children: [
        {
            path: '/notice-popup',
            name: 'cooperNoticePopup',
            component: () => import('/@/features/cooper/pages/NoticePopup.vue'),
            meta: { title: '公告通知', fullscreen: true, permissionPath: '/preview/notice' },
        },
        {
            path: '/preview/news',
            name: 'cooperNewsPreview',
            component: () => import('/@/features/cooper/pages/Preview.vue'),
            meta: { title: '新闻预览', fullscreen: true, permissionPath: '/preview/news' },
        },
        {
            path: '/preview/notice',
            name: 'cooperNoticePreview',
            component: () => import('/@/features/cooper/pages/Preview.vue'),
            meta: { title: '公告预览', fullscreen: true, permissionPath: '/preview/notice' },
        },
        {
            path: '/preview/office',
            name: 'cooperOfficePreview',
            component: () => import('/@/features/cooper/pages/OfficePreview.vue'),
            meta: { title: '文档预览', fullscreen: true, permissionPath: '/preview/office' },
        },

        {
            path: 'loading/:to?',
            name: 'adminMainLoading',
            component: () => import('/@/layouts/common/components/loading.vue'),
            meta: {
                title: `pagesTitle.loading`,
            },
        },
    ],
}

export default adminBaseRoute
