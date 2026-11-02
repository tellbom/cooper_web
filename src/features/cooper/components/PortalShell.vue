<template>
    <div class="cooper-portal">
        <header class="portal-header">
            <router-link to="/cooper/home" class="portal-brand"
                ><svg viewBox="0 0 36 36" width="36" height="36" aria-hidden="true">
                    <rect width="36" height="36" rx="10" fill="#2563eb" />
                    <rect x="8" y="8" width="13" height="13" rx="3.5" fill="none" stroke="white" stroke-width="2.2" />
                    <rect x="15" y="15" width="13" height="13" rx="3.5" fill="white" fill-opacity=".92" /></svg
                ><span><b>协同工作平台</b><small>COLLABORATIVE WORKSPACE</small></span></router-link
            >
            <nav class="portal-nav" aria-label="主导航">
                <template v-for="menu in primaryMenus" :key="menu.path"
                    ><el-dropdown v-if="menu.children?.length" trigger="click"
                        ><button class="nav-button" :class="{ active: route.path.startsWith(menu.path) }">
                            <component :is="icon(menu.meta?.title)" :size="16" :stroke-width="1.75" />{{ menu.meta?.title
                            }}<el-icon><ArrowDown /></el-icon></button
                        ><template #dropdown
                            ><el-dropdown-menu
                                ><el-dropdown-item v-for="child in menu.children" :key="child.path" @click="onClickMenu(child)">{{
                                    child.meta?.title
                                }}</el-dropdown-item></el-dropdown-menu
                            ></template
                        ></el-dropdown
                    ><button v-else class="nav-button" :class="{ active: route.path === menu.path }" @click="onClickMenu(menu)">
                        <component :is="icon(menu.meta?.title)" :size="16" :stroke-width="1.75" />{{ menu.meta?.title }}
                    </button></template
                >
            </nav>
            <form
                class="portal-global-search"
                @submit.prevent="router.push({ path: '/cooper/search', query: search.trim() ? { q: search.trim() } : {} })"
            >
                <Search :size="15" /><input v-model="search" aria-label="资讯搜索" placeholder="搜索新闻、公告…" />
            </form>
            <InboxMenu /><span class="header-divider" /><el-dropdown trigger="click"
                ><button class="user-button">
                    <span>{{ (admin.nickname || admin.username || '用').slice(0, 1) }}</span
                    >{{ admin.nickname || admin.username }}<el-icon><ArrowDown /></el-icon></button
                ><template #dropdown
                    ><el-dropdown-menu
                        ><el-dropdown-item v-for="m in secondaryMenus" :key="m.path" @click="onClickMenu(m)">{{ m.meta?.title }}</el-dropdown-item
                        ><el-dropdown-item divided @click="logoutWithKeycloak">退出登录</el-dropdown-item></el-dropdown-menu
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
import {
    Home as House,
    Database as DataAnalysis,
    Timer,
    TrendingDown as TrendCharts,
    ClipboardCheck as Checked,
    Cpu,
    Search,
    ChevronDown as ArrowDown,
    Settings as Setting,
} from 'lucide-vue-next'
import { useNavTabs } from '/@/stores/navTabs'
import { useAdminInfo } from '/@/stores/adminInfo'
import { onClickMenu } from '/@/utils/router'
import { logoutWithKeycloak } from '/@/utils/keycloak'
import { startRealtime, stopRealtime } from '../realtime'
import InboxMenu from './InboxMenu.vue'
const admin = useAdminInfo(),
    navTabs = useNavTabs(),
    route = useRoute(),
    router = useRouter(),
    search = ref('')
const primaryTitles = ['首页', '数据管控', '工时统计', '运营损失', '质量日报', 'DNC数据']
const primaryMenus = computed(() => navTabs.state.tabsViewRoutes.filter((m) => primaryTitles.includes(String(m.meta?.title)) || m.name === 'auth'))
const secondaryMenus = computed(() =>
    navTabs.state.tabsViewRoutes.filter((m) => !(primaryTitles.includes(String(m.meta?.title)) || m.name === 'auth') && m.meta?.title !== '新闻详情')
)
const icon = (title: unknown) =>
    ({ 首页: House, 数据管控: DataAnalysis, 工时统计: Timer, 运营损失: TrendCharts, 质量日报: Checked, DNC数据: Cpu })[String(title)] || Setting
onMounted(() => startRealtime(admin.userid || ''))
onBeforeUnmount(stopRealtime)
</script>
