/**
 * RBAC Token Bridge
 *
 * 文件目标路径：src/api/backend/rbac/bridge.ts
 *
 * 职责：
 * 在现有登录流完成（adminInfo.token 已写入）后，
 * 调用 POST /api/auth/login 验证当前用户能否进入 RBAC Project，
 * 并将 adminInfo 写回 Pinia store。
 *
 * 调用时机：
 *   - 旧登录成功回调（adminInfo.setToken 之后）
 *   - 页面刷新后 adminInfo.token 已存在但 userid/project 为空时
 *
 * 不替换现有登录逻辑，只做桥接补充。
 */

import { rbacLogin, getBackendIndex } from '/@/api/backend/rbac'
import { useAdminInfo } from '/@/stores/adminInfo'

export interface RbacBridgeResult {
    success: boolean
    routePath?: string
    reason?: string
}

/**
 * 执行 RBAC 登录桥接。
 *
 * 1. 调用 POST /api/auth/login（使用 adminInfo.token 作为 Bearer）
 * 2. 将返回的 adminInfo 写入 Pinia store
 * 3. 返回 routePath 供路由跳转使用
 *
 * @example
 * // 在现有登录成功回调中：
 * adminInfo.setToken(res.data.token)
 * const bridge = await initRbacBridge()
 * if (bridge.success) {
 *   router.push(bridge.routePath ?? '/subcontract/batch')
 * }
 */
export async function initRbacBridge(): Promise<RbacBridgeResult> {
    const adminInfo = useAdminInfo()

    if (!adminInfo.token) {
        return { success: false, reason: 'token_missing' }
    }

    try {
        const result = await rbacLogin()

        // 写入 RBAC 状态
        adminInfo.setRbacInfo({
            id: result.adminInfo.id,
            userid: result.adminInfo.userid,
            username: result.adminInfo.username,
            project: result.adminInfo.project,
            super: result.adminInfo.super,
        })

        // 同步 token（login 接口回传的就是请求中携带的 token，幂等写入）
        if (result.token && !adminInfo.token) {
            // adminInfo.setToken(result.token)  // 按实际 store API 调用
        }

        return { success: true, routePath: result.routePath }
    } catch (err: any) {
        const msg = err?.msg ?? err?.message ?? 'RBAC 认证失败'
        return { success: false, reason: msg }
    }
}

/**
 * 加载后台初始化数据（菜单树 + adminInfo）。
 *
 * 调用时机：登录桥接成功后，或页面刷新时（取代旧 /admin/auth.Admin/index）。
 *
 * 返回的 menus 格式与旧后台兼容：
 *   id(string) / pid / title / name / path / icon / type / children
 *
 * @example
 * const index = await loadRbacBackendIndex()
 * if (index) {
 *   // 写入菜单：replaceMenus(index.menus)
 *   // 更新 adminInfo：adminInfo.setRbacInfo(index.adminInfo)
 * }
 */
export async function loadRbacBackendIndex() {
    const adminInfo = useAdminInfo()

    try {
        const result = await getBackendIndex()

        // 更新 store（super 状态可能在后台 session 中变更）
        adminInfo.setRbacInfo({
            id: result.adminInfo.id,
            userid: result.adminInfo.userid,
            username: result.adminInfo.username,
            project: result.adminInfo.project,
            super: result.adminInfo.super,
        })

        return result
    } catch (err: any) {
        console.error('[rbac/bridge] loadRbacBackendIndex failed:', err)
        return null
    }
}

/**
 * 页面刷新时检查 RBAC 状态完整性。
 * 若 token 存在但 userid 为空（刷新后 store 未初始化），
 * 自动重新加载 admin/index 补全状态。
 *
 * 建议在 App.vue onMounted 或路由守卫中调用。
 *
 * @example
 * // router/index.ts beforeEach：
 * router.beforeEach(async (to) => {
 *   const adminInfo = useAdminInfo()
 *   if (adminInfo.token && !adminInfo.userid) {
 *     await ensureRbacState()
 *   }
 * })
 */
export async function ensureRbacState(): Promise<void> {
    const adminInfo = useAdminInfo()

    if (!adminInfo.token) return
    if (adminInfo.userid) return // 已有 userid，无需重新加载

    await loadRbacBackendIndex()
}
