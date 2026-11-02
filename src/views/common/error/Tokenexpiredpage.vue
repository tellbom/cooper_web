<template>
    <div class="te-page">
        <!-- 背景装饰 -->
        <div class="te-bg">
            <div class="te-bg-blob te-bg-blob--1" />
            <div class="te-bg-blob te-bg-blob--2" />
            <div class="te-bg-dots" />
        </div>

        <!-- 主体内容 -->
        <div class="te-body">
            <!-- 沙漏图标区 -->
            <div class="te-icon-wrap">
                <div class="te-icon-shadow" />
                <div class="te-icon-card">
                    <!-- 沙漏 + 时钟 SVG -->
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <!-- 外圆 -->
                        <circle cx="20" cy="20" r="17" stroke="currentColor" stroke-width="2.2" stroke-dasharray="4 3" opacity="0.3" />
                        <!-- 时钟面 -->
                        <circle cx="20" cy="20" r="11" stroke="currentColor" stroke-width="2.2" />
                        <!-- 时针 -->
                        <line x1="20" y1="20" x2="20" y2="13" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
                        <!-- 分针（倾斜，表示时间过了） -->
                        <line x1="20" y1="20" x2="25.5" y2="22.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
                        <!-- 中心点 -->
                        <circle cx="20" cy="20" r="1.5" fill="currentColor" />
                    </svg>
                    <!-- 感叹标记 -->
                    <div class="te-icon-badge">!</div>
                </div>
            </div>

            <!-- 倒计时环 -->
            <div class="te-countdown-wrap">
                <svg class="te-countdown-ring" width="72" height="72" viewBox="0 0 72 72">
                    <circle cx="36" cy="36" r="30" fill="none" stroke="#f0eeec" stroke-width="4" />
                    <circle
                        cx="36"
                        cy="36"
                        r="30"
                        fill="none"
                        stroke="#c62f2f"
                        stroke-width="4"
                        stroke-linecap="round"
                        stroke-dasharray="188.5"
                        :stroke-dashoffset="188.5 - (188.5 * countdown) / 10"
                        class="te-ring-progress"
                        transform="rotate(-90 36 36)"
                    />
                </svg>
                <div class="te-countdown-num">{{ countdown }}</div>
            </div>

            <!-- 文字区 -->
            <div class="te-text">
                <div class="te-label">SESSION EXPIRED</div>
                <h1 class="te-title">登录令牌已过期</h1>
                <p class="te-desc">
                    您的会话已超时，为保障账号安全请重新登录。<br />
                    <span class="te-auto-text">{{ countdown > 0 ? countdown + ' 秒后自动跳转至登录页' : '正在跳转…' }}</span>
                </p>
            </div>

            <!-- 操作按钮 -->
            <div class="te-actions">
                <button class="te-btn te-btn--primary" @click="reLogin">
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                        <path
                            d="M5 7.5H12M9.5 5L12 7.5L9.5 10"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                        <path
                            d="M6 4H3.5C2.67 4 2 4.67 2 5.5V9.5C2 10.33 2.67 11 3.5 11H6"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linecap="round"
                        />
                    </svg>
                    立即重新登录
                </button>
            </div>

            <!-- 安全提示卡 -->
            <div class="te-tips">
                <div class="te-tip-hd">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path
                            d="M6.5 1L8.5 4.5H11.5L9 7L10 11L6.5 9L3 11L4 7L1.5 4.5H4.5L6.5 1Z"
                            stroke="currentColor"
                            stroke-width="1.2"
                            stroke-linejoin="round"
                        />
                    </svg>
                    安全提示
                </div>
                <ul class="te-tip-list">
                    <li>令牌过期是正常的安全保护机制</li>
                    <li>重新登录后您的数据不会丢失</li>
                    <li>如频繁过期请检查系统时间设置</li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const countdown = ref(10)
let timer = null

function reLogin() {
    clearInterval(timer)
    // TODO: 替换为真实登录路由
    router.push('/login')
}

onMounted(() => {
    timer = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) {
            clearInterval(timer)
            reLogin()
        }
    }, 1000)
})

onBeforeUnmount(() => {
    clearInterval(timer)
})
</script>

<style scoped>
/* ══ 整页独占 ══ */
.te-page {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f7f6f3;
    font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'SF Pro Display', 'Helvetica Neue', sans-serif;
    overflow: hidden;
    z-index: 9999;
}

/* ── 背景装饰 ── */
.te-bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
}
.te-bg-blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
}
.te-bg-blob--1 {
    width: 480px;
    height: 480px;
    background: rgba(198, 47, 47, 0.07);
    top: -180px;
    left: -100px;
}
.te-bg-blob--2 {
    width: 360px;
    height: 360px;
    background: rgba(139, 26, 26, 0.05);
    bottom: -130px;
    right: -80px;
}
.te-bg-dots {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(circle, rgba(0, 0, 0, 0.05) 1px, transparent 1px);
    background-size: 28px 28px;
}

/* ── 主体 ── */
.te-body {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    max-width: 400px;
    width: 100%;
    padding: 0 24px;
    animation: te-fadein 0.65s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes te-fadein {
    from {
        opacity: 0;
        transform: translateY(20px) scale(0.98);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

/* ── 图标卡 ── */
.te-icon-wrap {
    position: relative;
    width: 80px;
    height: 80px;
}
.te-icon-shadow {
    position: absolute;
    inset: 8px;
    border-radius: 20px;
    background: rgba(198, 47, 47, 0.15);
    filter: blur(12px);
    z-index: 0;
}
.te-icon-card {
    position: relative;
    z-index: 1;
    width: 80px;
    height: 80px;
    border-radius: 22px;
    background: #fff;
    border: 1.5px solid rgba(198, 47, 47, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #c62f2f;
    box-shadow: 0 4px 24px rgba(198, 47, 47, 0.12);
}
.te-icon-badge {
    position: absolute;
    top: -6px;
    right: -6px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #c62f2f;
    color: #fff;
    font-size: 12px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #f7f6f3;
    animation: te-bounce 0.6s 0.3s cubic-bezier(0.36, -0.04, 0.18, 1.4) both;
}
@keyframes te-bounce {
    from {
        opacity: 0;
        transform: scale(0);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

/* ── 倒计时环 ── */
.te-countdown-wrap {
    position: relative;
    width: 72px;
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: center;
}
.te-countdown-ring {
    position: absolute;
    inset: 0;
}
.te-ring-progress {
    transition: stroke-dashoffset 1s linear;
}
.te-countdown-num {
    font-size: 22px;
    font-weight: 800;
    color: #c62f2f;
    letter-spacing: -1px;
    position: relative;
    z-index: 1;
    font-variant-numeric: tabular-nums;
}

/* ── 文字区 ── */
.te-text {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}
.te-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2.5px;
    color: #c62f2f;
    opacity: 0.7;
}
.te-title {
    margin: 0;
    font-size: 26px;
    font-weight: 700;
    color: #1a1a1a;
    letter-spacing: -0.5px;
}
.te-desc {
    margin: 0;
    font-size: 14px;
    color: #888;
    line-height: 1.7;
}
.te-auto-text {
    font-size: 13px;
    color: #c62f2f;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
}

/* ── 按钮 ── */
.te-actions {
    width: 100%;
}
.te-btn {
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 13px 0;
    border-radius: 14px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    letter-spacing: -0.1px;
}
.te-btn--primary {
    background: #c62f2f;
    color: #fff;
    border: none;
    box-shadow: 0 4px 20px rgba(198, 47, 47, 0.32);
}
.te-btn--primary:hover {
    background: #e04545;
    transform: translateY(-1px);
    box-shadow: 0 6px 24px rgba(198, 47, 47, 0.4);
}
.te-btn--primary:active {
    transform: scale(0.97);
    box-shadow: none;
}

/* ── 安全提示卡 ── */
.te-tips {
    width: 100%;
    background: #fff;
    border: 1px solid #eceae6;
    border-radius: 14px;
    padding: 14px 18px;
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
}
.te-tip-hd {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 700;
    color: #aaa;
    letter-spacing: 0.5px;
    margin-bottom: 10px;
}
.te-tip-hd svg {
    color: #c62f2f;
    opacity: 0.7;
    flex-shrink: 0;
}
.te-tip-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 7px;
}
.te-tip-list li {
    font-size: 13px;
    color: #666;
    padding-left: 14px;
    position: relative;
    line-height: 1.5;
}
.te-tip-list li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 8px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: rgba(198, 47, 47, 0.35);
}
</style>
