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
            /><el-input v-if="tab === '全部值班'" v-model="keyword" :prefix-icon="Search" clearable placeholder="搜索姓名、日期或电话" />
        </div>
        <LoadState :loading="current.pending.value" :error="current.error.value" variant="table" @retry="current.load">
            <div v-if="tab === '我的值班'" class="my-duty-layout">
                <aside>
                    <small class="eyebrow muted">下一次值班</small
                    ><template v-if="upcoming[0]"
                        ><h4>{{ md(dateOf(upcoming[0])) }}</h4>
                        <p class="muted">
                            {{ upcoming[0]['星期'] }} ·
                            <span :class="{ blue: diff(upcoming[0]) === 0 }">{{
                                diff(upcoming[0]) === 0 ? '就是今天' : `还有 ${diff(upcoming[0])} 天`
                            }}</span>
                        </p>
                        <span class="duty-role">{{ role(upcoming[0]) }}</span>
                        <dl>
                            <div v-for="[k, v] in others(upcoming[0])" :key="k">
                                <dt>{{ k }}</dt>
                                <dd>
                                    <Phone v-if="k.includes('电话')" :size="12" /><i v-else class="person-initial">{{ v.slice(0, 1) }}</i
                                    >{{ v }}
                                </dd>
                            </div>
                        </dl></template
                    >
                    <p v-else class="muted no-duty">暂无后续值班安排</p>
                    <div class="duty-stats">
                        <div
                            v-for="[k, v] in [
                                ['即将', upcoming.length],
                                ['已完成', past.length],
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
                            { title: '即将值班', rows: upcoming },
                            { title: '已完成', rows: past },
                        ]"
                        :key="group.title"
                    >
                        <h4>
                            {{ group.title }} <small>{{ group.rows.length }} 次</small>
                        </h4>
                        <p v-if="!group.rows.length" class="muted">暂无记录</p>
                        <ol>
                            <li v-for="(r, i) in group.rows" :key="i" :class="{ past: diff(r) < 0 }">
                                <div class="timeline-duty-date">
                                    <b>{{ md(dateOf(r)) }}</b
                                    ><small>{{ r['星期'] }}</small>
                                </div>
                                <span class="duty-role">{{ role(r) }}</span>
                                <div class="duty-others">
                                    <span v-for="[k, v] in others(r)" :key="k"
                                        ><small>{{ k }}</small
                                        >{{ v }}</span
                                    >
                                </div>
                                <time :class="{ blue: diff(r) === 0 }">{{
                                    diff(r) === 0 ? '今日' : diff(r) > 0 ? diff(r) + ' 天后' : -diff(r) + ' 天前'
                                }}</time>
                            </li>
                        </ol>
                    </section>
                </main>
            </div>
            <div v-else class="all-duty-layout">
                <el-table :data="all.data.value?.list || []" class="prototype-table" height="100%" :row-class-name="rowClass"
                    ><el-table-column
                        v-for="c in columns"
                        :key="c"
                        :prop="c"
                        :label="c"
                        :min-width="c.includes('电话') ? 170 : c === '星期' ? 90 : 130"
                        ><template #default="{ row }"
                            ><DutyCell :column="c" :value="row[c]" :today="diff(row) === 0" :username="username" /></template></el-table-column
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
import { Search, Phone } from 'lucide-vue-next'
import { useAdminInfo } from '/@/stores/adminInfo'
import { getOnDutyList } from '../api'
import { useResource } from '../useResource'
import SegmentedControl from './SegmentedControl.vue'
import DutyCell from './DutyCell.vue'
import LoadState from './LoadState.vue'
defineProps<{ modelValue: boolean }>()
defineEmits(['update:modelValue'])
const admin = useAdminInfo(), username = computed(() => admin.nickname || admin.username),
    tab = ref('我的值班'),
    keyword = ref(''),
    q = ref(''),
    page = ref(1)
const mine = useResource(() => getOnDutyList({ isMySelf: true, page: 1, limit: 100 })),
    all = useResource(() => getOnDutyList({ isMySelf: false, context: q.value || undefined, page: page.value, limit: 12 }))
const current = computed(() => (tab.value === '我的值班' ? mine : all)),
    columns = computed(() => Object.keys(all.data.value?.list[0] || {}))
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
type Row = Record<string, string>
const dateOf = (r: Row) => r['日期'] || Object.values(r)[0] || '',
    md = (s: string) => `${Number(s.slice(-5, -3))}月${Number(s.slice(-2))}日`
const diff = (r: Row) => {
    const s = dateOf(r),
        n = new Date(),
        d = new Date(s.length === 5 ? `${n.getFullYear()}-${s}T00:00:00` : s + 'T00:00:00')
    return Math.round((d.getTime() - new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime()) / 864e5)
}
const sorted = computed(() => [...(mine.data.value?.list || [])].sort((a, b) => dateOf(a).localeCompare(dateOf(b)))),
    upcoming = computed(() => sorted.value.filter((r) => diff(r) >= 0)),
    past = computed(() => sorted.value.filter((r) => diff(r) < 0).reverse())
const role = (r: Row) => Object.keys(r).find((k) => r[k] === username.value) || '值班',
    others = (r: Row) => Object.entries(r).filter(([k, v]) => !['日期', '星期'].includes(k) && v !== username.value)
const rowClass = ({ row }: { row: Row }) =>
    diff(row) === 0 || Object.values(row).includes(username.value) ? 'duty-highlight' : diff(row) < 0 ? 'duty-past' : ''
</script>
