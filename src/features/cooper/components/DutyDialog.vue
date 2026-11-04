<template>
    <el-dialog
        modal-class="portal-modal"
        :model-value="modelValue"
        width="1024px"
        align-center
        class="portal-dialog flush-dialog duty-dialog"
        :close-on-click-modal="false"
        @update:model-value="$emit('update:modelValue', $event)"
        ><template #header
            ><h3 class="dialog-heading-title">值班安排</h3>
            <p class="dialog-subtitle">查看我的值班计划与全部值班排班</p></template
        >
        <div class="duty-dialog-toolbar">
            <SegmentedControl
                v-model="tab"
                :items="['我的值班', '全部值班']"
                :counts="{ 我的值班: mine.data.value?.total, 全部值班: keyword ? undefined : all.data.value?.total }"
            /><el-input v-if="tab === '全部值班'" v-model="keyword" :prefix-icon="Search" clearable placeholder="搜索值班人员或日期" />
        </div>
        <LoadState :loading="current.pending.value" :error="current.error.value" variant="table" @retry="current.load">
            <div v-if="tab === '我的值班'" class="my-duty-layout">
                <aside>
                    <small class="eyebrow muted">{{ (mine.data.value?.total || 0) > 100 ? '本页最近值班' : '下一次值班' }}</small
                    ><template v-if="upcoming[0]"
                        ><h4>{{ dutyMonthDay(upcoming[0]) }}</h4>
                        <p class="muted">
                            {{ dutyWeekday(upcoming[0]) }} ·
                            <span :class="{ blue: dutyDayDiff(upcoming[0]) === 0 }">{{
                                dutyDayDiff(upcoming[0]) === 0 ? '就是今天' : `还有 ${dutyDayDiff(upcoming[0])} 天`
                            }}</span>
                        </p>
                        <span class="duty-role">{{ role(upcoming[0]) }}</span>
                        <dl>
                            <div v-for="[k, v] in others(upcoming[0])" :key="k">
                                <dt>{{ k }}</dt>
                                <dd>
                                    <i class="person-initial">{{ v.slice(0, 1) }}</i
                                    >{{ v }}
                                </dd>
                            </div>
                        </dl></template
                    >
                    <p v-else class="muted no-duty">暂无后续值班安排</p>
                    <div class="duty-stats">
                        <div
                            v-for="[k, v] in [
                                ['本页即将', upcoming.length],
                                ['本页完成', past.length],
                                ['合计', mine.data.value?.total || 0],
                            ]"
                            :key="k"
                        >
                            <b>{{ v }}</b
                            ><small>{{ k }}</small>
                        </div>
                    </div>
                </aside>
                <main>
                    <section
                        v-for="group in [
                            { title: (mine.data.value?.total || 0) > 100 ? '本页即将值班' : '即将值班', rows: upcoming },
                            { title: (mine.data.value?.total || 0) > 100 ? '本页已完成' : '已完成', rows: past },
                            { title: '日期待确认', rows: undated },
                        ].filter(g => g.title !== '日期待确认' || g.rows.length)"
                        :key="group.title"
                    >
                        <h4>
                            {{ group.title }} <small>{{ group.rows.length }} 次</small>
                        </h4>
                        <p v-if="!group.rows.length" class="muted">暂无记录</p>
                        <ol>
                            <li v-for="(r, i) in group.rows" :key="i" :class="{ past: (dutyDayDiff(r) ?? 0) < 0 }">
                                <div class="timeline-duty-date">
                                    <b>{{ dutyMonthDay(r) }}</b
                                    ><small>{{ dutyWeekday(r) }}</small>
                                </div>
                                <span class="duty-role">{{ role(r) }}</span>
                                <div class="duty-others">
                                    <span v-for="[k, v] in others(r)" :key="k"
                                        ><small>{{ k }}</small
                                        >{{ v }}</span
                                    >
                                </div>
                                <time :class="{ blue: dutyDayDiff(r) === 0 }">{{
                                    relativeDay(r)
                                }}</time>
                            </li>
                        </ol>
                    </section>
                    <el-pagination v-if="(mine.data.value?.total || 0) > 100" v-model:current-page="minePage" :page-size="100"
                        :total="mine.data.value?.total || 0" layout="prev,pager,next" @current-change="mine.load" />
                </main>
            </div>
            <div v-else class="all-duty-layout">
                <el-table :data="all.data.value?.list || []" class="prototype-table" height="100%" :row-class-name="rowClass"
                    ><el-table-column
                        v-for="c in columns"
                        :key="c.prop"
                        :prop="c.prop"
                        :label="c.label"
                        :align="c.align || 'left'" :width="dutyColumnWidth(c)" :min-width="130"
                        ><template #default="{ row }"
                            ><DutyCell :column="c" :value="row[c.prop]" :today="dutyDayDiff(row) === 0" :username="username" /></template></el-table-column
                ></el-table>
                <div class="duty-pagination">
                    <span>共 {{ all.data.value?.total || 0 }} 条</span><small>▏含我或今日</small
                    ><el-pagination
                        v-model:current-page="page"
                        :page-size="12"
                        :total="all.data.value?.total || 0"
                        layout="prev,pager,next"
                        @current-change="all.load"
                    />
                </div>
            </div> </LoadState
    ></el-dialog>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Search } from 'lucide-vue-next'
import { useAdminInfo } from '/@/stores/adminInfo'
import { getOnDutyList } from '../api'
import { useResource } from '../useResource'
import SegmentedControl from './SegmentedControl.vue'
import DutyCell from './DutyCell.vue'
import LoadState from './LoadState.vue'
import { dutyDate, dutyDayDiff, dutyMonthDay, dutyWeekday, dutyText, dutyColumnWidth } from '../onDuty'
import type { OnDutyRow as Row } from '../types'
defineProps<{ modelValue: boolean }>()
defineEmits(['update:modelValue'])
const admin = useAdminInfo(), username = computed(() => admin.nickname || admin.username),
    tab = ref('我的值班'),
    keyword = ref(''),
    q = ref(''),
    page = ref(1), minePage = ref(1)
const mine = useResource(() => getOnDutyList({ isMySelf: true, page: minePage.value, limit: 100 })),
    all = useResource(() => getOnDutyList({ isMySelf: false, context: q.value || undefined, page: page.value, limit: 12 }))
const current = computed(() => (tab.value === '我的值班' ? mine : all)),
    columns = computed(() => all.data.value?.colums || [])
let timer: ReturnType<typeof setTimeout>
watch(keyword, () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
        q.value = keyword.value.trim()
        page.value = 1
        void all.load()
    }, 300)
})
onBeforeUnmount(() => clearTimeout(timer))
const sorted = computed(() => [...(mine.data.value?.list || [])].sort((a, b) => (dutyDate(a)?.valueOf() ?? Infinity) - (dutyDate(b)?.valueOf() ?? Infinity))),
    upcoming = computed(() => sorted.value.filter(r => { const days = dutyDayDiff(r); return days !== null && days >= 0 })),
    past = computed(() => sorted.value.filter(r => { const days = dutyDayDiff(r); return days !== null && days < 0 }).reverse()),
    undated = computed(() => sorted.value.filter(r => dutyDayDiff(r) === null))
const role = (r: Row) => mine.data.value?.colums.find(c => c.prop !== 'OnDutyTime' && !!username.value && r[c.prop] === username.value)?.label || '值班安排',
    others = (r: Row) => (mine.data.value?.colums || []).filter(c => c.prop !== 'OnDutyTime' && (!username.value || r[c.prop] !== username.value)).map(c => [c.label, dutyText(r[c.prop])])
const relativeDay = (r: Row) => {
    const days = dutyDayDiff(r)
    return days === null ? '日期待确认' : days === 0 ? '今日' : days > 0 ? days + ' 天后' : -days + ' 天前'
}
const rowClass = ({ row }: { row: Row }) =>
    dutyDayDiff(row) === 0 || (!!username.value && Object.values(row).includes(username.value)) ? 'duty-highlight' : (dutyDayDiff(row) ?? 0) < 0 ? 'duty-past' : ''
</script>
