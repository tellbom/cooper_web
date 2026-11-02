<template>
    <PortalCard class="agenda-card" more="更多" @more="openCalendar('7日')"
        ><template #tabs
            ><div class="line-tabs" role="tablist">
                <button
                    v-for="t in ['领导日程', '我的日程']"
                    :key="t"
                    role="tab"
                    :aria-selected="tab === t"
                    :class="{ active: tab === t }"
                    @click="tab = t"
                >
                    {{ t }}
                </button>
            </div></template
        >
        <div class="agenda-toolbar">
            <div class="date-nav">
                <button aria-label="上一页日程" @click="shift(-1)"><ChevronLeft :size="16" /></button
                ><strong>{{
                    tab === '领导日程' ? `${day.getFullYear()}年${md(day)} 周${week[day.getDay()]}` : `${md(days[0])} – ${md(days[6])}`
                }}</strong
                ><button aria-label="下一页日程" @click="shift(1)"><ChevronRight :size="16" /></button>
            </div>
            <SegmentedControl v-if="tab === '我的日程'" :model-value="'7日'" :items="['7日', '月', '年']" @update:model-value="openCalendar" />
        </div>
        <LoadState
            v-if="tab === '领导日程'"
            :loading="leaders.pending.value"
            :error="leaders.error.value"
            :empty="!leaderItems.length"
            variant="agenda"
            empty-text="当日暂无领导日程"
            @retry="leaders.load"
            ><ol class="leader-agenda scroll-area">
                <li v-for="(s, i) in leaderItems" :key="s.leaderID + s.startTime">
                    <i :style="{ background: tones[i % tones.length] }" /><time>{{ hm(s.startTime) }}</time>
                    <div>
                        <strong>{{ s.activity.split('（')[0] }}</strong
                        ><small
                            ><em>{{ s.leaderName }}</em
                            ><span v-if="s.activity.includes('（')"
                                ><MapPin :size="11" />{{ s.activity.split('（')[1].replace('）', '') }}</span
                            ></small
                        >
                    </div>
                </li>
            </ol></LoadState
        >
        <template v-else
            ><div class="week-strip">
                <button v-for="d in days" :key="ymd(d)" :class="{ active: ymd(d) === ymd(day) }" :aria-pressed="ymd(d) === ymd(day)" :aria-label="ymd(d)" @click="day = d">
                    <small>{{ week[d.getDay()] }}</small
                    ><b>{{ d.getDate() }}</b
                    ><span class="event-dot-row"
                        ><i v-for="i in Math.min(3, events.data.value?.filter((e) => overlapsDay(e, d)).length || 0)" :key="i"
                    /></span>
                </button>
            </div>
            <div class="section-tools">
                <button class="day-agenda-trigger" aria-label="展开当日详细日程" @click="dayListOpen = true">
                    <b>{{ md(day) }} 周{{ week[day.getDay()] }}</b
                    ><small>· {{ dayEvents.length }} 项 · 展开</small><ChevronRight :size="13" /></button
                ><button class="text-link" @click="newEvent(day)"><Plus :size="14" />新建日程</button>
            </div>
            <LoadState
                :loading="events.pending.value"
                :error="events.error.value"
                :empty="!dayEvents.length"
                empty-text="当日暂无日程"
                variant="agenda"
                @retry="events.load"
                ><div class="scroll-area day-agenda-preview">
                    <button v-for="e in dayEvents" :key="e.id" class="event-chip" :class="{ agent: e.source === 'AGENT' }" @click="selected = e">
                        <time :title="rangeLabel(e)"
                            >{{ dayTimes(e)[0] }}<small>{{ dayTimes(e)[1] }}</small></time
                        >
                        <span
                            ><b>{{ e.title }}<Bot v-if="e.source === 'AGENT'" :size="12" /></b><small>{{ isMultiDay(e) ? '跨日 · ' : '' }}{{ e.location || '未设置地点' }}</small></span
                        >
                        <ChevronRight :size="13" />
                    </button></div></LoadState
        ></template>
    </PortalCard>
    <el-drawer v-model="dayListOpen" size="460px" append-to-body class="portal-day-drawer">
        <template #header
            ><div>
                <span class="day-drawer-kicker">我的日程</span>
                <h3>
                    {{ md(day) }} <small>周{{ week[day.getDay()] }}</small>
                </h3>
                <p>当日共 {{ dayEvents.length }} 项安排</p>
            </div></template
        >
        <div class="day-drawer-nav">
            <el-button :icon="ChevronLeft" aria-label="前一天" @click="day = addDays(day, -1)" /><el-button @click="day = new Date()">今天</el-button
            ><el-button :icon="ChevronRight" aria-label="后一天" @click="day = addDays(day, 1)" />
        </div>
        <LoadState
            :loading="events.pending.value"
            :error="events.error.value"
            :empty="!dayEvents.length"
            empty-text="当日暂无日程"
            variant="agenda"
            @retry="events.load"
        >
            <ol class="day-drawer-events">
                <li v-for="e in dayEvents" :key="e.id">
                    <button :class="{ agent: e.source === 'AGENT' }" @click="selected = e">
                        <time :title="rangeLabel(e)"
                            >{{ dayTimes(e)[0] }}<small>{{ dayTimes(e)[1] }}</small></time
                        >
                        <div>
                            <h4>{{ e.title }}<Bot v-if="e.source === 'AGENT'" :size="13" /></h4>
                            <p v-if="isMultiDay(e)" class="day-drawer-range">{{ rangeLabel(e) }}</p>
                            <p><MapPin :size="13" />{{ e.location || '未设置地点' }}</p>
                            <small v-if="e.description" class="day-drawer-description">{{ e.description }}</small>
                        </div>
                        <ChevronRight :size="15" />
                    </button>
                </li>
            </ol>
        </LoadState>
        <template #footer
            ><el-button @click="openCalendar('7日')">打开完整日历</el-button
            ><el-button type="primary" :icon="Plus" @click="newEvent(day)">新建日程</el-button></template
        >
    </el-drawer>
    <el-dialog
        modal-class="portal-modal"
        v-model="calendarOpen"
        width="1152px"
        align-center
        class="portal-dialog flush-dialog schedule-dialog"
        :close-on-click-modal="false"
        destroy-on-close
        ><template #header
            ><div class="schedule-dialog-header">
                <div>
                    <h3 class="dialog-heading-title">{{ calendarTitle }}</h3>
                    <p class="dialog-subtitle">我的日程 · <template v-if="calendarLoading">正在加载</template><template v-else>共 {{ calendarCount }} 项{{ view === '年' ? ' · 点击月份查看详情' : '' }}</template></p>
                </div>
                <div class="schedule-actions">
                    <el-button @click="calendar?.getApi().today()">今天</el-button>
                    <div class="calendar-step">
                        <button aria-label="上一页" @click="calendar?.getApi().prev()"><ChevronLeft :size="16" /></button><span /><button
                            aria-label="下一页"
                            @click="calendar?.getApi().next()"
                        >
                            <ChevronRight :size="16" />
                        </button>
                    </div>
                    <SegmentedControl v-model="view" :items="['7日', '月', '年']" /><el-button type="primary" @click="newEvent(calendar?.getApi().getDate() || day)"
                        ><Plus :size="15" />新建日程</el-button
                    ><span class="header-divider" />
                </div></div
        ></template>
        <div :class="['fullcalendar-host', view === '月' ? 'calendar-month' : view === '年' ? 'calendar-year' : 'calendar-week']">
            <FullCalendar ref="calendar" :options="calendarOptions" />
            <div v-if="calendarLoading" class="calendar-loading"><LoadState loading variant="table" /></div></div
    ></el-dialog>
    <el-dialog
        modal-class="portal-modal"
        :model-value="!!selected"
        :title="selected?.title"
        width="500px"
        align-center
        class="portal-dialog event-detail-dialog"
        @update:model-value="selected = null"
        ><template #header
            ><span class="event-detail-kicker">我的日程</span>
            <h3 class="event-detail-title">{{ selected?.title }}</h3></template
        >
        <div v-if="selected" class="event-time-summary">
            <div class="event-date-tile">
                <strong>{{ new Date(selected.startAt).getDate() }}</strong
                ><small>{{ new Date(selected.startAt).getMonth() + 1 }}月 · 周{{ week[new Date(selected.startAt).getDay()] }}</small>
            </div>
            <div class="event-time-summary-copy">
                <div v-if="isMultiDay(selected)" class="event-full-range">
                    <div><small>开始</small><strong>{{ calendarDateTime(selected.startAt) }}</strong></div>
                    <div><small>结束</small><strong>{{ calendarDateTime(selected.endAt) }}</strong></div>
                </div>
                <time v-else>{{ calendarTime(selected.startAt) }}<span>—</span>{{ calendarTime(selected.endAt) }}</time>
                <p>{{ isMultiDay(selected) ? '跨日日程' : ymd(new Date(selected.startAt)) }} · {{ durationLabel(selected) }}</p>
            </div>
        </div>
        <ul v-if="selected" class="event-detail-list">
            <li v-if="selected.location"><MapPin :size="16" />{{ selected.location }}</li>
            <li><Bell :size="16" />{{ remindLabel(selected.reminderMinutes) }}</li>
            <li>
                <Bot v-if="selected.source === 'AGENT'" :size="16" /><UserRound v-else :size="16" />{{
                    selected.source === 'AGENT' ? '由智能助手创建' : '本人创建'
                }}
            </li>
            <li v-if="selected.description"><AlignLeft :size="16" />{{ selected.description }}</li>
        </ul>
        <template #footer
            ><button class="delete-event" :disabled="saving" @click="remove"><Trash2 :size="15" />删除日程</button
            ><el-button @click="selected = null">关闭</el-button
            ><el-button type="primary" :icon="Pencil" @click="editSelected">编辑日程</el-button></template
        ></el-dialog
    >
    <el-dialog
        modal-class="portal-modal"
        v-model="editorOpen"
        :title="editing ? '编辑日程' : '新建日程'"
        width="512px"
        align-center
        class="portal-dialog event-form-dialog"
        :close-on-click-modal="false"
        @opened="titleInput?.focus()"
        ><template #header
            ><div class="event-editor-heading">
                <span><CalendarDays :size="22" /></span>
                <div>
                    <h3 class="dialog-heading-title">{{ editing ? '编辑日程' : '新建日程' }}</h3>
                    <p class="dialog-subtitle">安排时间、地点与提醒</p>
                </div>
            </div></template
        ><el-form label-position="top" @submit.prevent="save"
            ><el-form-item label="日程主题" class="event-subject-field"
                ><el-input ref="titleInput" v-model="form.title" placeholder="例如：项目进度同步会" maxlength="100"
            /></el-form-item>
            <el-form-item label="日期与时间区间" class="event-range-field">
                <el-config-provider :locale="datePickerLocale">
                <el-date-picker v-model="form.range" type="datetimerange" format="YYYY-MM-DD HH:mm" range-separator="至"
                    start-placeholder="开始日期时间" end-placeholder="结束日期时间" :default-time="defaultRangeTime" unlink-panels
                    class="event-range-picker" popper-class="portal-event-range-popper" />
                </el-config-provider>
                <small class="event-range-hint">可选择不同日期，支持跨月、跨年</small>
            </el-form-item>
            <p v-if="form.range?.length === 2 && !validRange" class="event-invalid">结束日期时间需晚于开始日期时间</p>
            <div class="event-place-fields">
                <el-form-item label="提醒"
                    ><el-select v-model="form.reminderMinutes"
                        ><el-option v-for="m in [0, 5, 10, 15, 30, 60, 1440]" :key="m" :value="m" :label="remindLabel(m)" /></el-select></el-form-item
                ><el-form-item label="地点"><el-input v-model="form.location" placeholder="可选" /></el-form-item>
            </div>
            <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="3" placeholder="可选" /></el-form-item></el-form
        ><template #footer
            ><el-button @click="editorOpen = false">取消</el-button
            ><el-button type="primary" :loading="saving" :disabled="!form.title.trim() || !validRange" @click="save"
                >保存日程</el-button
            ></template
        ></el-dialog
    >
</template>
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { ElInput, ElMessage, ElMessageBox } from 'element-plus'
import datePickerLocale from 'element-plus/es/locale/lang/zh-cn'
import { ChevronLeft, ChevronRight, MapPin, Plus, Clock, Bell, Bot, UserRound, AlignLeft, Trash2, Pencil, CalendarDays } from 'lucide-vue-next'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import multiMonthPlugin from '@fullcalendar/multimonth'
import interactionPlugin from '@fullcalendar/interaction'
import zhLocale from '@fullcalendar/core/locales/zh-cn'
import type { CalendarOptions } from '@fullcalendar/core'
import * as api from '../api'
import { useResource } from '../useResource'
import { ymd, hm, addDays, weekStart, localIso, overlapsDay, overlapsRange, calendarTime, calendarDateTime } from '../date'
import { portalEvents } from '../realtime'
import PortalCard from './PortalCard.vue'
import LoadState from './LoadState.vue'
import SegmentedControl from './SegmentedControl.vue'
const tab = ref('领导日程'),
    day = ref(new Date()),
    dayListOpen = ref(false),
    titleInput = ref<InstanceType<typeof ElInput>>(),
    week = ['日', '一', '二', '三', '四', '五', '六'],
    tones = ['#3b82f6', '#10b981', '#fbbf24', '#8b5cf6']
const md = (d: Date) => `${d.getMonth() + 1}月${d.getDate()}日`
const leaders = useResource(api.getLeadershipAgenda),
    days = computed(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart(day.value), i)))
const events = useResource(() => api.listCalendarEvents(localIso(weekStart(day.value)), localIso(addDays(weekStart(day.value), 7))))
const leaderItems = computed(
    () => leaders.data.value?.filter((s) => s.startTime.startsWith(ymd(day.value))).sort((a, b) => a.startTime.localeCompare(b.startTime)) || []
)
const dayEvents = computed(
    () => events.data.value?.filter((e) => overlapsDay(e, day.value)).sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()) || []
)
function shift(n: number) {
    day.value = addDays(day.value, tab.value === '我的日程' ? n * 7 : n)
}
watch(
    () => ymd(weekStart(day.value)),
    () => events.load()
)
const calendarOpen = ref(false),
    view = ref('月'),
    calendar = ref<InstanceType<typeof FullCalendar>>(),
    calendarTitle = ref(''),
    calendarLoading = ref(false)
const calendarEntries = ref<api.CalendarEventDto[]>([])
const calendarPeriod = ref<{ start: Date; end: Date }>()
const calendarCount = computed(() => calendarEntries.value.filter(event => calendarPeriod.value && overlapsRange(event, calendarPeriod.value.start, calendarPeriod.value.end)).length)
let calendarRequest = 0
const viewNames: Record<string, string> = { '7日': 'timeGridWeek', 月: 'dayGridMonth', 年: 'multiMonthYear' }
function openCalendar(v: string) {
    dayListOpen.value = false
    view.value = v
    calendarOptions.initialView = viewNames[v]
    calendarOptions.initialDate = day.value
    calendarLoading.value = true
    calendarOpen.value = true
    nextTick(() => calendar.value?.getApi().changeView(viewNames[v], day.value))
}
watch(view, (v) => {
    if (calendarOpen.value) calendar.value?.getApi().changeView(viewNames[v])
})
const calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, multiMonthPlugin, interactionPlugin],
    locale: zhLocale,
    initialView: 'dayGridMonth',
    initialDate: day.value,
    headerToolbar: false,
    height: '100%',
    firstDay: 1,
    allDaySlot: false,
    slotMinTime: '00:00:00',
    slotMaxTime: '24:00:00',
    slotDuration: '01:00:00',
    scrollTime: '08:30:00',
    slotLabelFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
    dayMaxEvents: 2,
    expandRows: true,
    dayCellContent: (info) => String(info.date.getDate()),
    multiMonthMaxColumns: 4,
    multiMonthMinWidth: 190,
    editable: false,
    nowIndicator: true,
    eventDisplay: 'auto',
    eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
    datesSet(info) {
        calendarTitle.value = info.view.type === 'multiMonthYear' ? `${info.view.currentStart.getFullYear()}年` : info.view.title
        calendarPeriod.value = { start: info.view.currentStart, end: info.view.currentEnd }
        nextTick(() => setTimeout(decorateYear, 0))
    },
    loading(loading) { calendarLoading.value = loading },
    events: async (info, success, failure) => {
        const request = ++calendarRequest
        try {
            const list = await api.listCalendarEvents(info.startStr, info.endStr)
            if (request === calendarRequest) {
                calendarEntries.value = list
                nextTick(() => setTimeout(decorateYear, 0))
            }
            success(
                list.map((e) => ({
                    id: e.id,
                    title: e.title,
                    start: e.startAt,
                    end: e.endAt,
                    classNames: e.source === 'AGENT' ? ['agent-event'] : [],
                    extendedProps: { dto: e },
                }))
            )
        } catch (e) {
            failure(e as Error)
            if (request === calendarRequest) ElMessage.error((e as Error).message)
        }
    },
    eventClick(info) {
        selected.value = info.event.extendedProps.dto as api.CalendarEventDto
    },
    dateClick(info) {
        if (view.value === '月') {
            if ((info.jsEvent.target as HTMLElement).closest('.fc-daygrid-day-number')) {
                view.value = '7日'
                calendar.value?.getApi().changeView('timeGridWeek', info.date)
            }
        } else if (view.value === '7日') newEvent(info.date, true)
    },
    dayCellDidMount(info) {
        if (info.view.type === 'dayGridMonth') info.el.addEventListener('dblclick', () => newEvent(info.date))
        if (info.view.type === 'multiMonthYear')
            info.el.addEventListener('click', () => {
                view.value = '月'
                calendar.value?.getApi().changeView('dayGridMonth', info.date)
            })
    },
}
function decorateYear() {
    if (view.value !== '年') return
    const groups = document.querySelectorAll<HTMLElement>('.schedule-dialog .fc-multimonth-month')
    const year = calendar.value?.getApi().getDate().getFullYear() || new Date().getFullYear()
    groups.forEach((group, month) => {
        const title = group.querySelector<HTMLElement>('.fc-multimonth-title')
        if (title) {
            const total = calendarEntries.value.filter(
                (e) => overlapsRange(e, new Date(year, month, 1), new Date(year, month + 1, 1))
            ).length
            title.textContent = `${month + 1}月`
            const count = document.createElement('small')
            count.textContent = total ? `${total} 项` : '—'
            title.append(count)
            title.tabIndex = 0
            title.setAttribute('role', 'button')
            title.onclick = () => {
                view.value = '月'
                calendar.value?.getApi().changeView('dayGridMonth', new Date(year, month, 1))
            }
            title.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    title.click()
                }
            }
        }
        group.classList.toggle('current-month', month === new Date().getMonth() && year === new Date().getFullYear())
        group.querySelectorAll<HTMLElement>('[data-date]').forEach((cell) => {
            const n = calendarEntries.value.filter((e) => overlapsDay(e, cell.dataset.date!)).length
            cell.classList.remove('heat-1', 'heat-2', 'heat-3')
            if (n) cell.classList.add('heat-' + Math.min(3, n))
        })
    })
}
const selected = ref<api.CalendarEventDto | null>(null),
    editorOpen = ref(false),
    editing = ref(''),
    saving = ref(false)
const form = reactive({ title: '', range: undefined as [Date, Date] | undefined, description: '', location: '', reminderMinutes: 15 })
const defaultRangeTime: [Date, Date] = [new Date(2000, 0, 1, 9, 0), new Date(2000, 0, 1, 10, 0)]
const validRange = computed(() => !!form.range && form.range.length === 2 && Number.isFinite(form.range[0]?.getTime()) && Number.isFinite(form.range[1]?.getTime()) && form.range[1].getTime() > form.range[0].getTime())
const isMultiDay = (event: api.CalendarEventDto) => ymd(new Date(event.startAt)) !== ymd(new Date(event.endAt))
const rangeLabel = (event: api.CalendarEventDto) => `${calendarDateTime(event.startAt)} 至 ${calendarDateTime(event.endAt)}`
function dayTimes(event: api.CalendarEventDto) {
    const start = new Date(day.value.getFullYear(), day.value.getMonth(), day.value.getDate()), end = addDays(start, 1)
    return [new Date(event.startAt) < start ? '持续中' : calendarTime(event.startAt), new Date(event.endAt) > end ? '跨日' : new Date(event.endAt).getTime() === end.getTime() ? '24:00' : calendarTime(event.endAt)]
}
const remindLabel = (m: number) => (m === 0 ? '不提醒' : m === 1440 ? '提前 1 天' : m === 60 ? '提前 1 小时' : `提前 ${m} 分钟`)
function durationLabel(event: api.CalendarEventDto) {
    const minutes = Math.round((new Date(event.endAt).getTime() - new Date(event.startAt).getTime()) / 60000)
    const days = Math.floor(minutes / 1440), hours = Math.floor(minutes % 1440 / 60), remainder = minutes % 60
    return [days ? `${days}天` : '', hours ? `${hours}小时` : '', remainder ? `${remainder}分钟` : ''].filter(Boolean).join('') || '0分钟'
}
function newEvent(d: Date, timed = false) {
    editing.value = ''
    const start = timed ? new Date(d) : new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9)
    Object.assign(form, { title: '', range: [start, new Date(start.getTime() + 3600000)], description: '', location: '', reminderMinutes: 15 })
    editorOpen.value = true
}
function editSelected() {
    const e = selected.value
    if (!e) return
    editing.value = e.id
    Object.assign(form, {
        title: e.title,
        range: [new Date(e.startAt), new Date(e.endAt)],
        description: e.description || '',
        location: e.location || '',
        reminderMinutes: e.reminderMinutes,
    })
    selected.value = null
    editorOpen.value = true
}
function reload() {
    void events.load()
    calendar.value?.getApi().refetchEvents()
}
async function save() {
    if (!form.title.trim() || !validRange.value || !form.range) return
    saving.value = true
    try {
        const body = {
            title: form.title.trim(),
            description: form.description || null,
            location: form.location || null,
            startAt: localIso(form.range[0]),
            endAt: localIso(form.range[1]),
            reminderMinutes: form.reminderMinutes,
        }
        if (editing.value) await api.updateCalendarEvent(editing.value, body)
        else await api.createCalendarEvent(body)
        editorOpen.value = false
        reload()
        ElMessage.success('日程已保存')
    } catch (e) {
        ElMessage.error((e as Error).message)
    } finally {
        saving.value = false
    }
}
async function remove() {
    if (!selected.value) return
    try {
        await ElMessageBox.confirm('确认删除此日程？', '删除日程')
        saving.value = true
        await api.deleteCalendarEvent(selected.value.id)
        selected.value = null
        reload()
    } catch (e) {
        if (e instanceof Error) ElMessage.error(e.message)
    } finally {
        saving.value = false
    }
}
portalEvents.on('calendar', reload)
onBeforeUnmount(() => portalEvents.off('calendar', reload))
</script>
