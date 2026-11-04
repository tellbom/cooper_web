<template>
    <div v-if="blocked && allowed" class="notice-launch">
        <button @click="openWindow"><Bell :size="16" />有 {{ pending.length }} 条公告 <span>点击查看</span></button>
    </div>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Bell } from 'lucide-vue-next'
import { useAdminInfo } from '/@/stores/adminInfo'
import { getPopupnoticeapi, type CooperNotice } from '../api'
import { portalEvents } from '../realtime'
import { useNavTabs } from '/@/stores/navTabs'
const admin = useAdminInfo(),
    navTabs = useNavTabs(),
    route = useRoute(),
    pending = ref<CooperNotice[]>([]),
    blocked = ref(false)
const allowed = computed(
    () =>
        !!admin.token &&
        admin.project === 'cooper' &&
        navTabs.state.permissionsLoaded && navTabs.state.issuedPaths.includes('/preview/notice') &&
        !route.path.startsWith('/preview/') &&
        route.path !== '/notice-popup' &&
        route.path !== '/login' &&
        window.self === window.top
)
const owner = `popup-${Date.now()}-${Math.random().toString(36).slice(2)}`
let popup: Window | null = null,
    generation = 0,
    leaseKey = '',
    attempted = false,
    election: ReturnType<typeof setTimeout> | undefined
function lease() {
    try {
        return JSON.parse(localStorage.getItem(leaseKey) || 'null') as { owner: string; expires: number } | null
    } catch {
        return null
    }
}
function release() {
    if (leaseKey && lease()?.owner === owner) localStorage.removeItem(leaseKey)
}
function openWindow() {
    if (!allowed.value || !pending.value.length) return
    const active = lease()
    if (active && active.owner !== owner && active.expires > Date.now()) {
        attempted = true
        blocked.value = false
        return
    }
    localStorage.setItem(leaseKey, JSON.stringify({ owner, expires: Date.now() + 12000 }))
    popup = window.open(`/notice-popup?owner=${encodeURIComponent(owner)}`, '_blank', 'popup=yes,width=600,height=550,resizable=yes,scrollbars=yes')
    attempted = true
    blocked.value = !popup
    if (!popup) release()
}
function elect() {
    if (!allowed.value || !pending.value.length || attempted) return
    if (popup && !popup.closed) {
        attempted = true
        return
    }
    const active = lease()
    if (active && active.owner !== owner && active.expires > Date.now()) {
        attempted = true
        blocked.value = false
        return
    }
    localStorage.setItem(leaseKey, JSON.stringify({ owner, expires: Date.now() + 12000 }))
    clearTimeout(election)
    election = setTimeout(() => {
        if (lease()?.owner === owner) openWindow()
    }, 150)
}
async function load() {
    if (!allowed.value) return
    const current = ++generation
    try {
        const rows = await getPopupnoticeapi()
        if (current !== generation) return
        if (JSON.stringify(rows) !== JSON.stringify(pending.value)) attempted = false
        pending.value = rows
        if (!rows.length) blocked.value = false
        localStorage.setItem(`cooper:notice-update:${admin.userid}`, String(Date.now()))
        elect()
    } catch {
        /* Retry on a subsequent publish/login. */
    }
}
watch(
    () => [allowed.value, admin.userid],
    () => {
        generation++
        attempted = false
        blocked.value = false
        leaseKey = `cooper:notice-lease:${admin.userid}`
        if (allowed.value) void load()
        else if (!popup || popup.closed) release()
    },
    { immediate: true }
)
const timer = setInterval(() => {
    if (popup?.closed) {
        popup = null
        release()
    }
    if (!attempted) elect()
}, 2000)
portalEvents.on('notice', load)
onBeforeUnmount(() => {
    generation++
    clearTimeout(election)
    clearInterval(timer)
    if (!popup || popup.closed) release()
    portalEvents.off('notice', load)
})
</script>
