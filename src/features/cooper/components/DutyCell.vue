<template>
    <span class="duty-cell"
        ><template v-if="column === '日期'"
            ><span :class="{ blue: today, semibold: today }">{{ value }}</span
            ><em v-if="today" class="today-badge">今日</em></template
        ><template v-else-if="column === '星期'"
            ><span :class="/[六日]/.test(value) ? 'amber' : 'muted'">{{ value }}</span></template
        ><template v-else-if="column.includes('值班')"
            ><i class="person-initial">{{ value.slice(0, 1) }}</i
            ><span :class="{ blue: value === username, semibold: value === username }">{{ value }}</span
            ><em v-if="value === username" class="me-badge">我</em></template
        ><template v-else-if="column.includes('电话')"
            ><Phone :size="11" /><span>{{ value }}</span></template
        ><template v-else>{{ value }}</template></span
    >
</template>
<script setup lang="ts">
import { Phone } from 'lucide-vue-next'
defineProps<{ column: string; value: string; today?: boolean; username?: string }>()
</script>
