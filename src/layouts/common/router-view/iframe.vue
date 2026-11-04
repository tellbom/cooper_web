<template>
    <div class="iframe-main" v-loading="state.loading">
        <iframe
            :src="iframeSrc"
            :style="iframeStyle(35)"
            frameborder="0"
            height="100%"
            width="100%"
            id="iframe"
            ref="iframeRef"
            @load="hideLoading"
        ></iframe>
    </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { mainHeight as iframeStyle } from '/@/utils/layout'
import { useRoute } from 'vue-router'
import { safeLink } from '/@/features/cooper/links'

const route = useRoute()
const iframeSrc = computed(() => safeLink(String(route.meta.url || '')))

const state = reactive({
    loading: true,
})
watch(iframeSrc, () => { state.loading = true })

const hideLoading = () => {
    state.loading = false
}
</script>

<style scoped lang="scss">
.iframe-main {
    margin: var(--ba-main-space);
}
</style>
