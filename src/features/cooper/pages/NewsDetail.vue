<template>
    <div class="editorial-page news-detail-page">
        <div class="breadcrumbs">
            <router-link to="/cooper/home">首页</router-link> / <router-link to="/cooper/news">新闻资讯</router-link> / 正文
        </div>
        <LoadState
            :loading="detail.pending.value"
            :error="detail.error.value"
            :empty="!detail.data.value"
            :rows="12"
            variant="editorial"
            @retry="detail.load"
            ><template #skeleton><NewsSkeleton kind="detail" /></template><div v-if="n" class="news-detail-layout">
                <article>
                    <span class="eyebrow">{{ n.ChannelTitle }}</span>
                    <h1>{{ n.Title }}</h1>
                    <p v-if="n.Subheading" class="subheading">{{ n.Subheading }}</p>
                    <div class="article-meta">
                        <span class="meta-icon"><PenLine :size="14"/>{{ n.Author }}</span><time class="meta-icon"><CalendarDays :size="14"/>{{ n.CreateTime.replace('T', ' ').slice(0, 16) }}</time><span class="meta-icon article-views"><Eye :size="14" />{{ views.data.value ?? n.Hits }} 次浏览</span
                        ><button class="article-like" :class="{liked}" :aria-pressed="liked" :aria-label="liked?'取消点赞':'点赞'" :disabled="likeBusy||likes.data.value===null" @click="like"><Heart :size="14" :fill="liked?'currentColor':'none'"/>{{likes.data.value??'—'}}</button>
                        <div class="article-controls">
                            <span class="font-size-control" role="group" aria-label="字号"><button v-for="(s, i) in ['小', '中', '大']" :key="s" :class="{ active: size === i }" @click="size = i">{{ s }}</button></span><button @click="copyLink">复制链接</button
                            ><button @click="router.push({ path: '/preview/news', query: { id: n.Id } })">预览</button>
                        </div>
                    </div>
                    <blockquote v-if="n.Abstract">
                        <small class="eyebrow">摘要</small>
                        <p>{{ n.Abstract }}</p>
                    </blockquote>
                    <img v-if="n.Cover && !/<img/i.test(n.Content)" class="article-cover" :src="n.Cover" alt="" />
                    <div
                        class="prose-news"
                        :style="{ fontSize: [15, 17, 19][size] + 'px' }"
                        @click="onContentClick"
                        v-html="api.sanitizeHtml(n.Content)"
                    />
                    <p class="article-signature">责任编辑：{{ n.Creater }}</p>
                    <nav class="article-siblings">
                        <span v-if="siblings.pending.value" class="article-siblings-state" role="status">正在加载相邻新闻…</span>
                        <span v-else-if="siblings.error.value" class="article-siblings-state" role="alert">{{ siblings.error.value }}<button class="text-link" @click="reloadSiblings">重试</button></span>
                        <template v-else-if="siblings.data.value">
                        <router-link v-if="previous" :to="newsLink(previous.Id, siblings.data.value.position - 1)"
                            ><small>← 上一篇</small><b>{{ previous.Title }}</b></router-link
                        ><span v-else>已是第一篇</span
                        ><router-link v-if="next" :to="newsLink(next.Id, siblings.data.value.position + 1)"
                            ><small>下一篇 →</small><b>{{ next.Title }}</b></router-link
                        ><span v-else>已是最后一篇</span>
                        </template>
                        <span v-else class="article-siblings-state">暂无同频道新闻</span>
                    </nav>
                    <router-link class="back-link" :to="{ path: '/cooper/news', query: { channel: n.ChannelID } }">← 返回新闻列表</router-link>
                </article>
                <aside class="news-side">
                    <h3>同频道新闻</h3>
                    <LoadState :loading="siblings.pending.value" :error="siblings.error.value" variant="editorial" @retry="reloadSiblings"
                        ><template #skeleton><NewsSkeleton kind="related" /></template><router-link v-for="s in related" :key="s.Id" :to="newsLink(s.Id)"
                            ><img v-if="s.Cover" :src="s.Cover" alt="" />
                            <h4>{{ s.Title }}</h4>
                            <small>{{ s.CreateTime.slice(0, 10) }}</small></router-link
                        ></LoadState
                    >
                    <h3>文字快报</h3>
                    <LoadState :loading="briefs.pending.value" :error="briefs.error.value" variant="editorial" @retry="briefs.load">
                    <template #skeleton><NewsSkeleton kind="briefs" /></template>
                    <router-link v-for="s in briefs.data.value" :key="s.Id" :to="newsLink(s.Id)"
                        ><h4>{{ s.Title }}</h4>
                        <small>{{ s.CreateTime.slice(0, 10) }}</small></router-link
                    >
                    </LoadState>
                </aside>
            </div></LoadState
        >
    </div>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Eye,Heart,PenLine,CalendarDays } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as api from '../api'
import { useResource } from '../useResource'
import { newsLink, officeLink, safeLink } from '../links'
import { createNewsPager } from '../newsPaging'
import LoadState from '../components/LoadState.vue'
import NewsSkeleton from '../components/NewsSkeleton.vue'
const route = useRoute(),
    router = useRouter(),
    id = computed(() => String(route.query.id || '')),
    size = ref(1)
const liked=ref(false),likeBusy=ref(false),recorded=new Set<string>()
const detail = useResource(() => api.getNewsDetailitemapi(id.value)),
    n = computed(() => detail.data.value)
const views = useResource<number | null>(() => Promise.resolve(null)),
    likes = useResource<number | null>(() => Promise.resolve(null))
const pager = createNewsPager((ChannelID, Page, Limit) => api.getNewsDetail({ ChannelID, Page, Limit }))
let disposed = false
onBeforeUnmount(() => { disposed = true; pager.clear() })
const siblings = useResource(() => {
    const article = n.value
    return article?.ChannelID && article.Id === id.value
        ? pager.neighbors(Number(article.ChannelID), article.Id, Number(route.query.position), () => !disposed && n.value?.Id === article.Id && id.value === article.Id)
        : Promise.resolve(null)
})
const briefs = useResource(() => api.getNewsKuaiBao(6))
function reloadSiblings() { pager.clear(); void siblings.load() }
watch(id, () => {
    views.data.value = null
    likes.data.value = null
    liked.value = false
    siblings.data.value = null
    detail.data.value = null
    void detail.load()
})
watch(n, () => { siblings.data.value = null; void siblings.load() })
watch(n, async (value) => {
    if (!value) return
    const current = value.Id
    if(!recorded.has(current)){recorded.add(current);await api.recordView(current).catch(()=>recorded.delete(current))}
    api.likesstatus(current).then(r=>{if(n.value?.Id===current)liked.value=r}).catch(()=>{})
    api.countviews(current)
        .then((r) => {
            if (n.value?.Id === current) views.data.value = r
        })
        .catch(() => {})
    api.likescount(current)
        .then((r) => {
            if (n.value?.Id === current) likes.data.value = r
        })
        .catch(() => {})
})
const previous = computed(() => siblings.data.value?.previous),
    next = computed(() => siblings.data.value?.next),
    related = computed(() => siblings.data.value?.related || [])
async function like(){if(!n.value||likeBusy.value)return;likeBusy.value=true;const id=n.value.Id;try{await api.toggleLike(id);const [status,count]=await Promise.all([api.likesstatus(id),api.likescount(id)]);if(n.value?.Id===id){liked.value=status;likes.data.value=count}}catch(e){ElMessage.error((e as Error).message)}finally{likeBusy.value=false}}
async function copyLink() {
    try {
        if (navigator.clipboard) await navigator.clipboard.writeText(window.location.href)
        else {
            const input = document.createElement('textarea')
            input.value = window.location.href
            document.body.append(input)
            input.select()
            if (!document.execCommand('copy')) throw new Error()
            input.remove()
        }
        ElMessage.success('链接已复制')
    } catch {
        ElMessage.info('请复制浏览器地址栏中的链接')
    }
}
function onContentClick(event: MouseEvent) {
    const a = (event.target as HTMLElement).closest('a')
    if (!a) return
    event.preventDefault()
    const raw = a.getAttribute('href') || '',
        office = officeLink(raw)
    if (office) {
        router.push(office)
        return
    }
    const url = safeLink(raw)
    if (url) window.open(url, '_blank', 'noopener')
}
</script>
