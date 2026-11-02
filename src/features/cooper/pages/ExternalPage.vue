<template>
    <div class="external-page">
        <iframe v-if="url" :src="url" :title="String(route.meta.title || '业务看板')" @load="loaded = true" />
        <div v-if="url && !loaded" class="external-loading"><LoadState loading /></div>
        <div v-if="!url" class="portal-state">
            <el-icon :size="36"><DataAnalysis /></el-icon>
            <h1>{{ route.meta.title }}</h1>
            <p>此业务看板尚未配置内网地址。</p>
            <router-link to="/cooper/home">返回首页</router-link>
        </div>
    </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { DataAnalysis } from '@element-plus/icons-vue'
import { safeLink } from '../links'
import LoadState from '../components/LoadState.vue'
const route = useRoute(),
    loaded = ref(false)
const url = computed(() => safeLink(String(import.meta.env[`VITE_COOPER_${String(route.path.split('/').pop()).toUpperCase()}_URL`] || '')))
</script>
