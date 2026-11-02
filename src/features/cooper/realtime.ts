import mitt from 'mitt'
import mqtt from 'mqtt/dist/mqtt'
import { ElNotification } from 'element-plus'
import { useAdminInfo } from '/@/stores/adminInfo'
import { logoutWithKeycloak, refreshKeycloakToken } from '/@/utils/keycloak'
import { getReminders, readReminder } from './api'
import { USE_MOCK, gateways } from './http'
export const portalEvents = mitt<{ news: void; notice: void; calendar: void }>()
let client: ReturnType<typeof mqtt.connect> | undefined
let controller: AbortController | undefined
let reconnectTimer: ReturnType<typeof setTimeout> | undefined
let refreshTimer: ReturnType<typeof setTimeout> | undefined
let runningUser = ''
const notified = new Set<string>()
export function handlePublish(payload: string) {
    try {
        JSON.parse(payload)
    } catch {
        return
    }
    // The source document provides no event discriminator: refresh news + notices only.
    clearTimeout(refreshTimer)
    refreshTimer = setTimeout(() => {
        portalEvents.emit('news')
        portalEvents.emit('notice')
    }, 250)
}
async function notifyReminder(value: unknown) {
    if (!value || typeof value !== 'object') return
    const n = value as { id?: string; title?: string; message?: string }
    if (!n.id || notified.has(n.id)) return
    notified.add(n.id)
    ElNotification({
        title: n.title || '日程提醒',
        message: n.message || '',
        duration: 0,
        onClose: () => {
            void readReminder(n.id!).catch(() => notified.delete(n.id!))
        },
    })
}
export function parseSseFrame(frame: string) {
    let event = '',
        lines: string[] = []
    frame.split('\n').forEach((line) => {
        if (line.startsWith('event:')) event = line.slice(6).trim()
        if (line.startsWith('data:')) lines.push(line.slice(5).replace(/^ /, ''))
    })
    return { event, data: lines.join('\n') }
}
async function startCalendarStream(user: string, delay = 3000) {
    if (runningUser !== user || USE_MOCK) return
    controller = new AbortController()
    const signal = controller.signal
    try {
        const send = () =>
            fetch(`${gateways.Cooper}/api/calendar/events/stream`, {
                headers: { Authorization: `Bearer ${useAdminInfo().token}`, Accept: 'text/event-stream' },
                signal,
                cache: 'no-store',
            })
        let response = await send()
        if (response.status === 401) {
            await refreshKeycloakToken(-1)
            response = await send()
        }
        if (!response.ok || !response.body) throw new Error('calendar_stream_unavailable')
        const reader = response.body.getReader(),
            decoder = new TextDecoder()
        let buffer = ''
        while (!signal.aborted) {
            const chunk = await reader.read()
            if (chunk.done) break
            buffer += decoder.decode(chunk.value, { stream: true })
            buffer = buffer.replace(/\r\n/g, '\n')
            let split: number
            while ((split = buffer.indexOf('\n\n')) >= 0) {
                const frame = parseSseFrame(buffer.slice(0, split))
                buffer = buffer.slice(split + 2)
                if (['calendar.event.created', 'calendar.event.updated', 'calendar.event.deleted'].includes(frame.event))
                    portalEvents.emit('calendar')
                if (frame.event === 'calendar.reminder.fired') {
                    try {
                        await notifyReminder(JSON.parse(frame.data))
                    } catch {
                        /* Ignore malformed message; keep the stream alive. */
                    }
                }
            }
            if (buffer.length > 1024 * 1024) throw new Error('calendar_frame_too_large')
        }
    } catch {
        /* Reconnect below unless the owner has stopped. */
    }
    if (!signal.aborted && runningUser === user) reconnectTimer = setTimeout(() => void startCalendarStream(user, Math.min(delay * 2, 15000)), delay)
}
export function startRealtime(user: string) {
    if (!user || runningUser === user) return
    stopRealtime()
    runningUser = user
    if (USE_MOCK) return
    const url = import.meta.env.VITE_PROXY_MQTT as string
    if (url) {
        const bytes = new Uint8Array(4)
        window.crypto.getRandomValues(bytes)
        client = mqtt.connect(url, {
            protocolId: 'MQTT',
            protocolVersion: 4,
            clientId: `mqttjs_${user}_${Array.from(bytes)
                .map((b) => b.toString(16).padStart(2, '0'))
                .join('')}`,
            keepalive: 60,
            clean: true,
            reconnectPeriod: 1000,
            connectTimeout: 15000,
        })
        client.on('connect', () => client?.subscribe(['cooper/publish', `${user}/publish`]))
        client.on('message', (topic, message) => {
            if (topic === `${user}/publish`) {
                stopRealtime()
                void logoutWithKeycloak()
                return
            }
            if (topic === 'cooper/publish') handlePublish(message.toString())
        })
        client.on('error', () => {
            /* MQTT handles reconnection; do not log payloads or tokens. */
        })
    }
    void getReminders()
        .then((rows) => {
            if (runningUser === user) rows.forEach((n) => void notifyReminder(n))
        })
        .catch(() => {})
    void startCalendarStream(user)
}
export function stopRealtime() {
    runningUser = ''
    client?.end(true)
    client = undefined
    controller?.abort()
    controller = undefined
    clearTimeout(reconnectTimer)
    clearTimeout(refreshTimer)
    notified.clear()
}
