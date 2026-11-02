<template>
    <div class="portal-route-loading" role="status" aria-live="polite">
        <div class="bootstrap-art"><span class="bootstrap-orbit" /><img src="/cooper-logo.svg" alt="" /><i /><i /><i /></div>
        <span class="bootstrap-eyebrow">COLLABORATIVE WORKSPACE</span>
        <h1>正在准备您的工作空间</h1>
        <p>连接身份服务，加载权限菜单与工作台</p>
        <div class="bootstrap-progress"><span /></div>
        <div class="bootstrap-steps">
            <span><i />身份认证</span><b>—</b><span class="current"><i />权限菜单</span><b>—</b><span>工作空间</span>
        </div>
        <el-button v-if="showReload" @click="reload">重新加载</el-button>
    </div>
</template>
<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import router from '/@/router'
const showReload = ref(false),
    timer = setTimeout(() => (showReload.value = true), 8000)
const reload = () => router.go(0)
onBeforeUnmount(() => clearTimeout(timer))
</script>
<style scoped>
.portal-route-loading {
    min-height: calc(100vh - 60px);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    background: #f4f6fa;
    color: #141a2b;
    font-family: 'Noto Sans SC', sans-serif;
}
.bootstrap-art {
    position: relative;
    width: 112px;
    height: 112px;
    display: grid;
    place-items: center;
    margin-bottom: 28px;
}
.bootstrap-art img {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    box-shadow: 0 8px 24px #2563eb1f;
}
.bootstrap-orbit {
    position: absolute;
    inset: 4px;
    border: 1px solid #d9e3f5;
    border-radius: 50%;
}
.bootstrap-art > i {
    position: absolute;
    inset: 4px;
    border-radius: 50%;
    border-top: 2px solid #2563eb;
    border-right: 2px solid transparent;
    animation: bootstrap-orbit 2.8s linear infinite;
}
.bootstrap-art > i:nth-of-type(2) {
    inset: 16px;
    border-color: #93c5fd transparent transparent transparent;
    animation-direction: reverse;
    animation-duration: 3.8s;
}
.bootstrap-art > i:nth-of-type(3) {
    inset: -4px;
    border-color: transparent transparent #dbeafe transparent;
    animation-duration: 4.8s;
}
.bootstrap-eyebrow {
    font-size: 10px;
    font-weight: 500;
    color: #9aa1b2;
    letter-spacing: 0.22em;
}
.portal-route-loading h1 {
    font:
        500 24px 'Noto Serif SC',
        serif;
    margin: 10px 0;
}
.portal-route-loading p {
    font-size: 13px;
    color: #6b7386;
}
.bootstrap-progress {
    height: 3px;
    width: 200px;
    border-radius: 8px;
    background: #e5eaf3;
    overflow: hidden;
    margin: 28px 0 18px;
}
.bootstrap-progress > span {
    display: block;
    width: 45%;
    height: 100%;
    border-radius: 8px;
    background: linear-gradient(90deg, #93c5fd, #2563eb);
    animation: bootstrap-progress 1.8s ease-in-out infinite;
}
.bootstrap-steps {
    display: flex;
    align-items: center;
    gap: 14px;
    font-size: 11px;
    color: #9aa1b2;
}
.bootstrap-steps > span {
    display: flex;
    align-items: center;
    gap: 5px;
}
.bootstrap-steps i {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #cbd5e1;
}
.bootstrap-steps .current {
    color: #2563eb;
}
.bootstrap-steps .current i {
    background: #2563eb;
}
.bootstrap-steps b {
    font-weight: 400;
    color: #dbe1eb;
}
.portal-route-loading > .el-button {
    margin-top: 24px;
}
@keyframes bootstrap-orbit {
    to {
        transform: rotate(360deg);
    }
}
@keyframes bootstrap-progress {
    from {
        transform: translateX(-110%);
    }
    to {
        transform: translateX(340%);
    }
}
@media (prefers-reduced-motion: reduce) {
    .bootstrap-art > i,
    .bootstrap-progress > span {
        animation: none;
    }
}
</style>
