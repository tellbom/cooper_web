<template>
    <main class="portal-home">
        <div class="left-track"><SchedulePanel /><SystemsPanel /></div>
        <NewsPanel />
        <div class="right-track"><OperationsPanels kind="meetings" /><OperationsPanels kind="duty" /></div>
        <OperationsPanels kind="honor" /><OperationsPanels kind="tech" /><OperationsPanels kind="fault" />
    </main>
</template>
<script setup lang="ts">
import SchedulePanel from '../components/SchedulePanel.vue'
import SystemsPanel from '../components/SystemsPanel.vue'
import NewsPanel from '../components/NewsPanel.vue'
import OperationsPanels from '../components/OperationsPanels.vue'
</script>
