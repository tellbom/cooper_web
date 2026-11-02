<template>
    <el-dialog
        modal-class="portal-modal"
        :model-value="modelValue"
        width="1024px"
        align-center
        class="portal-dialog flush-dialog fault-dialog"
        :close-on-click-modal="false"
        @update:model-value="$emit('update:modelValue', $event)"
        ><template #header
            ><h3 class="dialog-heading-title">故障与制造问题</h3>
            <p class="dialog-subtitle">设备故障台账与制造问题（ZZPWT）跟踪</p></template
        >
        <div class="fault-dialog-body">
            <div class="fault-dialog-toolbar">
                <SegmentedControl
                    v-model="tab"
                    :items="['设备故障', '制造问题']"
                    :counts="{ 设备故障: faults.length, 制造问题: manufacture.data.value?.length }"
                /><el-input
                    v-model="q"
                    :prefix-icon="Search"
                    clearable
                    :placeholder="tab === '设备故障' ? '搜索设备或故障内容' : '搜索机型或责任人'"
                />
            </div>
            <div class="fault-state-cards" :style="{ gridTemplateColumns: `repeat(${states.length + 1},minmax(0,1fr))` }">
                <button v-for="s in ['全部', ...states]" :key="s" :class="{ selected: state === s }" @click="state = s">
                    <small><i v-if="s !== '全部'" :class="tone(s)" />{{ s }}</small
                    ><strong>{{ s === '全部' ? rows.length : rows.filter((r) => stateOf(r) === s).length }}</strong>
                </button>
            </div>
            <LoadState
                :loading="tab === '制造问题' && manufacture.pending.value"
                :error="manufacture.error.value"
                variant="table"
                @retry="manufacture.load"
                ><el-table :data="shown" class="prototype-table" height="100%"
                    ><template v-if="tab === '设备故障'"
                        ><el-table-column prop="SMBC" label="设备名称" min-width="190"
                            ><template #default="{ row }"
                                ><b>{{ row.SMBC }}</b></template
                            ></el-table-column
                        ><el-table-column prop="SS_GZNR" label="故障说明" min-width="310" show-overflow-tooltip /><el-table-column
                            prop="GZFS_SJ"
                            label="发生时间"
                            width="160"
                        /><el-table-column prop="State" label="状态" width="90"
                            ><template #default="{ row }"
                                ><span class="portal-state-tag" :class="tone(row.State)">{{ row.State }}</span></template
                            ></el-table-column
                        ></template
                    ><template v-else
                        ><el-table-column prop="JX" label="机型" min-width="180" /><el-table-column
                            prop="LJTH"
                            label="零件图号"
                            min-width="180" /><el-table-column prop="DQZT" label="当前状态" width="110"
                            ><template #default="{ row }"
                                ><span class="portal-state-tag" :class="tone(row.DQZT)">{{ row.DQZT }}</span></template
                            ></el-table-column
                        ><el-table-column prop="ZRXM" label="责任人" min-width="160" /><el-table-column
                            prop="TCSJ"
                            label="提出时间"
                            width="160" /></template></el-table
            ></LoadState></div
    ></el-dialog>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Search } from 'lucide-vue-next'
import { getZZPWTMessageapi } from '../api'
import type { FaultDto, ZZPWTDto } from '../types'
import { useResource } from '../useResource'
import SegmentedControl from './SegmentedControl.vue'
import LoadState from './LoadState.vue'
const props = defineProps<{ modelValue: boolean; faults: FaultDto[]; initialTab?: string }>()
defineEmits(['update:modelValue'])
const tab = ref(props.initialTab || '设备故障'),
    state = ref('全部'),
    q = ref(''),
    manufacture = useResource(getZZPWTMessageapi)
watch(tab, () => {
    state.value = '全部'
    q.value = ''
})
const rows = computed<(FaultDto | ZZPWTDto)[]>(() => (tab.value === '设备故障' ? props.faults : manufacture.data.value || []))
const stateOf = (r: FaultDto | ZZPWTDto) => ('State' in r ? r.State : r.DQZT)
const states = computed(() =>
    tab.value === '设备故障' ? ['未响应', '处理中', '已处理', '未确认', '已归零'] : [...new Set((manufacture.data.value || []).map((r) => r.DQZT))]
)
const shown = computed(() => rows.value.filter((r) => (state.value === '全部' || stateOf(r) === state.value) && JSON.stringify(r).includes(q.value)))
const tone = (s: string) =>
    s === '未响应' ? 'red' : s === '处理中' ? 'orange' : s === '未确认' ? 'amber' : ['已处理', '已归零'].includes(s) ? 'green' : 'gray'
</script>
