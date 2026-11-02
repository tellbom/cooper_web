<template>
    <el-popover v-model:visible="open" placement="bottom-end" :width="440" trigger="click" popper-class="portal-inbox" @show="refresh">
        <template #reference>
            <button class="bell-button" :aria-label="`通知，共 ${total} 项待办和未读消息`">
                <el-badge :value="total" :hidden="!total" :max="999"><Bell :size="20" /></el-badge>
            </button>
        </template>
        <div class="inbox-heading">
            <div class="line-tabs" role="tablist">
                <button v-for="t in tabs" :key="t" role="tab" :aria-selected="tab === t" :class="{ active: tab === t }" @click="tab = t">
                    {{ t }}<em>{{ count(t) }}</em>
                </button>
            </div>
            <el-button text size="small" :loading="current.pending.value" aria-label="刷新通知" @click="refresh"><RefreshCw :size="14" /></el-button>
        </div>
        <LoadState :loading="current.pending.value" :error="current.error.value" :empty="!current.data.value?.length" empty-text="暂无待处理事项" @retry="current.load">
            <ul v-if="tab === '今日待办'" class="inbox-list">
                <li v-for="t in tasks.data.value" :key="t.taskId">
                    <div class="inbox-item-copy">
                        <b :title="t.businessTitle">{{ t.businessTitle }}</b>
                        <small>{{ [t.businessType, t.taskName].filter(Boolean).join(' · ') }}</small>
                        <time>{{ displayTime(t.createTime) }}</time>
                    </div>
                    <el-button size="small" type="primary" plain :disabled="!taskTarget(t)" @click="openTask(t)">去处理<ArrowUpRight :size="13" /></el-button>
                </li>
            </ul>
            <ul v-else class="inbox-list">
                <li v-for="m in messages.data.value" :key="m.messageId">
                    <div class="inbox-item-copy">
                        <b :title="m.content">{{ m.content }}</b>
                        <small>{{ m.sourceSystem }}</small><time>{{ displayTime(m.createdAt) }}</time>
                    </div>
                    <el-button size="small" type="primary" plain :loading="reading === m.messageId" @click="read(m)">
                        {{ safeLink(m.url) ? '打开消息' : '查看详情' }}<ArrowUpRight v-if="safeLink(m.url)" :size="13" />
                    </el-button>
                </li>
            </ul>
        </LoadState>
        <footer class="inbox-footer">
            <a v-if="centerTarget" :href="centerTarget" target="_blank" rel="noopener" @click="open = false">{{ tab === '今日待办' ? '进入流程中心' : '进入消息中心' }}<ArrowUpRight :size="14" /></a>
            <span v-else class="muted">{{ tab === '今日待办' ? '流程中心入口暂未开放' : '消息中心入口暂未开放' }}</span>
        </footer>
    </el-popover>
    <el-dialog v-model="detailOpen" title="消息详情" width="560px" align-center append-to-body class="portal-dialog inbox-detail-dialog">
        <template v-if="detail">
            <div class="message-detail-meta"><strong>{{ detail.sourceSystem }}</strong><time>{{ displayTime(detail.createdAt) }}</time></div>
            <p class="message-detail-body">{{ detail.content }}</p>
        </template>
        <template #footer><el-button type="primary" @click="detailOpen = false">关闭</el-button></template>
    </el-dialog>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Bell, RefreshCw, ArrowUpRight } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import { useAdminInfo } from '/@/stores/adminInfo'
import * as api from '../api'
import { useResource } from '../useResource'
import { safeLink } from '../links'
import { inboxNavigation, taskLink } from '../navigation'
import LoadState from './LoadState.vue'

const tabs = ['今日待办', '消息中心'] as const
const tab = ref<(typeof tabs)[number]>('今日待办'), open = ref(false), admin = useAdminInfo()
const tasks = useResource(() => admin.userid ? api.mytodo(admin.userid) : Promise.resolve([]))
const messages = useResource(api.myMessages), reading = ref(''), detailOpen = ref(false), detail = ref<api.MessageCenterItem | null>(null)
const current = computed(() => tab.value === '今日待办' ? tasks : messages)
const total = computed(() => (tasks.data.value?.length || 0) + (messages.data.value?.length || 0))
const centerTarget = computed(() => safeLink(tab.value === '今日待办' ? inboxNavigation.processCenter : inboxNavigation.messageCenter))
const taskTarget = (task: api.PendingTaskItem) => taskLink(task, inboxNavigation)
const displayTime = (time: string) => time?.replace('T', ' ').slice(0, 16) || ''
function count(t: string) {
    const resource = t === '今日待办' ? tasks : messages
    return resource.data.value ? resource.data.value.length : resource.pending.value ? '…' : '—'
}
function refresh() { void tasks.load(); void messages.load() }
watch(() => admin.userid, () => { tasks.data.value = null; messages.data.value = null; refresh() })
function openTask(task: api.PendingTaskItem) {
    const target = taskTarget(task)
    if (target) { window.open(target, '_blank', 'noopener'); open.value = false }
}
async function read(message: api.MessageCenterItem) {
    const target = safeLink(message.url)
    if (target) window.open(target, '_blank', 'noopener')
    else { detail.value = message; detailOpen.value = true }
    open.value = false
    reading.value = message.messageId
    try { await api.readMessage(message.messageId); await messages.load() }
    catch (error) { ElMessage.error((error as Error).message) }
    finally { reading.value = '' }
}
</script>
