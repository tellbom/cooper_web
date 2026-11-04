<template>
    <div class="cooper-portal">
        <header class="portal-header">
            <component :is="brandTarget ? 'router-link' : 'div'" :to="brandTarget" class="portal-brand"
                ><svg viewBox="0 0 36 36" width="36" height="36" aria-hidden="true">
                    <rect width="36" height="36" rx="10" fill="#2563eb" />
                    <rect x="8" y="8" width="13" height="13" rx="3.5" fill="none" stroke="white" stroke-width="2.2" />
                    <rect x="15" y="15" width="13" height="13" rx="3.5" fill="white" fill-opacity=".92" /></svg
                ><span><b>协同工作平台</b><small>COLLABORATIVE WORKSPACE</small></span></component
            >
            <nav class="portal-nav" aria-label="主导航">
                <el-menu class="portal-rbac-menu" mode="horizontal" :default-active="route.path" :ellipsis="true">
                    <MenuTree v-for="menu in navTabs.state.tabsViewRoutes" :key="menu.path" :menus="[menu]" :extends="{ position: 'horizontal', level: 1 }" />
                </el-menu>
            </nav>
            <form
                v-if="searchTarget"
                class="portal-global-search"
                @submit.prevent="router.push({ path: searchTarget.path, query: search.trim() ? { q: search.trim() } : {} })"
            >
                <Search :size="15" /><input v-model="search" aria-label="资讯搜索" placeholder="搜索新闻、公告…" />
            </form>
            <InboxMenu /><span class="header-divider" /><el-dropdown trigger="click"
                ><button class="user-button">
                    <span>{{ (admin.nickname || admin.username || '用').slice(0, 1) }}</span
                    >{{ admin.nickname || admin.username }}<el-icon><ArrowDown /></el-icon></button
                ><template #dropdown
                    ><el-dropdown-menu
                        ><el-dropdown-item @click="logoutWithKeycloak">退出登录</el-dropdown-item></el-dropdown-menu
                    ></template
                ></el-dropdown
            >
        </header>
        <div v-if="!navTabs.state.tabsViewRoutes.length" class="portal-state">
            <p>正在加载权限菜单</p>
            <el-button @click="router.go(0)">重新加载</el-button>
        </div>
        <div class="portal-scroll"><router-view /></div>
    </div>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search, ChevronDown as ArrowDown } from 'lucide-vue-next'
import { useNavTabs } from '/@/stores/navTabs'
import { useAdminInfo } from '/@/stores/adminInfo'
import { getFirstRoute, getIssuedRouteByComponent } from '/@/utils/router'
import MenuTree from '/@/layouts/backend/components/menus/menuTree.vue'
import { logoutWithKeycloak } from '/@/utils/keycloak'
import { startRealtime, stopRealtime } from '../realtime'
import InboxMenu from './InboxMenu.vue'
const admin = useAdminInfo(),
    navTabs = useNavTabs(),
    route = useRoute(),
    router = useRouter(),
    search = ref('')
const brandTarget = computed(() => { const first = getFirstRoute(navTabs.state.tabsViewRoutes); return first ? first.path : undefined })
const searchTarget = computed(() => getIssuedRouteByComponent('/src/features/cooper/pages/Search.vue'))
onMounted(() => startRealtime(admin.userid || ''))
onBeforeUnmount(stopRealtime)
</script>
