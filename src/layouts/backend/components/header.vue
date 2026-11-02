<template>
    <el-header v-if="!navTabs.state.tabFullScreen" class="layout-header">
        <ClassicNavBar />
    </el-header>
</template>

<script setup lang="ts">
import { useNavTabs } from '/@/stores/navTabs'
import ClassicNavBar from '/@/layouts/backend/components/navBar/classic.vue'

const navTabs = useNavTabs()
</script>

<style scoped lang="scss">
/*
 * el-header 本身保持透明并去除默认高度限制。
 * 背景色由内部的 menuHorizontal.vue 的 .layouts-menu-horizontal 负责，
 * 不在此层设置颜色，避免双重背景叠加。
 */
.layout-header {
    height: auto;
    padding: 0;
    background-color: transparent;
}
</style>
