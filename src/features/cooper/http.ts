import { useAdminInfo } from '/@/stores/adminInfo'
import { refreshKeycloakToken } from '/@/utils/keycloak'

export const USE_MOCK = import.meta.env.VITE_COOPER_USE_MOCK === 'true'
export const USE_VECTOR_SEARCH = import.meta.env.VITE_AURA_SEARCH_BACKEND === 'vector'
export const gateways = {
    Cooper: String(import.meta.env.VITE_COOPER_API_BASE_URL || '/cooperRouter').replace(/\/$/, ''),
    newOA: String(import.meta.env.VITE_NEW_OA_API_BASE_URL || '/newOARouter').replace(/\/$/, ''),
    processRouter: String(import.meta.env.VITE_PROCESS_API_BASE_URL || '/processRouter').replace(/\/$/, ''),
    MessageCenter: String(import.meta.env.VITE_MESSAGE_API_BASE_URL || '/MessageCenter').replace(/\/$/, ''),
    likeFeatureUrl: String(import.meta.env.VITE_LIKE_API_BASE_URL || '/likeFeatureUrl').replace(/\/$/, ''),
    aura: String(import.meta.env.VITE_AURA_API_BASE_URL || '/aurasearchserviceUrl').replace(/\/$/, ''),
    YiyanQC: String(import.meta.env.VITE_QUALITY_API_BASE_URL || '/YiyanQC').replace(/\/$/, ''),
    OA: '/oaRouter',
    Production: '/Production',
    Notifications: '/notificationRouter',
} as const
export type Gateway = keyof typeof gateways
export interface RequestOptions {
    method?: string
    query?: Record<string, unknown>
    body?: unknown
    signal?: AbortSignal
}
export class PortalApiError extends Error {
    constructor(
        public status: number,
        message: string
    ) {
        super(message)
    }
}
let refreshing: Promise<unknown> | undefined
export async function http<T>(gw: Gateway, path: string, options: RequestOptions = {}): Promise<T> {
    if (USE_MOCK && !(gw === 'aura' && USE_VECTOR_SEARCH)) {
        const { mockRequest } = await import('./mockTransport')
        return mockRequest(gw, path, options) as Promise<T>
    }
    const query = new URLSearchParams()
    Object.entries(options.query || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null) query.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
    })
    const url = gateways[gw] + path + (query.toString() ? (path.includes('?') ? '&' : '?') + query : '')
    const send = () =>
        fetch(url, {
            method: options.method || 'GET',
            signal: options.signal,
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${useAdminInfo().token}` },
            body: options.body === undefined ? undefined : JSON.stringify(options.body),
        })
    let response: Response
    try {
        response = await send()
        if (response.status === 401) {
            if (!refreshing)
                refreshing = refreshKeycloakToken(-1).finally(() => {
                    refreshing = undefined
                })
            await refreshing
            response = await send()
        }
    } catch (error) {
        if (options.signal?.aborted) throw error
        throw new PortalApiError(0, '网络连接失败，请重试')
    }
    if (response.status === 204) return undefined as T
    const body = await response.json().catch(() => null)
    if (!response.ok) throw new PortalApiError(response.status, body?.error || body?.message || body?.msg || body?.title || '服务暂时不可用')
    // Cooper envelopes use code=1; calendar and AURA return their own DTO directly.
    if (body && typeof body.code === 'number' && body.code !== 1) throw new PortalApiError(body.code, body.msg || '请求未成功')
    return body as T
}
