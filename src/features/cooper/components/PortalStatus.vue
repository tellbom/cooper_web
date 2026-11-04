<template>
    <section class="portal-status" :class="'portal-status--' + kind" :role="kind === 'unavailable' ? 'alert' : 'status'">
        <el-result :title="title" :sub-title="description">
            <template #icon>
                <div class="portal-status-art" aria-hidden="true">
                    <span class="status-orbit" />
                    <span class="status-sheet status-sheet-back" />
                    <span class="status-sheet status-sheet-front">
                        <Newspaper :size="24" :stroke-width="1.4" />
                        <i /><i /><i />
                    </span>
                    <span class="status-symbol"><component :is="symbol" :size="27" :stroke-width="1.6" /></span>
                    <span class="status-code">{{ code || 'NEWS' }}</span>
                </div>
            </template>
            <template #extra>
                <p v-if="hint" class="portal-status-hint">{{ hint }}</p>
                <div class="portal-status-actions"><slot /></div>
            </template>
        </el-result>
    </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Newspaper, FileQuestion, CloudOff } from 'lucide-vue-next'
const props = defineProps<{ kind: 'unavailable' | 'notfound'; title: string; description: string; hint?: string; code?: string | number }>()
const symbol = computed(() => props.kind === 'notfound' ? FileQuestion : CloudOff)
</script>

<style scoped lang="scss">
.portal-status {
    border: 1px solid #e5e9f0;
    border-radius: 16px;
    background: #fff;
    color: #141a2b;
    font-family: 'Noto Sans SC', 'Microsoft YaHei', sans-serif;
    overflow: hidden;
    :deep(.el-result) { padding: 40px 28px 36px; }
    :deep(.el-result__title) { margin-top: 12px; }
    :deep(.el-result__title p) {
        font: 500 24px/1.5 'Noto Serif SC', 'SimSun', serif;
        color: #141a2b;
        letter-spacing: .02em;
    }
    :deep(.el-result__subtitle) { margin-top: 10px; max-width: 520px; }
    :deep(.el-result__subtitle p) { font-size: 14px; line-height: 1.9; color: #6b7386; overflow-wrap: anywhere; }
    :deep(.el-result__extra) { margin-top: 22px; }
}
.portal-status-art { position: relative; width: 188px; height: 146px; margin: 0 auto; }
.status-orbit {
    position: absolute; width: 144px; height: 128px; left: 22px; top: 9px;
    border-radius: 50%; background: #f0f5ff; border: 1px solid #e5edff;
    &::after { content: ''; position: absolute; width: 9px; height: 9px; background: #a9c3ff; border: 4px solid #fff; border-radius: 50%; right: -8px; top: 26px; }
}
.status-sheet { position: absolute; width: 82px; height: 102px; border: 1px solid #d2dff5; border-radius: 9px; }
.status-sheet-back { left: 47px; top: 18px; background: #e6eeff; transform: rotate(-13deg); }
.status-sheet-front {
    left: 57px; top: 22px; background: #fff; text-align: left; padding: 14px 13px;
    color: #7495cb; box-shadow: 0 7px 18px rgba(36, 79, 146, .06);
    > i { display: block; height: 3px; border-radius: 2px; margin-top: 9px; background: #e1e9f6; }
    > i:last-child { width: 60%; }
    > svg { width: 24px; height: 24px; }
}
.status-symbol { position: absolute; right: 27px; bottom: 18px; display: grid; place-items: center; width: 49px; height: 49px; border: 4px solid #fff; border-radius: 50%; background: #2563eb; color: #fff; }
.status-symbol > svg { width: 27px; height: 27px; }
.status-code { position: absolute; top: 7px; right: 19px; color: #7890b5; font-size: 10px; font-weight: 600; letter-spacing: .12em; }
.portal-status-hint { margin: 0 0 18px; font-size: 12px; line-height: 1.8; color: #9aa1b2; }
.portal-status-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; :deep(.el-button) { margin-left: 0; height: 38px; border-radius: 8px; font: 500 13px 'Noto Sans SC', 'Microsoft YaHei', sans-serif; padding: 0 20px; } }
.portal-status--unavailable .status-symbol { background: #607a9e; }
.portal-status--notfound .status-code { top: 0; right: 1px; font-size: 25px; letter-spacing: .04em; color: #2563eb; }
@media (max-width: 600px) { .portal-status :deep(.el-result) { padding: 28px 20px; } }
</style>
