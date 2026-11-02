<template>
    <PortalCard title="常用系统" :icon="Grid" more="全部应用" class="systems-card" @more="openCenter">
        <LoadState :loading="mine.pending.value" :error="mine.error.value" :rows="3" variant="systems" @retry="mine.load"
            ><div class="system-grid">
                <a
                    v-for="s in mine.data.value?.slice(0, 8)"
                    :key="s.Id"
                    :href="safeLink(s.JumpLink)"
                    :title="s.Details"
                    target="_blank"
                    rel="noopener"
                    ><span class="system-icon"
                        ><img v-if="s.Icon" :src="s.Icon" alt="" /><component
                            v-else
                            :is="icons[s.Name] || Grid"
                            :size="20"
                            :stroke-width="1.6" /></span
                    >{{ s.Name }}</a
                ><button v-if="(mine.data.value?.length || 0) < 8" @click="openCenter"><span class="system-icon more-app">＋</span>更多应用</button>
            </div></LoadState
        >
    </PortalCard>
    <el-dialog
        modal-class="portal-modal"
        v-model="open"
        width="1024px"
        align-center
        class="portal-dialog flush-dialog systems-dialog"
        :close-on-click-modal="false"
        ><template #header
            ><div class="systems-dialog-header">
                <div>
                    <h3 class="dialog-heading-title">应用中心</h3>
                    <p class="dialog-subtitle">选择常用应用并调整顺序，首页按顺序展示前 8 个</p>
                </div>
                <el-dropdown trigger="click"
                    ><el-button>更多资源 <ChevronDown :size="14" /></el-button
                    ><template #dropdown
                        ><el-dropdown-menu
                            ><el-dropdown-item @click="resource = '软件下载'">软件下载</el-dropdown-item
                            ><el-dropdown-item @click="resource = '表格下载'">表格下载</el-dropdown-item></el-dropdown-menu
                        ></template
                    ></el-dropdown
                >
            </div></template
        >
        <div class="systems-manager">
            <div class="applications-pane">
                <div class="application-search">
                    <el-input v-model="keyword" placeholder="搜索应用名称或用途" :prefix-icon="Search" clearable /><small
                        >共 {{ all.data.value?.length || 0 }} 个应用</small
                    >
                </div>
                <LoadState :loading="all.pending.value" :error="all.error.value" variant="systems" @retry="all.load"
                    ><div class="application-cards">
                        <div v-for="s in filtered" :key="s.Id" :class="{ selected: selected.includes(s.Id) }">
                            <span class="system-icon"
                                ><img v-if="s.Icon" :src="s.Icon" alt="" /><component
                                    v-else
                                    :is="icons[s.Name] || Grid"
                                    :size="20"
                                    :stroke-width="1.6"
                            /></span>
                            <div class="application-copy">
                                <a :href="safeLink(s.JumpLink)" target="_blank" rel="noopener"
                                    ><b :title="s.Name">{{ s.Name }}</b></a
                                >
                                <p :title="s.Details">{{ s.Details }}</p>
                            </div>
                            <button class="application-toggle" :aria-pressed="selected.includes(s.Id)" @click="toggle(s.Id)">
                                <Check v-if="selected.includes(s.Id)" :size="13" /><Plus v-else :size="13" />{{
                                    selected.includes(s.Id) ? '已添加' : '添加'
                                }}
                            </button>
                        </div>
                        <p v-if="!filtered.length" class="portal-state">没有找到「{{ keyword }}」相关应用</p>
                    </div></LoadState
                >
            </div>
            <aside>
                <h3>
                    我的常用 <small>{{ selected.length }}</small>
                </h3>
                <p class="muted">使用箭头调整顺序</p>
                <ol>
                    <template v-for="(id, i) in selected" :key="id"
                        ><p v-if="i === 8" class="application-limit">以下应用不在首页展示</p>
                        <li>
                            <span>{{ i + 1 }}</span
                            ><span class="system-icon small"
                                ><component :is="icons[all.data.value?.find((s) => s.Id === id)?.Name || ''] || Grid" :size="16" /></span
                            ><b>{{ all.data.value?.find((s) => s.Id === id)?.Name }}</b>
                            <div class="application-order">
                                <button :disabled="i === 0" aria-label="上移" @click="move(i, -1)"><ArrowUp :size="14" /></button
                                ><button :disabled="i === selected.length - 1" aria-label="下移" @click="move(i, 1)"><ArrowDown :size="14" /></button
                                ><button aria-label="移除" @click="toggle(id)"><X :size="14" /></button>
                            </div></li
                    ></template>
                </ol>
            </aside>
        </div>
        <template #footer
            ><el-button @click="open = false">取消</el-button><el-button type="primary" :loading="saving" @click="save">保存设置</el-button></template
        ></el-dialog
    >
    <ResourceDialog v-if="resource" :kind="resource" @close="resource = ''" />
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import {
    LayoutGrid as Grid,
    FileText as Document,
    Mail as Message,
    Globe as Link,
    Flag,
    Factory as OfficeBuilding,
    Layers as Connection,
    GitBranch as Share,
    ShieldCheck as Checked,
    Search,
    ChevronDown,
    Plus,
    Check,
    ArrowUp,
    ArrowDown,
    X,
} from 'lucide-vue-next'
import type { Component } from 'vue'
import { ElMessage } from 'element-plus'
import { useAdminInfo } from '/@/stores/adminInfo'
import * as api from '../api'
import { useResource } from '../useResource'
import PortalCard from './PortalCard.vue'
import LoadState from './LoadState.vue'
import ResourceDialog from './ResourceDialog.vue'
import { safeLink } from '../links'
const icons: Record<string, Component> = {
    OA办公: Document,
    集团邮箱: Message,
    公司门户: Link,
    智慧党群: Flag,
    生产制造: OfficeBuilding,
    工艺集成: Connection,
    流程中心: Share,
    质量管理: Checked,
}
const admin = useAdminInfo(),
    mine = useResource(() => api.getmypersonalapi(admin.userid || '')),
    all = useResource(api.getcustomizationapi)
const resource = ref<'' | '软件下载' | '表格下载'>(''),
    open = ref(false),
    selected = ref<string[]>([]),
    keyword = ref(''),
    saving = ref(false)
const filtered = computed(() => all.data.value?.filter((s) => (s.Name + s.Details).includes(keyword.value)) || [])
function openCenter() {
    selected.value = mine.data.value?.map((s) => s.Id) || []
    open.value = true
}
function toggle(id: string) {
    selected.value = selected.value.includes(id) ? selected.value.filter((s) => s !== id) : [...selected.value, id]
}
function move(i: number, n: number) {
    const list = [...selected.value]
    ;[list[i], list[i + n]] = [list[i + n], list[i]]
    selected.value = list
}
async function save() {
    saving.value = true
    try {
        await api.postmypersonalapi(admin.userid || '', selected.value)
        await mine.load()
        open.value = false
        ElMessage.success('常用应用已保存')
    } catch (e) {
        ElMessage.error((e as Error).message)
    } finally {
        saving.value = false
    }
}
</script>
