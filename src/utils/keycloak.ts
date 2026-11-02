/*
 * Keycloak SSO helpers.
 */
import Keycloak from 'keycloak-js'
import type { KeycloakInitOptions, KeycloakInstance } from 'keycloak-js'
import { useAdminInfo } from '/@/stores/adminInfo'

let keycloak: KeycloakInstance | null = null
let sessionPollTimer: ReturnType<typeof setInterval> | null = null
let keycloakInitialized = false

const TOKEN_MIN_VALIDITY_SECONDS = 30
const TOKEN_REFRESH_INTERVAL_SECONDS = 20

function syncKeycloakTokens(kc: KeycloakInstance) {
    const adminInfo = useAdminInfo()
    if (kc.token) adminInfo.setToken(kc.token, 'auth')
    if (kc.refreshToken) adminInfo.setToken(kc.refreshToken, 'refresh')
}

export async function refreshKeycloakToken(minValidity = TOKEN_MIN_VALIDITY_SECONDS) {
    const kc = getKeycloak()
    if (!keycloakInitialized || !kc.authenticated) return false

    const refreshed = await kc.updateToken(minValidity)
    syncKeycloakTokens(kc)
    return refreshed
}

export function startSessionPoll(intervalSeconds = TOKEN_REFRESH_INTERVAL_SECONDS) {
    stopSessionPoll()
    sessionPollTimer = setInterval(async () => {
        try {
            await refreshKeycloakToken(TOKEN_MIN_VALIDITY_SECONDS)
        } catch (error) {
            console.error('[keycloak] token refresh failed:', error)
            stopSessionPoll()
            await logoutWithKeycloak()
        }
    }, intervalSeconds * 1000)
}

export function stopSessionPoll() {
    if (sessionPollTimer !== null) {
        clearInterval(sessionPollTimer)
        sessionPollTimer = null
    }
}

function sha256(data: ArrayBuffer): ArrayBuffer {
    const K = new Uint32Array([
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be,
        0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa,
        0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85,
        0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
        0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f,
        0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ])
    const bytes = new Uint8Array(data)
    const padLen = bytes.length % 64 < 56 ? 56 - (bytes.length % 64) : 120 - (bytes.length % 64)
    const padded = new Uint8Array(bytes.length + padLen + 8)
    padded.set(bytes)
    padded[bytes.length] = 0x80
    const dv = new DataView(padded.buffer)
    const bitLen = bytes.length * 8
    dv.setUint32(padded.length - 4, bitLen >>> 0, false)
    dv.setUint32(padded.length - 8, Math.floor(bitLen / 2 ** 32), false)
    const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n))
    let [h0, h1, h2, h3, h4, h5, h6, h7] = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]
    for (let i = 0; i < padded.length; i += 64) {
        const w = new Uint32Array(64)
        for (let j = 0; j < 16; j++) w[j] = dv.getUint32(i + j * 4, false)
        for (let j = 16; j < 64; j++) {
            const s0 = rotr(w[j - 15], 7) ^ rotr(w[j - 15], 18) ^ (w[j - 15] >>> 3)
            const s1 = rotr(w[j - 2], 17) ^ rotr(w[j - 2], 19) ^ (w[j - 2] >>> 10)
            w[j] = (w[j - 16] + s0 + w[j - 7] + s1) >>> 0
        }
        let [a, b, c, d, e, f, g, h] = [h0, h1, h2, h3, h4, h5, h6, h7]
        for (let j = 0; j < 64; j++) {
            const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)
            const ch = (e & f) ^ (~e & g)
            const t1 = (h + S1 + ch + K[j] + w[j]) >>> 0
            const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)
            const mj = (a & b) ^ (a & c) ^ (b & c)
            const t2 = (S0 + mj) >>> 0
            h = g
            g = f
            f = e
            e = (d + t1) >>> 0
            d = c
            c = b
            b = a
            a = (t1 + t2) >>> 0
        }
        h0 = (h0 + a) >>> 0
        h1 = (h1 + b) >>> 0
        h2 = (h2 + c) >>> 0
        h3 = (h3 + d) >>> 0
        h4 = (h4 + e) >>> 0
        h5 = (h5 + f) >>> 0
        h6 = (h6 + g) >>> 0
        h7 = (h7 + h) >>> 0
    }
    const out = new Uint8Array(32)
    const ov = new DataView(out.buffer)
    ov.setUint32(0, h0, false)
    ov.setUint32(4, h1, false)
    ov.setUint32(8, h2, false)
    ov.setUint32(12, h3, false)
    ov.setUint32(16, h4, false)
    ov.setUint32(20, h5, false)
    ov.setUint32(24, h6, false)
    ov.setUint32(28, h7, false)
    return out.buffer
}

function injectCryptoPolyfill(): void {
    if (typeof window === 'undefined') return

    if (!(window as any).crypto) {
        Object.defineProperty(window, 'crypto', {
            value: {},
            writable: true,
            configurable: true,
        })
    }

    const c = window.crypto as any

    if (typeof c.getRandomValues !== 'function') {
        c.getRandomValues = function <T extends ArrayBufferView>(buf: T): T {
            let s0 = (Date.now() ^ 0xdeadbeef) >>> 0
            let s1 = ((performance.now() * 1000) ^ 0xcafebabe) >>> 0
            const arr = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
            for (let i = 0; i < arr.length; i++) {
                const t = s1
                s0 ^= s0 << 23
                s0 ^= s0 >>> 17
                s0 ^= t ^ (t >>> 26)
                s1 = t
                arr[i] = (s0 + s1) & 0xff
            }
            return buf
        }
    }

    if (typeof c.randomUUID !== 'function') {
        c.randomUUID = function (): string {
            const b = new Uint8Array(16)
            c.getRandomValues(b)
            b[6] = (b[6] & 0x0f) | 0x40
            b[8] = (b[8] & 0x3f) | 0x80
            const h = Array.from(b)
                .map((x) => x.toString(16).padStart(2, '0'))
                .join('')
            return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
        }
    }

    if (!c.subtle) {
        c.subtle = {
            digest(algorithm: AlgorithmIdentifier, data: BufferSource): Promise<ArrayBuffer> {
                const name = typeof algorithm === 'string' ? algorithm.toUpperCase() : ((algorithm as Algorithm).name ?? '').toUpperCase()
                if (name !== 'SHA-256') {
                    return Promise.reject(new Error(`[crypto polyfill] Unsupported algorithm: ${String(algorithm)}`))
                }
                const buf = ArrayBuffer.isView(data) ? data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) : (data as ArrayBuffer)
                return Promise.resolve(sha256(buf))
            },
        }
    }
}

function getRealmConfig() {
    const realmUrl = (import.meta.env.VITE_KEYCLOAK_REALM_URL as string).replace(/\/$/, '')
    const matched = realmUrl.match(/^(.*)\/realms\/([^/]+)$/)

    return {
        url: matched ? matched[1] : realmUrl,
        realm: matched ? matched[2] : (import.meta.env.VITE_KEYCLOAK_REALM as string) || 'master',
        clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID as string,
        realmUrl,
    }
}

export function getKeycloak() {
    if (!keycloak) {
        const config = getRealmConfig()
        keycloak = new Keycloak({
            url: config.url,
            realm: config.realm,
            clientId: config.clientId,
        })
    }
    return keycloak
}

export function getKeycloakLoginRedirectUri() {
    return `${window.location.origin}/login`
}

export function getKeycloakLogoutRedirectUri() {
    return `${window.location.origin}/`
}

function createKeycloakInitOptions(onLoad: 'login-required' | 'check-sso', redirectUri = getKeycloakLoginRedirectUri()): KeycloakInitOptions {
    const adminInfo = useAdminInfo()

    return {
        onLoad,
        pkceMethod: 'S256',
        checkLoginIframe: false,
        redirectUri,
        token: adminInfo.token || undefined,
        refreshToken: adminInfo.refresh_token || undefined,
    }
}

async function initKeycloak(onLoad: 'login-required' | 'check-sso', redirectUri?: string) {
    const kc = getKeycloak()
    if (keycloakInitialized) return !!kc.authenticated

    const authenticated = await kc.init(createKeycloakInitOptions(onLoad, redirectUri))
    keycloakInitialized = true
    return authenticated
}

export async function loginWithKeycloak() {
    injectCryptoPolyfill()

    const kc = getKeycloak()
    const authenticated = await initKeycloak('login-required')
    if (!authenticated || !kc.token) {
        await kc.login({ redirectUri: getKeycloakLoginRedirectUri() })
        return false
    }

    await refreshKeycloakToken(TOKEN_MIN_VALIDITY_SECONDS)
    startSessionPoll()
    return true
}

export async function ensureKeycloakSession() {
    try {
        injectCryptoPolyfill()

        const kc = getKeycloak()
        const authenticated = await initKeycloak('check-sso', window.location.href)
        if (!authenticated || !kc.token) {
            stopSessionPoll()
            useAdminInfo().removeToken()
            return false
        }

        await refreshKeycloakToken(TOKEN_MIN_VALIDITY_SECONDS)
        startSessionPoll()
        return true
    } catch (error) {
        console.error('[keycloak] session restore failed:', error)
        stopSessionPoll()
        useAdminInfo().removeToken()
        return false
    }
}

export async function logoutWithKeycloak() {
    const adminInfo = useAdminInfo()
    const config = getRealmConfig()
    const idTokenHint = keycloak?.idToken

    stopSessionPoll()
    keycloakInitialized = false
    adminInfo.removeToken()

    const logoutUrl = new URL(`${config.realmUrl}/protocol/openid-connect/logout`)
    logoutUrl.searchParams.set('client_id', config.clientId)
    logoutUrl.searchParams.set('post_logout_redirect_uri', getKeycloakLogoutRedirectUri())
    if (idTokenHint) logoutUrl.searchParams.set('id_token_hint', idTokenHint)

    window.location.href = logoutUrl.toString()
}
