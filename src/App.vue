<template>
    <el-config-provider :locale="lang">
        <router-view></router-view>
        <NoticeHost/>
    </el-config-provider>
</template>
<script setup lang="ts">
import { onMounted, watch } from 'vue'
import NoticeHost from '/@/features/cooper/components/NoticeHost.vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useConfig } from '/@/stores/config'
import { setTitleFromRoute } from '/@/utils/common'

const route = useRoute()
const config = useConfig()

// 初始化 element 的语言包
const { getLocaleMessage } = useI18n()
const lang = getLocaleMessage(config.lang.defaultLang) as any
onMounted(() => {})

// 监听路由变化时更新浏览器标题
watch(
    () => route.path,
    () => {
        setTitleFromRoute()
    }
)
</script>
<style>
/* 让 html 和 body 可以滚动 */
html,
body {
    margin: 0;
    padding: 0;
    width: 100%;
    /* 移除 height: 100% */
    /* 移除 overflow: hidden */
}

#app {
    width: 100%;
    /* 移除 height: 100% */
    /* 移除 overflow: hidden */
}
</style>
