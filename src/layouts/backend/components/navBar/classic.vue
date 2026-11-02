<template>
    <header class="co-header" aria-label="页面导航">
        <Logo />

        <el-breadcrumb class="page-breadcrumb" separator="/" aria-label="面包屑">
            <el-breadcrumb-item>Cochain</el-breadcrumb-item>
            <el-breadcrumb-item>后台</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentTitle">{{ currentTitle }}</el-breadcrumb-item>
        </el-breadcrumb>

        <NavMenus />
    </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import NavMenus from '../navMenus.vue'
import Logo from '../logo.vue'

const route = useRoute()
const { t, te } = useI18n()

const currentTitle = computed(() => {
    const title = String(route.meta?.title ?? '')
    return te(title) ? t(title) : title
})
</script>

<style scoped lang="scss">
.co-header {
    display: flex;
    align-items: center;
    gap: 0;
    width: 100%;
    height: 52px;
    padding: 0 18px 0 0;
    border-bottom: 1px solid var(--co-hairline);
    background: #ffffff;
}

.page-breadcrumb {
    min-width: 0;
    flex: 1;
    padding-left: 20px;
    font-size: 12px;
}

@media (max-width: 768px) {
    .co-header {
        padding-right: 12px;
    }

    .page-breadcrumb :deep(.el-breadcrumb__item:not(:last-child)) {
        display: none;
    }
}
</style>
