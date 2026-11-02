<template>
    <div class="editorial-page search-page">
        <div class="breadcrumbs">
            <router-link to="/cooper/home">首页</router-link> / <router-link to="/cooper/news">新闻资讯</router-link> / 资讯搜索
        </div>
        <header class="editorial-heading">
            <div>
                <span class="eyebrow">TIMELINE SEARCH</span>
                <h1>资讯搜索</h1>
                <p>沿时间轴浏览与检索公司新闻和公告；不输入关键词即按日浏览</p>
            </div>
        </header>
        <form class="search-main-form" @submit.prevent="apply">
            <el-input
                v-model="keyword"
                :prefix-icon="SearchIcon"
                placeholder="输入关键词，如：安全生产、质量、数字化"
                clearable
                @clear="setQuery({ q: undefined })"
            /><el-button type="primary" native-type="submit">搜索</el-button>
        </form>
        <div class="search-filters">
            <SegmentedControl
                :model-value="type"
                :items="['全部', '新闻', '公告']"
                @update:model-value="setQuery({ type: $event === '全部' ? undefined : $event })"
            /><SegmentedControl
                :model-value="range"
                :items="['全部时间', '近7天', '近30天', '近90天', '自定义']"
                @update:model-value="setQuery({ range: $event === '全部时间' ? undefined : $event, from: undefined, to: undefined })"
            /><el-date-picker
                v-if="range === '自定义'"
                v-model="dateRange"
                type="daterange"
                value-format="YYYY-MM-DD"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
            />
        </div>
        <div v-if="degraded || maxDepth" class="search-degraded">
            <p v-if="degraded">当前为降级检索，结果可能不完整。</p>
            <p v-if="maxDepth">已达到最大检索深度，可缩小时间范围后重试。</p>
        </div>
        <div class="search-timeline">
            <LoadState
                :loading="pending && !groups.length"
                :error="error && !groups.length ? error : ''"
                :empty="!groups.length"
                variant="timeline"
                empty-text="没有找到相关资讯，试试更换关键词或放宽时间范围"
                @retry="load"
                ><section v-for="group in groups" :key="group.date + ':' + group.items[0]?.newsId" class="day-group" :class="{ 'is-today': group.date === today }">
                    <div class="timeline-date">
                        <strong :class="{ blue: group.date === today }">{{ group.date.slice(8) }}</strong
                        ><small>{{ group.date.slice(0, 4) }}年{{ Number(group.date.slice(5, 7)) }}月</small
                        ><span
                            >周{{ week[new Date(group.date + 'T00:00:00').getDay()]
                            }}{{ relative(group.date) ? ' · ' + relative(group.date) : '' }}</span
                        >
                    </div>
                    <div>
                        <button
                            v-for="i in group.items"
                            :key="i.sourceType + i.newsId"
                            class="search-result"
                            :class="{ announcement: i.sourceType === 'Announcement' }"
                            @click.prevent="openItem(i)"
                        >
                            <div>
                                <div class="search-item-meta">
                                    <span class="source-label" :class="{ announcement: i.sourceType === 'Announcement' }"
                                        ><Newspaper v-if="i.sourceType === 'News'" :size="12" /><Megaphone v-else :size="12" />{{
                                            i.sourceType === 'News' ? '新闻' : '公告'
                                        }}</span
                                    ><time>{{ i.publishTime.slice(11, 16) }}</time
                                    ><span>|</span><span>{{ i.publisher }}{{ i.author && i.author !== i.publisher ? ' · ' + i.author : '' }}</span>
                                </div>
                                <h3>{{ i.title }}<ArrowUpRight :size="16" /></h3>
                                <div
                                    v-if="i.sourceType === 'Announcement' && (i.contentHtml || i.highlight || i.summary)"
                                    class="search-announcement-excerpt"
                                    v-html="api.sanitizeHtml(i.highlight || i.contentHtml || i.summary || '')"
                                />
                                <p v-else-if="i.sourceType === 'News'" class="search-news-excerpt">{{ newsSnippet(i) }}</p>
                            </div>
                            <img v-if="i.cover" :src="i.cover" alt="" />
                        </button>
                    </div>
                </section>
                <div class="search-load-more">
                    <el-button v-if="hasMore" :loading="pending" @click="load(true)">{{ submitted ? '加载更多结果' : '加载更早的日期' }}</el-button
                    ><span v-else>— 已经到底了 —</span>
                    <p v-if="error" role="alert">{{ error }} <button class="text-link" @click="load(true)">重试</button></p>
                </div>
                <p v-if="chunks[0]" class="search-trace">
                    检索模式 {{ chunks[0].data.searchMode }} · 编号 {{ chunks[0].data.searchTraceId }}
                </p></LoadState
            >
        </div>
        <el-dialog
            modal-class="portal-modal"
            :model-value="!!reading"
            :title="reading?.title"
            width="768px"
            align-center
            class="portal-dialog search-reading-dialog"
            @update:model-value="reading = null"
            ><template #header
                ><h3 class="dialog-heading-title">{{ reading?.title }}</h3>
                <p class="dialog-subtitle">{{ reading?.publisher }} · {{ reading?.publishTime.replace('T', ' ').slice(0, 16) }}</p></template
            >
            <div v-if="reading?.contentHtml" class="prose-news" v-html="api.sanitizeHtml(reading.contentHtml)" />
            <p v-else class="muted">{{ reading?.summary || '暂无正文' }}</p></el-dialog
        >
    </div>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search as SearchIcon, Newspaper, Megaphone, ArrowUpRight } from 'lucide-vue-next'
import * as api from '../api'
import { ymd, addDays } from '../date'
import { newsLink, safeLink } from '../links'
import LoadState from '../components/LoadState.vue'
import SegmentedControl from '../components/SegmentedControl.vue'
const route = useRoute(),
    router = useRouter(),
    keyword = ref(String(route.query.q || '')),
    reading = ref<api.SearchItem | null>(null),
    week = ['日', '一', '二', '三', '四', '五', '六'],
    today = ymd(new Date())
const submitted = computed(() => String(route.query.q || '')),
    type = computed(() => (['新闻', '公告'].includes(String(route.query.type)) ? String(route.query.type) : '全部')),
    range = computed(() => (['近7天', '近30天', '近90天', '自定义'].includes(String(route.query.range)) ? String(route.query.range) : '全部时间'))
function setQuery(patch: Record<string, string | undefined>) {
    const q = { ...route.query, ...patch }
    Object.keys(q).forEach((k) => {
        if (q[k] === undefined || q[k] === '') delete q[k]
    })
    void router.replace({ query: q })
}
const dateRange = computed({
    get: () => (route.query.from && route.query.to ? [String(route.query.from), String(route.query.to)] : []),
    set: (value: string[] | null) => setQuery({ from: value?.[0], to: value?.[1] }),
})
const chunks = ref<api.SearchView[]>([]),
    pending = ref(false),
    error = ref('')
let page = 0,
    sequence = 0,
    disposed = false
const key = computed(() => JSON.stringify([submitted.value, type.value, range.value, route.query.from, route.query.to]))
function request(n: number): api.DayGroupedSearchRequest {
    const sourceTypes: api.SourceType[] = type.value === '全部' ? ['News', 'Announcement'] : type.value === '新闻' ? ['News'] : ['Announcement']
    const days = Number(range.value.replace(/[^0-9]/g, ''))
    const dates = range.value === '自定义' ? dateRange.value : days ? [ymd(addDays(new Date(), -days)), today] : []
    return {
        query: submitted.value.trim(),
        sourceTypes,
        page: n,
        pageSize: submitted.value.trim() ? 10 : 5,
        ...(dates.length === 2 ? { publishTimeFrom: dates[0], publishTimeTo: dates[1] } : {}),
    }
}
async function load(more = false) {
    if (more && pending.value) return
    const version = ++sequence,
        n = more ? page + 1 : 1
    pending.value = true
    error.value = ''
    try {
        const result = await api.searchNews(request(n))
        if (!disposed && version === sequence) {
            chunks.value = more ? [...chunks.value, result] : [result]
            page = n
        }
    } catch (e) {
        if (!disposed && version === sequence) error.value = (e as Error).message
    } finally {
        if (!disposed && version === sequence) pending.value = false
    }
}
watch(
    key,
    () => {
        keyword.value = submitted.value
        chunks.value = []
        page = 0
        void load()
    },
    { immediate: true }
)
onBeforeUnmount(() => {
    disposed = true
    sequence++
})
const groups = computed(() => {
    const ordered: api.SearchDayGroup[] = [],
        seen = new Set<string>()
    chunks.value.forEach((chunk) => {
        const items = chunk.displayMode === 'days' ? chunk.data.days.flatMap((d) => d.items) : chunk.data.results
        items.forEach((item) => {
            const id = item.sourceType + item.newsId
            if (seen.has(id)) return
            seen.add(id)
            const date = item.publishTime.slice(0, 10)
            const previous = ordered[ordered.length - 1]
            if (previous?.date === date) previous.items.push(item)
            else ordered.push({ date, items: [item] })
        })
    })
    return ordered
})
const hasMore = computed(() => {
    const last = chunks.value[chunks.value.length - 1]
    return !!last && (last.displayMode === 'days' ? last.data.page < last.data.totalPages : last.data.hasMore ?? last.data.results.length === last.data.pageSize)
})
const degraded = computed(() => chunks.value.some((r) => r.data.degraded)),
    maxDepth = computed(() => chunks.value.some((r) => r.data.maxDepthReached))
function relative(date: string) {
    const days = Math.round((new Date(today + 'T00:00:00').getTime() - new Date(date + 'T00:00:00').getTime()) / 864e5)
    return days === 0 ? '今天' : days === 1 ? '昨天' : days > 1 && days < 7 ? days + ' 天前' : ''
}
function apply() {
    setQuery({ q: keyword.value.trim() || undefined })
}
function openItem(i: api.SearchItem) {
    if (i.vectorResult) {
        const url = safeLink(i.url || '')
        if (url) window.open(url, '_blank', 'noopener')
        else reading.value = i
    } else if (i.sourceType === 'News') router.push(newsLink(i.newsId))
    else reading.value = i
}
function newsSnippet(item: api.SearchItem) {
    const html = api.sanitizeHtml(item.highlight || item.summary || item.contentHtml || '')
    return new DOMParser().parseFromString(html, 'text/html').body.textContent?.replace(/\s+/g, ' ').trim() || ''
}
</script>
