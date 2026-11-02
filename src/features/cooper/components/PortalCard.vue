<template>
    <section class="portal-card">
        <header class="card-heading">
            <span v-if="icon" class="card-title-icon"><component :is="icon" :size="17" :stroke-width="1.75" /></span>
            <h2 v-if="title">{{ title }}</h2>
            <div class="card-heading-main" :class="{ 'with-title': title }"><slot name="tabs" /></div>
            <slot name="extra"
                ><button v-if="more" class="more-link" @click="$emit('more')">{{ more }} <ChevronRight :size="14" /></button
            ></slot>
        </header>
        <div class="card-content"><slot /></div>
    </section>
</template>
<script setup lang="ts">
import type { Component } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
defineProps<{ title?: string; icon?: Component; more?: string }>()
defineEmits(['more'])
</script>
