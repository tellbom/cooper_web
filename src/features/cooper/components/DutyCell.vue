<template>
    <span class="duty-cell">
        <template v-if="column.prop === 'OnDutyTime'">
            <span :class="{ blue: today, semibold: today }">{{ dateLabel }}</span>
            <em v-if="today" class="today-badge">今日</em>
        </template>
        <template v-else-if="isDutyPerson(column.prop) && value">
            <i class="person-initial">{{ text.slice(0, 1) }}</i>
            <span :class="{ blue: mine, semibold: mine }">{{ text }}</span>
            <em v-if="mine" class="me-badge">我</em>
        </template>
        <template v-else>{{ text }}</template>
    </span>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { dutyDate, dutyText, isDutyPerson } from '../onDuty'
import type { OnDutyColumn } from '../types'

const props = defineProps<{ column: OnDutyColumn; value?: string | null; today?: boolean; username?: string }>()
const text = computed(() => dutyText(props.value)),
    mine = computed(() => !!props.username && props.value === props.username),
    dateLabel = computed(() => dutyDate({ OnDutyTime: props.value ?? null })?.format('MM-DD') ?? text.value)
</script>
