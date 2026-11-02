<template>
    <el-scrollbar ref="layoutMenuScrollbarRef" class="vertical-menus-scrollbar">
        <el-menu
            class="layouts-menu-vertical"
            :collapse-transition="false"
            :unique-opened="config.layout.menuUniqueOpened"
            :default-active="state.defaultActive"
            :collapse="config.layout.menuCollapse"
            ref="layoutMenuRef"
        >
            <MenuTree :menus="navTabs.state.tabsViewRoutes" />
        </el-menu>
    </el-scrollbar>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive } from 'vue'
import MenuTree from '/@/layouts/backend/components/menus/menuTree.vue'
import { useRoute, onBeforeRouteUpdate, type RouteLocationNormalizedLoaded } from 'vue-router'
import { layoutMenuRef, layoutMenuScrollbarRef } from '/@/stores/refs'
import { useConfig } from '/@/stores/config'
import { useNavTabs } from '/@/stores/navTabs'

const config = useConfig()
const navTabs = useNavTabs()
const route = useRoute()

const state = reactive({
    defaultActive: '',
})

const verticalMenusScrollbarHeight = computed(() => {
    return '100%'
})

/**
 * 激活当前路由对应的菜单
 */
const currentRouteActive = (currentRoute: RouteLocationNormalizedLoaded) => {
    const tabView = navTabs.getTabsViewDataByRoute(currentRoute)
    if (tabView) {
        // 以路由 fullPath 匹配的菜单优先，且 fullPath 无匹配时，回退到 path 的匹配菜单
        state.defaultActive = tabView.meta!.matched as string
    }
}

// 滚动条滚动到激活菜单所在位置
const verticalMenusScroll = () => {
    nextTick(() => {
        let activeMenu: HTMLElement | null = document.querySelector('.el-menu.layouts-menu-vertical li.is-active')
        if (!activeMenu) return false
        layoutMenuScrollbarRef.value?.setScrollTop(activeMenu.offsetTop)
    })
}

onMounted(() => {
    currentRouteActive(route)
    verticalMenusScroll()
})

onBeforeRouteUpdate((to) => {
    currentRouteActive(to)
})
</script>
<style>
.vertical-menus-scrollbar {
    height: v-bind(verticalMenusScrollbarHeight);
    background-color: v-bind('config.getColorVal("menuBackground")');
}
.layouts-menu-vertical {
    border: 0;
    padding: 10px 0 20px;
    --el-menu-bg-color: v-bind('config.getColorVal("menuBackground")');
    --el-menu-text-color: v-bind('config.getColorVal("menuColor")');
    --el-menu-active-color: v-bind('config.getColorVal("menuActiveColor")');
    --ba-menu-active-bg: v-bind('config.getColorVal("menuActiveBackground")');
    font-family:
        'SF Pro Text',
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        'Segoe UI',
        sans-serif;
}
.layouts-menu-vertical .el-menu-item,
.layouts-menu-vertical .el-sub-menu__title {
    height: 40px;
    line-height: 40px;
    margin: 1px 0;
    border-radius: 0;
    color: var(--el-menu-text-color);
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0;
}
.layouts-menu-vertical .el-menu-item:hover,
.layouts-menu-vertical .el-sub-menu__title:hover {
    background-color: #f5f5f7;
    color: var(--el-menu-active-color);
}
.layouts-menu-vertical .el-menu-item.is-active,
.layouts-menu-vertical .el-sub-menu.is-active > .el-sub-menu__title {
    background-color: var(--ba-menu-active-bg) !important;
    color: var(--el-menu-active-color) !important;
    font-weight: 600;
    box-shadow: inset 3px 0 0 var(--el-menu-active-color);
}
.layouts-menu-vertical .el-menu-item.is-active .menu-title,
.layouts-menu-vertical .el-sub-menu.is-active > .el-sub-menu__title .menu-title {
    font-weight: 600;
}
</style>
