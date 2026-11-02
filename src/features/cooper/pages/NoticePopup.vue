<template>
    <main class="notice-window">
        <header>
            <div>
                <span class="notice-window-mark"><Bell :size="18" /></span>
                <div>
                    <h2>公告通知</h2>
                    <small>共 {{ notices.length }} 条公告</small>
                </div>
            </div>
            <button aria-label="关闭公告窗口" @click="closeWindow"><X :size="18" /></button>
        </header>
        <div v-if="resource.error.value && resource.data.value" class="notice-refresh-error" role="alert">
            {{ resource.error.value }}<el-button text size="small" @click="resource.load">重新加载</el-button>
        </div>
        <LoadState
            :loading="resource.pending.value && !resource.data.value"
            :error="!resource.data.value ? resource.error.value : ''"
            :empty="!notices.length"
            empty-text="暂无公告"
            variant="article"
            @retry="resource.load"
        >
            <div class="notice-window-scroll" tabindex="0" aria-label="公告内容">
                <article v-for="notice in notices" :key="notice.Id" class="official-paper" :data-notice-id="notice.Id">
                    <div v-if="isPinnedNotice(notice)" class="notice-pin"><Pin :size="12" />置顶</div>
                    <h1>{{ notice.Title }}</h1>
                    <div class="official-rule" />
                    <div class="official-body" v-html="sanitizeHtml(notice.Context)" />
                    <div v-if="notice.Urls?.length" class="official-attachments">
                        <p>附件：</p>
                        <a v-for="(url, i) in notice.Urls" :key="url" :href="safeLink(url)" @click.prevent="openAttachment(url)">
                            {{ i + 1 }}. {{ fileName(url) }}
                        </a>
                    </div>
                    <footer>
                        <p>{{ notice.From || notice.Creater }}</p>
                        <time>{{ formatDate(notice.CreateTime) }}</time>
                    </footer>
                    <small v-if="notice.PublicityPeriod" class="notice-period">公示期：{{ notice.PublicityPeriod }}</small>
                </article>
            </div>
        </LoadState>
    </main>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Bell, Pin, X } from 'lucide-vue-next'
import { useAdminInfo } from '/@/stores/adminInfo'
import { getPopupnoticeapi, sanitizeHtml } from '../api'
import { useResource } from '../useResource'
import { safeLink, officeLink } from '../links'
import { isPinnedNotice, orderPopupNotices } from '../notice'
import { portalEvents } from '../realtime'
import LoadState from '../components/LoadState.vue'

const route = useRoute(),
    router = useRouter(),
    admin = useAdminInfo(),
    owner = String(route.query.owner || '')
const leaseKey = `cooper:notice-lease:${admin.userid}`
const resource = useResource(getPopupnoticeapi)
const notices = computed(() => orderPopupNotices(resource.data.value || []))
function lease() {
    try {
        return JSON.parse(localStorage.getItem(leaseKey) || 'null') as { owner: string; expires: number } | null
    } catch {
        return null
    }
}
function release() {
    if (owner && lease()?.owner === owner) localStorage.removeItem(leaseKey)
}
const timer = setInterval(() => {
    const current = lease()
    if (owner && (!current || current.owner === owner)) localStorage.setItem(leaseKey, JSON.stringify({ owner, expires: Date.now() + 12000 }))
}, 2000)
function closeWindow() {
    release()
    window.close()
}
function updated(event: StorageEvent) {
    if (event.key === `cooper:notice-update:${admin.userid}`) void resource.load()
}
window.addEventListener('storage', updated)
window.addEventListener('pagehide', release)
portalEvents.on('notice', resource.load)
onBeforeUnmount(() => {
    clearInterval(timer)
    release()
    portalEvents.off('notice', resource.load)
    window.removeEventListener('storage', updated)
    window.removeEventListener('pagehide', release)
})
const formatDate = (s: string) => `${s.slice(0, 4)}年${Number(s.slice(5, 7))}月${Number(s.slice(8, 10))}日`
const fileName = (url: string) => {
    try {
        return decodeURIComponent(new URL(url, location.origin).pathname.split('/').pop() || '附件')
    } catch {
        return '附件'
    }
}
function openAttachment(url: string) {
    const office = officeLink(url)
    if (office) router.push(office)
    else {
        const safe = safeLink(url)
        if (safe) window.open(safe, '_blank', 'noopener')
    }
}
</script>
