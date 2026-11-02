<template>
    <main class="login-page" aria-labelledby="login-title">
        <section class="login-panel" aria-live="polite">
            <img class="brand-mark" src="/cooper-logo.svg" alt="Cooper" />
            <p class="brand-name">COOPER</p>

            <div class="status-icon" :class="state" aria-hidden="true">
                <el-icon v-if="state === 'loading'" class="is-loading"><Loading /></el-icon>
                <el-icon v-else-if="state === 'success'"><CircleCheckFilled /></el-icon>
                <el-icon v-else><WarningFilled /></el-icon>
            </div>

            <h1 id="login-title">
                {{ state === 'loading' ? '正在验证身份' : state === 'success' ? '认证成功' : '暂时无法访问' }}
            </h1>
            <p class="status-copy">
                {{ state === 'loading' ? loadingText : state === 'success' ? '权限已确认，正在进入工作台。' : errorText }}
            </p>

            <div v-if="state === 'error'" class="actions">
                <el-button type="primary" round @click="handleRetry">重新登录</el-button>
                <el-button round @click="handleLogout">注销当前账号</el-button>
            </div>

            <p class="identity-note">协同工作平台</p>
        </section>
    </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { CircleCheckFilled, Loading, WarningFilled } from '@element-plus/icons-vue'
import router from '/@/router'
import { adminBaseRoutePath } from '/@/router/static/adminBase'
import { useAdminInfo } from '/@/stores/adminInfo'
import { initRbacBridge } from '/@/api/backend/rbac/bridge'
import { loginWithKeycloak, logoutWithKeycloak } from '/@/utils/keycloak'

type State = 'loading' | 'success' | 'error'

const state = ref<State>('loading')
const loadingText = ref('即将连接身份认证服务。')
const errorText = ref('')
const adminInfo = useAdminInfo()

onMounted(async () => {
    try {
        loadingText.value = '正在连接身份认证服务。'
        const authenticated = await loginWithKeycloak()
        if (!authenticated) return

        loadingText.value = '正在获取项目权限。'
        const bridge = await initRbacBridge()
        if (!bridge.success) {
            state.value = 'error'
            errorText.value = bridge.reason || '当前账号没有访问 Cooper 的权限，请联系管理员。'
            adminInfo.removeToken()
            return
        }

        state.value = 'success'
        window.setTimeout(() => {
            router.replace({ path: `${adminBaseRoutePath}/${bridge.routePath}` })
        }, 600)
    } catch (error) {
        console.error('[login] Keycloak login failed:', error)
        state.value = 'error'
        errorText.value = '身份认证服务连接失败，请检查网络后重试。'
        adminInfo.removeToken()
    }
})

function handleRetry() {
    state.value = 'loading'
    loadingText.value = '正在重新连接。'
    window.location.reload()
}

async function handleLogout() {
    await logoutWithKeycloak()
}
</script>

<style scoped lang="scss">
.login-page {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 24px;
    background: #f5f5f7;
    color: #1d1d1f;
}

.login-panel {
    width: min(100%, 400px);
    padding: 44px 36px 32px;
    border: 1px solid #dedee3;
    border-radius: 18px;
    background: #ffffff;
    text-align: center;
}

.brand-mark {
    display: block;
    width: 72px;
    height: 72px;
    margin: 0 auto 10px;
    border-radius: 18px;
    object-fit: contain;
}

.brand-name {
    margin: 0;
    color: #6e6e73;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.16em;
}

.status-icon {
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    margin: 34px auto 18px;
    border-radius: 50%;
    background: #f0f6fc;
    color: #0066cc;
    font-size: 24px;

    &.success {
        background: #eef8f1;
        color: #18884b;
    }

    &.error {
        background: #fff3f2;
        color: #c9342f;
    }
}

h1 {
    margin: 0;
    font-size: 24px;
    line-height: 1.25;
    letter-spacing: -0.02em;
}

.status-copy {
    min-height: 44px;
    margin: 10px 0 0;
    color: #6e6e73;
    font-size: 14px;
    line-height: 1.6;
}

.actions {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-top: 24px;

    .el-button {
        min-height: 44px;
        margin-left: 0;
    }
}

.identity-note {
    margin: 32px 0 0;
    padding-top: 20px;
    border-top: 1px solid #e8e8ed;
    color: #86868b;
    font-size: 12px;
}

@media (max-width: 480px) {
    .login-panel {
        padding: 36px 24px 28px;
    }

    .actions {
        flex-direction: column;
    }
}

@media (prefers-reduced-motion: reduce) {
    .is-loading {
        animation-duration: 2s;
    }
}
</style>
