<template>
    <div class="cooper-preview">
        <div class="preview-toolbar">
            <strong>{{ kind === 'notice' ? '公告预览' : '新闻预览' }}</strong
            ><span>预览</span><el-button @click="printPage">打印</el-button>
        </div>
        <LoadState :loading="pending" :error="error" :empty="!item" :rows="10" empty-text="请提供 id 或 ID 预览参数" @retry="load"
            ><article v-if="item" :class="kind === 'notice' ? 'official-paper' : 'preview-news'" @click="onContentClick">
                <h1>{{ item.Title }}</h1>
                <div v-if="kind === 'notice'" class="official-rule" />
                <div v-else class="article-meta">{{ item.Author }}　{{ item.CreateTime?.replace('T', ' ').slice(0, 16) }}</div>
                <div :class="kind === 'notice' ? 'official-body' : 'prose-news'" v-html="sanitizeHtml(item.Content)" />
                <footer v-if="kind === 'notice'">
                    <p>{{ item.Author }}</p>
                    <time>{{ item.CreateTime?.slice(0, 10) }}</time>
                </footer>
            </article></LoadState
        >
    </div>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getNewsDetailitemapi, getnoticesApi, getPreviewHtml, sanitizeHtml } from '../api'
import { officeLink, safeLink } from '../links'
import LoadState from '../components/LoadState.vue'
const route = useRoute(),
    router = useRouter(),
    kind = computed(() => (route.path.endsWith('/notice') ? 'notice' : 'news'))
const item = ref<{ Title: string; Content: string; Author: string; CreateTime: string } | null>(null),
    pending = ref(false),
    error = ref('')
let generation = 0
async function load() {
    const version = ++generation
    pending.value = true
    error.value = ''
    item.value = null
    try {
        const id = String(route.query.id || ''),
            ID = String(route.query.ID || '')
        let result: { Title: string; Content: string; Author: string; CreateTime: string } | null = null
        if (ID) {
            const raw = await getPreviewHtml(ID)
            if (typeof raw !== 'string') throw new Error('预览接口返回结构待核实，当前仅支持文档注明的 HTML 字符串')
            result = { Title: String(route.query.title || '内容预览'), Content: raw, Author: '', CreateTime: '' }
        } else if (id && kind.value === 'news') {
            const n = await getNewsDetailitemapi(id)
            result = { Title: n.Title, Content: n.Content, Author: n.Author, CreateTime: n.CreateTime }
        } else if (id) {
            let page = 1
            while (page <= 100) {
                const r = await getnoticesApi({ Pageindex: page, Pagesize: 100 })
                const n = r.data.find((n) => n.Id === id)
                if (n) {
                    result = { Title: n.Title, Content: n.Context, Author: n.From || n.Creater, CreateTime: n.CreateTime }
                    break
                }
                if (r.data.length < 100 || page * 100 >= r.count) break
                page++
            }
            if (!result) throw new Error('公告不存在或已下线')
        }
        if (version === generation) item.value = result
    } catch (e) {
        if (version === generation) error.value = (e as Error).message
    } finally {
        if (version === generation) pending.value = false
    }
}
watch(() => route.fullPath, load, { immediate: true })
function onContentClick(e: MouseEvent) {
    const a = (e.target as HTMLElement).closest('a')
    if (!a) return
    e.preventDefault()
    const url = a.getAttribute('href') || '',
        office = officeLink(url)
    if (office) router.push(office)
    else {
        const safe = safeLink(url)
        if (safe) window.open(safe, '_blank', 'noopener')
    }
}
const printPage = () => window.print()
</script>
