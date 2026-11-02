<template>
    <el-aside
        v-if="!navTabs.state.tabFullScreen"
        :class="['layout-aside-Classic', { shrink: config.layout.shrink, 'is-mobile-open': config.layout.shrink && !config.layout.menuCollapse }]"
    >
        <MenuVertical />
        <button class="aside-logout" type="button" @click="onLogout">
            <Icon name="fa fa-sign-out" size="15" aria-hidden="true" />
            <span v-if="!config.layout.menuCollapse">退出登录</span>
        </button>
    </el-aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MenuVertical from '/@/layouts/backend/components/menus/menuVertical.vue'
import { useConfig } from '/@/stores/config'
import { useNavTabs } from '/@/stores/navTabs'
import { logoutWithKeycloak } from '/@/utils/keycloak'

const config = useConfig()
const navTabs = useNavTabs()
const onLogout = () => logoutWithKeycloak()

const menuWidth = computed(() => config.menuWidth())
</script>

<style scoped lang="scss">
.layout-aside-Classic {
    display: flex;
    flex-direction: column;
    background: v-bind('config.getColorVal("menuBackground")');
    margin: 0;
    height: 100%;
    overflow: hidden;
    transition: width 0.3s ease;
    width: v-bind(menuWidth);
    border-right: 1px solid var(--co-hairline);
}
.layout-aside-Classic :deep(.vertical-menus-scrollbar) {
    min-height: 0;
    flex: 1;
}
.aside-logout {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 48px;
    margin: 8px 12px 14px;
    padding: 0 16px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: #6e6e73;
    font: 500 13px var(--co-font-family);
    cursor: pointer;
}
.aside-logout:hover {
    background: #f5f5f7;
    color: #1d1d1f;
}
.shrink {
    position: fixed;
    top: 52px;
    bottom: 0;
    left: 0;
    z-index: 9999999;
}

@media (max-width: 768px) {
    .layout-aside-Classic.shrink.is-mobile-open {
        width: min(82vw, 280px) !important;
        min-width: min(82vw, 280px) !important;
        max-width: min(82vw, 280px) !important;
        flex: 0 0 min(82vw, 280px);
    }
    .layout-aside-Classic.shrink {
        box-shadow: none;
    }
}
</style>
