<template>
    <el-dialog
        modal-class="portal-modal"
        :model-value="modelValue"
        width="1024px"
        align-center
        class="portal-dialog flush-dialog tech-dialog"
        :close-on-click-modal="false"
        @update:model-value="$emit('update:modelValue', $event)"
        ><template #header
            ><h3 class="dialog-heading-title">危险作业</h3>
            <p class="dialog-subtitle">共 {{ list.length }} 项危险作业</p></template
        >
        <div class="tech-dialog-layout">
            <aside>
                <div class="dialog-search"><el-input v-model="q" :prefix-icon="Search" clearable placeholder="搜索作业类型、区域或责任人" /></div>
                <ul class="scroll-area">
                    <li v-for="w in filtered" :key="w.Id">
                        <button :class="{ selected: current?.Id === w.Id }" @click="selected = w.Id">
                            <span
                                ><b>{{ w.workType }}</b
                                ><small>{{ w.userName }}</small></span
                            >
                            <p>{{ w.hazardousWorkArea }}</p>
                            <time>{{ date(w.screateTime) }} – {{ date(w.ecreateTime) }}</time>
                        </button>
                    </li>
                </ul>
            </aside>
            <article v-if="current">
                <span class="eyebrow muted">作业类型</span>
                <h4>{{ current.workType }}</h4>
                <h5>危险作业区域</h5><p class="tech-description">{{ current.hazardousWorkArea }}</p>
                <h5>作业时间</h5>
                <div class="work-time-block">
                    <div>
                        <small>开始时间</small>
                        <p>{{ full(current.screateTime) }}</p>
                    </div>
                    <div>
                        <small>结束时间</small>
                        <p>{{ full(current.ecreateTime) }}</p>
                    </div>
                    <div>
                        <small>历时</small><b>{{ duration }}</b>
                    </div>
                </div>
                <h5>责任人</h5>
                <div class="work-owner-block">
                    <span class="owner-initial">{{ current.userName.slice(0, 1) }}</span>
                    <div>
                        <b>{{ current.userName }}</b>
                        <p><Phone :size="13" />{{ current.phone }}</p>
                    </div>
                    <el-button @click="copy"><Copy :size="14" />复制号码</el-button>
                </div>
                <dl v-if="current.plant || current.className" class="work-extra">
                    <div v-if="current.plant">
                        <dt>分厂</dt>
                        <dd>{{ current.plant }}</dd>
                    </div>
                    <div v-if="current.className">
                        <dt>班组</dt>
                        <dd>{{ current.className }}</dd>
                    </div>
                </dl>
            </article>
        </div>
    </el-dialog>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Search, Phone, Copy } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import type { HotWorkDto } from '../types'
import { copyText } from '../clipboard'
const props = defineProps<{ modelValue: boolean; list: HotWorkDto[]; initial?: string }>()
defineEmits(['update:modelValue'])
const q = ref(''),
    selected = ref('')
watch(
    () => props.modelValue,
    (v) => {
        if (v) {
            q.value = ''
            selected.value = props.initial || props.list[0]?.Id || ''
        }
    }
)
const filtered = computed(() => props.list.filter((w) => (w.workType + w.hazardousWorkArea + w.userName).includes(q.value)))
const current = computed(() => props.list.find((w) => w.Id === selected.value) || props.list[0]),
    date = (s: string) => s.replace('T', ' ').slice(5, 16),
    full = (s: string) => s.replace('T', ' ').slice(0, 16)
const duration = computed(() => {
    const w = current.value
    if (!w) return ''
    const h = Math.round((new Date(w.ecreateTime).getTime() - new Date(w.screateTime).getTime()) / 36e5)
    return h >= 24 ? `${Math.floor(h / 24)} 天${h % 24 ? ' ' + (h % 24) + ' 小时' : ''}` : h + ' 小时'
})
async function copy() {
    try {
        await copyText(current.value?.phone || '')
        ElMessage.success('号码已复制')
    } catch {
        ElMessage.info('请手动复制号码')
    }
}
</script>
