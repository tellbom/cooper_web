<template>
    <div class="np-page">
        <!-- 背景装饰层 -->
        <div class="np-bg">
            <div class="np-bg-circle np-bg-circle--1" />
            <div class="np-bg-circle np-bg-circle--2" />
            <div class="np-bg-circle np-bg-circle--3" />
            <div class="np-bg-grid" />
        </div>

        <!-- 主体内容 -->
        <div class="np-body">
            <!-- 图标区 -->
            <div class="np-icon-wrap">
                <div class="np-icon-ring np-icon-ring--outer" />
                <div class="np-icon-ring np-icon-ring--inner" />
                <div class="np-icon-core">
                    <!-- 锁图标 SVG -->
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M10 16V12C10 7.58172 13.5817 4 18 4C22.4183 4 26 7.58172 26 12V16"
                            stroke="currentColor"
                            stroke-width="2.5"
                            stroke-linecap="round"
                        />
                        <rect
                            x="7"
                            y="16"
                            width="22"
                            height="16"
                            rx="4"
                            fill="currentColor"
                            fill-opacity="0.12"
                            stroke="currentColor"
                            stroke-width="2.5"
                        />
                        <circle cx="18" cy="24" r="2.5" fill="currentColor" />
                        <line x1="18" y1="24" x2="18" y2="27.5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
                    </svg>
                </div>
            </div>

            <!-- 文字区 -->
            <div class="np-text">
                <div class="np-code">403</div>
                <h1 class="np-title">暂无访问权限</h1>
                <p class="np-desc">
                    您当前的账号没有访问此页面的权限。<br />
                    如需访问，请联系系统管理员申请相应权限。
                </p>
            </div>

            <!-- 信息卡 -->
            <div class="np-info-card">
                <div class="np-info-row">
                    <span class="np-info-icon">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.5" />
                            <line x1="7" y1="6" x2="7" y2="10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                            <circle cx="7" cy="4" r="0.75" fill="currentColor" />
                        </svg>
                    </span>
                    <span class="np-info-text">当前访问路径已被权限策略拦截</span>
                </div>
                <div class="np-info-row">
                    <span class="np-info-icon">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.5" />
                            <path
                                d="M4.5 7.5L6.5 9.5L9.5 5.5"
                                stroke="currentColor"
                                stroke-width="1.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                        </svg>
                    </span>
                    <span class="np-info-text">您的登录状态正常，权限需单独申请</span>
                </div>
            </div>

            <!-- 操作按钮 -->
            <div class="np-actions">
                <button class="np-btn np-btn--primary" @click="goHome">
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                        <path
                            d="M7.5 1.5L1.5 7H3.5V13H6.5V9.5H8.5V13H11.5V7H13.5L7.5 1.5Z"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linejoin="round"
                        />
                    </svg>
                    返回首页
                </button>
                <button class="np-btn np-btn--ghost" @click="goBack">
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                        <path d="M9 3L4 7.5L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    返回上一页
                </button>
            </div>

            <!-- 底部联系信息 -->
            <p class="np-contact">
                如有疑问请联系
                <a href="mailto:admin@example.com" class="np-link">系统管理员</a>
            </p>
        </div>
    </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
    router.push('/')
}

function goBack() {
    if (window.history.length > 1) {
        router.go(-1)
    } else {
        router.push('/')
    }
}
</script>

<style scoped>
/* ══ 整页独占 ══ */
.np-page {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f4f2;
    font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'SF Pro Display', 'Helvetica Neue', sans-serif;
    overflow: hidden;
    z-index: 9999;
}

/* ── 背景装饰 ── */
.np-bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
}
.np-bg-circle {
    position: absolute;
    border-radius: 50%;
    opacity: 0.06;
}
.np-bg-circle--1 {
    width: 560px;
    height: 560px;
    background: #c62f2f;
    top: -160px;
    right: -120px;
}
.np-bg-circle--2 {
    width: 380px;
    height: 380px;
    background: #c62f2f;
    bottom: -140px;
    left: -80px;
    opacity: 0.04;
}
.np-bg-circle--3 {
    width: 200px;
    height: 200px;
    background: #8b1a1a;
    top: 40%;
    left: 10%;
    opacity: 0.03;
}
.np-bg-grid {
    position: absolute;
    inset: 0;
    background-image: linear-gradient(rgba(0, 0, 0, 0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.025) 1px, transparent 1px);
    background-size: 40px 40px;
}

/* ── 主体 ── */
.np-body {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 28px;
    max-width: 420px;
    width: 100%;
    padding: 0 24px;
    animation: np-fadein 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes np-fadein {
    from {
        opacity: 0;
        transform: translateY(24px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* ── 图标区 ── */
.np-icon-wrap {
    position: relative;
    width: 100px;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
}
.np-icon-ring {
    position: absolute;
    border-radius: 50%;
    border: 1.5px solid rgba(198, 47, 47, 0.18);
    animation: np-pulse 3s ease-in-out infinite;
}
.np-icon-ring--outer {
    width: 100px;
    height: 100px;
    animation-delay: 0s;
}
.np-icon-ring--inner {
    width: 72px;
    height: 72px;
    border-color: rgba(198, 47, 47, 0.25);
    animation-delay: 0.4s;
}
@keyframes np-pulse {
    0%,
    100% {
        transform: scale(1);
        opacity: 1;
    }
    50% {
        transform: scale(1.04);
        opacity: 0.7;
    }
}
.np-icon-core {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: #fff;
    box-shadow:
        0 2px 20px rgba(198, 47, 47, 0.14),
        0 1px 4px rgba(0, 0, 0, 0.06);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #c62f2f;
    z-index: 1;
}

/* ── 文字区 ── */
.np-text {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
}
.np-code {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 3px;
    color: #c62f2f;
    background: rgba(198, 47, 47, 0.08);
    border: 1px solid rgba(198, 47, 47, 0.15);
    padding: 4px 12px;
    border-radius: 20px;
}
.np-title {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
    color: #1a1a1a;
    letter-spacing: -0.5px;
    line-height: 1.2;
}
.np-desc {
    margin: 0;
    font-size: 14px;
    color: #888;
    line-height: 1.7;
    text-align: center;
}

/* ── 信息卡 ── */
.np-info-card {
    width: 100%;
    background: #fff;
    border: 1px solid #ebebeb;
    border-radius: 14px;
    padding: 14px 18px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    box-shadow: 0 1px 8px rgba(0, 0, 0, 0.04);
}
.np-info-row {
    display: flex;
    align-items: center;
    gap: 10px;
}
.np-info-icon {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    background: rgba(198, 47, 47, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #c62f2f;
    flex-shrink: 0;
}
.np-info-text {
    font-size: 13px;
    color: #555;
    line-height: 1.5;
}

/* ── 按钮区 ── */
.np-actions {
    display: flex;
    gap: 10px;
    width: 100%;
}
.np-btn {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 11px 0;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    letter-spacing: -0.1px;
}
.np-btn--primary {
    background: #c62f2f;
    color: #fff;
    border: none;
    box-shadow: 0 2px 12px rgba(198, 47, 47, 0.3);
}
.np-btn--primary:hover {
    background: #e04545;
    transform: translateY(-1px);
    box-shadow: 0 4px 18px rgba(198, 47, 47, 0.36);
}
.np-btn--primary:active {
    transform: scale(0.97);
}

.np-btn--ghost {
    background: #fff;
    color: #444;
    border: 1.5px solid #e0e0e0;
}
.np-btn--ghost:hover {
    background: #f8f8f8;
    border-color: #c8c8c8;
    transform: translateY(-1px);
}
.np-btn--ghost:active {
    transform: scale(0.97);
}

/* ── 底部 ── */
.np-contact {
    margin: 0;
    font-size: 13px;
    color: #aaa;
}
.np-link {
    color: #c62f2f;
    text-decoration: none;
    font-weight: 500;
}
.np-link:hover {
    text-decoration: underline;
}
</style>
