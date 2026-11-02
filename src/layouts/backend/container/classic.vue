<template>
    <el-container class="layout-container classic-layout">
        <Header />
        <el-container class="layout-body">
            <Aside />
            <Main />
        </el-container>
    </el-container>
    <CloseFullScreen v-if="navTabs.state.tabFullScreen" />
</template>

<script setup lang="ts">
import Aside from '/@/layouts/backend/components/aside.vue'
import Header from '/@/layouts/backend/components/header.vue'
import Main from '/@/layouts/backend/router-view/main.vue'
import CloseFullScreen from '/@/layouts/backend/components/closeFullScreen.vue'
import { useNavTabs } from '/@/stores/navTabs'
const navTabs = useNavTabs()
</script>

<style scoped>
.layout-container {
    flex-direction: column;
    height: 100%;
    width: 100%;
}
.layout-body {
    min-height: 0;
    flex: 1;
    width: 100%;
    background: var(--co-canvas-subtle);
}

.classic-layout :deep(.layout-main) {
    min-width: 0;
    padding: 28px !important;
    background: var(--co-canvas-subtle);
}

@media (max-width: 768px) {
    .classic-layout :deep(.layout-main) {
        padding: var(--co-space-4) !important;
    }
}
</style>
