<template>
    <main class="error-page">
        <p class="error-code">404</p>
        <h1>页面不存在</h1>
        <p>当前地址不属于 Cochain，或对应菜单已被移除。</p>
        <div class="error-actions">
            <el-button @click="router.back()">返回上一页</el-button>
            <el-button type="primary" @click="router.replace('/login')">返回登录页</el-button>
        </div>
    </main>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<style scoped>
.error-page {
    display: grid;
    min-height: 100dvh;
    place-content: center;
    justify-items: start;
    padding: 32px;
    background: var(--co-canvas-subtle);
    color: var(--co-ink);
}

.error-code {
    margin: 0 0 8px;
    color: var(--co-primary);
    font-size: 18px;
    font-weight: 700;
}

h1 {
    margin: 0;
    font-size: clamp(32px, 6vw, 56px);
}

.error-page > p:not(.error-code) {
    margin: 12px 0 24px;
    color: var(--co-ink-muted);
}

.error-actions {
    display: flex;
    gap: 12px;
}
</style>
