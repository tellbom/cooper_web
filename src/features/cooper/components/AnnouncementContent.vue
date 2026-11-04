<template>
    <iframe
        class="announcement-content-frame"
        :class="{ 'is-preview': preview }"
        :srcdoc="documentHtml"
        :style="{ height: preview ? `${height}px` : '65vh' }"
        title="公告完整正文"
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        @load="measure"
    />
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
const props = defineProps<{ html: string; preview?: boolean }>()
const height = ref(160)
const documentHtml = computed(() => {
    const doc = new DOMParser().parseFromString(props.html, 'text/html')
    if (!doc.querySelector('base')) {
        const base = doc.createElement('base')
        base.href = window.location.href
        base.target = '_blank'
        doc.head.prepend(base)
    }
    return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML
})
function measure(event: Event) {
    const doc = (event.target as HTMLIFrameElement).contentDocument
    if (doc) height.value = Math.max(120, doc.documentElement.scrollHeight)
}
</script>
<style scoped>
.announcement-content-frame {
    display: block;
    width: 100%;
    border: 0;
    margin-top: 12px;
    background: white;
}
.announcement-content-frame.is-preview {
    pointer-events: none;
}
</style>
