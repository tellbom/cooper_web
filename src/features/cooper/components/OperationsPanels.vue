<template>
    <template v-if="kind === 'meetings'">
        <PortalCard title="会议动态" :icon="Calendar" more="更多" class="meetings-card" @more="open = true"
            ><template #extra
                ><small class="meeting-summary"
                    >今日 <b>{{ meetingItems.filter((m) => m.startTime.slice(0, 10) === ymd(now)).length }}</b
                    >　进行中 <b>{{ meetingItems.filter((m) => state(m) === '进行中').length }}</b></small
                ><button class="more-link" @click="open = true">更多 ›</button></template
            ><LoadState
                :loading="meetings.pending.value"
                :error="meetings.error.value"
                :empty="!meetingItems.length"
                variant="table"
                @retry="meetings.load"
                ><div class="mini-table meeting-table">
                    <div class="table-head"><span>时间</span><span>会议名称</span><span>会议地点</span><span>状态</span></div>
                    <div class="autoscroll">
                        <div :class="{ 'marquee-y': meetingItems.length > 4 }">
                            <div v-for="(m, i) in repeatedMeetings" :key="i" class="table-row" :class="{ highlight: state(m) === '进行中' }">
                                <time
                                    >{{ m.startTime.slice(5, 10) }} <b>{{ hm(m.startTime) }}</b></time
                                ><b :title="m.meetingTitle">{{ m.meetingTitle }}</b
                                ><span class="meeting-location"><MapPin :size="12" />{{ m.roomName }}</span
                                ><small class="meeting-state" :class="{ blue: state(m) === '进行中', ended: state(m) === '已结束' }"
                                    ><i />{{ state(m) }}</small
                                >
                            </div>
                        </div>
                    </div>
                </div></LoadState
            ></PortalCard
        >
        <el-dialog modal-class="portal-modal" v-model="open" title="会议动态" width="980px" class="portal-dialog"
            ><LoadState :loading="meetings.pending.value" :error="meetings.error.value" @retry="meetings.load"
                ><el-table :data="meetings.data.value || []" max-height="560"
                    ><el-table-column prop="meetingTitle" label="会议名称" min-width="240" /><el-table-column
                        prop="roomName"
                        label="会议地点" /><el-table-column prop="startTime" label="开始时间" min-width="170" /><el-table-column
                        prop="endTime"
                        label="结束时间"
                        min-width="170" /></el-table></LoadState
        ></el-dialog>
    </template>
    <template v-else-if="kind === 'duty'">
        <PortalCard title="值班信息" :icon="UserFilled" more="值班安排" class="duty-card" @more="open = true"
            ><LoadState
                :loading="duty.pending.value"
                :error="duty.error.value"
                :empty="!duty.data.value?.list.length"
                variant="table"
                @retry="duty.load"
                ><div
                    class="mini-table dynamic-table"
                    :style="{
                        '--duty-cols': dutyColumns
                            .map((c) => (c.includes('电话') ? 'minmax(0,1.5fr)' : c === '星期' ? 'minmax(0,.7fr)' : 'minmax(0,1fr)'))
                            .join(' '),
                    }"
                >
                    <div class="table-head">
                        <span v-for="c in dutyColumns" :key="c">{{ c }}</span>
                    </div>
                    <div class="autoscroll">
                        <div :class="{ 'marquee-y': (duty.data.value?.list.length || 0) > 4 }">
                            <div
                                v-for="(r, i) in repeatedDuty"
                                :key="i"
                                class="table-row"
                                :class="{ highlight: Object.values(r).some((v) => v === ymd(now).slice(5)) }"
                            >
                                <DutyCell
                                    v-for="c in dutyColumns"
                                    :key="c"
                                    :column="c"
                                    :value="r[c]"
                                    :today="r['日期'] === ymd(now).slice(5)"
                                    :username="username"
                                />
                            </div>
                        </div>
                    </div></div></LoadState
        ></PortalCard>
        <DutyDialog v-if="open" v-model="open" />
    </template>
    <template v-else-if="kind === 'honor'">
        <PortalCard title="荣誉墙" :icon="Trophy" more="更多" class="honor-card" @more="openHonorSite"
            ><template #tabs><span class="pill-tab">全部</span></template
            ><LoadState
                :loading="honors.pending.value"
                :error="honors.error.value"
                :empty="!honors.data.value?.length"
                :rows="6"
                variant="honor"
                @retry="honors.load"
                ><el-carousel
                    class="honor-carousel"
                    height="100%"
                    :interval="4500"
                    arrow="always"
                    indicator-position="outside"
                    :pause-on-hover="true"
                    trigger="click"
                    ><el-carousel-item v-for="i in honorSteps" :key="i"
                        ><div class="honor-group">
                            <button v-for="h in honors.data.value?.slice(i - 1, i + 3)" :key="h.Id" class="honor-item" @click="openHonorSite">
                                <div><img :src="h.Avatar" :alt="h.Title" /></div>
                                <h3>{{ h.Title }}</h3>
                                <small>{{ h.CreateTime.slice(0, 10) }} <span>|</span> {{ h.Awardee }}</small>
                            </button>
                        </div></el-carousel-item
                    ></el-carousel
                ></LoadState
            ></PortalCard
        >
    </template>
    <template v-else-if="kind === 'tech'">
        <PortalCard title="危险作业" :icon="Operation" more="更多" class="tech-card" @more="open = true"
            ><LoadState :loading="hot.pending.value" :error="hot.error.value" :empty="!hot.data.value?.list.length" variant="work" @retry="hot.load"
                ><div class="scroll-area">
                    <button
                        v-for="w in hot.data.value?.list"
                        :key="w.Id"
                        class="work-row"
                        @click="
                            ($event) => {
                                selectedWork = w
                                open = true
                            }
                        "
                    >
                        <span
                            ><b>{{ w.workType }}</b
                            ><small class="work-person"
                                ><i class="person-initial">{{ w.userName.slice(0, 1) }}</i
                                >{{ w.userName }}</small
                            ></span
                        >
                        <p>{{ w.hazardousWorkArea }}</p>
                        <time
                            ><Clock :size="11" />{{ w.screateTime.replace('T', ' ').slice(5, 16) }} –
                            {{ w.ecreateTime.replace('T', ' ').slice(5, 16) }}</time
                        >
                    </button>
                </div>
                <button class="view-all" @click="open = true">查看全部作业 ›</button></LoadState
            ></PortalCard
        >
        <TechDialog v-model="open" :list="hot.data.value?.list || []" :initial="selectedWork?.Id" />
    </template>
    <template v-else>
        <PortalCard title="故障与制造问题" :icon="Warning" more="更多" class="fault-card" @more="open = true"
            ><SegmentedControl v-model="faultTab" :items="['设备故障', '制造问题']" class="fault-home-tabs" />
            <LoadState
                :loading="faultResource.pending.value"
                :error="faultResource.error.value"
                :empty="!faultResource.data.value?.length"
                variant="fault"
                @retry="faultResource.load"
                ><div class="scroll-area">
                    <button v-for="(f, i) in faultTab === '设备故障' ? faults.data.value : []" :key="i" class="fault-row" @click="open = true">
                        <i :class="tone(f.State)" />
                        <div>
                            <b>{{ f.SMBC }}</b>
                            <p>{{ f.SS_GZNR }}</p>
                        </div>
                        <span
                            ><em :class="tone(f.State)">{{ f.State }}</em
                            ><time>{{ f.GZFS_SJ?.slice(5, 10) || '—' }}</time></span
                        >
                    </button>
                    <button v-for="(m, i) in faultTab === '制造问题' ? manufacture.data.value : []" :key="'manufacture-' + i" class="fault-row" @click="open = true">
                        <i :class="tone(m.DQZT)" /><div><b>{{ m.JX }} · {{ m.LJTH }}</b><p>责任人：{{ m.ZRXM }}</p></div>
                        <span><em :class="tone(m.DQZT)">{{ m.DQZT }}</em><time>{{ m.TCSJ?.slice(5, 10) }}</time></span>
                    </button>
                </div>
                <button class="view-all" @click="open = true">查看全部问题 ›</button></LoadState
            ></PortalCard
        >
        <FaultDialog v-if="open" v-model="open" :faults="faults.data.value || []" :initial-tab="faultTab" />
    </template>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import {
    CalendarClock as Calendar,
    UserCheck as UserFilled,
    Award as Trophy,
    Settings2 as Operation,
    TriangleAlert as Warning,
    MapPin,
    Phone,
    Clock,
    ChevronRight,
} from 'lucide-vue-next'
import * as api from '../api'
import { useResource } from '../useResource'
import { ymd, hm } from '../date'
import PortalCard from './PortalCard.vue'
import LoadState from './LoadState.vue'
import TechDialog from './TechDialog.vue'
import DutyDialog from './DutyDialog.vue'
import FaultDialog from './FaultDialog.vue'
import DutyCell from './DutyCell.vue'
import SegmentedControl from './SegmentedControl.vue'
import { useAdminInfo } from '/@/stores/adminInfo'
import { safeLink } from '../links'
const admin = useAdminInfo(), username = computed(() => admin.nickname || admin.username)
const props = defineProps<{ kind: 'meetings' | 'duty' | 'honor' | 'tech' | 'fault' }>(),
    open = ref(false),
    now = ref(new Date())
// Each panel only requests its own endpoints. Optional dialog data loads when opened.
const meetings = useResource(() => (props.kind === 'meetings' ? api.getmeetingInfos() : Promise.resolve([])))
const duty = useResource(() => (props.kind === 'duty' ? api.getOnDutyList() : Promise.resolve(null)))
const honors = useResource(() => (props.kind === 'honor' ? api.getHonorapi() : Promise.resolve([])))
const workKeyword = ref(''),
    hot = useResource(() =>
        props.kind === 'tech'
            ? api.getHotwork({ pageNo: 1, pageSize: 20, userName: workKeyword.value || undefined })
            : Promise.resolve({ list: [], total: 0 })
    )
const faults = useResource(() => (props.kind === 'fault' ? api.getFaultTableMessageapi() : Promise.resolve([])))
const manufacture = useResource(() => props.kind === 'fault' ? api.getZZPWTMessageapi() : Promise.resolve([]))
const faultTab = ref('设备故障'), faultResource = computed(() => faultTab.value === '设备故障' ? faults : manufacture)
const meetingItems = computed(() => meetings.data.value || [])
const state = (m: api.MeetingInfo) => (now.value < new Date(m.startTime) ? '未开始' : now.value > new Date(m.endTime) ? '已结束' : '进行中')
const repeatedMeetings = computed(() => (meetingItems.value.length > 4 ? [...meetingItems.value, ...meetingItems.value] : meetingItems.value))
const dutyColumns = computed(() => Object.keys(duty.data.value?.list[0] || {}))
const repeatedDuty = computed(() => {
    const list = duty.data.value?.list || []
    return list.length > 4 ? [...list, ...list] : list
})
const honorSteps = computed(() => Math.max(1, (honors.data.value?.length || 0) - 3))
const selectedWork = ref<api.HotWorkDto | null>(null)
// 在内网填写荣誉网站地址；更多入口和荣誉卡片均直接打开该网站。
const honorSiteUrl = ''
function openHonorSite() {
    const url = honorSiteUrl.trim() && safeLink(honorSiteUrl)
    if (url) window.open(url, '_blank', 'noopener')
}
const tone = (s: string) => (s === '未响应' ? 'red' : s === '处理中' ? 'orange' : s === '未确认' ? 'amber' : ['已处理', '已归零', '已完成'].includes(s) ? 'green' : 'gray')
const timer = window.setInterval(() => {
    now.value = new Date()
}, 4500)
onBeforeUnmount(() => {
    clearInterval(timer)
})
</script>
